/**
 * Smart Trip — Phase 3ZG Gate 4A Write-Ahead Orchestrator
 * Dedicated Write-Ahead Orchestrator for Gate 4A Staging Identity & Read-Only Smoke Verification
 *
 * Grounded in:
 * - Gate 4A Specification (0883d2f9-941c-4d13-be1b-b7fdc8759588 manifest standard)
 * - Phase 3ZF Blocker Analysis: Database mutation MUST NOT occur before write-ahead intent is flushed
 * - Phase 3ZG Strict Staging Allowlist: Enforces staging project `rwvptwjpfhtfkiwboexz` and blocks `fzdaasbckmnndqzqopex`
 *
 * CRITICAL SAFETY RULES:
 * 1. Zero side-effects on import: Merely importing this module does NOT connect to database or send HTTP requests.
 * 2. Fail-closed target guard: Asserts non-production database before initializing run directory or locks.
 * 3. Write-Ahead Sequencing: `INTENT_RECORDED` event is durably flushed via `fs.fsyncSync` to disk BEFORE `bootstrapTestSessions` is invoked.
 * 4. Secrets Suppression: Raw session tokens, cookie signatures, passwords, and connection strings are NEVER written to disk or logs.
 * 5. Incident Governance: On unhandled error or timeout, records `RUN_STATE_UNKNOWN` or `FAILED` and HALTS immediately. Zero auto-retry, zero auto-cleanup.
 *
 * DURABILITY & CRASH CAVEAT:
 * While all event records and manifest snapshots are explicitly flushed to storage via `fs.fsyncSync(fd)`
 * to drain OS buffer caches before dispatching database mutations or HTTP requests, standard Node.js
 * running on user-space OS filesystems (e.g. Windows NTFS) cannot guarantee absolute atomic filesystem
 * transactions against sudden hardware power failure or disk controller write-caching. This implementation
 * provides durable write-ahead serialization to maximize crash observability and manual reconciliation.
 */

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  assertNonProductionDatabase,
  bootstrapTestSessions,
  toSanitizedMetadata,
  validateRunId,
  isValidUUIDv4,
  type BootstrapTestSessionResult,
  type SanitizedBootstrapMetadata,
} from "./test-session-helper";
import { safeFetch, type SafeFetchOptions, type SafeFetchResponse } from "./smoke-runner";

// ============================================================================
// 1. DATA CONTRACTS & MANIFEST TYPES (GATE 4A SPECIFICATION)
// ============================================================================

export type Gate4aOperationCategory =
  | "LIVE_HTTP_INFRA_MUTATING"
  | "LIVE_HTTP_SAFE_READONLY"
  | "LIVE_HTTP_EXPECTED_REJECTION";

export type Gate4aOperationState =
  | "INTENT_RECORDED"
  | "DISPATCHED"
  | "SUCCEEDED"
  | "FAILED"
  | "RUN_STATE_UNKNOWN";

export type Gate4aRunState =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RUN_STATE_UNKNOWN";

export interface Gate4aEvidence {
  httpStatus: number;
  httpStatusText: string;
  latencyMs: number;
  assertionPassed: boolean;
  matchedUserId?: string;
  notes?: string;
}

export interface Gate4aEvent {
  timestamp: string;
  runId: string;
  operationId: string;
  operationKey: string;
  sequence: number;
  category: Gate4aOperationCategory;
  state: Gate4aOperationState;
  evidence?: Gate4aEvidence;
  error?: string;
}

export interface Gate4aOperationRecord {
  sequence: number;
  operationId: string;
  operationKey: string;
  category: Gate4aOperationCategory;
  description: string;
  state: Gate4aOperationState;
  dispatchedAt?: string;
  completedAt?: string;
  evidence?: Gate4aEvidence;
  error?: string;
}

export interface Gate4aManifest {
  manifestVersion: "1.0.0";
  runId: string;
  createdAt: string;
  updatedAt: string;
  baseUrl: string;
  runState: Gate4aRunState;
  authMetadata: SanitizedBootstrapMetadata | null;
  operations: Record<string, Gate4aOperationRecord>;
}

export interface Gate4aOperationDefinition {
  sequence: number;
  operationKey: string;
  category: Gate4aOperationCategory;
  description: string;
}

/**
 * Canonical 5 operations defining Gate 4A (Identity Bootstrap + 3 Authenticated & 1 Unauthenticated Read-Only Verification)
 */
export const GATE4A_OPERATIONS_INVENTORY: Gate4aOperationDefinition[] = [
  {
    sequence: 0,
    operationKey: "GATE4A-BOOTSTRAP",
    category: "LIVE_HTTP_INFRA_MUTATING",
    description: "Bootstrap test identities User A (Host) and User B (Member)",
  },
  {
    sequence: 1,
    operationKey: "GATE4A-HTTP-01",
    category: "LIVE_HTTP_EXPECTED_REJECTION",
    description: "GET /api/me without cookie -> expect 401 Unauthorized",
  },
  {
    sequence: 2,
    operationKey: "GATE4A-HTTP-02",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "GET /api/me with User A cookie -> expect 200 OK",
  },
  {
    sequence: 3,
    operationKey: "GATE4A-HTTP-03",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "GET /api/me with User B cookie -> expect 200 OK",
  },
  {
    sequence: 4,
    operationKey: "GATE4A-HTTP-04",
    category: "LIVE_HTTP_SAFE_READONLY",
    description: "GET /api/trips with User A cookie -> expect 200 OK",
  },
];

/**
 * Standard operationId format: `${runId}::${sequence}::${operationKey}`
 */
export function formatGate4aOperationId(
  runId: string,
  sequence: number,
  operationKey: string
): string {
  const seqStr = String(sequence).padStart(2, "0");
  return `${runId}::${seqStr}::${operationKey}`;
}

// ============================================================================
// 2. WRITE-AHEAD MANIFEST MANAGER
// ============================================================================

export class Gate4aManifestManager {
  private runsDir: string;
  private runDir: string;
  private manifestPath: string;
  private eventsPath: string;
  private lockPath: string;
  private lockFd: number | null = null;
  private manifest: Gate4aManifest;

  constructor(
    runId: string,
    baseDir: string = process.cwd(),
    baseUrl: string = "http://localhost:3000"
  ) {
    const validatedRunId = validateRunId(runId);
    this.runsDir = path.join(baseDir, ".smoke-runs");
    this.runDir = path.join(this.runsDir, validatedRunId);
    this.manifestPath = path.join(this.runDir, "manifest.json");
    this.eventsPath = path.join(this.runDir, "events.jsonl");
    this.lockPath = path.join(this.runDir, "runner.lock");

    const nowIso = new Date().toISOString();
    this.manifest = {
      manifestVersion: "1.0.0",
      runId: validatedRunId,
      createdAt: nowIso,
      updatedAt: nowIso,
      baseUrl,
      runState: "PENDING",
      authMetadata: null,
      operations: {},
    };
  }

  public getRunId(): string {
    return this.manifest.runId;
  }

  public getRunDir(): string {
    return this.runDir;
  }

  public getManifestPath(): string {
    return this.manifestPath;
  }

  public getEventsPath(): string {
    return this.eventsPath;
  }

  public getManifest(): Gate4aManifest {
    return JSON.parse(JSON.stringify(this.manifest)) as Gate4aManifest;
  }

  /**
   * Acquires exclusive process lock to prevent concurrent runs on the same runId.
   * Enforces non-overwrite collision guards using atomic `wx` flag.
   */
  public acquireLock(): void {
    if (!fs.existsSync(this.runsDir)) {
      fs.mkdirSync(this.runsDir, { recursive: true });
    }

    // Fail-closed run-directory collision guard
    if (fs.existsSync(this.runDir)) {
      throw new Error(
        `[Gate4aOrchestrator] Conflict: Execution run directory already exists at ${this.runDir}. Cannot execute or overwrite existing run directory for runId ${this.manifest.runId}.`
      );
    }

    if (fs.existsSync(this.manifestPath)) {
      throw new Error(
        `[Gate4aOrchestrator] Conflict: Execution manifest already exists at ${this.manifestPath}. Cannot overwrite existing run evidence for runId ${this.manifest.runId}.`
      );
    }
    if (fs.existsSync(this.eventsPath)) {
      throw new Error(
        `[Gate4aOrchestrator] Conflict: Execution events log already exists at ${this.eventsPath}. Cannot overwrite existing events for runId ${this.manifest.runId}.`
      );
    }

    // Atomic, non-recursive directory creation
    try {
      fs.mkdirSync(this.runDir);
    } catch (mkdirErr: unknown) {
      const code = (mkdirErr as { code?: string })?.code;
      if (code === "EEXIST") {
        throw new Error(
          `[Gate4aOrchestrator] Concurrency conflict: Execution run directory already exists at ${this.runDir}. Cannot execute duplicate runner for runId ${this.manifest.runId}.`
        );
      }
      throw mkdirErr;
    }

    // Atomic lockfile creation
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
          `[Gate4aOrchestrator] Concurrency conflict: Run lock already exists at ${this.lockPath}. Cannot execute duplicate runner for runId ${this.manifest.runId}.`
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
   * Initializes manifest and writes write-ahead INTENT_RECORDED for GATE4A-BOOTSTRAP
   * strictly BEFORE any database mutation is dispatched.
   */
  public initializeWriteAhead(): void {
    const nowIso = new Date().toISOString();
    this.manifest.runState = "RUNNING";
    this.manifest.updatedAt = nowIso;

    for (const op of GATE4A_OPERATIONS_INVENTORY) {
      const opId = formatGate4aOperationId(this.manifest.runId, op.sequence, op.operationKey);
      this.manifest.operations[op.operationKey] = {
        sequence: op.sequence,
        operationId: opId,
        operationKey: op.operationKey,
        category: op.category,
        description: op.description,
        state: "INTENT_RECORDED",
      };
    }

    // Set dispatchedAt on the initial bootstrap operation
    this.manifest.operations["GATE4A-BOOTSTRAP"].dispatchedAt = nowIso;

    // 1. Durably flush manifest snapshot to disk
    this.flushManifest();

    // 2. Durably append INTENT_RECORDED event to events.jsonl
    const bootstrapOp = GATE4A_OPERATIONS_INVENTORY[0];
    const opId = formatGate4aOperationId(
      this.manifest.runId,
      bootstrapOp.sequence,
      bootstrapOp.operationKey
    );
    const event: Gate4aEvent = {
      timestamp: nowIso,
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: bootstrapOp.operationKey,
      sequence: bootstrapOp.sequence,
      category: bootstrapOp.category,
      state: "INTENT_RECORDED",
    };
    this.appendEventDurable(event);
  }

  /**
   * Records successful bootstrap completion and updates manifest with sanitized metadata.
   */
  public recordBootstrapSuccess(
    authMetadata: SanitizedBootstrapMetadata,
    evidence: Gate4aEvidence
  ): void {
    const nowIso = new Date().toISOString();
    const bootstrapOp = GATE4A_OPERATIONS_INVENTORY[0];
    const opId = formatGate4aOperationId(
      this.manifest.runId,
      bootstrapOp.sequence,
      bootstrapOp.operationKey
    );

    const event: Gate4aEvent = {
      timestamp: nowIso,
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: bootstrapOp.operationKey,
      sequence: bootstrapOp.sequence,
      category: bootstrapOp.category,
      state: "SUCCEEDED",
      evidence,
    };
    this.appendEventDurable(event);

    const record = this.manifest.operations["GATE4A-BOOTSTRAP"];
    if (record) {
      record.state = "SUCCEEDED";
      record.completedAt = nowIso;
      record.evidence = evidence;
    }

    this.manifest.authMetadata = authMetadata;
    this.manifest.updatedAt = nowIso;
    this.flushManifest();
  }

  /**
   * Records in-flight transition to DISPATCHED before dispatching an HTTP request.
   */
  public recordDispatched(operationKey: string): void {
    const op = GATE4A_OPERATIONS_INVENTORY.find((o) => o.operationKey === operationKey);
    if (!op) throw new Error(`Unknown operationKey: ${operationKey}`);

    const nowIso = new Date().toISOString();
    const opId = formatGate4aOperationId(this.manifest.runId, op.sequence, op.operationKey);

    const event: Gate4aEvent = {
      timestamp: nowIso,
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
      record.dispatchedAt = nowIso;
    }
    this.manifest.updatedAt = nowIso;
    this.flushManifest();
  }

  /**
   * Records completion of an HTTP operation.
   */
  public recordCompletion(
    operationKey: string,
    state: "SUCCEEDED" | "FAILED",
    evidence: Gate4aEvidence,
    error?: string
  ): void {
    const op = GATE4A_OPERATIONS_INVENTORY.find((o) => o.operationKey === operationKey);
    if (!op) throw new Error(`Unknown operationKey: ${operationKey}`);

    const nowIso = new Date().toISOString();
    const opId = formatGate4aOperationId(this.manifest.runId, op.sequence, op.operationKey);

    const event: Gate4aEvent = {
      timestamp: nowIso,
      runId: this.manifest.runId,
      operationId: opId,
      operationKey: op.operationKey,
      sequence: op.sequence,
      category: op.category,
      state,
      evidence,
      error,
    };
    this.appendEventDurable(event);

    const record = this.manifest.operations[op.operationKey];
    if (record) {
      record.state = state;
      record.completedAt = nowIso;
      record.evidence = evidence;
      if (error) record.error = error;
    }

    if (state === "FAILED") {
      this.manifest.runState = "FAILED";
    }

    this.manifest.updatedAt = nowIso;
    this.flushManifest();
  }

  /**
   * Records RUN_STATE_UNKNOWN on unhandled crash, network timeout, or ambiguous dispatch.
   * Execution HALTS immediately without auto-retry or rollback.
   */
  public recordUnknown(operationKey: string, errorMessage: string): void {
    const op = GATE4A_OPERATIONS_INVENTORY.find((o) => o.operationKey === operationKey);
    const seq = op ? op.sequence : 0;
    const cat = op ? op.category : "LIVE_HTTP_SAFE_READONLY";
    const nowIso = new Date().toISOString();
    const opId = formatGate4aOperationId(this.manifest.runId, seq, operationKey);

    const event: Gate4aEvent = {
      timestamp: nowIso,
      runId: this.manifest.runId,
      operationId: opId,
      operationKey,
      sequence: seq,
      category: cat,
      state: "RUN_STATE_UNKNOWN",
      error: errorMessage,
    };
    this.appendEventDurable(event);

    const record = this.manifest.operations[operationKey];
    if (record) {
      record.state = "RUN_STATE_UNKNOWN";
      record.error = errorMessage;
      record.completedAt = nowIso;
    }

    this.manifest.runState = "RUN_STATE_UNKNOWN";
    this.manifest.updatedAt = nowIso;
    this.flushManifest();
  }

  /**
   * Marks the entire Gate 4A run as COMPLETED.
   */
  public markCompleted(): void {
    this.manifest.runState = "COMPLETED";
    this.manifest.updatedAt = new Date().toISOString();
    this.flushManifest();
  }

  /**
   * Durably writes an append-only event record with explicit fsyncSync.
   */
  private appendEventDurable(event: Gate4aEvent): void {
    const line = JSON.stringify(event) + "\n";
    const fd = fs.openSync(this.eventsPath, "a");
    try {
      fs.writeFileSync(fd, line, "utf-8");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  }

  /**
   * Durably flushes manifest snapshot using atomic write pattern + fsyncSync.
   */
  private flushManifest(): void {
    const tempPath = `${this.manifestPath}.tmp.${Date.now()}`;
    const content = JSON.stringify(this.manifest, null, 2);

    const fd = fs.openSync(tempPath, "w");
    try {
      fs.writeFileSync(fd, content, "utf-8");
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }

    // Atomic replace
    fs.renameSync(tempPath, this.manifestPath);
  }
}

// ============================================================================
// 3. GATE 4A SUITE ORCHESTRATOR EXECUTION FUNCTION
// ============================================================================

export interface Gate4aOrchestratorOptions {
  runId?: string;
  baseUrl?: string;
  baseDir?: string;
  timeoutMs?: number;
  /**
   * When true, verifies lock, write-ahead manifest creation, and intent flush
   * without connecting to the database or dispatching network requests.
   */
  dryRun?: boolean;
  /**
   * When true, skips database target validation. Strictly for isolated offline unit tests.
   */
  skipTargetCheck?: boolean;
  /**
   * Custom bootstrap executor (defaults to live bootstrapTestSessions).
   * Enables injecting mock/spy executors for offline testing without database mutations.
   */
  bootstrapFn?: (opts: { runId: string }) => Promise<BootstrapTestSessionResult>;
  /**
   * Custom HTTP fetch executor (defaults to safeFetch).
   * Enables injecting mock HTTP responses for offline testing without network calls.
   */
  fetchFn?: (baseUrl: string, options: SafeFetchOptions) => Promise<SafeFetchResponse>;
}

export interface Gate4aOrchestratorResult {
  success: boolean;
  runId: string;
  runState: Gate4aRunState;
  manifest: Gate4aManifest;
}

/**
 * Executes Gate 4A Write-Ahead Orchestration strictly targeted at Staging.
 *
 * NOTE: Phase 3ZG implements and verifies the orchestrator statically.
 * Live execution against Staging requires explicit authorization.
 */
export async function runGate4aOrchestration(
  options: Gate4aOrchestratorOptions = {}
): Promise<Gate4aOrchestratorResult> {
  const baseDir = options.baseDir || process.cwd();

  // Load local .env into process.env if not already loaded (e.g. CLI direct execution)
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
    try {
      const envPath = path.join(baseDir, ".env");
      if (fs.existsSync(envPath)) {
        process.loadEnvFile(envPath);
      }
    } catch {
      // Ignore errors; assertNonProductionDatabase will fail closed if missing
    }
  }

  // Fail-closed Safety Guard: Validates database target before locks or manifests
  let projectRef = "rwvptwjpfhtfkiwboexz";
  if (!options.skipTargetCheck) {
    const verified = assertNonProductionDatabase();
    projectRef = verified.projectRef;
  }

  const executionRunId = options.runId ? validateRunId(options.runId) : randomUUID();
  const baseUrl = options.baseUrl || process.env.BASE_URL || "http://localhost:3000";
  const timeoutMs = options.timeoutMs ?? 15000;
  const dryRun = Boolean(options.dryRun);
  const bootstrapExecutor = options.bootstrapFn ?? bootstrapTestSessions;
  const fetchExecutor = options.fetchFn ?? safeFetch;

  const manifestManager = new Gate4aManifestManager(executionRunId, baseDir, baseUrl);
  manifestManager.acquireLock();

  try {
    console.log(`[Gate4aOrchestrator] Starting Gate 4A Orchestration (runId: ${executionRunId})`);
    console.log(`[Gate4aOrchestrator] Target Staging Project: ${projectRef}`);
    console.log(`[Gate4aOrchestrator] Target Base URL: ${baseUrl}`);

    // STEP 1: DURABLY RECORD INTENT TO DISK BEFORE ANY DATABASE MUTATION
    manifestManager.initializeWriteAhead();
    console.log(`[Gate4aOrchestrator] Write-Ahead: INTENT_RECORDED flushed to disk.`);

    if (dryRun) {
      console.log(`[Gate4aOrchestrator] DRY RUN COMPLETE: Manifest and event log flushed without mutations.`);
      manifestManager.releaseLock();
      return {
        success: true,
        runId: executionRunId,
        runState: manifestManager.getManifest().runState,
        manifest: manifestManager.getManifest(),
      };
    }

    // STEP 2: DISPATCH DATABASE MUTATION (BOOTSTRAP TEST SESSIONS)
    console.log(`[Gate4aOrchestrator] Dispatching bootstrapTestSessions for User A (Host) and User B (Member)...`);
    const bootstrapStartTime = Date.now();
    let bootstrapResult: BootstrapTestSessionResult;

    try {
      bootstrapResult = await bootstrapExecutor({ runId: executionRunId });
    } catch (bootErr: unknown) {
      const errMessage = (bootErr as Error).message || String(bootErr);
      manifestManager.recordUnknown("GATE4A-BOOTSTRAP", `Bootstrap failed or aborted: ${errMessage}`);
      throw bootErr;
    }

    const bootstrapLatency = Date.now() - bootstrapStartTime;
    const sanitizedMetadata = toSanitizedMetadata(bootstrapResult);

    manifestManager.recordBootstrapSuccess(sanitizedMetadata, {
      httpStatus: 200,
      httpStatusText: "OK",
      latencyMs: bootstrapLatency,
      assertionPassed: true,
      notes: `Bootstrapped User A (${sanitizedMetadata.userA_id}) and User B (${sanitizedMetadata.userB_id})`,
    });
    console.log(`[Gate4aOrchestrator] Bootstrap succeeded and sanitized metadata recorded in manifest.`);

    const hostCookie = bootstrapResult.host.session.cookieHeader;
    const memberCookie = bootstrapResult.member.session.cookieHeader;

    // STEP 3: DISPATCH SEQUENTIAL HTTP READ-ONLY CHECKS

    // 3.1: GATE4A-HTTP-01: GET /api/me without cookie -> expect 401
    manifestManager.recordDispatched("GATE4A-HTTP-01");
    let res01: SafeFetchResponse;
    try {
      res01 = await fetchExecutor(baseUrl, { method: "GET", path: "/api/me", timeoutMs });
    } catch (fetchErr: unknown) {
      manifestManager.recordUnknown("GATE4A-HTTP-01", (fetchErr as Error).message);
      throw fetchErr;
    }
    const pass01 = res01.status === 401;
    manifestManager.recordCompletion(
      "GATE4A-HTTP-01",
      pass01 ? "SUCCEEDED" : "FAILED",
      {
        httpStatus: res01.status,
        httpStatusText: res01.statusText,
        latencyMs: res01.latencyMs,
        assertionPassed: pass01,
        notes: `Assertion ${pass01 ? "passed" : "failed"} (HTTP ${res01.status})`,
      },
      pass01 ? undefined : `Expected 401, received ${res01.status}`
    );
    if (!pass01) throw new Error(`GATE4A-HTTP-01 failed: expected 401, received ${res01.status}`);

    // 3.2: GATE4A-HTTP-02: GET /api/me with User A cookie -> expect 200
    manifestManager.recordDispatched("GATE4A-HTTP-02");
    let res02: SafeFetchResponse;
    try {
      res02 = await fetchExecutor(baseUrl, {
        method: "GET",
        path: "/api/me",
        cookie: hostCookie,
        timeoutMs,
      });
    } catch (fetchErr: unknown) {
      manifestManager.recordUnknown("GATE4A-HTTP-02", (fetchErr as Error).message);
      throw fetchErr;
    }
    const matchedUserA = res02.jsonBody?.data && (res02.jsonBody.data as { id?: string }).id === sanitizedMetadata.userA_id;
    const pass02 = res02.status === 200 && Boolean(matchedUserA);
    manifestManager.recordCompletion(
      "GATE4A-HTTP-02",
      pass02 ? "SUCCEEDED" : "FAILED",
      {
        httpStatus: res02.status,
        httpStatusText: res02.statusText,
        latencyMs: res02.latencyMs,
        assertionPassed: pass02,
        matchedUserId: sanitizedMetadata.userA_id,
        notes: `Assertion ${pass02 ? "passed" : "failed"} (HTTP ${res02.status})`,
      },
      pass02 ? undefined : `Expected 200 with matched User A ID, received ${res02.status}`
    );
    if (!pass02) throw new Error(`GATE4A-HTTP-02 failed: expected 200, received ${res02.status}`);

    // 3.3: GATE4A-HTTP-03: GET /api/me with User B cookie -> expect 200
    manifestManager.recordDispatched("GATE4A-HTTP-03");
    let res03: SafeFetchResponse;
    try {
      res03 = await fetchExecutor(baseUrl, {
        method: "GET",
        path: "/api/me",
        cookie: memberCookie,
        timeoutMs,
      });
    } catch (fetchErr: unknown) {
      manifestManager.recordUnknown("GATE4A-HTTP-03", (fetchErr as Error).message);
      throw fetchErr;
    }
    const matchedUserB = res03.jsonBody?.data && (res03.jsonBody.data as { id?: string }).id === sanitizedMetadata.userB_id;
    const pass03 = res03.status === 200 && Boolean(matchedUserB);
    manifestManager.recordCompletion(
      "GATE4A-HTTP-03",
      pass03 ? "SUCCEEDED" : "FAILED",
      {
        httpStatus: res03.status,
        httpStatusText: res03.statusText,
        latencyMs: res03.latencyMs,
        assertionPassed: pass03,
        matchedUserId: sanitizedMetadata.userB_id,
        notes: `Assertion ${pass03 ? "passed" : "failed"} (HTTP ${res03.status})`,
      },
      pass03 ? undefined : `Expected 200 with matched User B ID, received ${res03.status}`
    );
    if (!pass03) throw new Error(`GATE4A-HTTP-03 failed: expected 200, received ${res03.status}`);

    // 3.4: GATE4A-HTTP-04: GET /api/trips with User A cookie -> expect 200
    manifestManager.recordDispatched("GATE4A-HTTP-04");
    let res04: SafeFetchResponse;
    try {
      res04 = await fetchExecutor(baseUrl, {
        method: "GET",
        path: "/api/trips",
        cookie: hostCookie,
        timeoutMs,
      });
    } catch (fetchErr: unknown) {
      manifestManager.recordUnknown("GATE4A-HTTP-04", (fetchErr as Error).message);
      throw fetchErr;
    }
    const pass04 = res04.status === 200;
    manifestManager.recordCompletion(
      "GATE4A-HTTP-04",
      pass04 ? "SUCCEEDED" : "FAILED",
      {
        httpStatus: res04.status,
        httpStatusText: res04.statusText,
        latencyMs: res04.latencyMs,
        assertionPassed: pass04,
        notes: `Assertion ${pass04 ? "passed" : "failed"} (HTTP ${res04.status})`,
      },
      pass04 ? undefined : `Expected 200, received ${res04.status}`
    );
    if (!pass04) throw new Error(`GATE4A-HTTP-04 failed: expected 200, received ${res04.status}`);

    // STEP 4: MARK RUN COMPLETED
    manifestManager.markCompleted();
    console.log(`[Gate4aOrchestrator] Gate 4A Orchestration completed successfully.`);

    return {
      success: true,
      runId: executionRunId,
      runState: "COMPLETED",
      manifest: manifestManager.getManifest(),
    };
  } finally {
    manifestManager.releaseLock();
  }
}

// ============================================================================
// 4. CLI EXECUTION ENTRY POINT
// ============================================================================

if (
  process.argv[1] &&
  (process.argv[1].endsWith("gate-4a-orchestrator.ts") ||
    process.argv[1].endsWith("gate-4a-orchestrator.js"))
) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Smart Trip — Phase 3ZG/3ZI Gate 4A Write-Ahead Orchestrator
Usage: npx tsx scripts/gate-4a-orchestrator.ts [options]

Options:
  --help, -h          Show this help message
  --dry-run           Verify lock and write-ahead intent without mutations
  --run-id <uuid>     Specify UUIDv4 execution runId (auto-generated if omitted)
  --base-url <url>    Target web server base URL (default: http://localhost:3000)
  --timeout <ms>      Request timeout in ms (default: 15000)
    `);
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const runIdIdx = args.indexOf("--run-id");
  const runId = runIdIdx !== -1 && args[runIdIdx + 1] ? args[runIdIdx + 1] : undefined;
  const baseUrlIdx = args.indexOf("--base-url");
  const baseUrl = baseUrlIdx !== -1 && args[baseUrlIdx + 1] ? args[baseUrlIdx + 1] : undefined;
  const timeoutIdx = args.indexOf("--timeout");
  const timeoutMs = timeoutIdx !== -1 && args[timeoutIdx + 1] ? Number(args[timeoutIdx + 1]) : undefined;

  runGate4aOrchestration({ runId, baseUrl, dryRun, timeoutMs })
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("[Gate4aOrchestrator] Fatal execution error:", (err as Error).message);
      process.exit(1);
    });
}

