# 📋 MiQũy — Project Plan Chi Tiết

> **Mục tiêu:** Build MVP trong 30 ngày (2–30/11/2026), submit trước 05:59 ngày 25/11/2026.
> **Team size:** 2–3 người
> **Difficulty:** 4/5

---

## 1. Cấu trúc dự án

```
miquy/
├── contracts/                    # Foundry project — Smart contracts
│   ├── foundry.toml
│   ├── src/
│   │   ├── FundFactory.sol       # Factory tạo quỹ mới
│   │   ├── CommunityFund.sol     # Logic quỹ chính
│   │   ├── GovernanceModule.sol  # 4 governance modes
│   │   ├── YieldVault.sol        # ERC-4626 yield wrapper
│   │   ├── MockUSDC.sol          # USDC giả trên testnet
│   │   ├── MockYieldSource.sol   # Nguồn yield giả (mock Benqi)
│   │   └── interfaces/
│   │       ├── ICommunityFund.sol
│   │       ├── IGovernanceModule.sol
│   │       └── IYieldVault.sol
│   ├── test/
│   │   ├── FundFactory.t.sol
│   │   ├── CommunityFund.t.sol
│   │   ├── Governance.t.sol
│   │   └── YieldVault.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── lib/                      # Dependencies (OpenZeppelin, etc.)
│
├── l1/                           # Avalanche Custom L1 config
│   ├── genesis.json              # Genesis block cho Activity L1
│   ├── contracts/
│   │   ├── ActivityLog.sol       # Log hoạt động quỹ
│   │   └── ProofRegistry.sol     # Hash ảnh biên lai
│   └── icm/
│       ├── FundMessenger.sol     # ICM sender (L1 → C-Chain)
│       └── FundReceiver.sol      # ICM receiver (C-Chain → L1)
│
├── app/                          # Next.js frontend
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── create/page.tsx       # Tạo quỹ mới
│   │   │   ├── fund/[id]/page.tsx    # Dashboard quỹ
│   │   │   ├── fund/[id]/propose.tsx # Đề xuất chi tiêu
│   │   │   ├── fund/[id]/vote.tsx    # Vote chi tiêu
│   │   │   └── audit/page.tsx        # Chat AI Auditor
│   │   ├── components/
│   │   │   ├── FundCard.tsx
│   │   │   ├── FundTimeline.tsx
│   │   │   ├── VotePanel.tsx
│   │   │   ├── ProposalForm.tsx
│   │   │   ├── MemberList.tsx
│   │   │   ├── YieldDisplay.tsx
│   │   │   └── AuditChat.tsx
│   │   ├── hooks/
│   │   │   ├── useFund.ts
│   │   │   ├── useGovernance.ts
│   │   │   └── useAuditor.ts
│   │   ├── lib/
│   │   │   ├── contracts.ts      # ABI + addresses
│   │   │   ├── chains.ts         # Fuji + custom L1 config
│   │   │   └── x402.ts           # x402 client SDK
│   │   └── providers/
│   │       └── Web3Provider.tsx   # wagmi + wallet provider
│   └── public/
│       └── assets/
│
├── auditor/                      # x402 AI Auditor server
│   ├── package.json
│   ├── src/
│   │   ├── server.ts             # Express server
│   │   ├── x402-middleware.ts    # HTTP 402 paywall
│   │   ├── facilitator.ts       # x402 USDC settlement
│   │   ├── agent.ts             # LLM + Glacier API query
│   │   └── policy.ts            # Read-only policy (no money decisions)
│   └── .env.example
│
├── docs/
│   ├── pitch-deck.md            # Outline slide pitch
│   └── demo-script.md           # Kịch bản demo 3 phút
│
└── README.md
```

---

## 2. Smart Contract Specifications

### 2.1 FundFactory.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FundFactory — Tạo và registry quỹ cộng đồng
/// @notice Mỗi quỹ là một CommunityFund contract riêng biệt
interface IFundFactory {
    
    enum GovernanceMode {
        Simple,     // 1 admin duyệt, mọi chi tiêu công khai
        Vote,       // >threshold% thành viên đồng ý
        Milestone,  // Tiền giải ngân khi đạt mốc + bằng chứng
        Stream      // Tiền nhỏ giọt theo thời gian
    }

    struct FundParams {
        string name;                    // Tên quỹ: "Quỹ Lớp 12A3"
        GovernanceMode mode;            // Cách quản lý chi tiêu
        address[] initialMembers;       // Danh sách thành viên ban đầu
        uint256 contributionAmount;     // Số USDC mỗi kỳ đóng góp (6 decimals)
        uint256 contributionPeriod;     // Chu kỳ đóng góp (seconds)
        uint256 voteThreshold;          // % đồng ý cần thiết (chỉ cho mode Vote)
        address yieldVault;             // Địa chỉ yield vault
    }

    event FundCreated(
        address indexed fund,
        string name,
        GovernanceMode mode,
        address indexed creator,
        uint256 timestamp
    );

    /// @notice Tạo quỹ mới
    /// @return fundAddress Địa chỉ contract quỹ vừa tạo
    function createFund(FundParams calldata params) external returns (address fundAddress);

    /// @notice Lấy danh sách tất cả quỹ
    function getAllFunds() external view returns (address[] memory);

    /// @notice Lấy quỹ theo creator
    function getFundsByCreator(address creator) external view returns (address[] memory);
    
    /// @notice Tổng số quỹ đã tạo
    function fundCount() external view returns (uint256);
}
```

### 2.2 CommunityFund.sol

```solidity
/// @title CommunityFund — Logic quỹ cộng đồng
/// @notice Quản lý deposit, proposal, vote, disburse
interface ICommunityFund {

    enum ProposalStatus { Pending, Approved, Rejected, Executed, Cancelled }

    struct Proposal {
        uint256 id;
        address proposer;              // Người đề xuất
        string description;            // "Mua bánh kẹo liên hoan"
        uint256 amount;                // Số USDC cần chi
        address recipient;             // Người/nơi nhận tiền
        bytes32 proofHash;             // Hash ảnh hoá đơn (IPFS CID)
        ProposalStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        uint256 executedAt;
    }

    // ──── Events ────
    event Deposited(address indexed member, uint256 amount, uint256 timestamp);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 amount);
    event Voted(uint256 indexed proposalId, address indexed voter, bool approve);
    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalRejected(uint256 indexed proposalId);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    // ──── Member Management ────
    function addMember(address member) external;              // Chỉ admin/governance
    function removeMember(address member) external;
    function isMember(address addr) external view returns (bool);
    function getMembers() external view returns (address[] memory);
    function memberCount() external view returns (uint256);

    // ──── Deposits ────
    function deposit(uint256 amount) external;                // Đóng tiền vào quỹ
    function getBalance() external view returns (uint256);    // Tổng balance quỹ
    function getMemberContribution(address member) external view returns (uint256);

    // ──── Proposals ────
    function createProposal(
        string calldata description,
        uint256 amount,
        address recipient,
        bytes32 proofHash
    ) external returns (uint256 proposalId);

    function vote(uint256 proposalId, bool approve) external;
    function executeProposal(uint256 proposalId) external;    // Chỉ khi đã approved
    function cancelProposal(uint256 proposalId) external;     // Chỉ proposer hoặc admin

    // ──── Views ────
    function getProposal(uint256 id) external view returns (Proposal memory);
    function getProposalCount() external view returns (uint256);
    function getAllProposals() external view returns (Proposal[] memory);
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);

    // ──── Yield ────
    function depositToVault() external;                       // Chuyển idle USDC vào yield vault
    function withdrawFromVault(uint256 amount) external;      // Rút từ vault khi cần chi
    function getYieldEarned() external view returns (uint256);
    function getTotalValue() external view returns (uint256); // Balance + vault value
}
```

### 2.3 GovernanceModule.sol

```solidity
/// @title GovernanceModule — Logic quản trị cho từng mode
/// @notice Xác định ai có quyền duyệt chi tiêu và bằng cách nào
interface IGovernanceModule {

    // ──── Simple Mode ────
    // Admin gọi executeProposal() trực tiếp
    // Mọi chi tiêu vẫn ghi nhận on-chain, minh bạch

    // ──── Vote Mode ────
    /// @notice Kiểm tra proposal đã đủ vote chưa
    function isApproved(uint256 proposalId) external view returns (bool);
    
    /// @notice Lấy vote threshold (%)
    function voteThreshold() external view returns (uint256);
    
    /// @notice Thay đổi threshold (cần governance approval)
    function setVoteThreshold(uint256 newThreshold) external;

    // ──── Milestone Mode ────
    struct Milestone {
        string description;            // "Sửa thang máy tầng 5"
        uint256 amount;                // Budget cho milestone này
        bytes32 completionProofHash;   // Hash bằng chứng hoàn thành
        bool completed;
        bool disbursed;
    }

    function createMilestone(string calldata desc, uint256 amount) external returns (uint256);
    function completeMilestone(uint256 milestoneId, bytes32 proofHash) external;
    function getMilestone(uint256 id) external view returns (Milestone memory);

    // ──── Stream Mode ────
    /// @notice Cấu hình stream (amount per second)
    function setStream(address recipient, uint256 amountPerSecond) external;
    function claimStream() external;   // Recipient claim phần đã accumulate
    function getClaimable(address recipient) external view returns (uint256);
}
```

### 2.4 YieldVault.sol

```solidity
/// @title YieldVault — ERC-4626 wrapper cho yield trên idle USDC
/// @notice Mock trên Fuji, thật trên mainnet (Benqi/Aave)
/// @dev Implement ERC-4626 standard

// Trên Fuji: MockYieldSource tạo yield giả (1% mỗi block để demo nhanh)
// Trên mainnet: Kết nối Benqi qiUSDC hoặc Aave aUSDC

// Key functions (ERC-4626 standard):
// - deposit(assets, receiver) → shares
// - withdraw(assets, receiver, owner) → shares
// - totalAssets() → tổng USDC trong vault
// - convertToAssets(shares) → USDC tương đương
// - convertToShares(assets) → shares tương đương
```

---

## 3. Custom L1 Setup (Avalanche CLI)

### 3.1 Cài đặt Avalanche CLI

```bash
# macOS/Linux
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s

# Windows: Tải binary từ GitHub releases
# https://github.com/ava-labs/avalanche-cli/releases
```

### 3.2 Tạo Activity L1

```bash
# Bước 1: Tạo blockchain config
avalanche blockchain create miquy-activity \
  --evm \
  --latest

# Khi được hỏi:
# - Chain ID: 99999 (tùy chọn)
# - Token symbol: MACT (MiQũy Activity Token)
# - Gas config: Low throughput (đủ cho activity logging)
# - Airdrop: 1,000,000 MACT cho deployer

# Bước 2: Deploy local để test
avalanche blockchain deploy miquy-activity --local

# Bước 3: Deploy lên Fuji
avalanche blockchain deploy miquy-activity --fuji
```

### 3.3 Contracts trên L1

```solidity
/// @title ActivityLog — Ghi nhận hoạt động quỹ trên Activity L1
/// @notice Gas token MACT (free/near-zero) nên ghi thoải mái
contract ActivityLog {
    
    enum ActionType { 
        Deposit, 
        ProposalCreated, 
        VoteCast, 
        ProposalExecuted, 
        MemberAdded, 
        MemberRemoved,
        YieldClaimed 
    }

    struct Activity {
        address fundAddress;     // Quỹ nào (C-Chain address)
        ActionType actionType;
        address actor;           // Ai thực hiện
        uint256 amount;          // Số tiền (nếu có)
        bytes32 dataHash;        // Hash dữ liệu bổ sung
        uint256 timestamp;
    }

    event ActivityLogged(
        address indexed fundAddress,
        ActionType indexed actionType,
        address indexed actor,
        uint256 amount,
        bytes32 dataHash
    );

    Activity[] public activities;
    
    // Mapping: fund address → activities
    mapping(address => uint256[]) public fundActivities;

    function logActivity(
        address fundAddress,
        ActionType actionType,
        address actor,
        uint256 amount,
        bytes32 dataHash
    ) external {
        // Ghi nhận activity
        // Trong production: chỉ accept từ ICM receiver
    }

    function getActivitiesByFund(address fund) external view returns (Activity[] memory);
    function getActivityCount() external view returns (uint256);
}
```

```solidity
/// @title ProofRegistry — Lưu hash bằng chứng chi tiêu
contract ProofRegistry {
    
    struct Proof {
        address fundAddress;
        uint256 proposalId;
        bytes32 imageHash;       // Keccak256 of image file
        string ipfsCid;          // IPFS CID cho ảnh gốc
        address submitter;
        uint256 timestamp;
    }

    event ProofSubmitted(
        address indexed fundAddress,
        uint256 indexed proposalId,
        bytes32 imageHash,
        string ipfsCid
    );

    function submitProof(
        address fundAddress,
        uint256 proposalId,
        bytes32 imageHash,
        string calldata ipfsCid
    ) external;

    function getProof(address fund, uint256 proposalId) external view returns (Proof memory);
    function verifyProof(address fund, uint256 proposalId, bytes32 imageHash) external view returns (bool);
}
```

### 3.4 ICM/Teleporter Bridge

```solidity
/// @title FundMessenger — Gửi message từ C-Chain → Activity L1
/// @dev Deploy trên C-Chain
contract FundMessenger {
    // Sử dụng Teleporter interface
    // Khi có event trên CommunityFund (deposit, vote, execute)
    // → Gửi cross-chain message sang Activity L1 để log
    
    function sendActivityLog(
        bytes32 destinationBlockchainID,
        address activityLogAddress,
        address fundAddress,
        uint8 actionType,
        address actor,
        uint256 amount,
        bytes32 dataHash
    ) external;
}

/// @title FundReceiver — Nhận message từ Activity L1 trên C-Chain
/// @dev Deploy trên C-Chain
/// @notice Nhận vote confirmation từ L1 → trigger disburse
contract FundReceiver {
    // Khi milestone proof được submit trên L1
    // → Nhận confirmation → unlock funds trên C-Chain
    
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external;
}
```

---

## 4. x402 AI Auditor

### 4.1 Architecture

```
Người dùng hỏi: "Quỹ lớp tháng này chi bao nhiêu?"
         │
         ▼
┌─────────────────────┐
│  Frontend (AuditChat)│
│  POST /api/audit     │
│  + x402 client SDK   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Auditor Server     │     │   x402 Facilitator  │
│                     │     │                     │
│  1. Return HTTP 402 │◄───►│  Verify EIP-3009    │
│     with price info │     │  Settle on Fuji     │
│                     │     │  Confirm payment    │
│  2. After payment:  │     └─────────────────────┘
│     Query Glacier   │
│     API for fund    │     ┌─────────────────────┐
│     transactions    │◄───►│   Glacier API       │
│                     │     │   (Index fund data) │
│  3. LLM formats    │     └─────────────────────┘
│     response with   │
│     tx links        │     ┌─────────────────────┐
│                     │◄───►│   LLM API           │
│  4. Return answer   │     │   (Format response) │
└─────────────────────┘     └─────────────────────┘
```

### 4.2 Server Implementation Outline

```typescript
// auditor/src/server.ts

import express from 'express';
import { x402Middleware } from './x402-middleware';
import { queryFundData } from './agent';

const app = express();

// x402 paywall: 0.01 USDC per query
app.post('/api/audit', 
  x402Middleware({ 
    price: '10000',  // 0.01 USDC (6 decimals)
    receiver: AUDITOR_WALLET_ADDRESS,
    chainId: 43113,  // Fuji
    asset: FUJI_USDC_ADDRESS
  }),
  async (req, res) => {
    const { fundAddress, question } = req.body;
    
    // 1. Query on-chain data via Glacier API
    const fundData = await queryFundData(fundAddress);
    
    // 2. LLM formats answer (READ-ONLY, no money decisions)
    const answer = await formatAnswer(question, fundData);
    
    // 3. Return with transaction links
    res.json({ answer, sources: fundData.transactions });
  }
);
```

### 4.3 Policy Contract (Read-Only)

```solidity
/// @title AuditorPolicy — Đảm bảo AI chỉ ĐỌC, không chi tiền
/// @notice Deploy trên C-Chain, auditor agent session key chỉ có quyền gọi hàm view
contract AuditorPolicy {
    
    // Agent session key CHỈ được gọi:
    // - CommunityFund.getBalance()
    // - CommunityFund.getAllProposals()
    // - CommunityFund.getMemberContribution()
    // - CommunityFund.getYieldEarned()
    // - ActivityLog.getActivitiesByFund()
    
    // Agent session key KHÔNG được gọi:
    // - Bất kỳ hàm nào move tiền
    // - createProposal, vote, executeProposal, deposit, withdraw
    
    // Kill switch: owner revoke session key
    address public owner;
    bool public active;
    
    function revokeAgent() external {
        require(msg.sender == owner);
        active = false;
    }
}
```

---

## 5. Frontend Pages & Components

### 5.1 Pages

| Route | Mô tả | Key Components |
|-------|-------|----------------|
| `/` | Landing page — giới thiệu MiQũy, list quỹ public | FundCard[], hero section |
| `/create` | Form tạo quỹ mới — chọn mode, thêm members, set params | Multi-step form, wallet connect |
| `/fund/[id]` | Dashboard quỹ — balance, timeline, members, yield | FundTimeline, MemberList, YieldDisplay |
| `/fund/[id]/propose` | Đề xuất chi tiêu — description, amount, upload hoá đơn | ProposalForm, image upload → IPFS |
| `/fund/[id]/vote` | Vote chi tiêu — list proposals, approve/reject | VotePanel, ProposalCard[] |
| `/audit` | Chat AI Auditor — hỏi bất kỳ câu gì về quỹ | AuditChat, x402 payment flow |

### 5.2 Tech Stack

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "viem": "^2",
    "wagmi": "^2",
    "@rainbow-me/rainbowkit": "^2",  // hoặc Privy/Web3Auth
    "tailwindcss": "^3",
    "@tanstack/react-query": "^5",
    "zustand": "^4"                   // State management
  }
}
```

### 5.3 Wallet Integration

Dùng **embedded wallet** (Privy hoặc Web3Auth) để UX cho người không biết crypto:
- Đăng nhập bằng email/Google → tự tạo wallet
- Không cần cài MetaMask
- Quan trọng cho việc adoption (lớp trưởng, phụ huynh, cư dân chung cư)

---

## 6. Lịch trình 4 tuần

### 📅 Tuần 1 (2–8/11): Foundation

| Ngày | Task | Người | Output |
|------|------|-------|--------|
| T2 2/11 | Setup Foundry project, install OpenZeppelin | Dev 1 | `foundry.toml`, dependencies |
| T2 2/11 | Setup Next.js, TailwindCSS, wagmi | Dev 2 | App skeleton, wallet connect |
| T3 3/11 | `MockUSDC.sol` + `FundFactory.sol` | Dev 1 | Factory deploy + test |
| T3 3/11 | Landing page + create fund UI | Dev 2 | `/` và `/create` hoạt động |
| T4 4/11 | `CommunityFund.sol` — deposit + balance | Dev 1 | Deposit flow + test |
| T4 4/11 | Fund dashboard UI (`/fund/[id]`) | Dev 2 | Balance display, member list |
| T5 5/11 | `CommunityFund.sol` — proposal + execute (Simple mode) | Dev 1 | Proposal CRUD + test |
| T5 5/11 | Proposal form + execution UI | Dev 2 | `/fund/[id]/propose` |
| T6 6/11 | `GovernanceModule.sol` — Vote mode | Dev 1 | Vote logic + threshold + test |
| T6 6/11 | Vote panel UI | Dev 2 | `/fund/[id]/vote` |
| T7 7/11 | Integration test: full flow Factory → Fund → Proposal → Vote → Execute | Both | End-to-end test |
| CN 8/11 | Bug fix, refactor, review code | Both | Clean codebase |

**Tuần 1 deliverable:** Quỹ hoạt động trên Fuji với Simple + Vote mode. Deposit → Propose → Vote → Execute hoạt động end-to-end.

### 📅 Tuần 2 (9–15/11): Yield + Governance mở rộng

| Ngày | Task | Người | Output |
|------|------|-------|--------|
| T2 9/11 | `YieldVault.sol` (ERC-4626) + `MockYieldSource.sol` | Dev 1 | Yield mock hoạt động |
| T2 9/11 | Yield display component, deposit-to-vault flow | Dev 2 | UI hiển thị lãi |
| T3 10/11 | `GovernanceModule.sol` — Milestone mode | Dev 1 | Milestone create, complete, disburse |
| T3 10/11 | Milestone UI + proof upload (ảnh → hash) | Dev 2 | IPFS upload + hash |
| T4 11/11 | `GovernanceModule.sol` — Stream mode | Dev 1 | Per-second streaming |
| T4 11/11 | Stream visualization (ticking amount) | Dev 2 | Real-time counter |
| T5 12/11 | Test suite cho tất cả governance modes | Dev 1 | >90% coverage trên money paths |
| T5 12/11 | FundTimeline component (lịch sử giao dịch) | Dev 2 | Timeline view |
| T6-CN | Polish, fix bugs, review | Both | Stable V1 |

**Tuần 2 deliverable:** 4 governance modes hoạt động. Yield vault tích luỹ lãi. Timeline hiển thị mọi giao dịch.

### 📅 Tuần 3 (16–22/11): L1 + ICM + x402

| Ngày | Task | Người | Output |
|------|------|-------|--------|
| T2 16/11 | Avalanche CLI: tạo Activity L1, deploy local | Dev 1 | L1 chạy local |
| T2 16/11 | `ActivityLog.sol` + `ProofRegistry.sol` trên L1 | Dev 1 | Contracts deploy trên L1 |
| T2 16/11 | x402 facilitator server setup | Dev 2 | `/verify` + `/settle` endpoints |
| T3 17/11 | ICM/Teleporter: `FundMessenger.sol` + `FundReceiver.sol` | Dev 1 | Cross-chain message working |
| T3 17/11 | AI Auditor agent: Glacier API query + LLM formatting | Dev 2 | Agent trả lời câu hỏi |
| T4 18/11 | Hook CommunityFund events → ICM → ActivityLog | Dev 1 | Events sync cross-chain |
| T4 18/11 | AuditChat UI component + x402 payment flow | Dev 2 | `/audit` page |
| T5 19/11 | Deploy L1 lên Fuji | Dev 1 | L1 live trên Fuji |
| T5 19/11 | End-to-end test: Fund event → ICM → L1 log → AI query | Both | Full pipeline |
| T6-CN | Integration testing, bug fixes | Both | Stable V2 |

**Tuần 3 deliverable:** Custom L1 hoạt động trên Fuji. ICM sync events. AI Auditor trả lời qua x402.

### 📅 Tuần 4 (23–25/11): Polish + Submit

> ⚠️ **Deadline: 05:59 ngày 25/11/2026**

| Ngày | Task | Người | Output |
|------|------|-------|--------|
| T2 23/11 | UI polish: responsive, animations, error handling | Dev 2 | Production-ready UI |
| T2 23/11 | Final test suite, edge cases | Dev 1 | All tests pass |
| T3 24/11 | Quay video demo (2-3 phút) | Both | Video file |
| T3 24/11 | Pitch deck (Canva/Google Slides) | Both | Slide deck |
| T3 24/11 | README.md — setup instructions, architecture diagram | Dev 1 | Complete README |
| T3 24/11 | Submit trên team1vn.xyz | Both | ✅ Submitted |

---

## 7. Testing Strategy

### 7.1 Test cases bắt buộc (money paths)

```
FundFactory Tests:
├── ✅ Should create fund with correct parameters
├── ✅ Should emit FundCreated event
├── ✅ Should register fund in registry
└── ✅ Should reject invalid parameters (0 members, 0 amount)

CommunityFund Tests:
├── Deposit:
│   ├── ✅ Member can deposit USDC
│   ├── ✅ Non-member cannot deposit
│   ├── ✅ Balance updates correctly
│   └── ✅ Deposit event emitted
├── Proposal (Simple mode):
│   ├── ✅ Member can create proposal
│   ├── ✅ Admin can execute proposal
│   ├── ✅ Non-admin cannot execute
│   ├── ✅ Cannot execute if insufficient balance
│   ├── ✅ USDC transferred to recipient on execute
│   └── ✅ Cannot double-execute
├── Proposal (Vote mode):
│   ├── ✅ Member can vote
│   ├── ✅ Cannot vote twice
│   ├── ✅ Non-member cannot vote
│   ├── ✅ Proposal approved when threshold met
│   ├── ✅ Proposal rejected when threshold not met
│   ├── ✅ Cannot execute un-approved proposal
│   └── ✅ USDC transferred on approved execute
├── Yield:
│   ├── ✅ Idle USDC deposited to vault
│   ├── ✅ Yield accumulates
│   ├── ✅ Can withdraw from vault for disbursement
│   └── ✅ Yield belongs to fund, not individuals
└── Edge cases:
    ├── ✅ Cannot withdraw more than balance
    ├── ✅ Cannot create proposal for 0 amount
    └── ✅ Reentrancy protection on execute
```

### 7.2 Chạy test

```bash
# Foundry
forge test -vvv

# Coverage
forge coverage

# Gas report
forge test --gas-report
```

---

## 8. Kịch bản Demo (2-3 phút)

```
[0:00-0:15] HOOK
"Sau bão Yagi, Việt Nam cần 12.000 trang sao kê để kiểm tra 
tiền từ thiện. Nhưng đó chỉ là tiền VÀO. Tiền RA vẫn là hộp đen.
MiQũy tự động hoá 'Check VAR' cho MỌI quỹ cộng đồng."

[0:15-0:45] TẠO QUỸ
- Mở app, connect wallet (embedded wallet, không cần MetaMask)
- Tạo "Quỹ Lớp 12A3", mode Vote, 5 thành viên, 50k VND/tháng
- Show: contract deployed trên Fuji C-Chain

[0:45-1:15] ĐÓNG TIỀN + DASHBOARD  
- 3 thành viên deposit USDC vào quỹ
- Dashboard real-time: ai đã đóng, tổng balance, yield tích luỹ
- Timeline: mọi giao dịch with transaction hashes

[1:15-1:45] ĐỀ XUẤT + VOTE + CHI TIÊU
- Thành viên A đề xuất: "Mua bánh kẹo liên hoan: 200 USDC"
- Upload ảnh hoá đơn → hash lưu on-chain
- 3/5 thành viên vote đồng ý → tiền tự động chuyển cho recipient
- Show: transaction trên Snowtrace

[1:45-2:15] AI AUDITOR (x402)
- Mở chat: "Quỹ lớp tháng này chi bao nhiêu?"  
- x402 payment: 0.01 USDC micropayment
- AI trả lời: "Tổng chi: 200 USDC cho 'Mua bánh kẹo'. 
  Tx: 0xabc... Còn lại: 800 USDC (gồm 2.5 USDC yield)."

[2:15-2:45] CROSS-CHAIN (ICM)
- Show Activity L1: mọi hoạt động được log trên custom L1
- Show ICM message: vote event từ L1 → trigger trên C-Chain
- "Tách finance (C-Chain) và activity (L1) — chỉ Avalanche làm được"

[2:45-3:00] CLOSE
"Quỹ lớp hôm nay. Quỹ chung cư ngày mai. 
Quỹ cứu trợ quốc gia trong tương lai.
MiQũy — minh bạch mọi đồng tiền cộng đồng."
```

---

## 9. Pitch Outline (Slide Deck)

| Slide # | Nội dung | Thời gian |
|---------|---------|----------|
| 1 | **Hook:** "12.000 trang sao kê. Và tiền RA vẫn là hộp đen." | 15s |
| 2 | **Problem:** Quỹ cộng đồng VN — ai giữ tiền? Check VAR, vỡ hụi, quỹ chung cư | 30s |
| 3 | **Solution:** MiQũy = smart contract thay thế "người giữ tiền" | 20s |
| 4 | **Demo:** Live demo flow (xem kịch bản trên) | 2-3 min |
| 5 | **Architecture:** C-Chain + L1 + ICM + x402 diagram | 20s |
| 6 | **Why on-chain?** Bản chất vấn đề là niềm tin → blockchain = trust layer | 15s |
| 7 | **Why Avalanche?** Custom L1, ICM native, sub-second finality, phí < $0.001 | 15s |
| 8 | **Revenue model:** 0.3% protocol fee + yield share + x402 auditor | 15s |
| 9 | **Legal compliance:** Không phải legal tender, USDC testnet, no financial advice | 10s |
| 10 | **Roadmap:** Quỹ lớp → Chung cư → Cứu trợ → DAO treasury | 15s |
| 11 | **Team + Call to action** | 10s |

---

## 10. Cài đặt & Setup

### 10.1 Prerequisites

```bash
# 1. Node.js >= 18
node --version

# 2. Foundry (Forge, Cast, Anvil)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 3. Avalanche CLI
# macOS/Linux:
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
# Windows: Tải từ https://github.com/ava-labs/avalanche-cli/releases

# 4. Git
git --version
```

### 10.2 Project Init

```bash
# 1. Tạo Foundry project
mkdir -p miquy/contracts && cd miquy/contracts
forge init --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# 2. Tạo Next.js app
cd .. && npx create-next-app@latest app \
  --typescript --tailwind --app --src-dir --eslint

# 3. Tạo auditor server
mkdir -p auditor && cd auditor
npm init -y
npm install express viem dotenv openai

# 4. Wallet testing
# Tạo wallet test trên Fuji
cast wallet new

# 5. Faucet: Lấy AVAX testnet
# https://core.app/tools/testnet-faucet
# Hoặc: https://team1vn.xyz/faucet.html
```

### 10.3 Environment Variables

```bash
# contracts/.env
PRIVATE_KEY=0x...
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
ETHERSCAN_API_KEY=...

# app/.env.local
NEXT_PUBLIC_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_FUND_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# auditor/.env
OPENAI_API_KEY=sk-...
GLACIER_API_KEY=...
X402_FACILITATOR_URL=...
PRIVATE_KEY=0x...
```

---

## 11. Submission Checklist

- [ ] GitHub repo: public hoặc private + invite `tuantqse90`
- [ ] Smart contracts deployed trên Fuji
- [ ] Custom L1 deployed trên Fuji
- [ ] Frontend hosted (Vercel recommended)
- [ ] Video demo (2-3 phút)
- [ ] Pitch deck (Canva/Google Slides link)
- [ ] README với:
  - [ ] Architecture diagram
  - [ ] Setup instructions
  - [ ] Contract addresses
  - [ ] Team members
- [ ] Submit trên team1vn.xyz trước 05:59 ngày 25/11/2026

---

> [!TIP]
> **Ưu tiên nếu thiếu thời gian:**
> 1. 🔴 **Bắt buộc:** FundFactory + CommunityFund (Simple + Vote) + Frontend dashboard + Deploy Fuji
> 2. 🟡 **Nên có:** YieldVault + AI Auditor (x402) + Video demo
> 3. 🟢 **Bonus:** Custom L1 + ICM + Milestone/Stream modes
>
> Nếu chỉ có 2 tuần, tập trung vào nhóm 🔴 + video. Nhóm 🟡 và 🟢 cho điểm cao hơn nhưng không bắt buộc để submit.
