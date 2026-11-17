// SPDX-License-Identifier: Apache-2.0
// Public projections of hosted V2 operations. Results, progress and errors that leave the
// SDK (and so reach CLI JSON and MCP tool results) are built field by field from these
// allowlists; unknown hosted fields are never spread, because a hosted response may echo the
// request, and a vote request carries the ballot.
import { toFunctionSelector } from "viem";
import { z } from "zod";

import { TasksClientError } from "./client.js";
import { TaskOperationError } from "./operation-support.js";
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
