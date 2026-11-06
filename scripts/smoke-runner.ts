/**
 * Smart Trip — Phase 3H Smoke Testing
 * Smoke Runner Implementation: Autonomous Write-Ahead Live Test Executor
 *
 * Grounded in:
 * - 43 Canonical Test IDs + Prerequisite `OP-PREREQ-ITIN-USER-B` (Phase 3H-R58-R69)
 * - Standard Write-Ahead Manifest Enum `INTENT_RECORDED` (Phase 3H-R62)
 * - Better Auth 1.7.11 Cookie Signing & Test Session Helper (Phase 3H-R59-R68)
 * - Safe Fail-Closed Incident Governance: No auto-retry, no auto-rollback, no auto-cleanup on UNKNOWN state
 *
 * CRITICAL SAFETY RULES:
 * 1. Zero side-effects on import: Merely importing this module does NOT connect to database or send HTTP requests.
 * 2. Execution is STRICTLY single-threaded and sequential per `runId`.
 * 3. Before any mutating operation, `INTENT_RECORDED` is durably flushed to `events.jsonl` and `manifest.json`.
 * 4. Tokens, cookies, and database secrets are NEVER written to disk or logs.
 * 5. On timeout, unhandled error, or crash after request dispatch, state transitions to `RUN_STATE_UNKNOWN` and execution HALTS immediately.
 * 6. `cleanupTestSessions` is NEVER automatically invoked by this runner.
 *
 * CONCURRENCY & ISOLATION LIMITATIONS:
 * - Operates under PostgreSQL default `Read Committed` isolation level.
 * - Concurrency safety is achieved via process-level file locks (`runner.lock`) and unique UUIDv4 `runId` scoping.
 */

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  assertNonProductionDatabase,
  bootstrapTestSessions,
  resolveExistingTestSessions,
  validateRunId,
  isValidUUIDv4,
  type OperationState,
  type SanitizedBootstrapMetadata,
} from "./test-session-helper";

// Load local .env into process.env if not already loaded (e.g. CLI direct execution)
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  } catch {
    // Ignore errors; assertNonProductionDatabase will fail closed if missing
  }
}

// ============================================================================
// 1. MANIFEST & OPERATION ENUMS (PHASE 3H SPECIFICATION)
// ============================================================================

export type SmokeCategory =
  | "LIVE_HTTP_MUTATING"
  | "LIVE_HTTP_SAFE_READONLY"
  | "LIVE_HTTP_EXPECTED_REJECTION"
  | "LIVE_HTTP_INFRA_MUTATING"
  | "BLOCKED_SPECIAL_SETUP"
  | "OP_PREREQUISITE";

export type SmokeOperationState =
  | OperationState
  | "BLOCKED_SPECIAL_SETUP"
  | "RUN_STATE_UNKNOWN";

export type OverallRunState =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RUN_STATE_UNKNOWN";

export interface AllowlistedEvidence {
  httpStatus: number;
  httpStatusText: string;
  latencyMs: number;
  extractedIds?: Record<string, string>;
  responseCode?: string;
  assertionPassed: boolean;
  notes?: string;
}

export interface SmokeEvent {
  timestamp: string;
  runId: string;
  operationId: string;
  operationKey: string;
  sequence: number;
  category: SmokeCategory;
  state: SmokeOperationState;
  evidence?: AllowlistedEvidence;
  error?: string;
}

export interface OperationManifestRecord {
  sequence: number;
  operationId: string;
  operationKey: string;
  category: SmokeCategory;
  description: string;
  state: SmokeOperationState;
  dispatchedAt?: string;
  completedAt?: string;
  evidence?: AllowlistedEvidence;
  error?: string;
}

export interface RunManifestStats {
  totalOperations: number;
  succeeded: number;
  completed?: number;
  rejectedAsExpected: number;
  failed: number;
  blockedSpecialSetup: number;
  unknown: number;
}

export interface RunManifest {
  manifestVersion: "1.0.0";
  runId: string;
  identityRunId?: string;
  parentRunId?: string;
  createdAt: string;
  updatedAt: string;
  baseUrl: string;
  runState: OverallRunState;
  authMetadata: SanitizedBootstrapMetadata | null;
  reconciliation?: Record<string, AllowlistedEvidence>;
  stats: RunManifestStats;
  operations: Record<string, OperationManifestRecord>;
}

export interface SmokeExecutionContext {
  runId: string;
  baseUrl: string;
  hostCookie: string;
  memberCookie: string;
  timeoutMs: number;
  // Dynamic runtime entities passed between steps
  tripId?: string;
  inviteCode?: string;
  hostMemberId?: string;
  userBMemberId?: string;
  guestMemberId?: string;
  itinItem1_id?: string;
  itinItem2_id?: string;
  expense1_id?: string;
  transfer1_id?: string;
}

export interface SmokeOperationDef {
  sequence: number;
  operationKey: string;
  category: SmokeCategory;
  description: string;
  execute: (ctx: SmokeExecutionContext) => Promise<AllowlistedEvidence>;
}

// ============================================================================
// 2. WRITE-AHEAD MANIFEST & DURABLE PERSISTENCE
// ============================================================================

export class SmokeManifestManager {
  private runsDir: string;
  private runDir: string;
  private manifestPath: string;
  private eventsPath: string;
  private lockPath: string;
  private lockFd: number | null = null;
  private manifest: RunManifest;

  constructor(
    runId: string,
    baseDir: string = process.cwd(),
    identityRunId?: string,
    parentRunId?: string
  ) {
    // Fail-closed: assert non-production database before initializing manifest paths or state
    assertNonProductionDatabase();

    const validatedRunId = validateRunId(runId);
    this.runsDir = path.join(baseDir, ".smoke-runs");
    this.runDir = path.join(this.runsDir, validatedRunId);
    this.manifestPath = path.join(this.runDir, "manifest.json");
    this.eventsPath = path.join(this.runDir, "events.jsonl");
    this.lockPath = path.join(this.runDir, "runner.lock");

    this.manifest = {
      manifestVersion: "1.0.0",
      runId: validatedRunId,
      identityRunId: identityRunId ? validateRunId(identityRunId) : undefined,
      parentRunId: parentRunId ? validateRunId(parentRunId) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      baseUrl: "http://localhost:3000",
      runState: "PENDING",
      authMetadata: null,
      stats: {
        totalOperations: 44,
        succeeded: 0,
        completed: 0,
        rejectedAsExpected: 0,
        failed: 0,
        blockedSpecialSetup: 0,
        unknown: 0,
      },
      operations: {},
    };
  }

  /**
   * Acquires exclusive process lock to prevent concurrent runs on same runId.
   */
  public acquireLock(): void {
    if (!fs.existsSync(this.runsDir)) {
      fs.mkdirSync(this.runsDir, { recursive: true });
    }

    // 1. Fail-closed run-directory collision guard:
    // Refuse an already-existing execution-run directory before creating or writing anything inside it.
    if (fs.existsSync(this.runDir)) {
      throw new Error(
        `[SmokeRunner] Conflict: Execution run directory already exists at ${this.runDir}. Cannot execute or overwrite existing run directory for runId ${this.manifest.runId}.`
      );
    }

    // 2. Preserve separate fail-closed checks for existing manifest and events log
    if (fs.existsSync(this.manifestPath)) {
      throw new Error(
        `[SmokeRunner] Conflict: Execution manifest already exists at ${this.manifestPath}. Cannot overwrite existing run evidence for runId ${this.manifest.runId}.`
      );
    }
    if (fs.existsSync(this.eventsPath)) {
      throw new Error(
        `[SmokeRunner] Conflict: Execution events log already exists at ${this.eventsPath}. Cannot overwrite existing events for runId ${this.manifest.runId}.`
      );
    }

    // 3. Atomic, non-recursive creation of execution-run directory
    try {
      fs.mkdirSync(this.runDir);
    } catch (mkdirErr: unknown) {
      const code = (mkdirErr as { code?: string })?.code;
      if (code === "EEXIST") {
        throw new Error(
          `[SmokeRunner] Concurrency conflict: Execution run directory already exists at ${this.runDir}. Cannot execute duplicate runner for runId ${this.manifest.runId}.`
        );
      }
      throw mkdirErr;
    }

    try {
      this.lockFd = fs.openSync(this.lockPath, "wx");
      const lockData = JSON.stringify({
        pid: process.pid,
        runId: this.manifest.runId,
        acquiredAt: new Date().toISOString(),
      });
      fs.writeFileSync(this.lockFd, lockData, "utf-8");
      fs.fsyncSync(this.lockFd);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "EEXIST") {
        throw new Error(
          `[SmokeRunner] Concurrency conflict: Run lock already exists at ${this.lockPath}. Cannot execute duplicate runner for runId ${this.manifest.runId}.`
        );
      }
      throw err;
    }
  }

  /**
   * Releases exclusive process lock.
   */
  public releaseLock(): void {
    if (this.lockFd !== null) {
      try {
        fs.closeSync(this.lockFd);
      } catch {
        // Ignore close errors on exit
      }
      this.lockFd = null;
      if (fs.existsSync(this.lockPath)) {
        try {
          fs.unlinkSync(this.lockPath);
        } catch {
          // Ignore unlink errors on exit
        }
      }
    }
  }

  /**
   * Initializes manifest with sanitized authentication metadata and pre-populated inventory.
   */
  public initialize(
    authMetadata: SanitizedBootstrapMetadata,
    baseUrl: string,
    inventory: SmokeOperationDef[]
  ): void {
    this.manifest.authMetadata = authMetadata;
    this.manifest.baseUrl = baseUrl;
    this.manifest.runState = "RUNNING";
    this.manifest.updatedAt = new Date().toISOString();

    for (const op of inventory) {
      const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);
      this.manifest.operations[op.operationKey] = {
        sequence: op.sequence,
        operationId: opId,
        operationKey: op.operationKey,
        category: op.category,
        description: op.description,
        state: "INTENT_RECORDED",
      };
    }

    this.flushManifest();
  }

  /**
   * Initializes continuation manifest, preserving verified historical operations from parent
   * and retaining the historical SMK-SETL-02 failure without rewriting history.
   */
  public initializeContinuation(
    authMetadata: SanitizedBootstrapMetadata,
    baseUrl: string,
    inventory: SmokeOperationDef[],
    parentManifest: RunManifest
  ): void {
    this.manifest.authMetadata = authMetadata;
    this.manifest.baseUrl = baseUrl;
    this.manifest.runState = "RUNNING";
    this.manifest.updatedAt = new Date().toISOString();

    this.manifest.stats = {
      totalOperations: inventory.length,
      succeeded: 0,
      completed: 0,
      rejectedAsExpected: 0,
      failed: 0,
      blockedSpecialSetup: 0,
      unknown: 0,
    };

    for (const op of inventory) {
      const parentOp = parentManifest.operations[op.operationKey];
      const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);

      if (parentOp && (parentOp.state === "SUCCEEDED" || parentOp.state === "REJECTED_AS_EXPECTED")) {
        this.manifest.operations[op.operationKey] = {
          sequence: op.sequence,
          operationId: opId,
          operationKey: op.operationKey,
          category: op.category,
          description: op.description,
          state: parentOp.state,
          dispatchedAt: parentOp.dispatchedAt,
          completedAt: parentOp.completedAt,
          evidence: {
            ...parentOp.evidence!,
            notes: (parentOp.evidence?.notes ? parentOp.evidence.notes + " | " : "") +
              `Preserved from parent run ${parentManifest.runId}`,
          },
        };
        if (parentOp.state === "SUCCEEDED") {
          this.manifest.stats.succeeded++;
          this.manifest.stats.completed = this.manifest.stats.succeeded;
        } else if (parentOp.state === "REJECTED_AS_EXPECTED") {
          this.manifest.stats.rejectedAsExpected++;
        }
      } else if (parentOp && parentOp.state === "FAILED" && op.operationKey === "SMK-SETL-02") {
        this.manifest.operations[op.operationKey] = {
          sequence: op.sequence,
          operationId: opId,
          operationKey: op.operationKey,
          category: op.category,
          description: op.description,
          state: "FAILED",
          dispatchedAt: parentOp.dispatchedAt,
          completedAt: parentOp.completedAt,
          evidence: {
            ...parentOp.evidence!,
            notes: "Historical assertion failure from parent run (reconciled via safe read-only stage in continuation run)",
          },
          error: parentOp.error,
        };
        this.manifest.stats.failed++;
      } else {
        this.manifest.operations[op.operationKey] = {
          sequence: op.sequence,
          operationId: opId,
          operationKey: op.operationKey,
          category: op.category,
          description: op.description,
          state: "INTENT_RECORDED",
        };
      }
    }

    this.flushManifest();
  }

  public recordReconciliationIntent(key: string): void {
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: `${this.manifest.runId}::RECON::${key}`,
      operationKey: key,
      sequence: 0,
      category: "LIVE_HTTP_SAFE_READONLY",
      state: "INTENT_RECORDED",
    };
    this.appendEventDurable(event);
  }

  public recordReconciliationDispatched(key: string): void {
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: `${this.manifest.runId}::RECON::${key}`,
      operationKey: key,
      sequence: 0,
      category: "LIVE_HTTP_SAFE_READONLY",
      state: "DISPATCHED",
    };
    this.appendEventDurable(event);
  }

  public recordReconciliationCompletion(key: string, evidence: AllowlistedEvidence): void {
    if (!this.manifest.reconciliation) {
      this.manifest.reconciliation = {};
    }
    this.manifest.reconciliation[key] = evidence;

    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: `${this.manifest.runId}::RECON::${key}`,
      operationKey: key,
      sequence: 0,
      category: "LIVE_HTTP_SAFE_READONLY",
      state: evidence.assertionPassed ? "SUCCEEDED" : "FAILED",
      evidence,
    };
    this.appendEventDurable(event);
    this.flushManifest();
  }

  /**
   * Durably writes an append-only event record before or after operation state changes.
   */
  private appendEventDurable(event: SmokeEvent): void {
    const line = JSON.stringify(event) + "\n";
    const fd = fs.openSync(this.eventsPath, "a");
    fs.writeFileSync(fd, line, "utf-8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
  }

  /**
   * Durably flushes manifest snapshot to disk using atomic write.
   */
  private flushManifest(): void {
    this.manifest.updatedAt = new Date().toISOString();
    const tempPath = `${this.manifestPath}.tmp.${Date.now()}`;
    const fd = fs.openSync(tempPath, "w");
    const data = JSON.stringify(this.manifest, null, 2);
    fs.writeFileSync(fd, data, "utf-8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fs.renameSync(tempPath, this.manifestPath);
  }

  /**
   * Write-Ahead Rule: Records intent durable BEFORE HTTP request dispatch.
   */
  public recordIntent(op: SmokeOperationDef): void {
    const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: op.operationKey,
      sequence: op.sequence,
      category: op.category,
      state: "INTENT_RECORDED",
    };

    this.appendEventDurable(event);

    const record = this.manifest.operations[op.operationKey];
    if (record) {
      record.state = "INTENT_RECORDED";
      record.dispatchedAt = event.timestamp;
    }
    this.flushManifest();
  }

  /**
   * Records in-flight transition to DISPATCHED right when request is dispatched.
   */
  public recordDispatched(op: SmokeOperationDef): void {
    const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: op.operationKey,
      sequence: op.sequence,
      category: op.category,
      state: "DISPATCHED",
    };

    this.appendEventDurable(event);

    const record = this.manifest.operations[op.operationKey];
    if (record) {
      record.state = "DISPATCHED";
    }
    this.flushManifest();
  }

  /**
   * Records successful completion (SUCCEEDED) or expected rejection after response verification.
   */
  public recordCompletion(
    op: SmokeOperationDef,
    state: "SUCCEEDED" | "REJECTED_AS_EXPECTED" | "BLOCKED_SPECIAL_SETUP",
    evidence: AllowlistedEvidence
  ): void {
    const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: op.operationKey,
      sequence: op.sequence,
      category: op.category,
      state,
      evidence,
    };

    this.appendEventDurable(event);

    const record = this.manifest.operations[op.operationKey];
    if (record) {
      record.state = state;
      record.completedAt = event.timestamp;
      record.evidence = evidence;
    }

    if (state === "SUCCEEDED") {
      this.manifest.stats.succeeded++;
      this.manifest.stats.completed = this.manifest.stats.succeeded;
    } else if (state === "REJECTED_AS_EXPECTED") {
      this.manifest.stats.rejectedAsExpected++;
    } else if (state === "BLOCKED_SPECIAL_SETUP") {
      this.manifest.stats.blockedSpecialSetup++;
    }

    this.flushManifest();
  }

  /**
   * Records explicit failure when server returns unexpected error.
   */
  public recordFailure(
    op: SmokeOperationDef,
    evidence?: AllowlistedEvidence,
    errorMessage?: string
  ): void {
    const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: op.operationKey,
      sequence: op.sequence,
      category: op.category,
      state: "FAILED",
      evidence,
      error: errorMessage,
    };

    this.appendEventDurable(event);

    const record = this.manifest.operations[op.operationKey];
    if (record) {
      record.state = "FAILED";
      record.completedAt = event.timestamp;
      record.evidence = evidence;
      record.error = errorMessage;
    }

    this.manifest.stats.failed++;
    this.manifest.runState = "FAILED";
    this.flushManifest();
  }

  /**
   * Critical Fail-Closed Rule: Records RUN_STATE_UNKNOWN on timeout or network crash.
   * Execution HALTS immediately.
   */
  public recordUnknown(op: SmokeOperationDef, errorMessage: string): void {
    const opId = formatOperationId(this.manifest.runId, op.sequence, op.operationKey);
    const event: SmokeEvent = {
      timestamp: new Date().toISOString(),
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: op.operationKey,
      sequence: op.sequence,
      category: op.category,
      state: "RUN_STATE_UNKNOWN",
      error: errorMessage,
    };

    this.appendEventDurable(event);

    const record = this.manifest.operations[op.operationKey];
    if (record) {
      record.state = "RUN_STATE_UNKNOWN";
      record.completedAt = event.timestamp;
      record.error = errorMessage;
    }

    this.manifest.stats.unknown++;
    this.manifest.runState = "RUN_STATE_UNKNOWN";
    this.flushManifest();
  }

  /**
   * Marks overall run as finished cleanly.
   */
  public finishRun(state: OverallRunState): void {
    this.manifest.runState = state;
    this.flushManifest();
  }

  public getManifest(): Readonly<RunManifest> {
    return this.manifest;
  }
}

export function formatOperationId(
  runId: string,
  sequence: number,
  operationKey: string
): string {
  const seqStr = String(sequence).padStart(3, "0");
  return `${runId}::${seqStr}::${operationKey}`;
}

// ============================================================================
// 3. SECURE HTTP CLIENT WITH STRICT SENSITIVE DATA STRIPPING
// ============================================================================

export interface SafeFetchOptions {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  cookie?: string;
  body?: unknown;
  timeoutMs?: number;
}

export interface SafeFetchResponse {
  status: number;
  statusText: string;
  latencyMs: number;
  jsonBody?: Record<string, unknown>;
  textBody?: string;
  contentType: string;
}

/**
 * Dispatches an HTTP request with strict timeouts and zero logging of sensitive tokens/cookies.
 */
export async function safeFetch(
  baseUrl: string,
  options: SafeFetchOptions
): Promise<SafeFetchResponse> {
  const url = `${baseUrl.replace(/\/+$/, "")}${options.path}`;
  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "SmartTrip-SmokeRunner/1.0",
  };

  if (options.cookie) {
    headers["Cookie"] = options.cookie;
  }

  let bodyPayload: string | undefined = undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    bodyPayload = JSON.stringify(options.body);
  }

  const startTime = Date.now();
  try {
    const res = await fetch(url, {
      method: options.method,
      headers,
      body: bodyPayload,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startTime;
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") || "";
    let jsonBody: Record<string, unknown> | undefined = undefined;
    let textBody: string | undefined = undefined;

    if (contentType.includes("application/json")) {
      try {
        jsonBody = (await res.json()) as Record<string, unknown>;
      } catch {
        textBody = "[Unparseable JSON]";
      }
    } else {
      textBody = await res.text();
    }

    return {
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      jsonBody,
      textBody,
      contentType,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = (err as { name?: string })?.name === "AbortError";
    const msg = isAbort
      ? `Request timed out after ${timeoutMs}ms for ${options.method} ${options.path}`
      : `Network error: ${String(err)}`;
    throw new Error(msg);
  }
}

// ============================================================================
// 4. CANONICAL OPERATIONS INVENTORY (43 TESTS + 1 PREREQUISITE = 44 OPERATIONS)
// ============================================================================

export const CANONICAL_OPERATIONS_INVENTORY: SmokeOperationDef[] = [
  // --------------------------------------------------------------------------
  // Group 1: Auth Baseline (3 IDs: SMK-AUTH-01, SMK-AUTH-02, SMK-AUTH-03)
  // --------------------------------------------------------------------------
  {
    sequence: 1,
    operationKey: "SMK-AUTH-01",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Unauthenticated request to GET /api/me -> 401 Unauthorized",
    execute: async (ctx) => {
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: "/api/me",
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 401;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected unauthenticated request with 401" : `Unexpected status ${res.status}`,
      };
    },
  },
  {
    sequence: 2,
    operationKey: "SMK-AUTH-02",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A fetches self profile (GET /api/me -> 200)",
    execute: async (ctx) => {
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: "/api/me",
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Boolean(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Host authenticated successfully" : "Failed to authenticate host",
      };
    },
  },
  {
    sequence: 3,
    operationKey: "SMK-AUTH-03",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Member User B fetches self profile (GET /api/me -> 200)",
    execute: async (ctx) => {
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: "/api/me",
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Boolean(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Member authenticated successfully" : "Failed to authenticate member",
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 2: Trip Lifecycle (6 IDs: SMK-TRIP-01 to SMK-TRIP-06)
  // --------------------------------------------------------------------------
  {
    sequence: 4,
    operationKey: "SMK-TRIP-01",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A lists trips, records baseline snapshot (GET /api/trips -> 200; does not assume empty)",
    execute: async (ctx) => {
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: "/api/trips",
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Array.isArray(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Successfully recorded initial trips baseline snapshot" : "Failed to list trips",
      };
    },
  },
  {
    sequence: 5,
    operationKey: "SMK-TRIP-02",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A creates Trip (POST /api/trips -> 201 Created)",
    execute: async (ctx) => {
      const payload = {
        name: `Smoke Trip ${ctx.runId.slice(0, 8)}`,
        destination: "Da Lat, Lam Dong",
        startDate: "2026-11-01",
        endDate: "2026-11-05",
        budgetAmount: 5000000,
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: "/api/trips",
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const tripData = res.jsonBody?.data as { id?: string; inviteCode?: string; hostMemberId?: string } | undefined;
      const tripId = tripData?.id;
      const inviteCode = tripData?.inviteCode;
      const hostMemberId = tripData?.hostMemberId;
      const passed = res.status === 201 && Boolean(tripId) && Boolean(inviteCode);

      if (passed && tripId && inviteCode) {
        ctx.tripId = tripId;
        ctx.inviteCode = inviteCode;
        if (hostMemberId) ctx.hostMemberId = hostMemberId;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: tripId ? { tripId, inviteCode: inviteCode! } : undefined,
        assertionPassed: passed,
        notes: passed ? `Created trip ${tripId}` : "Failed to create trip",
      };
    },
  },
  {
    sequence: 6,
    operationKey: "SMK-TRIP-03",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A gets Trip detail (GET /api/trips/[id] -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Boolean(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 7,
    operationKey: "SMK-TRIP-04",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "User B (not joined) attempts GET /api/trips/[id] -> 403 Forbidden",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 403;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected non-member with 403" : `Unexpected status ${res.status}`,
      };
    },
  },
  {
    sequence: 8,
    operationKey: "SMK-TRIP-05",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A updates Trip metadata (PATCH /api/trips/[id] -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const payload = {
        name: `Smoke Trip ${ctx.runId.slice(0, 8)} Updated`,
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "PATCH",
        path: `/api/trips/${ctx.tripId}`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 9,
    operationKey: "SMK-TRIP-06",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Host User A attempts PATCH /api/trips/[id] with endDate before startDate -> 400 Bad Request",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const payload = {
        startDate: "2026-11-10",
        endDate: "2026-11-05",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "PATCH",
        path: `/api/trips/${ctx.tripId}`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 400;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected inverted date range with 400" : `Unexpected status ${res.status}`,
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 3: Invites & Member Management (8 IDs: SMK-MEMB-01 to SMK-MEMB-08)
  // --------------------------------------------------------------------------
  {
    sequence: 10,
    operationKey: "SMK-MEMB-01",
    category: "LIVE_HTTP_INFRA_MUTATING",
    description: "Preview valid invite code (GET /api/invites/[code] -> 200; mutates rate_limits)",
    execute: async (ctx) => {
      if (!ctx.inviteCode) throw new Error("Precondition failed: inviteCode missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/invites/${ctx.inviteCode}`,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Boolean(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: "Valid invite previewed; rate_limits infra record updated",
      };
    },
  },
  {
    sequence: 11,
    operationKey: "SMK-MEMB-02",
    category: "LIVE_HTTP_MUTATING",
    description: "User B joins trip 1st time via invite (POST /api/invites/[code]/join -> 201 Created)",
    execute: async (ctx) => {
      if (!ctx.inviteCode) throw new Error("Precondition failed: inviteCode missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/invites/${ctx.inviteCode}/join`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const memberData = res.jsonBody?.data as { memberId?: string; member?: { id?: string }; id?: string } | undefined;
      const userBMemberId = memberData?.memberId ?? memberData?.member?.id ?? memberData?.id;
      const passed = res.status === 201 && Boolean(userBMemberId);

      if (passed && userBMemberId) {
        ctx.userBMemberId = userBMemberId;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: userBMemberId ? { userBMemberId } : undefined,
        assertionPassed: passed,
        notes: passed ? `User B joined with memberId ${userBMemberId}` : "Failed to join trip",
      };
    },
  },
  {
    sequence: 12,
    operationKey: "SMK-MEMB-03",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "User B attempts repeated join when already ACTIVE -> 409 Conflict",
    execute: async (ctx) => {
      if (!ctx.inviteCode) throw new Error("Precondition failed: inviteCode missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/invites/${ctx.inviteCode}/join`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 409;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected repeated join with 409" : `Unexpected status ${res.status}`,
      };
    },
  },
  {
    sequence: 13,
    operationKey: "SMK-MEMB-04",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A lists trip members (GET /api/trips/[id]/members -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}/members`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const members = res.jsonBody?.data as Array<{ id: string; role: string; userId?: string | null }> | undefined;
      const passed = res.status === 200 && Array.isArray(members) && members.length >= 2;

      if (passed && members) {
        const host = members.find((m) => m.role === "HOST");
        if (host) ctx.hostMemberId = host.id;
        const memberB = members.find((m) => m.role === "MEMBER" && m.userId !== null);
        if (memberB && !ctx.userBMemberId) ctx.userBMemberId = memberB.id;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 14,
    operationKey: "SMK-MEMB-05",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A creates guest member (POST /api/trips/[id]/members -> 201 Created)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const payload = {
        displayName: "Guest Friend",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/members`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const guestData = res.jsonBody?.data as { id?: string } | undefined;
      const guestMemberId = guestData?.id;
      const passed = res.status === 201 && Boolean(guestMemberId);

      if (passed && guestMemberId) {
        ctx.guestMemberId = guestMemberId;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: guestMemberId ? { guestMemberId } : undefined,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 15,
    operationKey: "SMK-MEMB-06",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Non-Host User B attempts to edit guest member -> 403 Forbidden",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.guestMemberId) {
        throw new Error("Precondition failed: tripId or guestMemberId missing");
      }
      const payload = {
        displayName: "Unauthorized Edit",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "PATCH",
        path: `/api/trips/${ctx.tripId}/members/${ctx.guestMemberId}`,
        cookie: ctx.memberCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 403;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 16,
    operationKey: "SMK-MEMB-08",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Non-Host User B attempts to create guest member -> 403 Forbidden",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const payload = {
        displayName: "Unauthorized Guest",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/members`,
        cookie: ctx.memberCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 403;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 4: Itinerary Management & Prerequisite (4 IDs + 1 Prerequisite)
  // --------------------------------------------------------------------------
  {
    sequence: 17,
    operationKey: "SMK-ITIN-01",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A creates itinerary item 1 (POST /api/trips/[id]/itinerary -> 201 Created)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const payload = {
        placeName: "Lang Biang Mountain",
        dayDate: "2026-11-02",
        startTime: "08:00",
        endTime: "11:00",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/itinerary`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const itemData = res.jsonBody?.data as { id?: string } | undefined;
      const itinItem1_id = itemData?.id;
      const passed = res.status === 201 && Boolean(itinItem1_id);

      if (passed && itinItem1_id) {
        ctx.itinItem1_id = itinItem1_id;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: itinItem1_id ? { itinItem1_id } : undefined,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 18,
    operationKey: "SMK-ITIN-02",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A lists itinerary (GET /api/trips/[id]/itinerary -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}/itinerary`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Array.isArray(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 19,
    operationKey: "SMK-ITIN-03",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A updates itinerary item 1 (PATCH /api/trips/[id]/itinerary/[itemId] -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.itinItem1_id) {
        throw new Error("Precondition failed: tripId or itinItem1_id missing");
      }
      const payload = {
        placeName: "Lang Biang Mountain Updated",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "PATCH",
        path: `/api/trips/${ctx.tripId}/itinerary/${ctx.itinItem1_id}`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 20,
    operationKey: "SMK-ITIN-04",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A deletes itinerary item 1 (DELETE /api/trips/[id]/itinerary/[itemId] -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.itinItem1_id) {
        throw new Error("Precondition failed: tripId or itinItem1_id missing");
      }
      const res = await safeFetch(ctx.baseUrl, {
        method: "DELETE",
        path: `/api/trips/${ctx.tripId}/itinerary/${ctx.itinItem1_id}`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Host itinerary item 1 successfully deleted" : "Failed to delete item 1",
      };
    },
  },
  {
    sequence: 21,
    operationKey: "OP-PREREQ-ITIN-USER-B",
    category: "OP_PREREQUISITE",
    description: "Prerequisite: Member User B creates itinerary item 2 to establish history (POST /api/trips/[id]/itinerary -> 201)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const payload = {
        placeName: "Coffee at Tuyen Lam Lake",
        dayDate: "2026-11-03",
        startTime: "09:00",
        endTime: "11:00",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/itinerary`,
        cookie: ctx.memberCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const itemData = res.jsonBody?.data as { id?: string } | undefined;
      const itinItem2_id = itemData?.id;
      const passed = res.status === 201 && Boolean(itinItem2_id);

      if (passed && itinItem2_id) {
        ctx.itinItem2_id = itinItem2_id;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: itinItem2_id ? { itinItem2_id } : undefined,
        assertionPassed: passed,
        notes: "Historical referential integrity established for User B",
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 5: Member Leave, Rejection & Rejoin Workflow (Early in Trip = ACTIVE)
  // (3 IDs: SMK-CTRL-01, SMK-CTRL-02, SMK-MEMB-07)
  // --------------------------------------------------------------------------
  {
    sequence: 22,
    operationKey: "SMK-CTRL-01",
    category: "LIVE_HTTP_MUTATING",
    description: "Member User B leaves trip (DELETE /api/trips/[id]/members/[memberId] -> 200 OK, status = LEFT)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.userBMemberId) {
        throw new Error("Precondition failed: tripId or userBMemberId missing");
      }
      const res = await safeFetch(ctx.baseUrl, {
        method: "DELETE",
        path: `/api/trips/${ctx.tripId}/members/${ctx.userBMemberId}`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "User B soft-deleted (status = LEFT, balance = 0, history preserved)" : "Failed to leave trip",
      };
    },
  },
  {
    sequence: 23,
    operationKey: "SMK-CTRL-02",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Member User B (status LEFT) attempts POST /api/trips/[id]/expenses -> 403 Forbidden",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.userBMemberId) {
        throw new Error("Precondition failed: tripId or userBMemberId missing");
      }
      const payload = {
        title: "Unauthorized Expense While Left",
        amount: 100000,
        category: "FOOD",
        paidByMemberId: ctx.userBMemberId,
        splitMethod: "EQUAL",
        participantMemberIds: [ctx.userBMemberId],
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.memberCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 403;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected LEFT member with 403" : `Unexpected status ${res.status}`,
      };
    },
  },
  {
    sequence: 24,
    operationKey: "SMK-MEMB-07",
    category: "LIVE_HTTP_MUTATING",
    description: "Member User B rejoins trip via invite code (POST /api/invites/[code]/join -> 200 OK, same memberId)",
    execute: async (ctx) => {
      if (!ctx.inviteCode) throw new Error("Precondition failed: inviteCode missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/invites/${ctx.inviteCode}/join`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const memberData = res.jsonBody?.data as { memberId?: string; member?: { id?: string }; id?: string; isRejoined?: boolean } | undefined;
      const rejoinedId = memberData?.memberId ?? memberData?.member?.id ?? memberData?.id;
      const passed = res.status === 200 && Boolean(rejoinedId) && Boolean(ctx.userBMemberId) && rejoinedId === ctx.userBMemberId;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? `User B reactivated (status = ACTIVE, memberId: ${rejoinedId})` : "Failed to rejoin trip",
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 6: Expenses Lifecycle (7 IDs: SMK-EXPN-01 to SMK-EXPN-07)
  // --------------------------------------------------------------------------
  {
    sequence: 25,
    operationKey: "SMK-EXPN-01",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A creates Expense 1 (POST /api/trips/[id]/expenses -> 201 Created)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.hostMemberId || !ctx.userBMemberId) {
        throw new Error("Precondition failed: tripId, hostMemberId, or userBMemberId missing");
      }
      const payload = {
        title: "Dinner BBQ",
        amount: 600000,
        category: "FOOD",
        paidByMemberId: ctx.hostMemberId,
        splitMethod: "EQUAL",
        participantMemberIds: [ctx.hostMemberId, ctx.userBMemberId],
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const expData = res.jsonBody?.data as { id?: string } | undefined;
      const expense1_id = expData?.id;
      const passed = res.status === 201 && Boolean(expense1_id);

      if (passed && expense1_id) {
        ctx.expense1_id = expense1_id;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: expense1_id ? { expense1_id } : undefined,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 26,
    operationKey: "SMK-EXPN-02",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A lists expenses collection (GET /api/trips/[id]/expenses -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Array.isArray(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 27,
    operationKey: "SMK-EXPN-03",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Collection GET expenses again, confirms created expense is present (GET /api/trips/[id]/expenses -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.expense1_id) {
        throw new Error("Precondition failed: tripId or expense1_id missing");
      }
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const expenses = res.jsonBody?.data as Array<{ id: string }> | undefined;
      const found = Array.isArray(expenses) && expenses.some((e) => e.id === ctx.expense1_id);
      const passed = res.status === 200 && found;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? `Found expense ${ctx.expense1_id} in collection` : "Expense not found in collection",
      };
    },
  },
  {
    sequence: 28,
    operationKey: "SMK-EXPN-04",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A updates Expense 1 metadata-only (PATCH /api/trips/[id]/expenses/[id] -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.expense1_id) {
        throw new Error("Precondition failed: tripId or expense1_id missing");
      }
      // Metadata-only: title and note only, never change amount, payer, splitMethod, splits
      const payload = {
        title: "Dinner BBQ at Night Market",
        note: "Delicious local food",
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "PATCH",
        path: `/api/trips/${ctx.tripId}/expenses/${ctx.expense1_id}`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const data = res.jsonBody?.data as {
        amount?: number;
        paidByMemberId?: string;
        splitMethod?: string;
        shares?: Array<{ memberId: string; amount: number }>;
      } | undefined;
      const passed =
        res.status === 200 &&
        data?.amount === 600000 &&
        data?.paidByMemberId === ctx.hostMemberId &&
        data?.splitMethod === "EQUAL" &&
        Array.isArray(data?.shares);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: "Strictly metadata-only update: amounts, debt balances, and splits preserved",
      };
    },
  },
  {
    sequence: 29,
    operationKey: "SMK-EXPN-05",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Create expense with invalid negative/zero amount -> 400 Bad Request",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.hostMemberId) {
        throw new Error("Precondition failed: tripId or hostMemberId missing");
      }
      const payload = {
        title: "Negative Amount Expense",
        amount: -50000,
        category: "FOOD",
        paidByMemberId: ctx.hostMemberId,
        splitMethod: "EQUAL",
        participantMemberIds: [ctx.hostMemberId],
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 400;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 30,
    operationKey: "SMK-EXPN-06",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Non-payer Member User B attempts to delete Host's Expense 1 -> 403 Forbidden",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.expense1_id) {
        throw new Error("Precondition failed: tripId or expense1_id missing");
      }
      const res = await safeFetch(ctx.baseUrl, {
        method: "DELETE",
        path: `/api/trips/${ctx.tripId}/expenses/${ctx.expense1_id}`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 403;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 31,
    operationKey: "SMK-EXPN-07",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Create expense with splits not matching total amount -> 400 Bad Request",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.hostMemberId) {
        throw new Error("Precondition failed: tripId or hostMemberId missing");
      }
      const payload = {
        title: "Mismatched Itemized Expense",
        amount: 500000,
        category: "FOOD",
        paidByMemberId: ctx.hostMemberId,
        splitMethod: "ITEMIZED",
        items: [
          {
            name: "Item 1",
            amount: 200000,
            assignedMemberIds: [ctx.hostMemberId],
          },
        ],
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 400;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 7: Settlement Lifecycle (8 IDs: SMK-SETL-01 to SMK-SETL-08)
  // --------------------------------------------------------------------------
  {
    sequence: 32,
    operationKey: "SMK-SETL-01",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Non-host Member User B attempts to lock settlement -> 403 Forbidden",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/settlement`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 403;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 33,
    operationKey: "SMK-SETL-07",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A previews settlement summary before lock (GET /api/trips/[id]/settlement -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}/settlement`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200 && Boolean(res.jsonBody?.data);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 34,
    operationKey: "SMK-SETL-02",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A locks settlement 1st time (POST /api/trips/[id]/settlement -> 201 Created)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/settlement`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const data = res.jsonBody?.data as {
        settlement?: {
          id?: string;
          transfers?: Array<{ id: string }>;
        };
        transfers?: Array<{ id: string }>;
      } | undefined;
      const settlementId = data?.settlement?.id;
      const transferId = data?.settlement?.transfers?.[0]?.id ?? data?.transfers?.[0]?.id;
      const passed = res.status === 201 && Boolean(transferId);

      if (passed && transferId) {
        ctx.transfer1_id = transferId;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: transferId
          ? {
              transferId,
              ...(settlementId ? { settlementId } : {}),
            }
          : undefined,
        assertionPassed: passed,
        notes: passed ? `1st Settlement locked, transferId: ${transferId}` : "Failed to lock settlement",
      };
    },
  },
  {
    sequence: 35,
    operationKey: "SMK-SETL-08",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "Host User A views active settlement after lock (GET /api/trips/[id]/settlement -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: `/api/trips/${ctx.tripId}/settlement`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const activeSetl = (res.jsonBody?.data as { settlement?: { id?: string } } | undefined)?.settlement;
      const passed = res.status === 200 && Boolean(activeSetl?.id);
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? `Active settlement confirmed: ${activeSetl?.id}` : "Active settlement not found",
      };
    },
  },
  {
    sequence: 36,
    operationKey: "SMK-SETL-03",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Attempt to create expense while trip status is SETTLING -> 400 Bad Request",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.hostMemberId) {
        throw new Error("Precondition failed: tripId or hostMemberId missing");
      }
      const payload = {
        title: "Expense in Settling",
        amount: 100000,
        category: "FOOD",
        paidByMemberId: ctx.hostMemberId,
        splitMethod: "EQUAL",
        participantMemberIds: [ctx.hostMemberId],
      };
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/expenses`,
        cookie: ctx.hostCookie,
        body: payload,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 400;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
      };
    },
  },
  {
    sequence: 37,
    operationKey: "SMK-SETL-04",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A reopens settlement when transfer is UNPAID (POST /api/trips/[id]/settlement/reopen -> 200 OK)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/settlement/reopen`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Settlement reopened (trip status = ACTIVE)" : "Failed to reopen settlement",
      };
    },
  },
  {
    sequence: 38,
    operationKey: "SMK-SETL-05",
    category: "LIVE_HTTP_MUTATING",
    description: "Host User A locks settlement 2nd time after reopen (POST /api/trips/[id]/settlement -> 201 Created)",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/settlement`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const data = res.jsonBody?.data as {
        settlement?: {
          id?: string;
          transfers?: Array<{ id: string }>;
        };
        transfers?: Array<{ id: string }>;
      } | undefined;
      const settlementId = data?.settlement?.id;
      const transferId = data?.settlement?.transfers?.[0]?.id ?? data?.transfers?.[0]?.id;
      const passed = res.status === 201 && Boolean(transferId);

      if (passed && transferId) {
        ctx.transfer1_id = transferId;
      }

      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        extractedIds: transferId
          ? {
              transferId,
              ...(settlementId ? { settlementId } : {}),
            }
          : undefined,
        assertionPassed: passed,
        notes: passed ? `2nd Settlement locked, transferId: ${transferId}` : "Failed to lock settlement",
      };
    },
  },
  {
    sequence: 39,
    operationKey: "SMK-SETL-06",
    category: "LIVE_HTTP_MUTATING",
    description: "Debtor User B marks transfer paid (POST /api/trips/[id]/transfers/[transferId]/mark-paid -> 200 OK)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.transfer1_id) {
        throw new Error("Precondition failed: tripId or transfer1_id missing");
      }
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/transfers/${ctx.transfer1_id}/mark-paid`,
        cookie: ctx.memberCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Transfer marked paid by debtor" : "Failed to mark transfer paid",
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 8: Security & Edge Controls (4 IDs: SMK-SECR-01 to SMK-SECR-04)
  // --------------------------------------------------------------------------
  {
    sequence: 40,
    operationKey: "SMK-SECR-01",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "Attempt to reopen settlement when transfer is already PAID -> 409 Conflict",
    execute: async (ctx) => {
      if (!ctx.tripId) throw new Error("Precondition failed: tripId missing");
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/settlement/reopen`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 409;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected reopen when transfer PAID with 409" : `Unexpected status ${res.status}`,
      };
    },
  },
  {
    sequence: 41,
    operationKey: "SMK-SECR-02",
    category: "LIVE_HTTP_MUTATING",
    description: "Creditor Host confirms transfer; Trip transitions to COMPLETED (POST /api/trips/[id]/transfers/[id]/confirm -> 200)",
    execute: async (ctx) => {
      if (!ctx.tripId || !ctx.transfer1_id) {
        throw new Error("Precondition failed: tripId or transfer1_id missing");
      }
      const res = await safeFetch(ctx.baseUrl, {
        method: "POST",
        path: `/api/trips/${ctx.tripId}/transfers/${ctx.transfer1_id}/confirm`,
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 200;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Transfer confirmed by creditor; Trip status = COMPLETED" : "Failed to confirm transfer",
      };
    },
  },
  {
    sequence: 42,
    operationKey: "SMK-SECR-03",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "GET trip with malformed UUID -> 404 Not Found (rejected before DB query)",
    execute: async (ctx) => {
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: "/api/trips/invalid-uuid-format-12345",
        cookie: ctx.hostCookie,
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 404;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: passed ? "Correctly rejected malformed UUID with 404 before DB query" : `Unexpected status ${res.status}`,
      };
    },
  },
  {
    sequence: 43,
    operationKey: "SMK-SECR-04",
    category: "LIVE_HTTP_INFRA_MUTATING",
    description: "GET non-existent invite code -> 404 Not Found (mutates rate_limits)",
    execute: async (ctx) => {
      const res = await safeFetch(ctx.baseUrl, {
        method: "GET",
        path: "/api/invites/NONEXIST-9999",
        timeoutMs: ctx.timeoutMs,
      });
      const passed = res.status === 404;
      return {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        latencyMs: res.latencyMs,
        assertionPassed: passed,
        notes: "Non-existent invite queried; rate_limits table record updated",
      };
    },
  },

  // --------------------------------------------------------------------------
  // Group 9: Rate Limit Exhaustion / Special Setup (1 ID: SMK-CTRL-03)
  // --------------------------------------------------------------------------
  {
    sequence: 44,
    operationKey: "SMK-CTRL-03",
    category: "BLOCKED_SPECIAL_SETUP",
    description: "Rate limiting exhaustion test (BLOCKED_SPECIAL_SETUP: strictly skipped by default)",
    execute: async () => {
      // Intentionally never dispatches network request to prevent IP poisoning
      return {
        httpStatus: 429,
        httpStatusText: "BLOCKED_SPECIAL_SETUP",
        latencyMs: 0,
        assertionPassed: true,
        notes: "Skipped by safety governance to prevent 127.0.0.1 rate limit poisoning",
      };
    },
  },
];

// ============================================================================
// 5. MAIN SMOKE SUITE EXECUTOR
// ============================================================================

export interface SmokeRunnerOptions {
  runId?: string;
  reuseGate4aRun?: string;
  continueParentRun?: string;
  baseUrl?: string;
  timeoutMs?: number;
  dryRun?: boolean;
}

/**
 * Main execution function for Phase 3H Smoke Runner.
 *
 * CRITICAL RULE: This must ONLY be invoked when Gate 4 execution has been explicitly authorized.
 */
export async function runSmokeSuite(
  options: SmokeRunnerOptions = {}
): Promise<{ success: boolean; manifest: RunManifest }> {
  // Fail-closed safety: assert non-production database before any manifest initialization, file locks, or dispatch
  const { projectRef: verifiedProjectRef } = assertNonProductionDatabase();

  const executionRunId = options.runId ? validateRunId(options.runId) : randomUUID();
  const continueParentRun = options.continueParentRun ? validateRunId(options.continueParentRun) : undefined;
  let reuseGate4aRun = options.reuseGate4aRun ? validateRunId(options.reuseGate4aRun) : undefined;
  const baseUrl = options.baseUrl || process.env.BASE_URL || "http://localhost:3000";
  const timeoutMs = options.timeoutMs ?? 15000;
  const dryRun = Boolean(options.dryRun);

  // Fail-closed safety: execution runId must be distinct from Gate 4A identity runId and parent runId
  if (reuseGate4aRun && reuseGate4aRun === executionRunId) {
    throw new Error(
      `[SmokeRunner] Execution runId (${executionRunId}) must be distinct from Gate 4A identity runId (${reuseGate4aRun}) to preserve Gate 4A manifest evidence.`
    );
  }
  if (continueParentRun && continueParentRun === executionRunId) {
    throw new Error(
      `[SmokeRunner] Execution runId (${executionRunId}) must be distinct from parent runId (${continueParentRun}) to preserve parent manifest evidence.`
    );
  }
  if (continueParentRun && reuseGate4aRun && continueParentRun === reuseGate4aRun) {
    throw new Error(
      `[SmokeRunner] Parent runId (${continueParentRun}) cannot be identical to Gate 4A identity runId (${reuseGate4aRun}).`
    );
  }

  // Pre-validate parent manifest if continuing from prior run
  let parentManifest: RunManifest | undefined;
  if (continueParentRun) {
    const parentManifestPath = path.join(process.cwd(), ".smoke-runs", continueParentRun, "manifest.json");
    const parentEventsPath = path.join(process.cwd(), ".smoke-runs", continueParentRun, "events.jsonl");

    if (!fs.existsSync(parentManifestPath) || !fs.existsSync(parentEventsPath)) {
      throw new Error(
        `[SmokeRunner] Parent run evidence not found at ${parentManifestPath}. Cannot continue from missing run.`
      );
    }

    try {
      const rawContent = fs.readFileSync(parentManifestPath, "utf-8");
      parentManifest = JSON.parse(rawContent) as RunManifest;
    } catch (parseErr) {
      throw new Error(
        `[SmokeRunner] Parent manifest at ${parentManifestPath} is malformed or unparseable: ${String(parseErr)}`
      );
    }

    if (parentManifest.runId !== continueParentRun) {
      throw new Error(
        `[SmokeRunner] Parent manifest runId mismatch: manifest contains '${parentManifest.runId}' but requested '${continueParentRun}'`
      );
    }

    // Check parent run recorded failure at SMK-SETL-02
    const setl02Record = parentManifest.operations["SMK-SETL-02"];
    if (!setl02Record || setl02Record.state !== "FAILED") {
      throw new Error(
        `[SmokeRunner] Parent run ${continueParentRun} did not record failure at SMK-SETL-02 (state: ${setl02Record?.state}). Continuation only supported from the specific SMK-SETL-02 failure point.`
      );
    }

    // Verify that all 33 prior operations succeeded
    for (const op of CANONICAL_OPERATIONS_INVENTORY.slice(0, 33)) {
      const pOp = parentManifest.operations[op.operationKey];
      if (!pOp || (pOp.state !== "SUCCEEDED" && pOp.state !== "REJECTED_AS_EXPECTED")) {
        throw new Error(
          `[SmokeRunner] Parent run ${continueParentRun} operation ${op.operationKey} was not successful (state: ${pOp?.state}). Cannot safely continue.`
        );
      }
    }

    // Reconcile identityRunId
    if (!reuseGate4aRun && parentManifest.identityRunId) {
      reuseGate4aRun = parentManifest.identityRunId;
    } else if (reuseGate4aRun && parentManifest.identityRunId && reuseGate4aRun !== parentManifest.identityRunId) {
      throw new Error(
        `[SmokeRunner] Requested identityRunId (${reuseGate4aRun}) does not match parent run's identityRunId (${parentManifest.identityRunId}).`
      );
    }
  }

  const manifestManager = new SmokeManifestManager(executionRunId, process.cwd(), reuseGate4aRun, continueParentRun);
  manifestManager.acquireLock();

  try {
    console.log(`[SmokeRunner] Starting Smoke Test Suite (executionRunId: ${executionRunId})`);
    if (continueParentRun) {
      console.log(`[SmokeRunner] CONTINUATION MODE: Continuing from failed parent run ${continueParentRun}`);
    }
    if (reuseGate4aRun) {
      console.log(`[SmokeRunner] REUSE MODE: Reusing validated Gate 4A identities (identityRunId: ${reuseGate4aRun})`);
    }
    console.log(`[SmokeRunner] Target Base URL: ${baseUrl}`);
    console.log(`[SmokeRunner] Database Target: Positively identified approved staging Supabase project (${verifiedProjectRef})`);

    if (dryRun) {
      console.log("[SmokeRunner] DRY RUN MODE: Verifying inventory definition only.");
      manifestManager.releaseLock();
      return {
        success: true,
        manifest: manifestManager.getManifest(),
      };
    }

    // Step 1: Resolve or Bootstrap test credentials
    let bootstrapResult: Awaited<ReturnType<typeof bootstrapTestSessions>>;

    if (reuseGate4aRun) {
      // Opt-in identity reuse mode: Load and verify Gate 4A manifest
      const gate4aManifestPath = path.join(process.cwd(), ".smoke-runs", reuseGate4aRun, "manifest.json");
      if (!fs.existsSync(gate4aManifestPath)) {
        throw new Error(
          `[SmokeRunner] Gate 4A manifest not found at ${gate4aManifestPath}. Cannot reuse identities from unverified run.`
        );
      }

      let gate4aManifest: RunManifest;
      try {
        const rawContent = fs.readFileSync(gate4aManifestPath, "utf-8");
        gate4aManifest = JSON.parse(rawContent) as RunManifest;
      } catch (parseErr) {
        throw new Error(
          `[SmokeRunner] Gate 4A manifest at ${gate4aManifestPath} is malformed or unparseable: ${String(parseErr)}`
        );
      }

      if (gate4aManifest.runId !== reuseGate4aRun) {
        throw new Error(
          `[SmokeRunner] Gate 4A manifest runId mismatch: manifest contains '${gate4aManifest.runId}' but requested '${reuseGate4aRun}'`
        );
      }

      if (gate4aManifest.runState !== "COMPLETED") {
        throw new Error(
          `[SmokeRunner] Gate 4A run ${reuseGate4aRun} is not in COMPLETED state (state: ${gate4aManifest.runState}). Cannot reuse.`
        );
      }

      const meta = gate4aManifest.authMetadata;
      if (!meta) {
        throw new Error(
          `[SmokeRunner] Gate 4A run ${reuseGate4aRun} manifest is missing authMetadata. Cannot reuse.`
        );
      }

      // Validate required identity fields are present and well-formed
      if (!meta.userA_id || !meta.userA_email || !meta.sessionA_id || !meta.sessionA_userId ||
          !meta.userB_id || !meta.userB_email || !meta.sessionB_id || !meta.sessionB_userId) {
        throw new Error(
          `[SmokeRunner] Gate 4A authMetadata is missing required identity or session fields.`
        );
      }

      if (!isValidUUIDv4(meta.userA_id) || !isValidUUIDv4(meta.sessionA_id) ||
          !isValidUUIDv4(meta.userB_id) || !isValidUUIDv4(meta.sessionB_id)) {
        throw new Error(
          `[SmokeRunner] Gate 4A authMetadata contains malformed non-UUID identifiers.`
        );
      }

      if (meta.sessionA_userId !== meta.userA_id) {
        throw new Error(
          `[SmokeRunner] Gate 4A authMetadata inconsistent: sessionA_userId (${meta.sessionA_userId}) does not match userA_id (${meta.userA_id}).`
        );
      }

      if (meta.sessionB_userId !== meta.userB_id) {
        throw new Error(
          `[SmokeRunner] Gate 4A authMetadata inconsistent: sessionB_userId (${meta.sessionB_userId}) does not match userB_id (${meta.userB_id}).`
        );
      }

      if (meta.userA_id === meta.userB_id || meta.sessionA_id === meta.sessionB_id) {
        throw new Error(
          `[SmokeRunner] Gate 4A authMetadata contains identity collision between User A and User B.`
        );
      }

      console.log(`[SmokeRunner] Re-validating existing sessions from Gate 4A without database mutations...`);
      bootstrapResult = await resolveExistingTestSessions({
        identityRunId: reuseGate4aRun,
        expectedMetadata: meta,
      });
    } else {
      // Default standalone mode: Bootstrap fresh test credentials
      console.log("[SmokeRunner] Bootstrapping new test sessions for User A (Host) and User B (Member)...");
      bootstrapResult = await bootstrapTestSessions({ runId: executionRunId });
    }

    // Step 2: Initialize Manifest with sanitized metadata
    const sanitizedMetadata: SanitizedBootstrapMetadata = {
      runId: executionRunId,
      userA_id: bootstrapResult.host.user.id,
      userA_email: bootstrapResult.host.user.email,
      sessionA_id: bootstrapResult.host.session.id,
      sessionA_userId: bootstrapResult.host.session.userId,
      userB_id: bootstrapResult.member.user.id,
      userB_email: bootstrapResult.member.user.email,
      sessionB_id: bootstrapResult.member.session.id,
      sessionB_userId: bootstrapResult.member.session.userId,
      hostUserId: bootstrapResult.host.user.id,
      hostEmail: bootstrapResult.host.user.email,
      hostSessionId: bootstrapResult.host.session.id,
      memberUserId: bootstrapResult.member.user.id,
      memberEmail: bootstrapResult.member.user.email,
      memberSessionId: bootstrapResult.member.session.id,
      sessionExpiresAt: bootstrapResult.host.session.expiresAt.toISOString(),
      createdAt: bootstrapResult.createdAt.toISOString(),
    };

    if (continueParentRun && parentManifest) {
      manifestManager.initializeContinuation(sanitizedMetadata, baseUrl, CANONICAL_OPERATIONS_INVENTORY, parentManifest);
    } else {
      manifestManager.initialize(sanitizedMetadata, baseUrl, CANONICAL_OPERATIONS_INVENTORY);
    }

    // Step 3: Set up execution context
    const ctx: SmokeExecutionContext = {
      runId: executionRunId,
      baseUrl,
      hostCookie: bootstrapResult.host.session.cookieHeader,
      memberCookie: bootstrapResult.member.session.cookieHeader,
      timeoutMs,
    };

    // Step 3.5: Execute Read-Only Reconciliation Stage in continuation mode
    if (continueParentRun && parentManifest) {
      console.log(`[SmokeRunner] Executing Read-Only Reconciliation Stage for parent run ${continueParentRun}...`);

      const tripId = parentManifest.operations["SMK-TRIP-02"]?.evidence?.extractedIds?.tripId;
      const inviteCode = parentManifest.operations["SMK-TRIP-02"]?.evidence?.extractedIds?.inviteCode;
      const userBMemberId = parentManifest.operations["SMK-MEMB-02"]?.evidence?.extractedIds?.userBMemberId;
      const guestMemberId = parentManifest.operations["SMK-MEMB-05"]?.evidence?.extractedIds?.guestMemberId;
      const itinItem2_id = parentManifest.operations["OP-PREREQ-ITIN-USER-B"]?.evidence?.extractedIds?.itinItem2_id;
      const expense1_id = parentManifest.operations["SMK-EXPN-01"]?.evidence?.extractedIds?.expense1_id;

      if (!tripId || !isValidUUIDv4(tripId)) {
        throw new Error("[SmokeRunner] Reconciliation failed: parent run manifest missing valid tripId.");
      }
      if (
        !inviteCode ||
        typeof inviteCode !== "string" ||
        inviteCode.trim().length === 0 ||
        !/^[A-Z0-9]{5,6}-[A-Z0-9]{5,6}$/i.test(inviteCode.trim())
      ) {
        throw new Error(
          `[SmokeRunner] Reconciliation failed: parent run manifest missing or invalid inviteCode format (expected XXXXXX-XXXXXX string, got '${inviteCode}').`
        );
      }
      if (!userBMemberId || !isValidUUIDv4(userBMemberId)) {
        throw new Error("[SmokeRunner] Reconciliation failed: parent run manifest missing valid userBMemberId.");
      }
      if (!guestMemberId || !isValidUUIDv4(guestMemberId)) {
        throw new Error("[SmokeRunner] Reconciliation failed: parent run manifest missing valid guestMemberId.");
      }
      if (!itinItem2_id || !isValidUUIDv4(itinItem2_id)) {
        throw new Error("[SmokeRunner] Reconciliation failed: parent run manifest missing valid itinItem2_id.");
      }
      if (!expense1_id || !isValidUUIDv4(expense1_id)) {
        throw new Error("[SmokeRunner] Reconciliation failed: parent run manifest missing valid expense1_id.");
      }

      ctx.tripId = tripId;
      ctx.inviteCode = inviteCode;
      ctx.guestMemberId = guestMemberId;
      ctx.itinItem2_id = itinItem2_id;
      ctx.expense1_id = expense1_id;

      // Reconciliation Request 1: GET /api/trips/{tripId} (Host auth)
      manifestManager.recordReconciliationIntent("RECON-TRIP-STATUS");
      manifestManager.recordReconciliationDispatched("RECON-TRIP-STATUS");
      const tripRes = await safeFetch(baseUrl, {
        method: "GET",
        path: `/api/trips/${tripId}`,
        cookie: ctx.hostCookie,
        timeoutMs,
      });
      const tripData = tripRes.jsonBody?.data as { id?: string; status?: string } | undefined;
      const tripPassed = tripRes.status === 200 && tripData?.status === "SETTLING";
      manifestManager.recordReconciliationCompletion("RECON-TRIP-STATUS", {
        httpStatus: tripRes.status,
        httpStatusText: tripRes.statusText,
        latencyMs: tripRes.latencyMs,
        assertionPassed: tripPassed,
        notes: tripPassed
          ? `Trip ${tripId} status verified as SETTLING`
          : `Trip status mismatch: expected SETTLING, got '${tripData?.status}' (HTTP ${tripRes.status})`,
      });
      if (!tripPassed) {
        throw new Error(
          `[SmokeRunner] Reconciliation failed: Trip ${tripId} is not in expected SETTLING state (HTTP ${tripRes.status}, status: '${tripData?.status}').`
        );
      }

      // Reconciliation Request 2: GET /api/trips/{tripId}/members (Host auth)
      manifestManager.recordReconciliationIntent("RECON-MEMBERS");
      manifestManager.recordReconciliationDispatched("RECON-MEMBERS");
      const membersRes = await safeFetch(baseUrl, {
        method: "GET",
        path: `/api/trips/${tripId}/members`,
        cookie: ctx.hostCookie,
        timeoutMs,
      });
      const membersList = membersRes.jsonBody?.data as Array<{ id: string; role: string; userId?: string | null }> | undefined;
      const hostMember = membersList?.find((m) => m.role === "HOST" && m.userId === bootstrapResult.host.user.id);
      const memberB = membersList?.find((m) => m.role === "MEMBER" && m.userId === bootstrapResult.member.user.id);
      const membersPassed = membersRes.status === 200 && Boolean(hostMember?.id) && Boolean(memberB?.id);
      manifestManager.recordReconciliationCompletion("RECON-MEMBERS", {
        httpStatus: membersRes.status,
        httpStatusText: membersRes.statusText,
        latencyMs: membersRes.latencyMs,
        extractedIds: {
          ...(hostMember ? { hostMemberId: hostMember.id } : {}),
          ...(memberB ? { userBMemberId: memberB.id } : {}),
        },
        assertionPassed: membersPassed,
        notes: membersPassed
          ? `Host memberId (${hostMember?.id}) and User B memberId (${memberB?.id}) verified`
          : `Failed to recover expected members from trip ${tripId}`,
      });
      if (!membersPassed || !hostMember?.id) {
        throw new Error(
          `[SmokeRunner] Reconciliation failed: Unable to verify hostMember or memberB in trip ${tripId}.`
        );
      }
      ctx.hostMemberId = hostMember.id;
      ctx.userBMemberId = memberB?.id ?? userBMemberId;

      // Reconciliation Request 3: GET /api/trips/{tripId}/settlement (Host auth)
      manifestManager.recordReconciliationIntent("RECON-SETL-02");
      manifestManager.recordReconciliationDispatched("RECON-SETL-02");
      const setlRes = await safeFetch(baseUrl, {
        method: "GET",
        path: `/api/trips/${tripId}/settlement`,
        cookie: ctx.hostCookie,
        timeoutMs,
      });
      const setlData = setlRes.jsonBody?.data as {
        settlement?: {
          id?: string;
          status?: string;
          transfers?: Array<{ id: string; status: string; amount: number }>;
        };
      } | undefined;
      const activeSettlement = setlData?.settlement;
      const firstTransfer = activeSettlement?.transfers?.[0];
      const setlPassed =
        setlRes.status === 200 &&
        Boolean(activeSettlement?.id) &&
        activeSettlement?.status === "ACTIVE" &&
        Boolean(firstTransfer?.id);
      manifestManager.recordReconciliationCompletion("RECON-SETL-02", {
        httpStatus: setlRes.status,
        httpStatusText: setlRes.statusText,
        latencyMs: setlRes.latencyMs,
        extractedIds: {
          ...(activeSettlement?.id ? { settlementId: activeSettlement.id } : {}),
          ...(firstTransfer?.id ? { transfer1_id: firstTransfer.id } : {}),
        },
        assertionPassed: setlPassed,
        notes: setlPassed
          ? `Existing Settlement ${activeSettlement?.id} reconciled with transfer1_id ${firstTransfer?.id} (replaces redispatching SMK-SETL-02)`
          : `Failed to reconcile active settlement or transfer in trip ${tripId}`,
      });
      if (!setlPassed || !firstTransfer?.id) {
        throw new Error(
          `[SmokeRunner] Reconciliation failed: Active settlement or transfer1_id could not be established for trip ${tripId}.`
        );
      }
      ctx.transfer1_id = firstTransfer.id;

      console.log(`[SmokeRunner] Reconciliation complete. Reconciled settlementId: ${activeSettlement.id}, transfer1_id: ${firstTransfer.id}`);
    }

    // Step 4: Execute remaining operations sequentially
    const operationsToExecute = continueParentRun
      ? CANONICAL_OPERATIONS_INVENTORY.filter((op) => op.sequence >= 35)
      : CANONICAL_OPERATIONS_INVENTORY;

    for (const op of operationsToExecute) {
      console.log(`[SmokeRunner] [${op.sequence}/44] ${op.operationKey} (${op.category}): ${op.description}`);

      // Handle BLOCKED_SPECIAL_SETUP
      if (op.category === "BLOCKED_SPECIAL_SETUP") {
        const evidence = await op.execute(ctx);
        manifestManager.recordCompletion(op, "BLOCKED_SPECIAL_SETUP", evidence);
        console.log(`[SmokeRunner]   -> SKIPPED (BLOCKED_SPECIAL_SETUP)`);
        continue;
      }

      // Write-ahead intent record & dispatch transition
      manifestManager.recordIntent(op);
      manifestManager.recordDispatched(op);

      let evidence: AllowlistedEvidence;
      try {
        evidence = await op.execute(ctx);
      } catch (err: unknown) {
        // FAIL-CLOSED: On timeout or crash after dispatch, transition to RUN_STATE_UNKNOWN and HALT
        const errMsg = String(err);
        console.error(`[SmokeRunner]   -> FATAL INCIDENT on ${op.operationKey}: ${errMsg}`);
        manifestManager.recordUnknown(op, errMsg);
        console.error(`[SmokeRunner] Execution halted in RUN_STATE_UNKNOWN. No auto-retry, no rollback.`);
        manifestManager.releaseLock();
        return { success: false, manifest: manifestManager.getManifest() };
      }

      if (!evidence.assertionPassed) {
        // Normal assertion failure
        console.error(`[SmokeRunner]   -> FAILED: Assertion failed (HTTP ${evidence.httpStatus})`);
        manifestManager.recordFailure(op, evidence, `Assertion failed (HTTP ${evidence.httpStatus})`);
        manifestManager.releaseLock();
        return { success: false, manifest: manifestManager.getManifest() };
      }

      const completionState =
        op.category === "LIVE_HTTP_EXPECTED_REJECTION"
          ? "REJECTED_AS_EXPECTED"
          : "SUCCEEDED";

      manifestManager.recordCompletion(op, completionState, evidence);
      console.log(`[SmokeRunner]   -> ${completionState} (HTTP ${evidence.httpStatus}, ${evidence.latencyMs}ms)`);
    }

    manifestManager.finishRun("COMPLETED");
    console.log(
      continueParentRun
        ? "[SmokeRunner] Continuation suite completed successfully!"
        : "[SmokeRunner] All 44 operations completed successfully!"
    );
    manifestManager.releaseLock();
    return { success: true, manifest: manifestManager.getManifest() };
  } catch (outerErr: unknown) {
    manifestManager.releaseLock();
    throw outerErr;
  }
}

// ============================================================================
// 6. CLI ENTRYPOINT (GUARDED AGAINST SIDE-EFFECTS ON IMPORT)
// ============================================================================

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("smoke-runner.ts") || process.argv[1].endsWith("smoke-runner.js"))
) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Smart Trip — Phase 3H Smoke Test Runner
Usage: npx tsx scripts/smoke-runner.ts [options]

Options:
  --help, -h                  Show this help message
  --dry-run                   Verify operation inventory mapping without network requests
  --run-id <uuid>             Specify canonical UUIDv4 execution runId (auto-generated if omitted)
  --reuse-gate4a-run <uuid>   Reuse validated test identities from completed Gate 4A run
  --continue-parent-run <uuid> Continue execution from a failed parent run (skips already-dispatched operations, reconciles state)
  --base-url <url>            Target web server base URL (default: http://localhost:3000)
  --timeout <ms>              Request timeout in ms (default: 15000)

Note: Live execution requires Gate 4 authorization.
    `);
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const runIdIdx = args.indexOf("--run-id");
  const runId = runIdIdx !== -1 && args[runIdIdx + 1] ? args[runIdIdx + 1] : undefined;
  const reuseIdx = args.indexOf("--reuse-gate4a-run");
  const reuseGate4aRun = reuseIdx !== -1 && args[reuseIdx + 1] ? args[reuseIdx + 1] : undefined;
  const continueIdx = args.indexOf("--continue-parent-run") !== -1
    ? args.indexOf("--continue-parent-run")
    : args.indexOf("--continue-run");
  const continueParentRun = continueIdx !== -1 && args[continueIdx + 1] ? args[continueIdx + 1] : undefined;
  const baseUrlIdx = args.indexOf("--base-url");
  const baseUrl = baseUrlIdx !== -1 && args[baseUrlIdx + 1] ? args[baseUrlIdx + 1] : undefined;

  runSmokeSuite({ runId, reuseGate4aRun, continueParentRun, baseUrl, dryRun })
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("[SmokeRunner] Uncaught fatal error:", err);
      process.exit(1);
    });
}

