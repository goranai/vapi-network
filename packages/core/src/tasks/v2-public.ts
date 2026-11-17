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
