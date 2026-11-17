// SPDX-License-Identifier: Apache-2.0
// Public projections of hosted V2 operations. Results, progress and errors that leave the
// SDK (and so reach CLI JSON and MCP tool results) are built field by field from these
// allowlists; unknown hosted fields are never spread, because a hosted response may echo the
// request, and a vote request carries the ballot.
import { toFunctionSelector } from "viem";
import { z } from "zod";

import { TasksClientError } from "./client.js";
import { TaskInputError, TaskOperationError } from "./operation-support.js";
import { disputeResolverV3Abi } from "./v2-abi.js";
import type { TaskLifecycle, TaskNextAction } from "./v2.js";
import type { TaskV2Action, TaskV2Consent, TaskV2Operation } from "./v2-write.js";

/** Reveal calldata carries the vote and its salt; it is signed and broadcast, never echoed. */
export const TASK_V2_REDACTED_CALLDATA = "[redacted: reveal calldata]";
/** Steps whose hosted request or calldata is tied to a sealed ballot. */
export const TASK_V2_SECRET_STEPS: readonly string[] = ["v2-commit-vote", "v2-reveal-vote"];
const REVEAL_SELECTOR = toFunctionSelector(
  disputeResolverV3Abi.find((entry) => entry.type === "function" && entry.name === "revealVote")!,
);

export function isTaskV2SecretAction(action: Pick<TaskV2Action | TaskV2Consent, "action">) {
  return action.action === "commit-vote" || action.action === "reveal-vote";
}

/**
 * The operation fields a caller may see. Reveal calldata is redacted by its step or by its
 * selector, so a hosted operation that names another step still never shows a ballot.
 */
export function publicTaskV2Operation(op: TaskV2Operation, secret = false): TaskV2Operation {
  const reveal =
    secret ||
    op.step === "v2-reveal-vote" ||
    op.plan.step === "v2-reveal-vote" ||
    op.plan.data.toLowerCase().startsWith(REVEAL_SELECTOR);
  return {
    id: op.id,
    kind: op.kind,
    state: op.state,
    step: op.step,
    expectedActor: op.expectedActor,
    transactionHash: op.transactionHash,
    plan: {
      version: op.plan.version,
      operationId: op.plan.operationId,
      step: op.plan.step,
      chainId: op.plan.chainId,
      network: op.plan.network,
      from: op.plan.from,
      to: op.plan.to,
      data: reveal ? (TASK_V2_REDACTED_CALLDATA as `0x${string}`) : op.plan.data,
      value: op.plan.value,
    },
  };
}

/** An operation as SDK results show it: calldata may already be the redaction marker. */
const shownOperationSchema = z.object({
  id: z.string(),
  kind: z.literal("tasks-v2-write"),
  state: z.enum(["prepared", "submitted", "confirmed", "abandoned"]),
  step: z.string(),
  expectedActor: z.string(),
  transactionHash: z.string().nullable(),
  plan: z.object({
    version: z.literal("work-transaction-plan-v2"),
    operationId: z.string(),
    step: z.string(),
    chainId: z.number(),
    network: z.string(),
    from: z.string(),
    to: z.string(),
    data: z.string(),
    value: z.literal("0"),
  }),
});
/** The public projection of an operation-shaped value, or undefined when it is not one. */
export function publicTaskV2OperationOf(value: unknown, secret = false) {
  const parsed = shownOperationSchema.safeParse(value);
  return parsed.success
    ? publicTaskV2Operation(parsed.data as unknown as TaskV2Operation, secret)
    : undefined;
}

/** Hosted recovery and abandon responses, reduced to their documented fields. */
export function publicTaskV2Recovery(
  response: {
    orderId: string;
    operation?: TaskV2Operation | null;
    recovered?: boolean;
    scanComplete?: boolean;
    outcome?: "abandoned" | "recovered" | "scanning";
  },
  step: string,
) {
  const secret = TASK_V2_SECRET_STEPS.includes(step);
  return {
    orderId: response.orderId,
    ...(response.operation === undefined
      ? {}
      : {
          operation: response.operation && publicTaskV2Operation(response.operation, secret),
        }),
    ...(typeof response.recovered === "boolean" ? { recovered: response.recovered } : {}),
    ...(typeof response.scanComplete === "boolean" ? { scanComplete: response.scanComplete } : {}),
    ...(response.outcome === undefined ? {} : { outcome: response.outcome }),
  };
}

const lifecycleShape = z.enum(["task", "bounty", "pool"]);
const lifecycleState = z.enum([
  "Draft",
  "Open",
  "Active",
  "Settled",
  "Refunded",
  "Cancelled",
  "Judging",
  "Awarded",
  "Paused",
  "Closed",
]);
const lifecycleSubstate = z.enum(["InProgress", "Submitted", "Stalled", "Disputed"]);
const milestoneStatus = z.enum([
  "pending",
  "submitted",
  "released",
  "refunded",
  "disputed",
  "split",
]);
const nextActionKind = z.enum([
  "award",
  "release",
  "deliver",
  "counter-evidence",
  "checkin",
  "judge",
  "none",
]);
const baseUnits = z.string().regex(/^[0-9]{1,78}$/u);
const shownInstant = z.iso.datetime();
const milestoneId = z.string().max(128);
const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
/** One documented field, kept only when it parses; any other field is dropped. */
function pick<T>(source: Record<string, unknown>, key: string, schema: z.ZodType<T>) {
  const parsed = schema.safeParse(source[key]);
  return parsed.success ? ({ [key]: parsed.data } as Record<string, T>) : {};
}

/**
 * The documented lifecycle fields (shape, state, substate, amount, due date and each
 * milestone's id, status, amount and due date). Hosted lifecycle and next-action objects are
 * loose on the wire, so a nested unknown field (for example an echoed `debug` with the
 * ballot) would otherwise reach SDK results, CLI JSON and MCP results.
 */
export function publicTaskLifecycle(value: unknown): TaskLifecycle | null {
  const source = record(value);
  if (!source) return null;
  const milestones = Array.isArray(source.milestones)
    ? source.milestones.flatMap((item: unknown) => {
        const m = record(item);
        return m
          ? [
              {
                ...pick(m, "id", milestoneId),
                ...pick(m, "status", milestoneStatus),
                ...pick(m, "amountBaseUnits", baseUnits),
                ...pick(m, "dueAt", shownInstant),
              },
            ]
          : [];
      })
    : undefined;
  return {
    ...pick(source, "shape", lifecycleShape),
    ...pick(source, "state", lifecycleState),
    ...pick(source, "substate", lifecycleSubstate),
    ...pick(source, "amountBaseUnits", baseUnits),
    ...pick(source, "dueAt", shownInstant),
    ...(milestones ? { milestones } : {}),
  } as unknown as TaskLifecycle;
}

/** The documented next-action fields (action, amount, due date); nothing else is copied. */
export function publicTaskNextAction(value: unknown): TaskNextAction | null {
  const source = record(value);
  if (!source) return null;
  return {
    ...pick(source, "action", nextActionKind),
    ...pick(source, "amountBaseUnits", baseUnits),
    ...pick(source, "dueAt", shownInstant),
  } as unknown as TaskNextAction;
}

/** The public lifecycle and next action of a hosted order view. */
export function publicTaskV2Progress(view: {
  lifecycle?: unknown;
  nextAction?: unknown;
  workOrder?: { lifecycle?: unknown; nextAction?: unknown };
}) {
  return {
    lifecycle: publicTaskLifecycle(view.lifecycle ?? view.workOrder?.lifecycle ?? null),
    nextAction: publicTaskNextAction(view.nextAction ?? view.workOrder?.nextAction ?? null),
  };
}

/**
 * Every failure of a hosted call during recovery or abandon. The caller-supplied step does
 * not decide sensitivity: the operation behind it may be a reveal whatever step is named, and
 * a hosted error (or a transport error quoting the response) may echo the prepared request.
 * Only the HTTP status survives; the code is fixed per path.
 */
export function taskV2RecoveryHostedError(error: unknown, step: string) {
  if (TASK_V2_SECRET_STEPS.includes(step)) return taskV2VoteHostedError(error);
  return new TaskOperationError(
    "v2_recovery_failed",
    `The hosted API did not complete the operation recovery${
      error instanceof TasksClientError && error.status ? ` (HTTP ${error.status})` : ""
    }. Retry the same status command; nothing was signed.`,
  );
}

/**
 * A hosted error on a vote step may echo the request, so neither its code nor its message is
 * copied: the caller gets one fixed code and message, plus the HTTP status when there is one.
 */
export function taskV2VoteHostedError(error: unknown) {
  return new TaskOperationError(
    "v2_vote_rejected",
    `The hosted API refused the vote step${
      error instanceof TasksClientError && error.status ? ` (HTTP ${error.status})` : ""
    }. The sealed ballot stays on this machine; check the case state and retry.`,
  );
}

/** Keys that hold a sealed ballot inside a vote request, step or operation. */
const BALLOT_FIELDS = new Set(["outcome", "toWorker", "salt", "vote", "ballot"]);
const VOTE_ACTIONS: readonly string[] = ["commit-vote", "reveal-vote", ...TASK_V2_SECRET_STEPS];
const isRevealCalldata = (value: string) =>
  value.length > REVEAL_SELECTOR.length && value.toLowerCase().startsWith(REVEAL_SELECTOR);
function plainRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null
    ? (value as Record<string, unknown>)
    : undefined;
}
/** A step, operation or request whose kind, step or action is a V2 commit or reveal vote. */
function isVoteContext(source: Record<string, unknown>) {
  const named = (value: unknown) => typeof value === "string" && VOTE_ACTIONS.includes(value);
  const plan = plainRecord(source.plan);
  return (
    named(source.step) ||
    named(source.kind) ||
    named(source.action) ||
    (plan !== undefined && named(plan.step)) ||
    (typeof source.data === "string" && isRevealCalldata(source.data))
  );
}

/**
 * A hosted read (plain `show` and `status`) with every unrevealed ballot removed, at any depth:
 * every `salt` key; inside a commit or reveal vote step, operation or request, its calldata
 * (`data`) and its ballot fields (outcome, toWorker, salt, vote, ballot); and any reveal
 * calldata string. Everything else, including reveal outcomes in public chain state, is kept.
 */
export function redactTaskV2Ballots<T>(value: T): T {
  const walk = (item: unknown, vote: boolean): unknown => {
    if (typeof item === "string") return isRevealCalldata(item) ? TASK_V2_REDACTED_CALLDATA : item;
    if (Array.isArray(item)) return item.map((entry: unknown) => walk(entry, vote));
    const source = plainRecord(item);
    if (!source) return item;
    const inside = vote || isVoteContext(source);
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(source)) {
      if (/^salt$/iu.test(key) || (inside && BALLOT_FIELDS.has(key))) continue;
      out[key] =
        inside && key === "data" && typeof entry === "string"
          ? TASK_V2_REDACTED_CALLDATA
          : walk(entry, inside);
    }
    return out;
  };
  return walk(value, false) as T;
}

/** A 32-byte hex value (a salt-like value) or a named vote field in an error message. */
const ECHOED_VOTE = /(?:0x)?[0-9a-f]{64}|\bsalt\b|toWorker|(?:reveal|commit)[-_ ]?vote/iu;
const SAFE_SERVER_CODE = /^[a-z0-9_.-]{1,64}$/iu;

/**
 * One hosted call of a plain `show` or `status` read. A hosted error, or a transport error
 * quoting the response, may echo a prepared vote: a message that carries a salt-like value or
 * a vote field is replaced by a fixed message with only the HTTP status, before the usual
 * error mapping (sign-in, not found, unavailable route) runs on its status and code.
 */
export async function taskReadWithoutBallots<T>(verb: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    const withheld = (status?: number) =>
      `The hosted API returned an error for ${verb}${
        status ? ` (HTTP ${status})` : ""
      }; its message was withheld because it may echo a vote. Retry the same command.`;
    if (error instanceof TasksClientError) {
      const serverCode =
        error.serverCode && SAFE_SERVER_CODE.test(error.serverCode) ? error.serverCode : undefined;
      if (ECHOED_VOTE.test(error.message) || serverCode !== error.serverCode)
        throw new TasksClientError(
          error.code,
          withheld(error.status),
          error.status,
          serverCode,
          error.retryAfter,
        );
      throw error;
    }
    if (error instanceof TaskInputError) {
      if (ECHOED_VOTE.test(error.message)) throw new TaskInputError(withheld());
      throw error;
    }
    if (error instanceof TaskOperationError) {
      if (ECHOED_VOTE.test(error.message) || error.details)
        throw new TaskOperationError(
          error.code,
          ECHOED_VOTE.test(error.message) ? withheld() : error.message,
          error.manifestHash,
          error.details && redactTaskV2Ballots(error.details),
        );
      throw error;
    }
    if (error instanceof Error && ECHOED_VOTE.test(`${error.message} ${String(error.cause)}`))
      throw new TasksClientError("network", withheld());
    throw error;
  }
}
