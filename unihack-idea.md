# 🎯 UniHack 2026 — Đề xuất ý tưởng dự án

## Phương pháp: Tôi đã đi tìm ý tưởng như thế nào

Trước khi đọc ý tưởng, bạn cần hiểu tôi đã **loại trừ** những gì và **tại sao**.

### Bước 1: Hiểu cuộc thi muốn gì

Từ file `topics.json` chính thức, cuộc thi có **20 topic gợi ý** chia 4 track:

| Track | Số topic | Nhắm tới |
|-------|---------|----------|
| **A. Social Finance** | 9 topic (Hụi, Split-bill, Commitment Stake, Allowance, Charity, QF, Savings, Payroll, Tickets) | Team mới, Solidity cơ bản, góc nhìn địa phương |
| **B. Game on L1** | 2 topic (YieldGO, DeFi Farm) | Frontend mạnh + custom L1 + ICM |
| **C. AI Agents & Security** | 4 topic (Treasury Guardrails, DeFi Copilot, Tx Guardian, PayrollFloat) | Có kinh nghiệm agent + tool calling |
| **D. Agent Economy on x402** | 5 topic (StockAgent, x402 Rails, ActorBazaar, TalkMeter, AskPay) | Backend/Infra, câu chuyện agent economy |

**Tiêu chí chấm (100 điểm):**
- Technical Implementation: **25 điểm**
- Avalanche Integration: **25 điểm** ← Đây là yếu tố quyết định. Phải dùng sâu, không phải "deploy lên C-Chain rồi xong"
- Creativity & Innovation: **15 điểm**
- Impact & Use Case: **15 điểm**
- Presentation & Pitching: **10 điểm**
- UI/UX & Demo: **10 điểm**

**3 câu hỏi bắt buộc phải trả lời trong pitch:**
1. *Tại sao phải on-chain?*
2. *Tại sao phải Avalanche?*
3. *Tiền / yield đến từ đâu?*

### Bước 2: Hiểu nỗi đau thực tế Việt Nam

Nghiên cứu chuyên sâu cho ra 7 nhóm vấn đề lớn:

| # | Vấn đề | Mức độ đau | Đã có topic chưa? |
|---|--------|-----------|-------------------|
| 1 | Tín dụng đen sinh viên, app vay nóng | 🔴🔴🔴 | ❌ Chưa |
| 2 | Freelancer mất 7-10% phí, bị đóng băng tài khoản | 🔴🔴 | ⚠️ Topic 8 đã cover một phần (streaming payroll) |
| 3 | Văn bằng giả quy mô công nghiệp | 🔴🔴 | ❌ Chưa |
| 4 | Gian lận mã số vùng trồng nông sản xuất khẩu | 🔴🔴🔴 | ❌ Chưa |
| 5 | Tạm ứng viện phí + trục lợi BHYT | 🔴🔴 | ❌ Chưa |
| 6 | Lừa đảo sinh trắc học + deepfake eKYC | 🔴🔴 | ❌ Chưa |
| 7a | Vỡ hụi trăm tỷ | 🔴🔴🔴 | ✅ Topic 1 đã cover |
| 7b | "Check VAR" từ thiện — tiền RA vẫn là hộp đen | 🔴🔴🔴 | ⚠️ Topic 5 cover tiền VÀO, nhưng KHÔNG cover tiền RA |

### Bước 3: Tìm giao điểm "nỗi đau chưa được giải" × "khoảng trống kỹ thuật Avalanche"

Khoảng trống kỹ thuật mà KHÔNG topic nào khai thác đầy đủ:
1. Không topic nào **kết hợp cả L1 + ICM + x402** cho bài toán Social Finance
2. Không topic nào dùng **ZK attestation** cho danh tính/uy tín
3. Không topic nào giải quyết bài toán **quản lý quỹ cộng đồng tổng quát** (Topic 1 = hụi, Topic 5 = từ thiện — nhưng quỹ lớp, quỹ chung cư, quỹ hội nhóm thì sao?)

### Bước 4: Loại bỏ

| Ý tưởng | Lý do loại |
|---------|-----------|
| Hụi on-chain | ❌ Đã là Topic 1 |
| Streaming payroll | ❌ Đã là Topic 8 |
| Charity transparency | ⚠️ Topic 5 đã cover — cần góc nhìn hoàn toàn khác |
| Bảo hiểm nông nghiệp | ❌ Cần dữ liệu oracle thực, không demo được trên testnet |
| Đấu giá năng lượng | ❌ Quá lớn, cần partnership với EVN |
| Game giáo dục tài chính | ❌ Topic 10 & 11 đã cover game + DeFi rất tốt |
| ZK danh tính sinh viên | ⚠️ Hay nhưng ZK quá phức tạp cho 30 ngày |

---

## 💡 Ý TƯỞNG: **"MiQũy" — Giao thức quỹ cộng đồng lập trình được**

> **Một dòng:** Smart contract thay thế "người giữ tiền" trong mọi loại quỹ cộng đồng Việt Nam — từ quỹ lớp, quỹ chung cư, quỹ nhóm bạn, đến quỹ cứu trợ thiên tai — với mọi giao dịch minh bạch theo thời gian thực và AI kiểm toán qua x402.

### Tại sao ý tưởng này đặc biệt?

**Nó KHÔNG phải Hụi (Topic 1).** Hụi là cơ chế **tiết kiệm xoay vòng** cụ thể — mỗi vòng một người nhận. MiQũy là **quỹ chung mục đích tổng quát** — ai cũng đóng, tiền ra theo quy tắc do nhóm thống nhất.

**Nó KHÔNG phải Transparent Charity (Topic 5).** Topic 5 là công cụ cho **tổ chức từ thiện** với multisig board. MiQũy là giao thức cho **bất kỳ nhóm người nào** muốn gom tiền và chi tiêu minh bạch — từ 5 bạn cùng phòng trọ đến 500 hộ dân trong chung cư.

**Nó nằm ở giao điểm chưa ai khai thác:**

```
     Topic 1 (Hụi)           Topic 5 (Charity)
     ┌──────────┐            ┌──────────┐
     │ Tiết kiệm│            │ Tổ chức  │
     │ xoay vòng│            │ từ thiện │
     │ cố định  │            │ multisig │
     └──────────┘            └──────────┘
           │                       │
           └───────┐   ┌──────────┘
                   ▼   ▼
              ┌──────────────┐
              │   MiQũy      │
              │ Quỹ cộng đồng│
              │ tổng quát    │
              │ + AI auditor │
              │ + Custom L1  │
              └──────────────┘
                   ▲
                   │
     Khoảng trống: Không topic nào cover
```

---

### Nỗi đau: "Ai đang giữ tiền của chúng ta?"

Trong xã hội Việt Nam, **gom tiền chung** xảy ra ở khắp nơi:

| Loại quỹ | Ai tham gia | Nỗi đau cụ thể |
|----------|------------|----------------|
| **Quỹ lớp** | Mọi học sinh/sinh viên VN | Lớp trưởng thu 50k/tháng × 40 người. Cuối năm "tiền đâu hết rồi?" Không ai biết. |
| **Quỹ chung cư** | ~10 triệu cư dân chung cư | Phí dịch vụ hàng tháng, ban quản trị chi tiêu mờ ám. Hàng loạt vụ kiện ở Hà Nội, TP.HCM. |
| **Quỹ nhóm bạn** | Bất kỳ nhóm nào đi chơi, đi du lịch | Một người giữ tiền, cuối cùng "hết tiền rồi" nhưng không có sổ sách. |
| **Quỹ cứu trợ** | Toàn xã hội (sau bão Yagi 2024) | 12.000 trang sao kê chỉ giải quyết phần tiền VÀO. Tiền RA vẫn là hộp đen. |
| **Quỹ hội đồng hương** | Cộng đồng người xa quê | Đóng góp hàng năm, chi tiêu không rõ ràng, gây mâu thuẫn nội bộ. |
| **Quỹ phường/xã** | Cộng đồng dân cư | Thu đóng góp, chi tiêu thiếu giám sát. |

**Điểm chung:** Một người giữ tiền → mọi người khác phải **tin tưởng mù quáng** → khi niềm tin vỡ, mối quan hệ vỡ theo.

**Quy mô vấn đề:** Gần như **100% người Việt Nam** đang hoặc đã từng tham gia ít nhất một loại quỹ cộng đồng. Đây không phải bài toán của một nhóm nhỏ — nó ảnh hưởng đến toàn xã hội.

---

### Giải pháp: Smart contract IS "người giữ tiền"

MiQũy thay thế vai trò "người giữ tiền" bằng smart contract với quy tắc lập trình được:

**1. Tiền VÀO — minh bạch tuyệt đối**
- Mỗi người chuyển USDC vào smart contract
- Mọi khoản đóng góp ghi nhận on-chain, không thể chỉnh sửa
- Dashboard real-time: ai đã đóng, ai chưa, tổng quỹ bao nhiêu

**2. Tiền RA — theo quy tắc, không theo ý một người**
- Khi tạo quỹ, nhóm chọn **governance mode:**

| Mode | Cách hoạt động | Phù hợp cho |
|------|---------------|-------------|
| **Simple** | Một admin duyệt, nhưng mọi chi tiêu công khai | Quỹ lớp nhỏ, nhóm bạn |
| **Vote** | Chi tiêu cần >50% thành viên đồng ý | Quỹ chung cư, hội nhóm |
| **Milestone** | Tiền giải ngân tự động khi đạt mốc + bằng chứng | Quỹ cứu trợ, dự án |
| **Stream** | Tiền nhỏ giọt theo thời gian (weekly/monthly) | Quỹ vận hành, lương nhân viên hội |

**3. Bằng chứng chi tiêu — hash on-chain**
- Mỗi khoản chi kèm ảnh hoá đơn/biên lai → hash lưu on-chain
- Không thể xoá, không thể sửa, mọi người verify được

**4. AI Auditor qua x402 — "Check VAR" tự động**
- Bất kỳ ai cũng có thể hỏi: *"Quỹ chung cư 12B tháng này chi bao nhiêu cho điện?"*
- Trả phí micropayment qua x402 (0.01 USDC/câu hỏi)
- AI đọc dữ liệu on-chain qua Glacier API → trả lời chính xác, có dẫn nguồn giao dịch
- **LLM KHÔNG quyết định tiền** — chỉ đọc và báo cáo (đúng quy tắc hackathon)

**5. Tiền nhàn rỗi sinh lời**
- USDC chưa giải ngân tự động đưa vào yield vault (ERC-4626, Benqi/Aave mock trên testnet)
- Lãi sinh ra thuộc về quỹ → quỹ lớn hơn theo thời gian

---

### Kiến trúc kỹ thuật — Tại sao phải Avalanche?

```
┌─────────────────────────────────────────────────────────┐
│                    NGƯỜI DÙNG                           │
│  Đóng tiền · Đề xuất chi · Vote · Xem dashboard        │
│  Hỏi AI auditor                                        │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐    ┌─────────────────────┐
│   C-CHAIN (Fuji)     │    │   ACTIVITY L1       │
│                      │    │   (Custom Subnet)   │
│ • FundFactory        │◄──►│                     │
│ • CommunityFund      │ ICM│ • ActivityLog       │
│ • GovernanceModule   │Tele│ • ProofRegistry     │
│ • YieldVault (4626)  │port│ • MemberActions     │
│ • USDC settlements   │ er │ • VoteRecords       │
│                      │    │                     │
│ [Tiền ở đây]         │    │ [Hoạt động ở đây]   │
└──────────┬───────────┘    └─────────────────────┘
           │
           ▼
┌──────────────────────┐    ┌─────────────────────┐
│   x402 AI AUDITOR    │    │   GLACIER API       │
│                      │    │                     │
│ • HTTP 402 paywall   │◄───│ • Index fund data   │
│ • Query fund state   │    │ • Transaction history│
│ • Generate reports   │    │ • Balance tracking  │
│ • Policy contract    │    │                     │
│   (read-only, no $)  │    │                     │
└──────────────────────┘    └─────────────────────┘
```

**Tại sao kiến trúc này đạt điểm Avalanche Integration cao (25 điểm):**

| Thành phần Avalanche | Vai trò trong MiQũy | Tại sao PHẢI là Avalanche |
|----------------------|---------------------|--------------------------|
| **C-Chain** | Lớp tài chính — giữ USDC, yield vault, governance | EVM-compatible, native USDC, DeFi protocols (Benqi/Aave) để yield |
| **Custom L1 (Subnet)** | Lớp hoạt động — log mọi action, vote, proof hash | Phí gần 0, throughput cao — ghi hàng ngàn hoạt động/ngày mà không tốn gas trên C-Chain. Đây là điều chỉ Avalanche làm được (custom L1 triển khai dễ với Avalanche CLI, phí giảm 99.9% sau ACP-77) |
| **ICM / Teleporter** | Đồng bộ giữa L1 hoạt động và C-Chain tài chính | Vote trên L1 → trigger giải ngân trên C-Chain. Proof submission trên L1 → unlock milestone trên C-Chain. Cross-chain messaging native, không cần bridge bên thứ ba |
| **x402** | AI Auditor micropayment | Trả phí theo câu hỏi (0.01 USDC), không cần subscription. Chỉ Avalanche có phí đủ thấp cho micropayment 0.01 USDC |
| **Glacier API** | Dashboard transparency | Index toàn bộ giao dịch quỹ, cung cấp dữ liệu cho AI Auditor |

> **Không chain nào khác** cho phép bạn deploy custom L1 riêng với Avalanche CLI trong 10 phút, kết nối native ICM với C-Chain, và settle x402 micropayment với phí < $0.001. Ethereum L2 không có custom chain nhanh như vậy. Solana không có L1 sovereign. Đây là câu trả lời cho "Why Avalanche?"

---

### Trả lời 3 câu hỏi bắt buộc

**1. Tại sao phải on-chain?**

Bởi vì **bản chất của vấn đề là niềm tin.** Khi 40 người đóng tiền cho 1 người giữ, họ đang tin tưởng mù quáng. Blockchain thay thế niềm tin bằng verification — mọi giao dịch minh bạch, quy tắc chi tiêu enforce bằng code, không ai có thể chỉnh sửa lịch sử. Đây không phải "dùng blockchain vì trendy" — đây là use case mà blockchain sinh ra để giải quyết.

**2. Tại sao phải Avalanche?**

- **Custom L1**: Quỹ chung cư với 500 hộ dân tạo hàng ngàn giao dịch nhỏ (vote, log hoạt động). Trên Ethereum mainnet, phí sẽ ngốn hết quỹ. Trên custom L1 Avalanche, phí gần 0.
- **ICM/Teleporter**: Tách lớp hoạt động (L1) và lớp tài chính (C-Chain) một cách native, không cần bridge bên thứ ba có rủi ro hack.
- **Sub-second finality (~1s)**: Vote đồng ý chi tiêu → tiền giải ngân ngay lập tức. Không phải đợi 12 giây như Ethereum.
- **Native USDC + DeFi (Benqi/Aave)**: Yield thực từ lending protocol, không phải token mới in ra.

**3. Tiền / yield đến từ đâu?**

| Nguồn | Cơ chế | Bền vững? |
|-------|--------|----------|
| **Yield từ lending** | USDC nhàn rỗi → Benqi/Aave → lãi 3-5% APY | ✅ Có thật, từ lending spreads |
| **Protocol fee** | 0.3% trên mỗi khoản giải ngân | ✅ Phí dịch vụ, không phải token inflation |
| **x402 revenue** | 0.01 USDC/query cho AI Auditor | ✅ Pay-per-use, bền vững |

---

### MVP — Làm gì trong 30 ngày?

#### Tuần 1-2: Core Smart Contracts
```
📁 contracts/
├── FundFactory.sol        — Tạo quỹ mới với tham số tuỳ chỉnh
├── CommunityFund.sol      — Logic quỹ: deposit, propose, vote, disburse
├── GovernanceModule.sol   — 4 governance modes (Simple/Vote/Milestone/Stream)
├── YieldVault.sol         — ERC-4626 wrapper cho yield (mock trên Fuji)
└── tests/                 — Test mọi money path (bắt buộc theo rules)
```

#### Tuần 2-3: Custom L1 + ICM
```
📁 l1/
├── ActivityLog.sol        — Ghi nhận mọi hoạt động quỹ
├── ProofRegistry.sol      — Lưu hash ảnh hoá đơn/biên lai
└── icm/
    ├── VoteBridge.sol      — Vote trên L1 → trigger disburse trên C-Chain
    └── ProofBridge.sol     — Proof trên L1 → unlock milestone trên C-Chain
```

#### Tuần 3-4: Frontend + x402 AI Auditor
```
📁 app/
├── pages/
│   ├── create-fund/       — UI tạo quỹ mới
│   ├── fund/[id]/         — Dashboard quỹ: balance, members, history
│   ├── propose/           — Đề xuất chi tiêu + upload hoá đơn
│   └── audit/             — Chat với AI Auditor
├── x402/
│   ├── facilitator.ts     — x402 settlement trên Fuji
│   └── auditor-agent.ts   — AI query Glacier API, policy contract (read-only)
└── components/
    ├── FundTimeline.tsx    — Timeline mọi giao dịch
    └── VotePanel.tsx       — UI vote đồng ý/từ chối chi tiêu
```

#### Demo Flow (2-3 phút):
1. **Tạo quỹ** "Quỹ Lớp 12A3" — mode Vote, 10 thành viên, 50.000 VND/tháng
2. **Đóng tiền** — 5 thành viên chuyển USDC vào smart contract
3. **Đề xuất chi** — "Mua bánh kẹo liên hoan: 500.000 VND" kèm ảnh hoá đơn
4. **Vote** — 4/5 thành viên đồng ý → tiền tự động chuyển
5. **AI Auditor** — Hỏi "Quỹ lớp tháng này chi bao nhiêu?" → AI trả lời chính xác với link giao dịch
6. **Yield** — Tiền chưa chi trong vault → hiển thị lãi tích luỹ

---

### Tại sao ý tưởng này sẽ thắng?

| Tiêu chí | Điểm tối đa | MiQũy đạt vì... |
|----------|-------------|-----------------|
| Technical (25) | 25 | Smart contracts với test suite, nhiều module, governance logic |
| Avalanche Integration (25) | 25 | Dùng 5/5 thành phần: C-Chain + Custom L1 + ICM + x402 + Glacier. **Không topic nào trong 20 topic gợi ý kết hợp nhiều như vậy cho bài toán Social Finance** |
| Creativity (15) | 15 | Không trùng với bất kỳ topic nào. Là giao thức TỔNG QUÁT, không phải tool cho một use case |
| Impact (15) | 15 | ~100% người Việt tham gia ít nhất 1 loại quỹ cộng đồng. Bài toán "Check VAR" cộng hưởng cảm xúc cực mạnh |
| Presentation (10) | 10 | Câu chuyện rõ ràng: "Sau 12.000 trang sao kê, chúng tôi tự động hoá Check VAR cho MỌI quỹ" |
| UI/UX (10) | 10 | Dashboard trực quan, vote UI, chat AI — demo rất visual |

### Khác biệt so với Topic 1 (Hụi) và Topic 5 (Charity):

| | Topic 1: Hụi | Topic 5: Charity | **MiQũy** |
|--|-------------|-----------------|-----------|
| **Mục đích** | Tiết kiệm xoay vòng | Quyên góp từ thiện | **Bất kỳ mục đích gom tiền chung nào** |
| **Cơ chế** | Mỗi vòng 1 người nhận pot | Multisig board duyệt milestone | **4 governance modes tuỳ chỉnh** |
| **Đối tượng** | Nhóm chơi hụi | Tổ chức charity | **Mọi nhóm người: lớp học, chung cư, bạn bè, cứu trợ** |
| **AI** | Không | Không | **x402 AI Auditor** |
| **L1** | Không | Optional (bonus) | **Required — tách activity/finance** |
| **ICM** | Không | Không | **Required — bridge L1↔C-Chain** |
| **x402** | Không | Không | **Required — AI micropayment** |
| **Difficulty** | 2/5 | 3/5 | **4/5 — đủ phức tạp để gây ấn tượng** |

---

### Mở rộng sau hackathon (vì sao "vấn đề nhỏ" nhưng "ứng dụng rộng rãi")

Giai đoạn 1 (hackathon): Quỹ lớp, quỹ nhóm bạn
↓
Giai đoạn 2: Quỹ chung cư (10 triệu cư dân tiềm năng tại VN)
↓
Giai đoạn 3: Quỹ cứu trợ thiên tai (bài toán "Check VAR" quốc gia)
↓
Giai đoạn 4: Ngân sách cộng đồng (phường/xã, hội đồng hương)
↓
Giai đoạn 5: DAO treasury management (quốc tế)

**Cùng một giao thức, cùng một smart contract, mở rộng từ 5 bạn cùng lớp đến hàng triệu người.**

---

### Stack kỹ thuật cụ thể

| Layer | Công nghệ | Ghi chú |
|-------|----------|---------|
| Smart contracts | Solidity + Foundry | Test bắt buộc trên mọi money path |
| Chain | Fuji C-Chain + Custom L1 (Avalanche CLI) | L1 cho activity log, C-Chain cho finance |
| Cross-chain | ICM / Teleporter | Vote trên L1 → disburse trên C-Chain |
| Frontend | Next.js, viem, wagmi | Mobile-first |
| Wallet | Embedded wallet (Privy/Web3Auth) | UX cho người không biết crypto |
| x402 | x402 SDK + custom facilitator | AI Auditor micropayment |
| AI | LLM API + Glacier API | Read-only, policy contract, không quyết định tiền |
| Data | Glacier API | Index giao dịch quỹ |
| Yield | ERC-4626 + mock Benqi/Aave | Mock trên Fuji, thật trên mainnet |

---

### Tên gọi

**MiQũy** (phát âm: "mi-kwee")
- **Mi** = micro / minh bạch (transparent)
- **Qũy** = quỹ (fund)
- Ngắn gọn, dễ nhớ, thuần Việt nhưng không khó đọc cho judge quốc tế

Tên thay thế nếu không thích: **QuỹMở** (OpenFund), **SổQuỹ** (FundLedger), **TrustFund**

---

> [!IMPORTANT]
> **Tóm lại:** MiQũy không phải "một ý tưởng blockchain nữa." Nó giải quyết bài toán mà 100% người Việt đều gặp — "ai đang giữ tiền của chúng ta và họ chi tiêu thế nào?" — bằng cách biến smart contract thành "người giữ tiền" không thể gian lận. Nó đủ nhỏ để build MVP trong 30 ngày (quỹ lớp), nhưng đủ lớn để scale thành hạ tầng quản lý quỹ cộng đồng cho cả quốc gia.
