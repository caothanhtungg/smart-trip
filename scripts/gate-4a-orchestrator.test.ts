import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { randomUUID } from "node:crypto";
import {
  Gate4aManifestManager,
  formatGate4aOperationId,
  GATE4A_OPERATIONS_INVENTORY,
  runGate4aOrchestration,
  type Gate4aOrchestratorOptions,
} from "./gate-4a-orchestrator";
import type {
  BootstrapTestSessionResult,
  SanitizedBootstrapMetadata,
} from "./test-session-helper";
import type { SafeFetchOptions, SafeFetchResponse } from "./smoke-runner";

describe("Gate 4A Write-Ahead Orchestrator Static Safety Review", () => {
  let tempBaseDir: string;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "gate4a-unit-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // 1. DATA CONTRACTS & OPERATION IDS
  // ==========================================================================

  it("should format operation ID with padded 2-digit sequence", () => {
    const runId = "0883d2f9-941c-4d13-be1b-b7fdc8759588";
    assert.equal(
      formatGate4aOperationId(runId, 0, "GATE4A-BOOTSTRAP"),
      `${runId}::00::GATE4A-BOOTSTRAP`
    );
    assert.equal(
      formatGate4aOperationId(runId, 1, "GATE4A-HTTP-01"),
      `${runId}::01::GATE4A-HTTP-01`
    );
    assert.equal(
      formatGate4aOperationId(runId, 4, "GATE4A-HTTP-04"),
      `${runId}::04::GATE4A-HTTP-04`
    );
  });

  it("should maintain 5 canonical Gate 4A operations in inventory", () => {
    assert.equal(GATE4A_OPERATIONS_INVENTORY.length, 5);
    const keys = GATE4A_OPERATIONS_INVENTORY.map((o) => o.operationKey);
    assert.deepEqual(keys, [
      "GATE4A-BOOTSTRAP",
      "GATE4A-HTTP-01",
      "GATE4A-HTTP-02",
      "GATE4A-HTTP-03",
      "GATE4A-HTTP-04",
    ]);
  });

  // ==========================================================================
  // 2. LOCK & RUN DIRECTORY COLLISION PROTECTION
  // ==========================================================================

  it("should enforce fail-closed run directory collision protection", () => {
    const runId = randomUUID();
    const manager1 = new Gate4aManifestManager(runId, tempBaseDir);
    manager1.acquireLock();

    const manager2 = new Gate4aManifestManager(runId, tempBaseDir);
    assert.throws(
      () => manager2.acquireLock(),
      /Execution run directory already exists/
    );

    manager1.releaseLock();
  });

  it("should enforce fail-closed lock collision when lockfile exists", () => {
    const runId = randomUUID();
    const runDir = path.join(tempBaseDir, ".smoke-runs", runId);
    fs.mkdirSync(runDir, { recursive: true });
    const lockPath = path.join(runDir, "runner.lock");
    fs.writeFileSync(lockPath, JSON.stringify({ pid: 99999, runId }), "utf-8");

    const manager = new Gate4aManifestManager(runId, tempBaseDir);
    assert.throws(
      () => manager.acquireLock(),
      /Execution run directory already exists/
    );
  });

  it("should not delete another process lock if acquisition was not granted", () => {
    const runId = randomUUID();
    const manager1 = new Gate4aManifestManager(runId, tempBaseDir);
    manager1.acquireLock();

    const lockPath = path.join(tempBaseDir, ".smoke-runs", runId, "runner.lock");
    assert.ok(fs.existsSync(lockPath));

    const manager2 = new Gate4aManifestManager(runId, tempBaseDir);
    try {
      manager2.acquireLock();
    } catch {
      // Expected collision
    }

    // manager2 calling releaseLock must do nothing and NOT delete manager1's lock
    manager2.releaseLock();
    assert.ok(fs.existsSync(lockPath), "Manager 2 must not delete Manager 1's lockfile");

    manager1.releaseLock();
    assert.ok(!fs.existsSync(lockPath), "Manager 1 must clean up its own lockfile on release");
  });

  // ==========================================================================
  // 3. WRITE-AHEAD ORDERING & SPY VERIFICATION
  // ==========================================================================

  it("should verify INTENT_RECORDED is flushed to disk strictly BEFORE bootstrapTestSessions is invoked", async () => {
    const runId = randomUUID();
    const callOrder: string[] = [];

    const mockUserAId = randomUUID();
    const mockUserBId = randomUUID();

    const mockBootstrapResult: BootstrapTestSessionResult = {
      runId,
      host: {
        user: { id: mockUserAId, email: `host-${runId}@test.local`, name: "Host", displayName: "Host A" },
        session: { id: randomUUID(), userId: mockUserAId, expiresAt: new Date(Date.now() + 3600000), cookieHeader: "mock_cookie_a" },
      },
      member: {
        user: { id: mockUserBId, email: `member-${runId}@test.local`, name: "Member", displayName: "Member B" },
        session: { id: randomUUID(), userId: mockUserBId, expiresAt: new Date(Date.now() + 3600000), cookieHeader: "mock_cookie_b" },
      },
      createdAt: new Date(),
    };

    // Spy bootstrap function that inspects the disk at the moment of invocation
    const spyBootstrapFn = async (opts: { runId: string }): Promise<BootstrapTestSessionResult> => {
      callOrder.push("BOOTSTRAP_DISPATCHED");

      const runDir = path.join(tempBaseDir, ".smoke-runs", opts.runId);
      const manifestPath = path.join(runDir, "manifest.json");
      const eventsPath = path.join(runDir, "events.jsonl");

      // Verify that manifest already exists on disk
      assert.ok(fs.existsSync(manifestPath), "manifest.json must exist before bootstrap is called");
      const manifestAtDispatch = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      assert.equal(manifestAtDispatch.runState, "RUNNING");
      assert.equal(manifestAtDispatch.authMetadata, null, "authMetadata must be null prior to bootstrap execution");
      assert.equal(
        manifestAtDispatch.operations["GATE4A-BOOTSTRAP"].state,
        "INTENT_RECORDED",
        "GATE4A-BOOTSTRAP must be in INTENT_RECORDED state prior to bootstrap execution"
      );

      // Verify that events.jsonl already contains INTENT_RECORDED
      assert.ok(fs.existsSync(eventsPath), "events.jsonl must exist before bootstrap is called");
      const eventsAtDispatch = fs.readFileSync(eventsPath, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
      assert.equal(eventsAtDispatch.length, 1);
      assert.equal(eventsAtDispatch[0].operationKey, "GATE4A-BOOTSTRAP");
      assert.equal(eventsAtDispatch[0].state, "INTENT_RECORDED");

      callOrder.push("BOOTSTRAP_COMPLETED");
      return mockBootstrapResult;
    };

    const mockFetchFn = async (baseUrl: string, options: SafeFetchOptions): Promise<SafeFetchResponse> => {
      if (options.path === "/api/me" && !options.cookie) {
        return { status: 401, statusText: "Unauthorized", latencyMs: 10, contentType: "application/json" };
      }
      if (options.path === "/api/me" && options.cookie === "mock_cookie_a") {
        return { status: 200, statusText: "OK", latencyMs: 15, contentType: "application/json", jsonBody: { data: { id: mockUserAId } } };
      }
      if (options.path === "/api/me" && options.cookie === "mock_cookie_b") {
        return { status: 200, statusText: "OK", latencyMs: 15, contentType: "application/json", jsonBody: { data: { id: mockUserBId } } };
      }
      if (options.path === "/api/trips" && options.cookie === "mock_cookie_a") {
        return { status: 200, statusText: "OK", latencyMs: 20, contentType: "application/json", jsonBody: { data: [] } };
      }
      return { status: 500, statusText: "Unexpected Mock Request", latencyMs: 0, contentType: "application/json" };
    };

    const orchestratorResult = await runGate4aOrchestration({
      runId,
      baseDir: tempBaseDir,
      skipTargetCheck: true,
      bootstrapFn: spyBootstrapFn,
      fetchFn: mockFetchFn,
    });

    assert.equal(orchestratorResult.success, true);
    assert.equal(orchestratorResult.runState, "COMPLETED");
    assert.deepEqual(callOrder, ["BOOTSTRAP_DISPATCHED", "BOOTSTRAP_COMPLETED"]);
  });

  it("should never invoke bootstrapTestSessions if write-ahead flush fails", async () => {
    let bootstrapCalled = false;
    const spyBootstrapFn = async (): Promise<BootstrapTestSessionResult> => {
      bootstrapCalled = true;
      throw new Error("Should never be called");
    };

    const runId = randomUUID();
    // Simulate non-writable run directory by creating a file with the same name as .smoke-runs
    const runsCollisionPath = path.join(tempBaseDir, ".smoke-runs");
    fs.writeFileSync(runsCollisionPath, "not a directory", "utf-8");

    await assert.rejects(
      async () => {
        await runGate4aOrchestration({
          runId,
          baseDir: tempBaseDir,
          skipTargetCheck: true,
          bootstrapFn: spyBootstrapFn,
        });
      }
    );

    assert.equal(bootstrapCalled, false, "bootstrapFn must NEVER be called when directory/flush fails");
  });

  // ==========================================================================
  // 4. FAILURE HANDLING & RUN_STATE_UNKNOWN GOVERNANCE
  // ==========================================================================

  it("should transition to RUN_STATE_UNKNOWN when bootstrap fails and halt without retry", async () => {
    const runId = randomUUID();
    let bootstrapAttempts = 0;

    const failingBootstrapFn = async (): Promise<BootstrapTestSessionResult> => {
      bootstrapAttempts++;
      throw new Error("Simulated database timeout during bootstrap transaction");
    };

    await assert.rejects(
      async () => {
        await runGate4aOrchestration({
          runId,
          baseDir: tempBaseDir,
          skipTargetCheck: true,
          bootstrapFn: failingBootstrapFn,
        });
      },
      /Simulated database timeout during bootstrap transaction/
    );

    // Assert strictly single attempt (no automated retry)
    assert.equal(bootstrapAttempts, 1);

    const runDir = path.join(tempBaseDir, ".smoke-runs", runId);
    const manifest = JSON.parse(fs.readFileSync(path.join(runDir, "manifest.json"), "utf-8"));
    assert.equal(manifest.runState, "RUN_STATE_UNKNOWN");
    assert.equal(manifest.operations["GATE4A-BOOTSTRAP"].state, "RUN_STATE_UNKNOWN");
    assert.ok(manifest.operations["GATE4A-BOOTSTRAP"].error?.includes("Simulated database timeout"));

    const events = fs.readFileSync(path.join(runDir, "events.jsonl"), "utf-8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(events.length, 2);
    assert.equal(events[0].state, "INTENT_RECORDED");
    assert.equal(events[1].state, "RUN_STATE_UNKNOWN");
  });

  // ==========================================================================
  // 5. SECRETS SANITIZATION IN ARTIFACTS
  // ==========================================================================

  it("should strictly omit cookies, raw tokens, passwords, and DB URLs from manifest and events", async () => {
    const runId = randomUUID();
    const mockUserAId = randomUUID();
    const mockUserBId = randomUUID();
    const rawSecretToken = "raw_secret_token_1234567890abcdef";
    const rawHostCookieHeader = "better-auth.session_token=secret_host_signed_cookie_xyz";
    const rawMemberCookieHeader = "better-auth.session_token=secret_member_signed_cookie_abc";

    const mockBootstrapResult: BootstrapTestSessionResult = {
      runId,
      host: {
        user: { id: mockUserAId, email: `host-${runId}@test.local`, name: "Host", displayName: "Host A" },
        session: { id: randomUUID(), userId: mockUserAId, expiresAt: new Date(Date.now() + 3600000), cookieHeader: rawHostCookieHeader },
      },
      member: {
        user: { id: mockUserBId, email: `member-${runId}@test.local`, name: "Member", displayName: "Member B" },
        session: { id: randomUUID(), userId: mockUserBId, expiresAt: new Date(Date.now() + 3600000), cookieHeader: rawMemberCookieHeader },
      },
      createdAt: new Date(),
    };

    const mockFetchFn = async (baseUrl: string, options: SafeFetchOptions): Promise<SafeFetchResponse> => {
      if (options.path === "/api/me" && !options.cookie) {
        return { status: 401, statusText: "Unauthorized", latencyMs: 10, contentType: "application/json" };
      }
      if (options.path === "/api/me" && options.cookie) {
        const uid = options.cookie === rawHostCookieHeader ? mockUserAId : mockUserBId;
        return { status: 200, statusText: "OK", latencyMs: 15, contentType: "application/json", jsonBody: { data: { id: uid } } };
      }
      return { status: 200, statusText: "OK", latencyMs: 20, contentType: "application/json", jsonBody: { data: [] } };
    };

    await runGate4aOrchestration({
      runId,
      baseDir: tempBaseDir,
      skipTargetCheck: true,
      bootstrapFn: async () => mockBootstrapResult,
      fetchFn: mockFetchFn,
    });

    const runDir = path.join(tempBaseDir, ".smoke-runs", runId);
    const manifestRaw = fs.readFileSync(path.join(runDir, "manifest.json"), "utf-8");
    const eventsRaw = fs.readFileSync(path.join(runDir, "events.jsonl"), "utf-8");

    // Strictly assert zero occurrence of secrets in disk artifacts
    assert.ok(!manifestRaw.includes(rawSecretToken), "manifest must not contain raw session token");
    assert.ok(!manifestRaw.includes(rawHostCookieHeader), "manifest must not contain raw host cookie header");
    assert.ok(!manifestRaw.includes(rawMemberCookieHeader), "manifest must not contain raw member cookie header");
    assert.ok(!manifestRaw.includes("password"), "manifest must not contain password keyword");
    assert.ok(!manifestRaw.includes("postgresql://"), "manifest must not contain database URI");

    assert.ok(!eventsRaw.includes(rawSecretToken), "events.jsonl must not contain raw session token");
    assert.ok(!eventsRaw.includes(rawHostCookieHeader), "events.jsonl must not contain raw host cookie header");
    assert.ok(!eventsRaw.includes(rawMemberCookieHeader), "events.jsonl must not contain raw member cookie header");
    assert.ok(!eventsRaw.includes("password"), "events.jsonl must not contain password keyword");
    assert.ok(!eventsRaw.includes("postgresql://"), "events.jsonl must not contain database URI");
  });
});
