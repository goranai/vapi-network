// SPDX-License-Identifier: Apache-2.0
// Jury, vote and reviewer steps for Tasks V2 (DisputeResolverV3). Plans come from
// the hosted writes route; this module only reads the chain, seals ballots and
// hands the raw write to executeTaskV2. Rules: with 20 or fewer eligible reviewers
// everyone eligible votes; above 20, 5 are drawn. A verdict needs at least 3 reveals
// and a strict majority. A tie or no majority restores the pre-dispute state and a
// new dispute round may be raised. There is no mediation or appeal.
import { randomBytes as nodeRandomBytes } from "node:crypto";

import { getAddress, parseAbi, toHex, zeroHash, type Address, type Hex } from "viem";
import { z } from "zod";

import {
  listTaskV2Ballots,
  readTaskV2Ballot,
  TASK_V2_VOTE_OUTCOMES,
  taskV2BallotPath,
  writeTaskV2Ballot,
  type TaskV2Ballot,
} from "./ballots.js";
import type { TasksChainOptions } from "./chain.js";
import {
  TaskInputError,
  TaskOperationError,
  type TaskOperationContext,
} from "./operation-support.js";
import { disputeResolverV3JuryAbi, escrowFactoryV2Abi } from "./v2-abi.js";
import { executeTaskV2, type TaskV2ExecutionInput } from "./v2-execution.js";
import { v2Read, verifiedV2Resolver, verifyV2Target } from "./v2-plan-guard.js";
import { getTrustedTasksV2Deployment, type TasksV2DeploymentOverrides } from "./v2-trust.js";
import { taskV2IndexSchema, type TaskV2Action } from "./v2-write.js";
import type { PublicClient } from "viem";

/** DisputeResolverV3 case states (vapi-app tasks-v2.ts CaseState). Snapshotting was appended. */
export const TASK_V2_CASE_STATES = [
  "None",
  "Raised",
  "Matched",
  "JuryDrawPending",
  "Voting",
  "Resolved",
  "Snapshotting",
] as const;
const SNAPSHOTTING = 6;

export const TASK_V2_JURY_STEPS = {
  open: "open-jury",
  draw: "draw-jury",
  rearm: "rearm-draw",
  resolve: "resolve",
} as const;
export type TaskV2JuryStep = keyof typeof TASK_V2_JURY_STEPS;

// External reviewer-seat contracts, mirrored from vapi-app tasks-v1 2621284b3
// apps/api/app/tasks/server/chain/v2-writes.server.ts reviewerStatus().
const registryAbi = parseAbi(["function isReviewer(address) view returns (bool)"]);
const vapiIdAbi = parseAbi(["function hasId(address wallet) view returns (bool)"]);
const gateAbi = parseAbi([
  "function staking() view returns (address)",
  "function threshold() view returns (uint256)",
  "function isEligible(address) view returns (bool)",
]);
const stakingAbi = parseAbi(["function stakedBalance(address) view returns (uint256)"]);

const address = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/u)
  .transform((v) => getAddress(v));
const hash = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/u)
  .transform((v) => v.toLowerCase() as Hex);

/** Chain-side jury helpers bound to one unlocked wallet. Exposed as TasksChain.juryV2. */
export function createTaskV2Jury(options: TasksChainOptions) {
  const { client, account } = options;
  const randomBytes = options.randomBytes ?? ((size: number) => nodeRandomBytes(size));
  const now = options.now ?? (() => new Date());
  const home = () => {
    if (!options.ballotsHome)
      throw new TaskOperationError(
        "ballot_store_unavailable",
        "The local ballot store is unavailable.",
      );
    return options.ballotsHome;
  };

  /** The verified clone, its resolver (from the clone's DISPUTE_RESOLVER()) and the current round. */
  async function voteCase(id: string, i: number) {
    taskV2IndexSchema.parse(i);
    const deployment = await client.deployment();
    if (!deployment.configured)
      throw new TaskOperationError("v2_resolver_unavailable", "Hosted Tasks V2 is not configured.");
    const view = await client.getOrder(id);
    if (view.workOrder.id !== id)
      throw new TaskOperationError("invalid_response", "The order view belongs to another task.");
    const target = await verifyV2Target(options, { chainId: deployment.chainId }, view, {
      action: "open-jury",
      i,
    });
    const resolver = await verifiedV2Resolver(target);
    const at = [target.escrow, i] as const;
    const caseId = hash.parse(
      await v2Read(target.rpc, resolver, disputeResolverV3JuryAbi, "currentCaseId", at),
    );
    return { target, resolver, caseId, at };
  }
  async function onchainCommitment(
    rpc: PublicClient,
    resolver: Address,
    caseId: Hex,
  ): Promise<Hex> {
    return hash.parse(
      await v2Read(rpc, resolver, disputeResolverV3JuryAbi, "commitments", [
        caseId,
        account.address,
      ]),
    );
  }
  /** Never re-implement the hash: the resolver's own voteCommitment view is the preimage rule. */
  async function commitmentOf(
    rpc: PublicClient,
    resolver: Address,
    ballot: Pick<TaskV2Ballot, "escrow" | "i" | "outcome" | "toWorker" | "salt">,
  ): Promise<Hex> {
    return hash.parse(
      await v2Read(rpc, resolver, disputeResolverV3JuryAbi, "voteCommitment", [
        getAddress(ballot.escrow),
        ballot.i,
        account.address,
        ballot.outcome,
        BigInt(ballot.toWorker),
        ballot.salt,
      ]),
    );
  }

  return {
    /** Current DisputeResolverV3 case state for one milestone. */
    async caseState(input: { id: string; i: number }) {
      const { target, resolver, at } = await voteCase(input.id, input.i);
      const data = z
        .object({ state: z.number().int().min(0).max(6) })
        .parse(await v2Read(target.rpc, resolver, disputeResolverV3JuryAbi, "caseData", at));
      return { state: data.state, name: TASK_V2_CASE_STATES[data.state]!, resolver };
    },
    /**
     * Generate a 32-byte salt locally, compute the commitment over RPC and write the
     * ballot (0600, fsync) before any commit plan is requested. A retry with the same
     * vote reuses its sealed ballot so the hosted preparation resumes.
     */
    async sealBallot(input: { id: string; i: number; outcome: 0 | 1 | 2; toWorker: string }) {
      const { target, resolver, caseId } = await voteCase(input.id, input.i);
      const milestone = target.milestones[input.i];
      if (!milestone)
        throw new TaskInputError("The milestone index is outside the verified escrow.");
      if (
        (input.outcome !== 2 && input.toWorker !== "0") ||
        (input.outcome === 2 && BigInt(input.toWorker) > milestone.amount)
      )
        throw new TaskInputError(
          "A split names toWorker up to the milestone amount; other outcomes use 0.",
        );
      const key = { chainId: target.chainId, resolver, caseId };
      const onchain = await onchainCommitment(target.rpc, resolver, caseId);
      const sealed = (await listTaskV2Ballots(home(), key)).filter(
        (b) =>
          b.voter === account.address.toLowerCase() &&
          b.orderId === input.id &&
          b.i === input.i &&
          b.outcome === input.outcome &&
          b.toWorker === input.toWorker,
      );
      if (onchain !== zeroHash) {
        const committed = sealed.find((b) => b.commitment === onchain);
        if (!committed)
          throw new TaskOperationError(
            "already_committed",
            "This wallet already committed a different vote in this round. Reveal it with vapi task vote --reveal.",
          );
        return { ballot: committed, reused: true, path: taskV2BallotPath(home(), committed) };
      }
      const previous = sealed.at(-1);
      if (previous && (await commitmentOf(target.rpc, resolver, previous)) === previous.commitment)
        return { ballot: previous, reused: true, path: taskV2BallotPath(home(), previous) };
      const salt = toHex(randomBytes(32));
      const draft = {
        escrow: target.escrow.toLowerCase() as Hex,
        i: input.i,
        outcome: input.outcome,
        toWorker: input.toWorker,
        salt,
      };
      const commitment = await commitmentOf(target.rpc, resolver, draft);
      if (commitment === zeroHash)
        throw new TaskOperationError(
          "invalid_commitment",
          "The resolver returned an empty commitment.",
        );
      const ballot: TaskV2Ballot = {
        version: "vapi-tasks-ballot-v1",
        orderId: input.id,
        chainId: target.chainId,
        resolver: resolver.toLowerCase() as Hex,
        caseId,
        voter: account.address.toLowerCase() as Hex,
        commitment,
        createdAt: now().toISOString(),
        ...draft,
      };
      const path = await writeTaskV2Ballot(home(), ballot);
      return { ballot, reused: false, path };
    },
    /** The ballot whose commitment is onchain for this wallet in the current round. */
    async openBallot(input: { id: string; i: number }) {
      const { target, resolver, caseId } = await voteCase(input.id, input.i);
      const onchain = await onchainCommitment(target.rpc, resolver, caseId);
      if (onchain === zeroHash)
        throw new TaskOperationError(
          "no_commitment",
          "This wallet has no committed vote in the current dispute round.",
        );
      const ballot = await readTaskV2Ballot(home(), {
        chainId: target.chainId,
        resolver,
        caseId,
        commitment: onchain,
        voter: account.address,
      });
      if (!ballot || ballot.orderId !== input.id || ballot.i !== input.i)
        throw new TaskOperationError(
          "ballot_unavailable",
          "No local ballot matches the onchain commitment. Reveal from the machine that committed.",
        );
      if ((await commitmentOf(target.rpc, resolver, ballot)) !== onchain)
        throw new TaskOperationError(
          "invalid_commitment",
          "The stored ballot no longer matches its onchain commitment.",
        );
      return { ballot, path: taskV2BallotPath(home(), ballot) };
    },
  };
}
export type TaskV2Jury = ReturnType<typeof createTaskV2Jury>;

type RunBase = Omit<TaskV2ExecutionInput, "write" | "consent" | "prepared" | "preparationKey">;
function jury(context: TaskOperationContext): TaskV2Jury {
  if (!context.chain.juryV2)
    throw new TaskOperationError("chain_unavailable", "Local jury signing is unavailable.");
  return context.chain.juryV2;
}

/** Run one jury step. `open` repeats while the case is Snapshotting (continueJury batches). */
export async function runTaskV2Jury(
  context: TaskOperationContext,
  input: RunBase & { i: number; step: TaskV2JuryStep; maxRounds?: number },
) {
  const action = TASK_V2_JURY_STEPS[input.step];
  if (!action) throw new TaskInputError("The jury step must be open, draw, rearm or resolve.");
  const { step, maxRounds, i, ...base } = input;
  const write = { action, i } as TaskV2Action;
  let rounds = 0;
  for (;;) {
    rounds += 1;
    const result = await executeTaskV2(context, { ...base, write });
    if (!result.ok || step !== "open") return { ...result, rounds };
    const caseState = await jury(context).caseState({ id: input.id, i });
    if (caseState.state !== SNAPSHOTTING || rounds >= (maxRounds ?? 32))
      return { ...result, rounds, caseState: caseState.name };
  }
}

export const taskV2VoteInputSchema = z
  .strictObject({
    i: taskV2IndexSchema,
    action: z.enum(["commit", "reveal"]),
    outcome: z.enum(TASK_V2_VOTE_OUTCOMES).optional(),
    toWorker: z
      .string()
      .regex(/^(0|[1-9][0-9]*)$/u)
      .refine((v) => BigInt(v) < 2n ** 96n)
      .optional(),
  })
  .superRefine((value, context) => {
    const issue = (message: string) => context.addIssue({ code: "custom", message });
    if (value.action === "reveal" && (value.outcome || value.toWorker !== undefined))
      issue("Reveal reads the sealed local ballot; it takes no outcome or toWorker.");
    if (value.action === "commit" && !value.outcome) issue("Commit needs an outcome.");
    if (value.outcome === "split" && (value.toWorker === undefined || value.toWorker === "0"))
      issue("A split vote needs toWorker in USDC base units.");
    if (value.outcome && value.outcome !== "split" && (value.toWorker ?? "0") !== "0")
      issue("Only a split vote names toWorker.");
  });
export type TaskV2VoteInput = z.input<typeof taskV2VoteInputSchema>;

/** Commit seals the ballot locally first; reveal reads it back by the onchain commitment. */
export async function runTaskV2Vote(
  context: TaskOperationContext,
  input: RunBase & TaskV2VoteInput,
) {
  const { i, action, outcome, toWorker, ...base } = input;
  const parsed = taskV2VoteInputSchema.safeParse({
    i,
    action,
    ...(outcome === undefined ? {} : { outcome }),
    ...(toWorker === undefined ? {} : { toWorker }),
  });
  if (!parsed.success) throw new TaskInputError(parsed.error.issues[0]!.message);
  const vote = parsed.data;
  if (vote.action === "commit") {
    const sealed = await jury(context).sealBallot({
      id: input.id,
      i: vote.i,
      outcome: TASK_V2_VOTE_OUTCOMES.indexOf(vote.outcome!) as 0 | 1 | 2,
      toWorker: vote.toWorker ?? "0",
    });
    const result = await executeTaskV2(context, {
      ...base,
      write: { action: "commit-vote", i: vote.i, commitment: sealed.ballot.commitment },
    });
    return {
      ...result,
      ballot: {
        commitment: sealed.ballot.commitment,
        caseId: sealed.ballot.caseId,
        path: sealed.path,
      },
    };
  }
  const opened = await jury(context).openBallot({ id: input.id, i: vote.i });
  const result = await executeTaskV2(context, {
    ...base,
    write: {
      action: "reveal-vote",
      i: vote.i,
      outcome: opened.ballot.outcome,
      toWorker: opened.ballot.toWorker,
      salt: opened.ballot.salt,
    },
  });
  return {
    ...result,
    ballot: {
      commitment: opened.ballot.commitment,
      caseId: opened.ballot.caseId,
      outcome: TASK_V2_VOTE_OUTCOMES[opened.ballot.outcome],
      toWorker: opened.ballot.toWorker,
      path: opened.path,
    },
  };
}

/**
 * Reviewer readiness from local RPC reads only; there is no hosted order-less route yet.
 * The resolver is the local pin, else the pinned factory's disputeResolver() getter.
 */
export async function readTaskV2ReviewerStatus(input: {
  chainId: number;
  wallet: string;
  rpcFor: (chainId: number) => PublicClient;
  trustedV2Deployments?: TasksV2DeploymentOverrides;
  env?: NodeJS.ProcessEnv;
  onV2UntrustedOverride?: (message: string) => void;
}) {
  const wallet = address.parse(input.wallet);
  const pin = getTrustedTasksV2Deployment(input.chainId, {
    ...(input.trustedV2Deployments ? { overrides: input.trustedV2Deployments } : {}),
    ...(input.env ? { env: input.env } : {}),
    ...(input.onV2UntrustedOverride ? { notice: input.onV2UntrustedOverride } : {}),
  });
  const rpc = input.rpcFor(input.chainId);
  if ((await rpc.getChainId()) !== input.chainId)
    throw new TaskOperationError(
      "v2_plan_mismatch",
      "The RPC chain differs from the pinned V2 chain.",
    );
  let resolver = pin.disputeResolverV3;
  if (!resolver) {
    try {
      resolver = address.parse(
        await v2Read(rpc, pin.escrowFactoryV2, escrowFactoryV2Abi, "disputeResolver"),
      );
    } catch {
      throw new TaskOperationError(
        "v2_resolver_unavailable",
        `No dispute resolver is pinned for chain ${input.chainId}. Set VAPI_TASKS_V2_DISPUTE_RESOLVER_${input.chainId}.`,
      );
    }
  }
  const read = (
    contract: Address,
    abi: Parameters<typeof v2Read>[2],
    name: string,
    args: readonly unknown[] = [],
  ) => v2Read(rpc, contract, abi, name, args);
  const registry = address.parse(await read(resolver, disputeResolverV3JuryAbi, "registry"));
  const vapiId = address.parse(await read(resolver, disputeResolverV3JuryAbi, "vapiId"));
  const stakeGate = address.parse(await read(resolver, disputeResolverV3JuryAbi, "stakeGate"));
  const staking = address.parse(await read(stakeGate, gateAbi, "staking"));
  const flag = (value: unknown) => z.boolean().parse(value);
  const uint = (value: unknown) => z.bigint().nonnegative().parse(value);
  const status = {
    chainId: input.chainId,
    wallet,
    resolver,
    registry,
    vapiId,
    stakeGate,
    staking,
    isReviewer: flag(await read(registry, registryAbi, "isReviewer", [wallet])),
    hasId: flag(await read(vapiId, vapiIdAbi, "hasId", [wallet])),
    staked: uint(await read(staking, stakingAbi, "stakedBalance", [wallet])).toString(),
    threshold: uint(await read(stakeGate, gateAbi, "threshold")).toString(),
    eligible: flag(await read(stakeGate, gateAbi, "isEligible", [wallet])),
    available: flag(await read(resolver, disputeResolverV3JuryAbi, "available", [wallet])),
    suspended: flag(await read(resolver, disputeResolverV3JuryAbi, "suspended", [wallet])),
    claimable: uint(
      await read(resolver, disputeResolverV3JuryAbi, "claimable", [wallet]),
    ).toString(),
    missedReveals: Number(
      await read(resolver, disputeResolverV3JuryAbi, "missedReveals", [wallet]),
    ),
  };
  const meetsStake = BigInt(status.staked) >= BigInt(status.threshold);
  return {
    ...status,
    meetsStake,
    // A seat, a vAPI ID, the stake gate and availability decide whether this wallet can be drawn.
    ready:
      status.isReviewer &&
      status.hasId &&
      status.eligible &&
      meetsStake &&
      status.available &&
      !status.suspended,
  };
}
