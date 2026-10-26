/**
 * Smart Trip — Phase 3H Smoke Testing
 * Test Session Helper: Module for Auth Bootstrapping & Cookie Signing
 *
 * Grounded in:
 * - Better Auth 1.7.11 Cookie Signing & Verification Specification (Phase 3H-R59, R60)
 * - Expired Session Lifecycle & Deletion Branch Audit (Phase 3H-R61)
 * - Write-Ahead Manifest Enum Standard `INTENT_RECORDED` (Phase 3H-R62)
 *
 * CRITICAL SAFETY RULES:
 * 1. Zero side-effects on import: Merely importing this module does NOT connect to database.
 * 2. Secrets and tokens are NEVER printed to stdout/stderr or written to manifests.
 * 3. Zero automated cleanup on `RUN_STATE_UNKNOWN` or unhandled error.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

// ============================================================================
// 1. MANIFEST & STATE ENUM TYPES (FROZEN PHASE 3H SPECIFICATION)
// ============================================================================

/**
 * Canonical write-ahead operation lifecycle states as locked in Phase 3H-R62.
 * `INTENT_RECORDED` is the sole standard enum for pre-dispatch durable logging.
 */
export type OperationState =
  | "INTENT_RECORDED"
  | "DISPATCHED"
  | "SUCCEEDED"
  | "FAILED"
  | "REJECTED_AS_EXPECTED";

export const UUIDV4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a strictly formatted RFC 4122 UUIDv4.
 */
export function isValidUUIDv4(id: string): boolean {
  return typeof id === "string" && UUIDV4_REGEX.test(id.trim());
}

/**
 * Enforces runId validity, throwing an error if runId is not canonical UUIDv4.
 */
export function validateRunId(runId: string): string {
  if (!runId || typeof runId !== "string" || !isValidUUIDv4(runId)) {
    throw new Error(
      `[TestSessionHelper] Invalid runId "${runId}": must be a valid canonical UUIDv4 string`
    );
  }
  return runId.trim().toLowerCase();
}

export type TestUserRole = "HOST" | "MEMBER";

export interface GeneratedUserSpec {
  role: TestUserRole;
  email: string;
  name: string;
  displayName: string;
  emailVerified: boolean;
}

export interface GeneratedSessionSpec {
  rawToken: string;
  signedToken: string;
  cookieHeader: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface InMemCredentials {
  runId: string;
  hostUser: GeneratedUserSpec;
  hostSession: GeneratedSessionSpec;
  memberUser: GeneratedUserSpec;
  memberSession: GeneratedSessionSpec;
}

export interface UserRecordSummary {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
}

export interface SessionRecordSummary {
  id: string;
  userId: string;
  expiresAt: Date;
  cookieHeader: string;
}

export interface BootstrapTestSessionResult {
  runId: string;
  host: {
    user: UserRecordSummary;
    session: SessionRecordSummary;
  };
  member: {
    user: UserRecordSummary;
    session: SessionRecordSummary;
  };
  createdAt: Date;
}

/**
 * Sanitized metadata strictly omitting session tokens, signatures, and cookies.
 * Safe for write-ahead manifest and console logging.
 *
 * Provides explicit canonical identifiers (userA_id, sessionA_id, userB_id, sessionB_id)
 * and verifies the relational foreign keys (sessionA_userId === userA_id) for crash recovery.
 */
export interface SanitizedBootstrapMetadata {
  runId: string;
  // Canonical identifiers for crash recovery & manual reconciliation (Phase 3H-R54)
  userA_id: string;
  userA_email: string;
  sessionA_id: string;
  sessionA_userId: string;
  userB_id: string;
  userB_email: string;
  sessionB_id: string;
  sessionB_userId: string;
  // Role-based aliases (Host = User A, Member = User B)
  hostUserId: string;
  hostEmail: string;
  hostSessionId: string;
  memberUserId: string;
  memberEmail: string;
  memberSessionId: string;
  // Lifecycle timestamps (ISO-8601 strings)
  sessionExpiresAt: string;
  createdAt: string;
}

// ============================================================================
// 2. BETTER AUTH 1.7.11 CRYPTO & COOKIE SIGNING IMPLEMENTATION
// ============================================================================

export const BETTER_AUTH_COOKIE_NAME = "better-auth.session_token";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const RUNNER_USER_AGENT = "SmartTrip-SmokeRunner/1.0";
export const RUNNER_IP_ADDRESS = "127.0.0.1";

/**
 * Signs a raw session token using HMAC-SHA256 with the Better Auth Secret.
 * Exactly mirrors `makeSignature` in better-call/dist/crypto.mjs:
 * Signature is standard Base64 (44 characters, ending in '=').
 *
 * Return format: `${rawToken}.${base64Signature}`
 */
export function signSessionToken(rawToken: string, secret: string): string {
  if (!rawToken || typeof rawToken !== "string") {
    throw new Error("[TestSessionHelper] rawToken must be a non-empty string");
  }
  if (!secret || typeof secret !== "string") {
    throw new Error("[TestSessionHelper] BETTER_AUTH_SECRET must be provided");
  }

  const signature = createHmac("sha256", secret).update(rawToken).digest("base64");
  if (signature.length !== 44 || !signature.endsWith("=")) {
    throw new Error(
      `[TestSessionHelper] Invalid HMAC signature generated: expected length 44 ending with '=', got length ${signature.length}`
    );
  }

  return `${rawToken}.${signature}`;
}

/**
 * Decodes a percent-encoded string if '%' is present, exactly mirroring Better Auth's
 * `tryDecode` in better-call/dist/utils.mjs.
 */
export function tryDecodeCookieValue(value: string): string {
  try {
    return value.includes("%") ? decodeURIComponent(value) : value;
  } catch {
    return value;
  }
}

/**
 * Verifies a signed session token against the secret using timing-safe comparison.
 * Mirrors `verifySignature` in better-call/dist/crypto.mjs and context.mjs.
 * Supports both raw Base64 signatures and percent-encoded values via `tryDecodeCookieValue`.
 */
export function verifySessionToken(signedToken: string, secret: string): boolean {
  if (!signedToken || !secret) return false;

  let decoded = tryDecodeCookieValue(signedToken.trim());
  if (decoded.startsWith(`${BETTER_AUTH_COOKIE_NAME}=`)) {
    decoded = decoded.slice(BETTER_AUTH_COOKIE_NAME.length + 1);
  }

  const lastDotIndex = decoded.lastIndexOf(".");
  if (lastDotIndex < 1) return false;

  const rawToken = decoded.slice(0, lastDotIndex);
  const signature = decoded.slice(lastDotIndex + 1);

  if (signature.length !== 44 || !signature.endsWith("=")) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(rawToken).digest("base64");
  try {
    const a = Buffer.from(signature, "base64");
    const b = Buffer.from(expectedSignature, "base64");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure 32-byte hex raw token (64 hex characters).
 * Guaranteed to be URL-safe, dot-free, and space-free.
 */
export function generateRawSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Formats the Cookie HTTP header value for Better Auth.
 * Verified in R60: both raw Base64 and percent-encoded Base64 are supported
 * by Better Auth's `tryDecode`. Standard raw format is canonical on localhost.
 */
export function formatSessionCookie(
  signedToken: string,
  options?: { cookieName?: string; percentEncode?: boolean }
): string {
  const name = options?.cookieName ?? BETTER_AUTH_COOKIE_NAME;
  const value = options?.percentEncode ? encodeURIComponent(signedToken) : signedToken;
  return `${name}=${value}`;
}

// ============================================================================
// 3. IN-MEMORY TEST CREDENTIALS GENERATOR
// ============================================================================

/**
 * Pure generator: generates deterministic test user and session specs for a given runId.
 * Does NOT perform any I/O, database access, or network calls.
 */
export function generateTestCredentials(runId: string, secret: string): InMemCredentials {
  const validatedRunId = validateRunId(runId);
  if (!secret || typeof secret !== "string") {
    throw new Error("[TestSessionHelper] secret is required to generate signed session cookies");
  }

  const shortRunId = validatedRunId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // User A (Host)
  const hostRawToken = generateRawSessionToken();
  const hostSignedToken = signSessionToken(hostRawToken, secret);
  const hostUser: GeneratedUserSpec = {
    role: "HOST",
    email: `smoke-host-${validatedRunId}@test.local`,
    name: `Smoke Host ${shortRunId}`,
    displayName: `Smoke Host ${shortRunId}`,
    emailVerified: true,
  };
  const hostSession: GeneratedSessionSpec = {
    rawToken: hostRawToken,
    signedToken: hostSignedToken,
    cookieHeader: formatSessionCookie(hostSignedToken),
    expiresAt,
    ipAddress: RUNNER_IP_ADDRESS,
    userAgent: RUNNER_USER_AGENT,
  };

  // User B (Member)
  const memberRawToken = generateRawSessionToken();
  const memberSignedToken = signSessionToken(memberRawToken, secret);
  const memberUser: GeneratedUserSpec = {
    role: "MEMBER",
    email: `smoke-member-${validatedRunId}@test.local`,
    name: `Smoke Member ${shortRunId}`,
    displayName: `Smoke Member ${shortRunId}`,
    emailVerified: true,
  };
  const memberSession: GeneratedSessionSpec = {
    rawToken: memberRawToken,
    signedToken: memberSignedToken,
    cookieHeader: formatSessionCookie(memberSignedToken),
    expiresAt,
    ipAddress: RUNNER_IP_ADDRESS,
    userAgent: RUNNER_USER_AGENT,
  };

  return {
    runId: validatedRunId,
    hostUser,
    hostSession,
    memberUser,
    memberSession,
  };
}

// ============================================================================
// 4. SANITIZATION & RELATIONAL INTEGRITY (MANIFEST & CRASH RECOVERY SAFETY)
// ============================================================================

/**
 * Fail-closed relational integrity assertion for Phase 3H-R65.
 * Strictly verifies the 6 canonical conditions:
 * 1. userA_id corresponds to User A (Host) and is non-empty.
 * 2. userB_id corresponds to User B (Member) and is non-empty.
 * 3. sessionA_id is the valid ID of Session A.
 * 4. sessionB_id is the valid ID of Session B.
 * 5. sessionA_userId === userA_id (exact foreign key match).
 * 6. sessionB_userId === userB_id (exact foreign key match).
 * Plus identity and session isolation between Host and Member.
 */
export function assertRelationalIntegrity(result: BootstrapTestSessionResult): void {
  const { host, member } = result;

  // 1 & 3 & 5: Validate Host (User A) - Session A foreign key linkage
  if (!host?.user?.id || !host?.session?.id || !host?.session?.userId) {
    throw new Error(
      "[TestSessionHelper] Relational integrity violation: Missing required identifier on Host (User A) or Session A"
    );
  }
  if (host.session.userId !== host.user.id) {
    throw new Error(
      `[TestSessionHelper] Relational integrity violation: Session A userId (${host.session.userId}) does not match User A id (${host.user.id})`
    );
  }

  // 2 & 4 & 6: Validate Member (User B) - Session B foreign key linkage
  if (!member?.user?.id || !member?.session?.id || !member?.session?.userId) {
    throw new Error(
      "[TestSessionHelper] Relational integrity violation: Missing required identifier on Member (User B) or Session B"
    );
  }
  if (member.session.userId !== member.user.id) {
    throw new Error(
      `[TestSessionHelper] Relational integrity violation: Session B userId (${member.session.userId}) does not match User B id (${member.user.id})`
    );
  }

  // Additional sanity: ensure User A != User B and Session A != Session B
  if (host.user.id === member.user.id) {
    throw new Error(
      `[TestSessionHelper] Identity collision: User A and User B share the same id (${host.user.id})`
    );
  }
  if (host.session.id === member.session.id) {
    throw new Error(
      `[TestSessionHelper] Session collision: Session A and Session B share the same id (${host.session.id})`
    );
  }
}

/**
 * Converts a bootstrap result into sanitized metadata stripped of tokens,
 * signatures, and cookies. Use this for write-ahead manifest and logger.
 *
 * Enforces fail-closed relational integrity before returning.
 */
export function toSanitizedMetadata(
  result: BootstrapTestSessionResult
): SanitizedBootstrapMetadata {
  // Fail-closed verification: rejects returning metadata if relational integrity fails
  assertRelationalIntegrity(result);

  return {
    runId: result.runId,
    // Canonical identifiers for crash recovery & manual reconciliation (Phase 3H-R54)
    userA_id: result.host.user.id,
    userA_email: result.host.user.email,
    sessionA_id: result.host.session.id,
    sessionA_userId: result.host.session.userId,
    userB_id: result.member.user.id,
    userB_email: result.member.user.email,
    sessionB_id: result.member.session.id,
    sessionB_userId: result.member.session.userId,
    // Role-based aliases (Host = User A, Member = User B)
    hostUserId: result.host.user.id,
    hostEmail: result.host.user.email,
    hostSessionId: result.host.session.id,
    memberUserId: result.member.user.id,
    memberEmail: result.member.user.email,
    memberSessionId: result.member.session.id,
    // Lifecycle timestamps
    sessionExpiresAt: result.host.session.expiresAt.toISOString(),
    createdAt: result.createdAt.toISOString(),
  };
}

// ============================================================================
// PRODUCTION SAFETY GUARD & STAGING ALLOWLIST (FAIL-CLOSED)
// ============================================================================

export const KNOWN_PRODUCTION_PROJECT_REF = "fzdaasbckmnndqzqopex";
export const APPROVED_STAGING_PROJECT_REF = "rwvptwjpfhtfkiwboexz";

export interface ValidatedDatabaseTarget {
  projectRef: string;
}

/**
 * Extracts and validates the Supabase project reference from a connection string.
 *
 * Recognized Supabase Connection Formats:
 * 1. Direct host format: `db.<project-ref>.supabase.co`
 * 2. Pooler format: `postgres.<project-ref>` as username on `*.pooler.supabase.com`
 *
 * CRITICAL SAFETY RULES:
 * - Fails closed if the URI cannot be parsed or does not match a recognized Supabase target.
 * - Fails closed if the project reference matches `fzdaasbckmnndqzqopex` case-insensitively.
 * - Fails closed if the project reference does NOT match `rwvptwjpfhtfkiwboexz` case-insensitively.
 * - Never allows a caller-provided environment variable to override the approved staging reference.
 * - NEVER logs or echoes raw URLs, credentials, hostnames, or secrets in thrown errors.
 */
export function extractSupabaseProjectRef(
  rawUri: string,
  envVarName: "DATABASE_URL" | "DIRECT_URL"
): string {
  const prodRef = KNOWN_PRODUCTION_PROJECT_REF.toLowerCase();
  const approvedStagingRef = APPROVED_STAGING_PROJECT_REF.toLowerCase();

  // 1. Raw string case-insensitive substring check (preserved from Phase 3Z)
  if (rawUri.toLowerCase().includes(prodRef)) {
    throw new Error(
      `[ProductionSafetyGuard] FATAL: Production project reference detected in ${envVarName}. Test/mutation scripts are strictly prohibited from connecting to production infrastructure.`
    );
  }

  // 2. Decoded string check in case of percent-encoding (preserved from Phase 3Z)
  let decoded = rawUri;
  try {
    decoded = decodeURIComponent(rawUri);
  } catch {
    // Retain rawUri if decodeURIComponent fails
  }
  if (decoded.toLowerCase().includes(prodRef)) {
    throw new Error(
      `[ProductionSafetyGuard] FATAL: Production project reference detected in decoded ${envVarName}. Test/mutation scripts are strictly prohibited from connecting to production infrastructure.`
    );
  }

  // 3. Parsed WHATWG URL structure
  let parsed: URL;
  try {
    parsed = new URL(rawUri);
  } catch {
    throw new Error(
      `[ProductionSafetyGuard] FATAL: ${envVarName} is malformed or cannot be parsed as a valid connection URI. Test/mutation scripts fail closed.`
    );
  }

  const parsedHost = parsed.hostname.toLowerCase();
  const parsedUser = decodeURIComponent(parsed.username || "").toLowerCase();
  const parsedPath = parsed.pathname.toLowerCase();
  const parsedSearch = parsed.search.toLowerCase();

  // Preserved component check for production reference (Phase 3Z)
  if (
    parsedHost.includes(prodRef) ||
    parsedUser.includes(prodRef) ||
    parsedPath.includes(prodRef) ||
    parsedSearch.includes(prodRef)
  ) {
    throw new Error(
      `[ProductionSafetyGuard] FATAL: Production project reference detected in parsed ${envVarName} components. Test/mutation scripts are strictly prohibited from connecting to production infrastructure.`
    );
  }

  // 4. Positive Target Identification: Extract Supabase Project Reference
  let extractedRef: string | null = null;

  // Format A: Direct host -> db.<project-ref>.supabase.co
  const directHostMatch = /^db\.([a-z0-9_-]+)\.supabase\.co$/i.exec(parsedHost);
  if (directHostMatch) {
    extractedRef = directHostMatch[1].toLowerCase();
  }

  // Format B: Pooler host -> [aws-0-*.pooler.supabase.com or pooler.supabase.com]
  // with username format: postgres.<project-ref>
  const isPoolerHost = /^(?:[a-z0-9_-]+\.)*pooler\.supabase\.com$/i.test(parsedHost);
  const poolerUserMatch = /^postgres\.([a-z0-9_-]+)$/i.exec(parsedUser);

  if (isPoolerHost) {
    if (!poolerUserMatch) {
      throw new Error(
        `[ProductionSafetyGuard] Execution aborted: ${envVarName} targets Supabase pooler host but lacks expected 'postgres.<project-ref>' username format. Test/mutation scripts fail closed.`
      );
    }
    const poolerRef = poolerUserMatch[1].toLowerCase();
    if (extractedRef && extractedRef !== poolerRef) {
      throw new Error(
        `[ProductionSafetyGuard] Execution aborted: Conflicting project references detected within ${envVarName}. Test/mutation scripts fail closed.`
      );
    }
    extractedRef = poolerRef;
  }

  // Fail closed if format is not recognized
  if (!extractedRef) {
    throw new Error(
      `[ProductionSafetyGuard] Execution aborted: ${envVarName} does not identify a supported and recognizable Supabase target format (expected direct host 'db.<project-ref>.supabase.co' or pooler username 'postgres.<project-ref>' on '*.pooler.supabase.com'). Test/mutation scripts fail closed.`
    );
  }

  // Fail closed if extracted project reference matches prohibited production reference
  if (extractedRef === prodRef) {
    throw new Error(
      `[ProductionSafetyGuard] FATAL: Prohibited production project reference detected in ${envVarName}. Test/mutation scripts are strictly forbidden from executing against production infrastructure.`
    );
  }

  // Strict Staging Allowlist Assertion: Reject any project reference other than the approved staging project
  if (extractedRef !== approvedStagingRef) {
    throw new Error(
      `[ProductionSafetyGuard] Execution aborted: ${envVarName} targets an unauthorized Supabase project reference. Test/mutation scripts are strictly locked to approved staging project '${APPROVED_STAGING_PROJECT_REF}'.`
    );
  }

  return extractedRef;
}

/**
 * Asserts that the current database configuration positively identifies the approved
 * staging Supabase project target (`rwvptwjpfhtfkiwboexz`) across both `DATABASE_URL` and `DIRECT_URL`.
 *
 * CRITICAL SAFETY RULES:
 * 1. Executes strictly before Prisma is initialized or any test manifest is created.
 * 2. Validates both `DATABASE_URL` and `DIRECT_URL` independently (both are strictly required).
 * 3. Fails closed if either variable is missing, empty, or malformed.
 * 4. Fails closed if either URL fails to identify a recognized Supabase target format:
 *    - Direct host: `db.<project-ref>.supabase.co`
 *    - Pooler username: `postgres.<project-ref>` on `*.pooler.supabase.com`
 * 5. Fails closed if the extracted project reference matches `fzdaasbckmnndqzqopex` case-insensitively.
 * 6. Fails closed if the extracted project reference does NOT match `rwvptwjpfhtfkiwboexz` case-insensitively.
 * 7. Fails closed if `DATABASE_URL` and `DIRECT_URL` target different Supabase project references.
 * 8. Never allows a caller-provided environment variable to override the approved staging reference.
 * 9. NEVER logs or echoes raw URLs, credentials, hostnames, or secrets.
 *
 * NOTE ON LOCAL POSTGRESQL / ARBITRARY TARGETS:
 * The Smart Trip live test suite requires Supabase PostgreSQL with active RLS and enum
 * definitions. Arbitrary database targets (e.g., untracked local PostgreSQL instances)
 * are intentionally rejected by default to prevent silent misconfiguration or testing against
 * undefined database states.
 */
export function assertNonProductionDatabase(): ValidatedDatabaseTarget {
  const targetDatabaseUrl = process.env.DATABASE_URL?.trim();
  const targetDirectUrl = process.env.DIRECT_URL?.trim();

  // Fail-closed Rule 1: Missing or empty DATABASE_URL
  if (!targetDatabaseUrl) {
    throw new Error(
      "[ProductionSafetyGuard] Execution aborted: Target database configuration (DATABASE_URL) is missing or empty. Test/mutation scripts fail closed."
    );
  }

  // Fail-closed Rule 2: Missing or empty DIRECT_URL
  if (!targetDirectUrl) {
    throw new Error(
      "[ProductionSafetyGuard] Execution aborted: Target database configuration (DIRECT_URL) is missing or empty. Test/mutation scripts fail closed."
    );
  }

  // Validate and extract project references independently (enforces format, production block, and staging allowlist)
  const dbProjectRef = extractSupabaseProjectRef(targetDatabaseUrl, "DATABASE_URL");
  const directProjectRef = extractSupabaseProjectRef(targetDirectUrl, "DIRECT_URL");

  // Fail-closed Rule 3: Mismatch between DATABASE_URL and DIRECT_URL project references
  if (dbProjectRef !== directProjectRef) {
    throw new Error(
      "[ProductionSafetyGuard] Execution aborted: DATABASE_URL and DIRECT_URL target different Supabase project references. Test/mutation scripts require both connection strings to target the identical Supabase project."
    );
  }

  // Fail-closed Rule 4: Strict staging allowlist assertion (redundant defense-in-depth)
  const approvedStagingRef = APPROVED_STAGING_PROJECT_REF.toLowerCase();
  if (dbProjectRef !== approvedStagingRef) {
    throw new Error(
      `[ProductionSafetyGuard] Execution aborted: Target project reference does not match approved staging project '${APPROVED_STAGING_PROJECT_REF}'. Test/mutation scripts fail closed.`
    );
  }

  return { projectRef: dbProjectRef };
}

// ============================================================================
// 5. DATABASE OPERATIONS (LAZY RESOLUTION — ZERO TOP-LEVEL SIDE EFFECTS)
// ============================================================================

/**
 * Dynamically resolves the Prisma Client instance.
 * Importing this file does NOT initialize the database connection pool.
 */
async function resolvePrisma(injectedPrisma?: PrismaClient): Promise<PrismaClient> {
  // Fail-closed safety assertion before importing or resolving Prisma
  assertNonProductionDatabase();
  if (injectedPrisma) return injectedPrisma;
  const { prisma } = await import("@/lib/db/prisma");
  return prisma;
}

export interface BootstrapOptions {
  runId: string;
  secret?: string;
  prisma?: PrismaClient;
}

/**
 * Bootstraps User A (Host) and User B (Member) and their respective active sessions
 * into PostgreSQL in an atomic transaction.
 *
 * NOTE: Must only be executed when Gate 4 (Live Execution) is explicitly authorized.
 */
export async function bootstrapTestSessions(
  options: BootstrapOptions
): Promise<BootstrapTestSessionResult> {
  // Fail-closed safety assertion before any test credentials or DB resolution
  assertNonProductionDatabase();

  const validatedRunId = validateRunId(options.runId);
  const secret = options.secret ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[TestSessionHelper] BETTER_AUTH_SECRET environment variable is missing"
    );
  }

  const credentials = generateTestCredentials(validatedRunId, secret);
  const prisma = await resolvePrisma(options.prisma);

  // Execute in an atomic transaction: both users and both sessions must succeed or rollback
  const created = await prisma.$transaction(async (tx) => {
    // 1. Create User A (Host)
    const hostUserRecord = await tx.user.create({
      data: {
        email: credentials.hostUser.email,
        name: credentials.hostUser.name,
        displayName: credentials.hostUser.displayName,
        emailVerified: credentials.hostUser.emailVerified,
      },
    });

    // 2. Create Session A (Host Session)
    const hostSessionRecord = await tx.session.create({
      data: {
        userId: hostUserRecord.id,
        token: credentials.hostSession.rawToken,
        expiresAt: credentials.hostSession.expiresAt,
        ipAddress: credentials.hostSession.ipAddress,
        userAgent: credentials.hostSession.userAgent,
      },
    });

    // 3. Create User B (Member)
    const memberUserRecord = await tx.user.create({
      data: {
        email: credentials.memberUser.email,
        name: credentials.memberUser.name,
        displayName: credentials.memberUser.displayName,
        emailVerified: credentials.memberUser.emailVerified,
      },
    });

    // 4. Create Session B (Member Session)
    const memberSessionRecord = await tx.session.create({
      data: {
        userId: memberUserRecord.id,
        token: credentials.memberSession.rawToken,
        expiresAt: credentials.memberSession.expiresAt,
        ipAddress: credentials.memberSession.ipAddress,
        userAgent: credentials.memberSession.userAgent,
      },
    });

    return {
      hostUser: hostUserRecord,
      hostSession: hostSessionRecord,
      memberUser: memberUserRecord,
      memberSession: memberSessionRecord,
    };
  });

  const result: BootstrapTestSessionResult = {
    runId: validatedRunId,
    host: {
      user: {
        id: created.hostUser.id,
        email: created.hostUser.email,
        name: created.hostUser.name,
        displayName: created.hostUser.displayName,
      },
      session: {
        id: created.hostSession.id,
        userId: created.hostSession.userId,
        expiresAt: created.hostSession.expiresAt,
        cookieHeader: credentials.hostSession.cookieHeader,
      },
    },
    member: {
      user: {
        id: created.memberUser.id,
        email: created.memberUser.email,
        name: created.memberUser.name,
        displayName: created.memberUser.displayName,
      },
      session: {
        id: created.memberSession.id,
        userId: created.memberSession.userId,
        expiresAt: created.memberSession.expiresAt,
        cookieHeader: credentials.memberSession.cookieHeader,
      },
    },
    createdAt: new Date(),
  };

  // Fail-closed relational verification before returning
  assertRelationalIntegrity(result);

  return result;
}

export interface ResolveExistingSessionsOptions {
  identityRunId: string;
  expectedMetadata?: SanitizedBootstrapMetadata;
  secret?: string;
  prisma?: PrismaClient;
}

/**
 * Re-validates existing test users and sessions from an earlier run (e.g. Gate 4A)
 * and reconstructs active signed cookies without modifying the database.
 *
 * CRITICAL SAFETY RULES:
 * 1. Zero database writes: Only read queries are executed.
 * 2. Fail-closed: Throws an error immediately if sessions are missing, expired,
 *    or mismatch expected metadata.
 * 3. Never prints or logs secrets or session tokens.
 */
export async function resolveExistingTestSessions(
  options: ResolveExistingSessionsOptions
): Promise<BootstrapTestSessionResult> {
  // Fail-closed safety assertion before verifying or querying sessions
  assertNonProductionDatabase();

  const validatedRunId = validateRunId(options.identityRunId);
  const secret = options.secret ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "[TestSessionHelper] BETTER_AUTH_SECRET environment variable is missing"
    );
  }

  const expected = options.expectedMetadata;
  if (expected) {
    if (expected.runId !== validatedRunId) {
      throw new Error(
        `[TestSessionHelper] Identity mismatch: expected metadata runId (${expected.runId}) does not match identityRunId (${validatedRunId})`
      );
    }
    assertRelationalIntegrity({
      runId: validatedRunId,
      host: {
        user: { id: expected.userA_id, email: expected.userA_email, name: "", displayName: null },
        session: { id: expected.sessionA_id, userId: expected.sessionA_userId, expiresAt: new Date(expected.sessionExpiresAt), cookieHeader: "" },
      },
      member: {
        user: { id: expected.userB_id, email: expected.userB_email, name: "", displayName: null },
        session: { id: expected.sessionB_id, userId: expected.sessionB_userId, expiresAt: new Date(expected.sessionExpiresAt), cookieHeader: "" },
      },
      createdAt: new Date(expected.createdAt),
    });
  }

  const prisma = await resolvePrisma(options.prisma);

  const hostEmail = `smoke-host-${validatedRunId}@test.local`;
  const memberEmail = `smoke-member-${validatedRunId}@test.local`;

  // Fetch host user and member user with active sessions
  const hostUser = await prisma.user.findUnique({
    where: expected?.userA_id ? { id: expected.userA_id } : { email: hostEmail },
    include: { sessions: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  const memberUser = await prisma.user.findUnique({
    where: expected?.userB_id ? { id: expected.userB_id } : { email: memberEmail },
    include: { sessions: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  if (!hostUser) {
    throw new Error(
      `[TestSessionHelper] Existing Host user not found for identityRunId ${validatedRunId}`
    );
  }
  if (!memberUser) {
    throw new Error(
      `[TestSessionHelper] Existing Member user not found for identityRunId ${validatedRunId}`
    );
  }

  // Explicit verification: Database emails must equal expected Gate 4A manifest emails
  if (expected?.userA_email && hostUser.email !== expected.userA_email) {
    throw new Error(
      `[TestSessionHelper] Host User A email mismatch: database has '${hostUser.email}' but Gate 4A expected '${expected.userA_email}'`
    );
  }
  if (expected?.userB_email && memberUser.email !== expected.userB_email) {
    throw new Error(
      `[TestSessionHelper] Member User B email mismatch: database has '${memberUser.email}' but Gate 4A expected '${expected.userB_email}'`
    );
  }

  const now = new Date();
  const hostSessionRecord = expected?.sessionA_id
    ? hostUser.sessions.find((s) => s.id === expected.sessionA_id)
    : hostUser.sessions.find((s) => s.expiresAt > now);

  const memberSessionRecord = expected?.sessionB_id
    ? memberUser.sessions.find((s) => s.id === expected.sessionB_id)
    : memberUser.sessions.find((s) => s.expiresAt > now);

  if (!hostSessionRecord) {
    throw new Error(
      `[TestSessionHelper] Active Host session ${expected?.sessionA_id ?? ""} not found for User A (${hostUser.id})`
    );
  }
  if (expected?.sessionA_id && hostSessionRecord.id !== expected.sessionA_id) {
    throw new Error(
      `[TestSessionHelper] Host session ID mismatch: found '${hostSessionRecord.id}' but expected '${expected.sessionA_id}'`
    );
  }
  if (hostSessionRecord.userId !== hostUser.id) {
    throw new Error(
      `[TestSessionHelper] Host session userId ('${hostSessionRecord.userId}') does not match User A ID ('${hostUser.id}')`
    );
  }
  if (hostSessionRecord.expiresAt <= now) {
    throw new Error(
      `[TestSessionHelper] Host session ${hostSessionRecord.id} has expired at ${hostSessionRecord.expiresAt.toISOString()}`
    );
  }

  if (!memberSessionRecord) {
    throw new Error(
      `[TestSessionHelper] Active Member session ${expected?.sessionB_id ?? ""} not found for User B (${memberUser.id})`
    );
  }
  if (expected?.sessionB_id && memberSessionRecord.id !== expected.sessionB_id) {
    throw new Error(
      `[TestSessionHelper] Member session ID mismatch: found '${memberSessionRecord.id}' but expected '${expected.sessionB_id}'`
    );
  }
  if (memberSessionRecord.userId !== memberUser.id) {
    throw new Error(
      `[TestSessionHelper] Member session userId ('${memberSessionRecord.userId}') does not match User B ID ('${memberUser.id}')`
    );
  }
  if (memberSessionRecord.expiresAt <= now) {
    throw new Error(
      `[TestSessionHelper] Member session ${memberSessionRecord.id} has expired at ${memberSessionRecord.expiresAt.toISOString()}`
    );
  }

  // Reconstruct signed session cookies using Better Auth HMAC-SHA256 signing
  const hostSignedToken = signSessionToken(hostSessionRecord.token, secret);
  const hostCookieHeader = formatSessionCookie(hostSignedToken);

  const memberSignedToken = signSessionToken(memberSessionRecord.token, secret);
  const memberCookieHeader = formatSessionCookie(memberSignedToken);

  const result: BootstrapTestSessionResult = {
    runId: validatedRunId,
    host: {
      user: {
        id: hostUser.id,
        email: hostUser.email,
        name: hostUser.name,
        displayName: hostUser.displayName,
      },
      session: {
        id: hostSessionRecord.id,
        userId: hostSessionRecord.userId,
        expiresAt: hostSessionRecord.expiresAt,
        cookieHeader: hostCookieHeader,
      },
    },
    member: {
      user: {
        id: memberUser.id,
        email: memberUser.email,
        name: memberUser.name,
        displayName: memberUser.displayName,
      },
      session: {
        id: memberSessionRecord.id,
        userId: memberSessionRecord.userId,
        expiresAt: memberSessionRecord.expiresAt,
        cookieHeader: memberCookieHeader,
      },
    },
    createdAt: new Date(),
  };

  assertRelationalIntegrity(result);
  return result;
}

export interface CleanupOptions {
  runId: string;
  userA_id?: string;
  userB_id?: string;
  prisma?: PrismaClient;
}

/**
 * Manually cleans up test users for a given runId in an atomic transaction.
 * Cascade deletion in Prisma schema automatically cleans up associated sessions.
 *
 * CRITICAL RULE: This must NEVER be invoked automatically upon `RUN_STATE_UNKNOWN`.
 * Operator must explicitly review manifest before triggering cleanup.
 *
 * ATOMIC TARGETING & FAIL-CLOSED CLASSIFICATION CONTRACT:
 * 1. Dual-Key Branch (both `userA_id` and `userB_id` provided):
 *    - Validates both IDs are valid UUIDv4 strings and userA_id !== userB_id.
 *    - In a Prisma $transaction (Read Committed isolation):
 *      Step A: Pre-deletion broad superset read querying ANY record matching:
 *              `id IN [userA_id, userB_id] OR email IN [hostEmail, memberEmail]`.
 *      Case A — Clean / Idempotent:
 *              Zero records found across all 4 keys. Returns `{ deletedUsersCount: 0 }`.
 *      Case C — Exact Match:
 *              Exactly 2 records found, matching `(userA_id, hostEmail)` and `(userB_id, memberEmail)`.
 *              Step B: Deletes both verified pairs atomically in the same transaction.
 *              Step C: Asserts `deleteResult.count === 2`, else rolls back with an error.
 *              Returns `{ deletedUsersCount: 2 }`.
 *      Case B — Identity Mismatch / Orphan / Asymmetric State:
 *              Any record found that does not satisfy Case C (e.g., hostEmail bound to another ID,
 *              userA_id bound to another email, role swap, or only one user present).
 *              Fail-closed: Throws an error immediately BEFORE delete, preserving all evidence.
 * 2. Fallback Email Branch (neither `userA_id` nor `userB_id` provided):
 *    - In a Prisma $transaction:
 *      Step A: Pre-queries tx.user.findMany with email IN [hostEmail, memberEmail].
 *      If 0 records: returns `{ deletedUsersCount: 0 }`.
 *      If 2 records: deletes both atomically, asserts exactly 2 records deleted, returns `{ deletedUsersCount: 2 }`.
 *      If 1 record (asymmetric): throws an error immediately and aborts before delete.
 * 3. Asymmetric ID Input (only one ID provided):
 *    - Rejects immediately (fail-closed) before opening transaction.
 *
 * CONCURRENCY & ISOLATION LIMITATIONS:
 * - Operates under PostgreSQL default `Read Committed` isolation level.
 * - In concurrent multi-writer environments, `Read Committed` does not eliminate phantom writes
 *   between read (Step A) and delete (Step B). However, Phase 3H guarantees single-threaded,
 *   sequential execution per unique UUIDv4 `runId`, and post-deletion count validation guarantees
 *   fail-closed rollback if concurrent intervention alters expected deletion counts.
 */
export async function cleanupTestSessions(
  options: CleanupOptions
): Promise<{ deletedUsersCount: number }> {
  // Fail-closed safety assertion before attempting cleanup on any database
  assertNonProductionDatabase();

  const validatedRunId = validateRunId(options.runId);
  const prisma = await resolvePrisma(options.prisma);
  const hostEmail = `smoke-host-${validatedRunId}@test.local`;
  const memberEmail = `smoke-member-${validatedRunId}@test.local`;

  const hasIdA = Boolean(options.userA_id);
  const hasIdB = Boolean(options.userB_id);

  // 1. Fail-closed if partial ID targeting is attempted
  if (hasIdA !== hasIdB) {
    throw new Error(
      "[TestSessionHelper] Asymmetric cleanup input: userA_id and userB_id must both be provided for dual-key targeting, or both omitted for email-based targeting."
    );
  }

  // 2. Dual-key atomic transaction branch
  if (hasIdA && hasIdB) {
    const userA_id = options.userA_id!.trim();
    const userB_id = options.userB_id!.trim();

    if (!isValidUUIDv4(userA_id) || !isValidUUIDv4(userB_id)) {
      throw new Error(
        "[TestSessionHelper] Invalid cleanup input: userA_id and userB_id must be valid UUIDv4 strings"
      );
    }
    if (userA_id === userB_id) {
      throw new Error(
        "[TestSessionHelper] Invalid cleanup input: userA_id and userB_id must be distinct UUIDs"
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Step A: Broad superset read inside transaction across all 4 candidate keys
      const relatedUsers = await tx.user.findMany({
        where: {
          OR: [
            { id: { in: [userA_id, userB_id] } },
            { email: { in: [hostEmail, memberEmail] } },
          ],
        },
        select: { id: true, email: true },
      });

      // Case A — Clean / Idempotent state: no related user records found anywhere
      if (relatedUsers.length === 0) {
        return { deletedUsersCount: 0 };
      }

      // Exact pair verification
      const matchA = relatedUsers.find(
        (u) => u.id === userA_id && u.email === hostEmail
      );
      const matchB = relatedUsers.find(
        (u) => u.id === userB_id && u.email === memberEmail
      );

      // Case C — Exact match: both pairs match strictly and no extra records exist
      if (matchA && matchB && relatedUsers.length === 2) {
        // Step B: Atomic deletion of verified pairs
        const deleteResult = await tx.user.deleteMany({
          where: {
            OR: [
              { id: userA_id, email: hostEmail },
              { id: userB_id, email: memberEmail },
            ],
          },
        });

        // Step C: Post-deletion contract verification
        if (deleteResult.count !== 2) {
          throw new Error(
            `[TestSessionHelper] Atomic cleanup contract violation: Expected exactly 2 deleted users, but deleted ${deleteResult.count}. Transaction rolled back.`
          );
        }

        return {
          deletedUsersCount: deleteResult.count,
        };
      }

      // Case B — Identity Mismatch / Orphan / Asymmetric State:
      // Records exist matching one or more keys, but they do NOT form the exact expected (ID, email) pairs.
      // Fail-closed: refuse deletion, keep records intact, preserve audit evidence.
      const userWithIdA = relatedUsers.find((u) => u.id === userA_id);
      const userWithIdB = relatedUsers.find((u) => u.id === userB_id);
      const userWithEmailHost = relatedUsers.find((u) => u.email === hostEmail);
      const userWithEmailMember = relatedUsers.find((u) => u.email === memberEmail);

      const mismatchDetails: string[] = [];
      if (!matchA) {
        if (!userWithIdA && !userWithEmailHost) {
          mismatchDetails.push(
            `User A missing (neither id '${userA_id}' nor host email '${hostEmail}' found)`
          );
        } else if (userWithIdA && userWithIdA.email !== hostEmail) {
          mismatchDetails.push(
            `User A ID '${userA_id}' is bound to unexpected email '${userWithIdA.email}' instead of '${hostEmail}'`
          );
        } else if (userWithEmailHost && userWithEmailHost.id !== userA_id) {
          mismatchDetails.push(
            `Host email '${hostEmail}' is bound to unexpected ID '${userWithEmailHost.id}' instead of '${userA_id}'`
          );
        }
      }

      if (!matchB) {
        if (!userWithIdB && !userWithEmailMember) {
          mismatchDetails.push(
            `User B missing (neither id '${userB_id}' nor member email '${memberEmail}' found)`
          );
        } else if (userWithIdB && userWithIdB.email !== memberEmail) {
          mismatchDetails.push(
            `User B ID '${userB_id}' is bound to unexpected email '${userWithIdB.email}' instead of '${memberEmail}'`
          );
        } else if (userWithEmailMember && userWithEmailMember.id !== userB_id) {
          mismatchDetails.push(
            `Member email '${memberEmail}' is bound to unexpected ID '${userWithEmailMember.id}' instead of '${userB_id}'`
          );
        }
      }

      if (relatedUsers.length > 2) {
        mismatchDetails.push(
          `Detected ${relatedUsers.length} related records (expected at most 2)`
        );
      }

      const detailSummary =
        mismatchDetails.length > 0
          ? mismatchDetails.join("; ")
          : `Found ${relatedUsers.length} record(s) with mismatched or corrupted identities`;

      throw new Error(
        `[TestSessionHelper] Atomic cleanup aborted: Identity mismatch or orphan record detected (${detailSummary}). Refusing partial deletion to preserve audit evidence.`
      );
    });
  }

  // 3. Fallback: Email-based atomic transaction branch
  return await prisma.$transaction(async (tx) => {
    // Step A: Pre-deletion verification
    const existingUsers = await tx.user.findMany({
      where: {
        email: { in: [hostEmail, memberEmail] },
      },
      select: { id: true, email: true },
    });

    if (existingUsers.length === 0) {
      return { deletedUsersCount: 0 };
    }

    if (existingUsers.length !== 2) {
      throw new Error(
        `[TestSessionHelper] Atomic email cleanup aborted: Asymmetric state detected (found ${existingUsers.length} test user instead of 2 for runId ${validatedRunId}). Refusing partial deletion to preserve audit evidence.`
      );
    }

    // Step B: Atomic deletion
    const deleteResult = await tx.user.deleteMany({
      where: {
        email: { in: [hostEmail, memberEmail] },
      },
    });

    if (deleteResult.count !== 2) {
      throw new Error(
        `[TestSessionHelper] Atomic email cleanup contract violation: Expected exactly 2 deleted users, but deleted ${deleteResult.count}. Transaction rolled back.`
      );
    }

    return {
      deletedUsersCount: deleteResult.count,
    };
  });
}
