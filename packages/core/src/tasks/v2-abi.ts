// SPDX-License-Identifier: Apache-2.0
// Selected unchanged C0 schemas from vAPI-Network/vapi-app tasks-v1
// apps/api/app/tasks/server/chain/abi/tasks-v2.generated.ts (generated from contracts/abi/tasks-v2).
// IEscrowFactoryV2.json sha256: 3532a6ec82763c5c51239b558baa022126037388bc3d0f0e37d0f08b64a43b2a
// IEscrowV2.json sha256: 4ab4ede415fbdd571f0fca6658988bbdbdc28d75385abf0539ccb882cf491bc3
// IDisputeResolverV3.json sha256: 3d82af3185b156c2110b88bf94e7764c2138bb80cc9bb87656dd7c9838653cfd
// IBountyPoolFactoryV1.json sha256: 97a9b2f18a9934e0df144a0f1d3558925372835e7d14ea8af7963db784287673
// IBountyPoolV1.json sha256: 154e314dc324335a53220258f1a694d672fffef24b4103d7717ef610416f43b9
// Read-only calls and decoding only: never use these to build participant calldata.

export const escrowFactoryV2Abi = [
  {
    type: "function",
    name: "computeTermsDigest",
    inputs: [
      {
        name: "t",
        type: "tuple",
        internalType: "struct TermsInput",
        components: [
          {
            name: "shape",
            type: "uint8",
            internalType: "enum Shape",
          },
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "total",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "offerTtl",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "reviewWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "choiceWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "winners",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "rewardPerWinner",
            type: "uint96",
            internalType: "uint96",
          },
        ],
      },
      {
        name: "m",
        type: "tuple[]",
        internalType: "struct MilestoneInput[]",
        components: [
          {
            name: "amount",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "predictEscrow",
    inputs: [
      {
        name: "t",
        type: "tuple",
        internalType: "struct TermsInput",
        components: [
          {
            name: "shape",
            type: "uint8",
            internalType: "enum Shape",
          },
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "total",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "offerTtl",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "reviewWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "choiceWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "winners",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "rewardPerWinner",
            type: "uint96",
            internalType: "uint96",
          },
        ],
      },
      {
        name: "m",
        type: "tuple[]",
        internalType: "struct MilestoneInput[]",
        components: [
          {
            name: "amount",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
        ],
      },
      {
        name: "userSalt",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createAndFund",
    inputs: [
      {
        name: "t",
        type: "tuple",
        internalType: "struct TermsInput",
        components: [
          {
            name: "shape",
            type: "uint8",
            internalType: "enum Shape",
          },
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "total",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "offerTtl",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "reviewWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "choiceWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "winners",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "rewardPerWinner",
            type: "uint96",
            internalType: "uint96",
          },
        ],
      },
      {
        name: "m",
        type: "tuple[]",
        internalType: "struct MilestoneInput[]",
        components: [
          {
            name: "amount",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
        ],
      },
      {
        name: "userSalt",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "escrow",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createAndFundWithAuthorization",
    inputs: [
      {
        name: "t",
        type: "tuple",
        internalType: "struct TermsInput",
        components: [
          {
            name: "shape",
            type: "uint8",
            internalType: "enum Shape",
          },
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "total",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "offerTtl",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "reviewWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "choiceWindow",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "winners",
            type: "uint8",
            internalType: "uint8",
          },
          {
            name: "rewardPerWinner",
            type: "uint96",
            internalType: "uint96",
          },
        ],
      },
      {
        name: "m",
        type: "tuple[]",
        internalType: "struct MilestoneInput[]",
        components: [
          {
            name: "amount",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
        ],
      },
      {
        name: "userSalt",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "validAfter",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "validBefore",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "nonce",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "escrow",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isEscrow",
    inputs: [
      {
        name: "escrow",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdc",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "disputeResolver",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeBp",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
] as const;

export const bountyPoolFactoryV1Abi = [
  {
    type: "function",
    name: "predictPool",
    inputs: [
      {
        name: "p",
        type: "tuple",
        internalType: "struct PoolInput",
        components: [
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "rewardPerClaim",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "budget",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "gate",
            type: "uint8",
            internalType: "enum PoolGate",
          },
          {
            name: "verifier",
            type: "address",
            internalType: "address",
          },
        ],
      },
      {
        name: "userSalt",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createPool",
    inputs: [
      {
        name: "p",
        type: "tuple",
        internalType: "struct PoolInput",
        components: [
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "rewardPerClaim",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "budget",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "gate",
            type: "uint8",
            internalType: "enum PoolGate",
          },
          {
            name: "verifier",
            type: "address",
            internalType: "address",
          },
        ],
      },
      {
        name: "userSalt",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createAndFundPoolWithAuthorization",
    inputs: [
      {
        name: "p",
        type: "tuple",
        internalType: "struct PoolInput",
        components: [
          {
            name: "poster",
            type: "address",
            internalType: "address",
          },
          {
            name: "rewardPerClaim",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "budget",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "termsHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "gate",
            type: "uint8",
            internalType: "enum PoolGate",
          },
          {
            name: "verifier",
            type: "address",
            internalType: "address",
          },
        ],
      },
      {
        name: "userSalt",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "validAfter",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "validBefore",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "nonce",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "sig",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isPool",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
] as const;

export const escrowV2Abi = [
  {
    type: "function",
    name: "fund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelOffer",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "award",
    inputs: [
      {
        name: "worker",
        type: "address",
        internalType: "address",
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "workerSig",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitMilestone",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "deliveryHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approveMilestone",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rejectMilestone",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "reasonHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeMilestone",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelRemainder",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "refundRemainder",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "awardBounty",
    inputs: [
      {
        name: "winners",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "expireBounty",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "raiseDispute",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "evidenceHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitCounterEvidence",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "evidenceHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveUnmatched",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveWithSplit",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "toWorker",
        type: "uint96",
        internalType: "uint96",
      },
      {
        name: "expiry",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "counterSig",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "shape",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum Shape",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poster",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "worker",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "termsHash",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "termsDigest",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "total",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeBp",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "milestoneCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "milestone",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct MilestoneView",
        components: [
          {
            name: "amount",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "deadline",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "status",
            type: "uint8",
            internalType: "enum MilestoneStatus",
          },
          {
            name: "deliveryHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "submittedAt",
            type: "uint64",
            internalType: "uint64",
          },
          {
            name: "rejections",
            type: "uint8",
            internalType: "uint8",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "disputeFee",
    inputs: [
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [
      {
        name: "signer",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "offerTtl",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "reviewWindow",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "choiceWindow",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "winners",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardPerWinner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96",
      },
    ],
    stateMutability: "view",
  },
] as const;

export const bountyPoolV1Abi = [
  {
    type: "function",
    name: "fund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "payClaim",
    inputs: [
      {
        name: "claimant",
        type: "address",
        internalType: "address",
      },
      {
        name: "claimHash",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "poster",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifier",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardPerClaim",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "budget",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint96",
        internalType: "uint96",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deadline",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "termsHash",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "gate",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum PoolGate",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "feeBp",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
] as const;

export const disputeResolverV3Abi = [
  {
    type: "event",
    name: "DisputeOpened",
    inputs: [
      {
        name: "escrow",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "i",
        type: "uint8",
        indexed: true,
        internalType: "uint8",
      },
      {
        name: "raisedBy",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "raisedAt",
        type: "uint64",
        indexed: false,
        internalType: "uint64",
      },
      {
        name: "fee",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "stage",
    inputs: [
      {
        name: "escrow",
        type: "address",
        internalType: "address",
      },
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum DisputeStage",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "deadlines",
    inputs: [
      {
        name: "escrow",
        type: "address",
        internalType: "address",
      },
      {
        name: "i",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [
      {
        name: "evidenceEnd",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "drawBlock",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "commitEnd",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "revealEnd",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
] as const;

// Jury, vote, reviewer and owed-credit entries, selected unchanged from vAPI-Network/vapi-app
// tasks-v1 2621284b3 apps/api/app/tasks/server/chain/abi/tasks-v2.generated.ts.
// DisputeResolverV3.json sha256: 7ff0cc47b7ee48e0ebbd3e61c5d6fc3b8a81801c8300ffd7a6800cf7ef611c26
// EscrowV2.json sha256: 0f8df0cba09e523a0d68e0f621995e023ac29e8e2c5aac818a5db7ef15b6e434
// (BountyEscrowV2.json sha256: f768d9b683205729a764b4153c20cd464b42587822efb612e28144eaf34519c8
// carries the same claimOwed and owed entries.) Decoding and reads only.
export const disputeResolverV3JuryAbi = [
  {
    type: "function",
    name: "openJury",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "continueJury",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "drawJury",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rearmDraw",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "commitVote",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
      { name: "commitment", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revealVote",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
      { name: "outcome", type: "uint8", internalType: "enum IEscrowV2.Outcome" },
      { name: "toWorker", type: "uint96", internalType: "uint96" },
      { name: "salt", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolve",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "voteCommitment",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
      { name: "reviewer", type: "address", internalType: "address" },
      { name: "outcome", type: "uint8", internalType: "enum IEscrowV2.Outcome" },
      { name: "toWorker", type: "uint96", internalType: "uint96" },
      { name: "salt", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "commitments",
    inputs: [
      { name: "caseId", type: "bytes32", internalType: "bytes32" },
      { name: "reviewer", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "commitment", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentCaseId",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "caseData",
    inputs: [
      { name: "escrow", type: "address", internalType: "address" },
      { name: "i", type: "uint8", internalType: "uint8" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct DisputeResolverV3.CaseData",
        components: [
          { name: "state", type: "uint8", internalType: "enum DisputeResolverV3.CaseState" },
          { name: "juryMode", type: "uint8", internalType: "enum DisputeResolverV3.JuryMode" },
          { name: "raisedBy", type: "address", internalType: "address" },
          { name: "raisedAt", type: "uint64", internalType: "uint64" },
          { name: "evidenceDeadline", type: "uint64", internalType: "uint64" },
          { name: "commitDeadline", type: "uint64", internalType: "uint64" },
          { name: "revealDeadline", type: "uint64", internalType: "uint64" },
          { name: "drawBlock", type: "uint64", internalType: "uint64" },
          { name: "revealCount", type: "uint8", internalType: "uint8" },
          { name: "committedCount", type: "uint8", internalType: "uint8" },
          { name: "eligiblePoolSize", type: "uint32", internalType: "uint32" },
          { name: "round", type: "uint32", internalType: "uint32" },
          { name: "noQuorum", type: "bool", internalType: "bool" },
          { name: "snapshotRemaining", type: "uint32", internalType: "uint32" },
          { name: "voteCounts", type: "uint8[3]", internalType: "uint8[3]" },
          { name: "reviewers", type: "address[5]", internalType: "address[5]" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasRevealed",
    inputs: [
      { name: "caseId", type: "bytes32", internalType: "bytes32" },
      { name: "reviewer", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "revealed", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IReviewerRegistryV2" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "stakeGate",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IReviewersGate" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vapiId",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IVapiIdV1" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "available",
    inputs: [{ name: "reviewer", type: "address", internalType: "address" }],
    outputs: [{ name: "value", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "suspended",
    inputs: [{ name: "reviewer", type: "address", internalType: "address" }],
    outputs: [{ name: "value", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimable",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "missedReveals",
    inputs: [{ name: "reviewer", type: "address", internalType: "address" }],
    outputs: [{ name: "count", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
] as const;
export const escrowV2OwedAbi = [
  {
    type: "function",
    name: "DISPUTE_RESOLVER",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimOwed",
    inputs: [{ name: "to", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owed",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;
