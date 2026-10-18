# 📋 TRUSTPACT (UYTINNET) — MASTER BLUEPRINT
### *Giao Thức Ký Quỹ Bảo Vệ 3 Bên, Tín Nhiệm On-Chain & Phân Xử Minh Bạch trên Avalanche*
*(The Universal 3-Party Verifiable Protective Escrow & Dispute Resolution Protocol)*

> **Mục tiêu:** Xây dựng MVP nộp bài thi Avalanche Team1 Vietnam UniHack 2026 (2–30/11/2026).  
> **Track đăng ký:** **Track A: Social Finance (Custom Topic / My Own Idea)**.  
> **Triết lý cốt lõi:**  
> **"Thuận theo tự nhiên — Việc của nền tảng là lo toàn bộ logic bảo vệ 3 bên. Người dùng giao dịch bất cứ thứ gì là quyền của họ, TrustPact đứng ở vai trò hạ tầng bảo vệ dòng tiền, thực thi đúng cam kết và xử lý khiếu nại minh bạch bằng Smart Contract."**

---

## PHẦN I: SẢN PHẨM MVP SẼ XÂY DỰNG — TỔNG QUAN

MVP tập trung vào **3 trụ cột** hoàn chỉnh:

```
                        SẢN PHẨM TRUSTPACT MVP
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
  [ TRỤ CỘT 1 ]           [ TRỤ CỘT 2 ]           [ TRỤ CỘT 3 ]
 CHECK SCAM RADAR       PHÒNG GIAO DỊCH 3 BÊN     CỌC GDTG SINH LỜI
 & TÍN NHIỆM SBT       (Buyer - GDTG - Seller)   (Aave V3 Real Yield)
                                                          
 • Tra SĐT/STK/Telegram  • Két sắt khóa tiền       • Cọc GDTG gửi Aave V3
   (Gas 0đ Custom L1)    • GDTG bấm [Giải ngân] 0.8s• Lãi 4-6%/năm thực tế
 • Cộng đồng tố cáo        (hoặc Buyer xác nhận)    • GDTG hưởng 80% lãi
 • API x402 thu phí      • GDTG bấm [Hoàn tiền] 100%• Nền tảng thu 20% lãi
   0.01 USDC/lượt        • Auto-refund khi quá hạn  • Không in token lạm phát
 • Trust Passport SBT    • Tố cáo GDTG → chém cọc
   (Số đơn, %, cọc)      • GDTG hòa giải chia tiền
```

### 1. PHASE 1: MVP NỘP BÀI THI UNIHACK 2026 (XÂY DỰNG NGAY & ĐEM ĐI THI)
Tập trung 100% tài nguyên hoàn thiện trọn vẹn 3 trụ cột và các hạng mục sau:

| # | Hạng mục | Cụ thể chi tiết | Nơi triển khai |
|---|---|---|---|
| 1 | `StakedBrokerRegistry.sol` | Quản lý cọc bảo hiểm GDTG, Quota hạn mức, Slashing, **tích hợp Aave V3 sinh lời thực tế trên cọc** | Avalanche Fuji C-Chain |
| 2 | `UniversalEscrow.sol` | Két sắt 3 bên, GDTG giải ngân 0.8s, GDTG hoàn tiền, Auto-refund quá hạn, Hòa giải chia tiền, Slashing GDTG | Avalanche Fuji C-Chain |
| 3 | `TrustPassportSBT.sol` | Hộ chiếu tín nhiệm Soulbound on-chain (Số đơn hoàn tất, % thành công, cọc bảo hiểm đang khóa) | Avalanche Fuji C-Chain |
| 4 | `ScamRegistryL1.sol` | Sổ đen cộng đồng tố cáo & tra cứu lừa đảo (SĐT, STK ngân hàng, Telegram handle) — **Gas 0đ miễn phí 100%** | Custom L1 Subnet |
| 5 | Cổng API x402 Service | Micro-payment service thu phí vi mô 0.01 USDC/lượt cho Bot Telegram tra cứu tự động | Backend Service |
| 6 | Trang chủ `/` | Giao diện tra cứu Check Scam Radar + Tra cứu điểm tín nhiệm Trust Passport SBT | Next.js 14 Web App |
| 7 | Trang tạo kèo `/pact/create` | Giao diện tạo giao dịch mới: nhập thỏa thuận, chọn GDTG có Tick Xanh, đặt mức phí hoa hồng | Next.js 14 Web App |
| 8 | Phòng giao dịch `/pact/[id]` | Phòng chat 3 bên: QR nạp cọc két sắt, giao nhận, nút [Giải ngân] / [Hoàn tiền] cho GDTG & nút Tố cáo | Next.js 14 Web App |
| 9 | Trang GDTG `/broker/stake` | Bảng điều khiển GDTG: Nạp/rút cọc bảo hiểm, theo dõi hạn mức Quota, xem lãi Aave V3 nhảy theo giây | Next.js 14 Web App |
| 10 | Tòa án Sàn `/admin/disputes` | Giao diện Multisig Admin: Kiểm tra log chat, đối soát bằng chứng gian lận, kích hoạt chém cọc đền bù | Next.js 14 Web App |

---

### 2. PHASE 2: ROADMAP MỞ RỘNG (CHỈ TRÌNH BÀY TRÊN SLIDE PITCH, KHÔNG CODE TRONG MVP)
Giữ vai trò định hướng mở rộng hệ sinh thái khi bảo vệ trước ban giám khảo:

* **Đấu Thầu Cọc Minh Bạch (`AuctionEscrow`):** 
  - Giải quyết bài toán Cung < Cầu (tranh mua tài sản hiếm) hoặc đấu thầu ngược (thuê outsource dev bot/tool). 
  - Đấu giá hạn chót cố định, người thắng tự động bridge cọc sang Escrow 3 bên.
* **Yield Vault cho Kèo Dài Hạn (`YieldVaultAdapter` cho Buyer):**
  - Mở rộng cơ chế gửi lãi Aave cho cả tiền cọc của Buyer đối với các giao dịch mua bán dự án lớn (kỳ hạn ≥ 30 ngày và cọc ≥ 500 USDC).
* **Két Sắt & Sổ Thu Chi Nhóm (`CommunityFund`):**
  - Quản lý quỹ nhóm sinh viên, team dev chia sẻ chi phí server cloud bằng Multi-Approval.

---

## PHẦN II: MA TRẬN LOGIC XỬ LÝ 3 BÊN (BUYER - SELLER - BROKER)

```
                              PHÒNG GIAO DỊCH 3 BÊN
                 ┌──────────────────────────────────────────────┐
                 │  Link duy nhất: trustpact.vn/pact/[id]       │
                 └──────────────────────┬───────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
     [ BÊN MUA ]                 [ BÊN TRUNG GIAN ]            [ BÊN BÁN ]
       (BUYER)                   (STAKED GDTG/BROKER)            (SELLER)
 1. Tra cứu uy tín           1. Nạp cọc bảo hiểm Staked      1. Tạo/Nhận kèo giao dịch
 2. Nạp tiền vào Két sắt        Bond (nhận Tick Xanh)        2. Thống nhất chọn GDTG
 3. Kiểm tra bàn giao        2. Cọc tự sinh lời trên         3. Cam kết thời hạn
 4. Bấm xác nhận nhận hàng      Aave V3 (4-6%/năm)           4. Bàn giao hàng/dịch vụ
    (hoặc GDTG giải ngân)    3. Nhận hạn mức bảo lãnh Quota  5. Nhận tiền sau 0.8 giây
 5. Tự rút tiền nếu quá hạn  4. Làm trọng tài chứng kiến,       khi GDTG/Buyer bấm xong
 6. Nút Tố Cáo GDTG lên Sàn     kiểm tra bàn giao
                             5. Bấm [GIẢI NGÂN] hoặc [HOÀN TIỀN]
```

---

### 1. Chi Tiết Logic: Mỗi Bên Cần Làm Gì?

#### A. Bên Bán (Seller)
1. **Tạo kèo hoặc chấp nhận kèo:** Nhập thông tin giao dịch (Tên hàng/dịch vụ, số tiền, thời hạn bàn giao).
2. **Thống nhất chọn GDTG:** Hai bên cùng chọn 1 GDTG có Tick Xanh bảo chứng trên sàn.
3. **Bàn giao:** Bàn giao tài sản / dịch vụ cho Buyer đúng thỏa thuận, đúng thời hạn.
4. **Nhận tiền:** Khi GDTG bấm **[Giải ngân]** (hoặc Buyer bấm xác nhận), tiền tự động chuyển về ví Seller trong **0.8 giây**.

#### B. Bên Mua (Buyer)
1. **Tra cứu uy tín:** Dùng Check Scam Radar tra cứu SĐT, STK, Telegram handle của Seller và GDTG (Gas 0đ).
2. **Nạp tiền vào Két sắt:** Chuyển USDC vào `UniversalEscrow`. Tiền bị khóa cứng trên blockchain, không ai rút trộm được (kể cả Admin hay GDTG).
3. **Kiểm tra bàn giao:** Kiểm tra hàng/dịch vụ có đúng cam kết không. Có thể tự bấm **"Xác nhận nhận hàng"** để giải ngân ngay.
4. **Rút tiền khi quá hạn:** Nếu Seller không giao hàng + GDTG mất tích → Hết hạn bàn giao, Buyer tự bấm `buyerClaimExpiredRefund` rút 100% tiền về ví ngay lập tức, không bị giam vốn.
5. **Tố cáo GDTG:** Nếu GDTG gian dối / thông đồng với Seller → bấm **"TỐ CÁO GDTG LÊN SÀN"** kèm chứng cứ.

#### C. Bên Trung Gian / GDTG (Broker)
1. **Nạp cọc bảo hiểm:** Nạp USDC vào `StakedBrokerRegistry` → nhận Tick Xanh + hạn mức Quota. Tiền cọc được **tự động gửi vào Aave V3 sinh lời 4-6%/năm** — GDTG hưởng 80% lãi, nền tảng thu 20% lãi.
2. **Làm trọng tài giám sát:** Chứng kiến quá trình bàn giao như họ vẫn làm ngoài đời.
3. **Thực thi nhiệm vụ:**
   - **Giao dịch xong xuôi:** Bấm **[Giải ngân]** (`brokerRelease`) → Tiền về Seller, phí hoa hồng về GDTG trong 0.8 giây. Xong kèo!
   - **Kèo hỏng / Seller bùng:** Bấm **[Hoàn tiền]** (`brokerRefundBuyer`) → hoàn 100% cho Buyer ngay lập tức. Xong kèo!
   - **Hòa giải chia tiền:** Bấm **[Chia tiền]** (`brokerSettle`) theo thỏa thuận 2 bên (ví dụ hàng lỗi bớt 20%).

---

### 2. Khi Hoàn Tất Giao Dịch, Hệ Thống Làm Gì?

Khi giao dịch thành công (GDTG bấm giải ngân hoặc Buyer xác nhận), Smart Contract tự động trong **0.8 giây**:
1. **Giải ngân tiền hàng** cho Seller.
2. **Trả phí GDTG** (do 2 bên thỏa thuận khi tạo kèo, mặc định 1.5%, tối đa 10%).
3. **Thu phí sàn** 0.3% về Treasury.
4. **Giải phóng Quota** cho GDTG tiếp tục nhận kèo mới.
5. **Cập nhật Trust Passport SBT:** +1 đơn thành công cho Seller và GDTG.

---

### 3. Cơ Chế Xử Lý Khi Có Trục Trặc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRƯỜNG HỢP 1 — GDTG HÒA GIẢI CHIA TIỀN:                                     │
│ Hai bên thương lượng (ví dụ hàng lỗi bớt tiền). GDTG bấm brokerSettle       │
│ chia đúng số tiền mỗi bên nhận. Hợp đồng thực thi ngay lập tức.             │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRƯỜNG HỢP 2 — SELLER BÙNG KÈO / HỦY KÈO:                                  │
│ GDTG bấm brokerRefundBuyer → hoàn 100% tiền cho Buyer ngay lập tức.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRƯỜNG HỢP 3 — QUÁ HẠN TỰ ĐỘNG (GDTG + SELLER ĐỀU MẤT TÍCH):               │
│ Buyer tự bấm buyerClaimExpiredRefund → rút 100% tiền cọc về ví.             │
│ Không phụ thuộc bất kỳ ai. Không bị giam vốn vĩnh viễn.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ TRƯỜNG HỢP 4 — GDTG GIAN DỐI / THÔNG ĐỒNG:                                  │
│ Buyer bấm "TỐ CÁO GDTG LÊN SÀN" kèm chứng cứ.                              │
│ Sàn (Multisig) gọi adminSlashCorruptBroker:                                │
│   → Hoàn 100% tiền gốc cho Buyer                                           │
│   → Chém cọc bảo hiểm GDTG trên Aave V3 đền bù nạn nhân                    │
│   → Tước Tick Xanh vĩnh viễn, đưa vào Sổ Đen                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN III: CỌC GDTG SINH LỜI TRÊN AAVE V3 — CƠ CHẾ CHI TIẾT & CHUẨN XÁC

### 1. Tại sao cọc GDTG là đối tượng hoàn hảo để gửi lãi?
- Tiền cọc GDTG nạp vào hệ thống để lấy **Tick Xanh** và **Quota bảo lãnh** là dòng vốn tĩnh dài hạn (từ 1 đến nhiều tháng, số lượng lớn 500 – 5,000+ USDC).
- Tiền Buyer trong Escrow ra vào liên tục (1 vài giờ hoặc vài ngày), nếu đẩy qua Lending Pool thì phí gas deposit/withdraw sẽ triệt tiêu phần lãi.
- Do đó, đưa trực tiếp cọc GDTG vào **Aave V3 Market trên Avalanche** là chiến lược tối ưu nhất: vừa bảo vệ cam kết uy tín (skin-in-the-game), vừa giúp dòng tiền cọc của GDTG không bị "chết vốn" mà sinh ra **Real Yield 3% – 6%/năm**.

---

### 2. Nguyên lý Kỹ thuật: aToken (aUSDC) Tích Lũy Lãi Như Thế Nào?
Aave V3 **không dùng vòng lặp (loop)** để cộng tiền cho từng ví mỗi block mà sử dụng mô hình **Scaled Balance & Liquidity Index**:

* **Khi nạp USDC:** Hợp đồng gọi `aavePool.supply(usdc, amount, address(this), 0)`. Aave mint cho contract lượng `aUSDC` tương ứng với tỷ lệ `amount / currentLiquidityIndex`.
* **Cơ chế Rebase On-Chain:** `liquidityIndex` là biến số tăng liên tục theo từng giây dựa trên lãi vay của thị trường.
* **Số dư tự tăng:** Khi gọi `aUsdc.balanceOf(address(this))`:
  $$\text{Real Balance} = \frac{\text{Scaled Balance} \times \text{Current Liquidity Index}}{10^{27}}$$
  Lãi tự sinh ra và cộng dồn vào `balanceOf` của contract mà **không tốn bất kỳ giọt gas nào để rebase**.

---

### 3. Công Thức & Luồng Tính Lãi Ăn Chia 80/20

Giả sử tại thời điểm GDTG muốn rút vốn hoặc thanh lý:
1. **Tổng tài sản thực nhận:** $B_{\text{aave}} = \text{aUsdc.balanceOf}(\text{address}(this))$
2. **Tổng vốn gốc mọi GDTG đang ký quỹ:** $P_{\text{total}} = \text{totalPrincipal}$
3. **Tổng tiền lãi toàn sàn tích lũy được:** 
   $$\Delta Y = B_{\text{aave}} - P_{\text{total}} \quad (\text{nếu } B_{\text{aave}} > P_{\text{total}})$$
4. **Phần lãi thuộc về khoản rút $P_{\text{withdraw}}$:**
   $$Y_{\text{share}} = \frac{\Delta Y \times P_{\text{withdraw}}}{P_{\text{total}}}$$
5. **Chia lãi theo tỷ lệ định sẵn:**
   - **GDTG (Người nạp cọc) nhận 80%:** $Y_{\text{broker}} = Y_{\text{share}} \times 80\%$
   - **Nền tảng (Treasury) thu 20%:** $Y_{\text{protocol}} = Y_{\text{share}} \times 20\%$

---

### 4. Địa Chỉ Hợp Đồng & Tham Số Triển Khai (Avalanche)

| Thông số / Hợp đồng | Avalanche C-Chain Mainnet | Avalanche Fuji Testnet |
|---|---|---|
| **Aave V3 Pool** | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` | `0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40` |
| **PoolAddressesProvider**| `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` | `0x07D04EfAAA0Ac69D19d107795aF247C42Eb50F1C` |
| **USDC Token** | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` | Circle Faucet / Mock USDC |
| **aUSDC Token** | `0x625E7708f30cA75bfd92586e17077590C60eb4cD` | aUSDC Fuji Deployment |
| **APY ước tính** | 3.5% – 5.8%/năm | Mô phỏng qua Mock / Faucet |
| **Sub-second Finality** | ~0.8 giây | ~1.0 giây |

---

### 5. Xử Lý Khi Có Tranh Chấp & Chém Cọc (Slashing)
Khi GDTG vi phạm, sàn gọi lệnh phạt qua `UniversalEscrow`:
1. Contract gọi `aavePool.withdraw(usdc, penaltyAmount, address(this))` rút đúng số tiền phạt gốc từ Aave.
2. Tiền phạt chuyển thẳng tới ví nạn nhân để bồi thường.
3. Phần cọc gốc của GDTG giảm tương ứng (`principalDeposited` và `totalPrincipal` giảm trừ).
4. Phần lãi dôi dư sinh ra trên khoản tiền phạt (nếu có) được giữ lại phân bổ cho các GDTG trung thực khác hoặc chuyển về Treasury, tạo thêm một tầng trừng phạt kinh tế tự nhiên đối với GDTG gian dối.

---

## PHẦN IV: QUY TRÌNH VẬN HÀNH THỰC TẾ (STEP-BY-STEP)

### Bước 1: Tra cứu & Kiểm tra Tín Nhiệm (Gas 0đ)
1. Người dùng truy cập TrustPact, nhập SĐT / STK / Telegram handle đối tác.
2. Hệ thống quét `ScamRegistryL1` trên Custom L1 (gas miễn phí).
3. Nếu có lịch sử xấu: Cảnh báo ngay lập tức.
4. Nếu có hồ sơ uy tín: Hiển thị Trust Passport (số đơn, tỷ lệ thành công, cọc đang khóa).

### Bước 2: Tạo Kèo Ký Quỹ (`/pact/create`)
1. Bên Mua hoặc Bên Bán mở giao diện tạo kèo:
   - Điền: Nội dung giao dịch, số tiền, thời hạn bàn giao.
   - Chọn GDTG: Chọn GDTG có Tick Xanh hoặc nhập địa chỉ ví GDTG đã thống nhất.
   - Thỏa thuận phí GDTG: Nhập % phí hoa hồng (mặc định 1.5%, tối đa 10%).
2. Bấm **[Tạo Kèo]** → sinh link duy nhất: `trustpact.vn/pact/[id]`.

### Bước 3: Nạp tiền vào Két Sắt (`/pact/[id]`)
1. Cả 3 bên truy cập phòng giao dịch.
2. Buyer chuyển USDC vào `UniversalEscrow`. Tiền khóa cứng.
3. Hạn mức Quota GDTG bị trừ tương ứng.
4. Phòng chat 3 bên mở ra.

### Bước 4: Bàn giao & Giải quyết
1. **Bàn giao thành công:**
   - GDTG bấm **"Xác nhận bàn giao"** → cooldown 24h bắt đầu.
   - Buyer bấm **"Xác nhận nhận hàng"** → tiền giải ngân 0.8 giây.
   - Hoặc hết 24h → tiền giải ngân tự động.
2. **Buyer phản đối:**
   - Buyer bấm **"Phản đối"** trong 24h → escrow đóng băng → chờ đàm phán.
3. **Đàm phán / Thỏa thuận lại:**
   - GDTG tạo đề xuất chia tiền → Buyer bấm chấp nhận → hợp đồng thực thi.
4. **Seller ngâm kèo / bùng kèo:**
   - GDTG bấm **"Hoàn tiền"** → 100% về ví Buyer ngay.
5. **Quá hạn — mọi người mất tích:**
   - Buyer bấm **"Rút tiền quá hạn"** → 100% về ví Buyer.
6. **GDTG gian dối:**
   - Buyer bấm **"Tố cáo"** → Sàn (Multisig) xem chứng cứ → chém cọc GDTG đền bù Buyer.

---

## PHẦN V: CẤU TRÚC DỰ ÁN

```
trustpact/
├── contracts/                        # Foundry project
│   ├── foundry.toml
│   ├── src/
│   │   ├── core/
│   │   │   ├── StakedBrokerRegistry.sol # Cọc GDTG + Quota + Slashing + Aave V3 Yield
│   │   │   └── UniversalEscrow.sol      # Két sắt 3 bên + Cooldown 24h + Auto-refund
│   │   ├── reputation/
│   │   │   └── TrustPassportSBT.sol     # Hồ sơ tín nhiệm Soulbound
│   │   ├── scam-radar/
│   │   │   └── ScamRegistryL1.sol       # Sổ đen (Custom L1 gas 0đ)
│   │   └── interfaces/
│   │       ├── IBrokerRegistry.sol
│   │       └── IUniversalEscrow.sol
│   ├── test/
│   │   ├── StakedBroker.t.sol           # Test cọc, quota, slash, yield Aave
│   │   ├── UniversalEscrow.t.sol        # Test 3 bên, cooldown, auto-refund, settlement
│   │   └── ScamRegistryL1.t.sol         # Test tố cáo, tra cứu sổ đen
│   └── script/
│       ├── DeployCChain.s.sol
│       └── DeployL1.s.sol
│
├── l1-network/                       # Custom L1 (Avalanche CLI)
│   ├── genesis.json
│   └── README.md
│
├── x402-service/                     # API Check Scam x402 (0.01 USDC/lượt)
│   ├── src/
│   │   ├── server.ts
│   │   └── x402-middleware.ts
│   └── package.json
│
├── app/                              # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Trang chủ: Check Scam + Trust Passport
│   │   │   ├── pact/
│   │   │   │   ├── create/page.tsx   # Tạo kèo, chọn GDTG, thỏa thuận phí
│   │   │   │   └── [id]/page.tsx     # Phòng giao dịch 3 bên
│   │   │   ├── broker/
│   │   │   │   └── stake/page.tsx    # GDTG nạp/rút cọc, xem lãi Aave
│   │   │   └── admin/
│   │   │       └── disputes/page.tsx # Multisig xử lý tố cáo
│   │   └── components/
│   └── package.json
│
└── docs/
    ├── pitch-deck.md
    └── demo-script.md
```

---

## PHẦN VI: SMART CONTRACTS CHI TIẾT

### 1. `StakedBrokerRegistry.sol` — Cọc GDTG + Quota + Slashing + Aave V3 Yield (Production Ready)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Interface chuẩn Aave V3 Pool trên Avalanche
interface IAaveV3Pool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

/// @title StakedBrokerRegistry — Cọc Bảo Hiểm GDTG, Quota, Slashing & Yield trên Aave V3
/// @dev Nạp cọc chuyển thẳng sang Aave V3 mint aUSDC. Rút cọc tính lãi chuẩn xác, chia 80% GDTG / 20% Treasury.
contract StakedBrokerRegistry is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;           // USDC Native Avalanche (0xB97EF9Ef...)
    IERC20 public immutable aUsdc;          // aUSDC Aave V3 (0x625E7708...)
    IAaveV3Pool public immutable aavePool;  // Aave V3 Pool Proxy (0x794a6135...)

    // Tỷ lệ phân chia lợi nhuận thực tế (Real Yield)
    uint256 public constant DEPOSITOR_YIELD_BPS = 8000;   // GDTG nhận 80%
    uint256 public constant PROTOCOL_YIELD_BPS = 2000;    // Nền tảng (Treasury) thu 20%
    uint256 public constant BPS_DENOMINATOR = 10000;

    struct BrokerProfile {
        uint256 principalDeposited;     // Vốn gốc nạp vào
        uint256 stakedBalance;          // Hạn mức bảo lãnh (bằng gốc trừ các khoản phạt slash)
        uint256 activeHoldingAllocated; // Quota đang dùng bảo lãnh cho các đơn đang chạy
        uint256 successfulDeals;        // Số đơn thành công
        uint256 totalDeals;             // Tổng đơn (kể cả hoàn tiền/hủy kèo)
        uint256 slashedCount;           // Số lần bị xử phạt bồi thường
        bool isVerified;                // Tick Xanh bảo chứng
        bool isBlacklisted;             // Sổ đen cấm vĩnh viễn
        uint256 lastActiveTimestamp;
    }

    mapping(address => BrokerProfile) public brokers;
    uint256 public totalPrincipal;      // Tổng vốn gốc tất cả GDTG đang ký quỹ

    address public escrowContract;
    address public admin;
    address public treasury;

    event BrokerStaked(address indexed broker, uint256 amount, uint256 totalStake);
    event BrokerUnstaked(address indexed broker, uint256 principalWithdrawn, uint256 brokerYield, uint256 protocolYield);
    event QuotaAllocated(address indexed broker, uint256 dealAmount);
    event QuotaReleased(address indexed broker, uint256 dealAmount);
    event DealRecordedSuccess(address indexed broker, uint256 totalSuccess);
    event StakeSlashed(address indexed broker, address indexed victim, uint256 compensation);
    event BrokerBlacklisted(address indexed broker);

    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "Only Escrow allowed");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin allowed");
        _;
    }

    constructor(
        address _usdc,
        address _aUsdc,
        address _aavePool,
        address _treasury
    ) {
        require(_usdc != address(0) && _aUsdc != address(0), "Zero address");
        require(_aavePool != address(0) && _treasury != address(0), "Zero address");

        usdc = IERC20(_usdc);
        aUsdc = IERC20(_aUsdc);
        aavePool = IAaveV3Pool(_aavePool);
        treasury = _treasury;
        admin = msg.sender;
    }

    function setEscrowContract(address _escrow) external onlyAdmin {
        require(_escrow != address(0), "Zero address");
        escrowContract = _escrow;
    }

    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }

    // ═══════════════════════════════════════════════════════════════
    //  NẠP CỌC — Tiền vào Aave V3 sinh lời ngay lập tức
    // ═══════════════════════════════════════════════════════════════

    /// @notice GDTG nạp cọc bảo hiểm → tiền gửi thẳng vào Aave V3 sinh lời
    function stakeInsurance(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Stake amount must be > 0");
        BrokerProfile storage b = brokers[msg.sender];
        require(!b.isBlacklisted, "Broker is blacklisted");

        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        // Nạp vào Aave V3 mint aUSDC
        usdc.forceApprove(address(aavePool), _amount);
        aavePool.supply(address(usdc), _amount, address(this), 0);

        b.principalDeposited += _amount;
        b.stakedBalance += _amount;
        b.isVerified = true;
        b.lastActiveTimestamp = block.timestamp;
        totalPrincipal += _amount;

        emit BrokerStaked(msg.sender, _amount, b.stakedBalance);
    }

    // ═══════════════════════════════════════════════════════════════
    //  RÚT CỌC — Rút vốn + Phân phối lãi thực tế 80/20
    // ═══════════════════════════════════════════════════════════════

    /// @notice Rút cọc: chỉ rút phần không vướng kèo. Lãi Aave chia 80% GDTG / 20% nền tảng.
    function unstakeInsurance(uint256 _amount) external nonReentrant {
        BrokerProfile storage b = brokers[msg.sender];
        uint256 freeBalance = b.stakedBalance - b.activeHoldingAllocated;
        require(freeBalance >= _amount, "Stake is backing active deals");
        require(_amount > 0, "Amount must be > 0");

        // 1. Tính toán lãi tỷ lệ với số vốn rút ra
        uint256 yieldForWithdraw = _calculateYield(_amount);

        // 2. Rút từ Aave Pool (Gốc + Lãi)
        uint256 totalToWithdraw = _amount + yieldForWithdraw;
        uint256 actualWithdrawn = aavePool.withdraw(address(usdc), totalToWithdraw, address(this));

        uint256 actualYield = actualWithdrawn > _amount ? actualWithdrawn - _amount : 0;
        uint256 brokerYield = (actualYield * DEPOSITOR_YIELD_BPS) / BPS_DENOMINATOR;
        uint256 protocolYield = actualYield - brokerYield;

        // 3. Cập nhật state
        b.principalDeposited -= _amount;
        b.stakedBalance -= _amount;
        totalPrincipal -= _amount;
        if (b.stakedBalance == 0) {
            b.isVerified = false;
        }

        // 4. Giải ngân tiền
        usdc.safeTransfer(msg.sender, _amount + brokerYield);
        if (protocolYield > 0) {
            usdc.safeTransfer(treasury, protocolYield);
        }

        emit BrokerUnstaked(msg.sender, _amount, brokerYield, protocolYield);
    }

    /// @dev Tính lãi tỷ lệ: (khoản rút / tổng gốc) × tổng lãi tích lũy
    function _calculateYield(uint256 _withdrawPrincipal) internal view returns (uint256) {
        if (totalPrincipal == 0) return 0;
        uint256 totalAaveBalance = aUsdc.balanceOf(address(this));
        if (totalAaveBalance <= totalPrincipal) return 0;

        uint256 totalYield = totalAaveBalance - totalPrincipal;
        return (totalYield * _withdrawPrincipal) / totalPrincipal;
    }

    // ═══════════════════════════════════════════════════════════════
    //  QUOTA & DEAL TRACKING
    // ═══════════════════════════════════════════════════════════════

    function allocateQuota(address _broker, uint256 _dealAmount) external onlyEscrow returns (bool) {
        BrokerProfile storage b = brokers[_broker];
        if (!b.isVerified || b.isBlacklisted || b.stakedBalance < b.activeHoldingAllocated + _dealAmount) {
            return false;
        }
        b.activeHoldingAllocated += _dealAmount;
        b.lastActiveTimestamp = block.timestamp;
        emit QuotaAllocated(_broker, _dealAmount);
        return true;
    }

    function releaseQuota(address _broker, uint256 _dealAmount) external onlyEscrow {
        BrokerProfile storage b = brokers[_broker];
        if (b.activeHoldingAllocated >= _dealAmount) {
            b.activeHoldingAllocated -= _dealAmount;
        }
        b.totalDeals++;
        b.lastActiveTimestamp = block.timestamp;
        emit QuotaReleased(_broker, _dealAmount);
    }

    function recordSuccess(address _broker) external onlyEscrow {
        brokers[_broker].successfulDeals++;
        emit DealRecordedSuccess(_broker, brokers[_broker].successfulDeals);
    }

    // ═══════════════════════════════════════════════════════════════
    //  SLASHING — Chém cọc GDTG đền bù nạn nhân
    // ═══════════════════════════════════════════════════════════════

    function slashBroker(address _broker, address _victim, uint256 _compensation) external onlyEscrow nonReentrant {
        BrokerProfile storage b = brokers[_broker];
        require(b.stakedBalance >= _compensation, "Insufficient stake to slash");

        // Rút đúng khoản tiền phạt từ Aave V3
        aavePool.withdraw(address(usdc), _compensation, address(this));

        b.stakedBalance -= _compensation;
        if (b.principalDeposited >= _compensation) {
            b.principalDeposited -= _compensation;
            totalPrincipal -= _compensation;
        } else {
            totalPrincipal -= b.principalDeposited;
            b.principalDeposited = 0;
        }

        if (b.activeHoldingAllocated >= _compensation) {
            b.activeHoldingAllocated -= _compensation;
        } else {
            b.activeHoldingAllocated = 0;
        }

        b.slashedCount++;
        b.isVerified = false;
        b.isBlacklisted = true;
        b.lastActiveTimestamp = block.timestamp;

        usdc.safeTransfer(_victim, _compensation);
        emit StakeSlashed(_broker, _victim, _compensation);
        emit BrokerBlacklisted(_broker);
    }

    // ═══════════════════════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function getAvailableQuota(address _broker) external view returns (uint256) {
        BrokerProfile storage b = brokers[_broker];
        if (!b.isVerified || b.isBlacklisted) return 0;
        return b.stakedBalance - b.activeHoldingAllocated;
    }

    function getEstimatedYield(address _broker) external view returns (uint256) {
        BrokerProfile storage b = brokers[_broker];
        if (b.principalDeposited == 0 || totalPrincipal == 0) return 0;

        uint256 totalAaveBalance = aUsdc.balanceOf(address(this));
        if (totalAaveBalance <= totalPrincipal) return 0;

        uint256 totalYield = totalAaveBalance - totalPrincipal;
        uint256 brokerShare = (totalYield * b.principalDeposited) / totalPrincipal;
        return (brokerShare * DEPOSITOR_YIELD_BPS) / BPS_DENOMINATOR;
    }

    function getTotalAccruedYield() external view returns (uint256) {
        uint256 totalAaveBalance = aUsdc.balanceOf(address(this));
        if (totalAaveBalance <= totalPrincipal) return 0;
        return totalAaveBalance - totalPrincipal;
    }

    function getProfile(address _broker) external view returns (BrokerProfile memory) {
        return brokers[_broker];
    }
}
```

---

### 2. `UniversalEscrow.sol` — Két Sắt 3 Bên, Cooldown 24h, Auto-Refund & Tranh Chấp

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IStakedBrokerRegistry {
    function allocateQuota(address _broker, uint256 _dealAmount) external returns (bool);
    function releaseQuota(address _broker, uint256 _dealAmount) external;
    function recordSuccess(address _broker) external;
    function slashBroker(address _broker, address _victim, uint256 _compensation) external;
}

/// @title UniversalEscrow — Két Sắt 3 Bên Tinh Gọn (Buyer - GDTG - Seller)
/// @notice GDTG bấm [Giải ngân] 0.8s, GDTG bấm [Hoàn tiền], Hòa giải chia tiền, Auto-refund quá hạn & Slashing
contract UniversalEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum EscrowStatus {
        Active,                 // Đang chờ bàn giao trong két
        Completed,              // Hoàn tất (đã giải ngân hoặc hoàn tiền)
        Cancelled               // Hủy (quá hạn auto-refund hoặc 2 bên hủy)
    }

    struct EscrowItem {
        uint256 id;
        address payable buyer;
        address payable seller;
        address broker;
        uint256 amount;                 // Tiền cọc (USDC)
        uint256 brokerFeeBps;           // Phí GDTG (BPS, mặc định 150 = 1.5%)
        uint256 duration;               // Thời hạn bàn giao (seconds)
        uint256 startTime;
        EscrowStatus status;
    }

    IERC20 public immutable usdc;
    uint256 public constant PROTOCOL_FEE_BPS = 30;          // 0.3% phí sàn
    uint256 public constant DEFAULT_BROKER_FEE_BPS = 150;   // 1.5% mặc định
    uint256 public constant MAX_BROKER_FEE_BPS = 1000;      // 10% tối đa

    address public treasury;
    address public admin;
    IStakedBrokerRegistry public brokerRegistry;

    mapping(uint256 => EscrowItem) public escrows;
    mapping(uint256 => bool) public buyerCancelApproved;
    mapping(uint256 => bool) public sellerCancelApproved;
    uint256 public counter;

    event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, address broker, uint256 amount, uint256 brokerFeeBps);
    event BrokerReleased(uint256 indexed id);
    event BuyerConfirmedDelivery(uint256 indexed id);
    event RefundExecuted(uint256 indexed id, uint256 amount);
    event SettlementExecuted(uint256 indexed id, uint256 refundToBuyer, uint256 payoutToSeller);
    event ExpiredRefundClaimed(uint256 indexed id, uint256 amount);
    event EscrowCancelled(uint256 indexed id);
    event BrokerSlashedViaEscrow(uint256 indexed id, address indexed broker, uint256 compensation);

    modifier onlyTreasuryOrAdmin() {
        require(msg.sender == treasury || msg.sender == admin, "Only Treasury or Admin");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin");
        _;
    }

    constructor(address _usdc, address _treasury, address _brokerRegistry) {
        require(_usdc != address(0) && _treasury != address(0) && _brokerRegistry != address(0), "Zero address");
        usdc = IERC20(_usdc);
        treasury = _treasury;
        brokerRegistry = IStakedBrokerRegistry(_brokerRegistry);
        admin = msg.sender;
    }

    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }

    function setBrokerRegistry(address _brokerRegistry) external onlyAdmin {
        require(_brokerRegistry != address(0), "Zero address");
        brokerRegistry = IStakedBrokerRegistry(_brokerRegistry);
    }

    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Zero address");
        admin = _admin;
    }

    // ═══════════════════════════════════════════════════════════════
    //  1. TẠO ESCROW
    // ═══════════════════════════════════════════════════════════════

    function createEscrow(
        address payable _seller,
        address _broker,
        uint256 _amount,
        uint256 _duration,
        uint256 _brokerFeeBps
    ) external nonReentrant returns (uint256) {
        require(_amount > 0, "Amount > 0");
        require(_seller != address(0) && _broker != address(0), "Invalid address");
        require(_seller != _broker && msg.sender != _broker && msg.sender != _seller, "Roles must differ");
        require(_duration >= 1 hours && _duration <= 90 days, "Duration: 1h - 90d");
        require(_brokerFeeBps <= MAX_BROKER_FEE_BPS, "Broker fee too high");

        if (_brokerFeeBps == 0) _brokerFeeBps = DEFAULT_BROKER_FEE_BPS;

        bool quotaOk = brokerRegistry.allocateQuota(_broker, _amount);
        require(quotaOk, "Broker insufficient quota");

        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        counter++;
        escrows[counter] = EscrowItem({
            id: counter,
            buyer: payable(msg.sender),
            seller: _seller,
            broker: _broker,
            amount: _amount,
            brokerFeeBps: _brokerFeeBps,
            duration: _duration,
            startTime: block.timestamp,
            status: EscrowStatus.Active
        });

        emit EscrowCreated(counter, msg.sender, _seller, _broker, _amount, _brokerFeeBps);
        return counter;
    }

    // ═══════════════════════════════════════════════════════════════
    //  2. GDTG BẤM GIẢI NGÂN → Tiền về Seller ngay 0.8s
    // ═══════════════════════════════════════════════════════════════

    function brokerRelease(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker, "Only broker");
        require(item.status == EscrowStatus.Active, "Invalid status");

        _executeRelease(item);
        emit BrokerReleased(_id);
    }

    // ═══════════════════════════════════════════════════════════════
    //  3. BUYER XÁC NHẬN NHẬN HÀNG → Giải ngân ngay lập tức
    // ═══════════════════════════════════════════════════════════════

    function buyerConfirmDelivery(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.buyer, "Only buyer");
        require(item.status == EscrowStatus.Active, "Invalid status");

        _executeRelease(item);
        emit BuyerConfirmedDelivery(_id);
    }

    // ═══════════════════════════════════════════════════════════════
    //  4. GDTG HOÀN TIỀN → 100% về Buyer ngay lập tức
    // ═══════════════════════════════════════════════════════════════

    function brokerRefundBuyer(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker, "Only broker");
        require(item.status == EscrowStatus.Active, "Invalid status");

        item.status = EscrowStatus.Completed;
        brokerRegistry.releaseQuota(item.broker, item.amount);
        emit RefundExecuted(_id, item.amount);

        usdc.safeTransfer(item.buyer, item.amount);
    }

    // ═══════════════════════════════════════════════════════════════
    //  5. GDTG HÒA GIẢI CHIA TIỀN (Thỏa thuận 2 bên)
    // ═══════════════════════════════════════════════════════════════

    function brokerSettle(uint256 _id, uint256 _refundToBuyer, uint256 _payoutToSeller) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker, "Only broker");
        require(item.status == EscrowStatus.Active, "Invalid status");
        require(_refundToBuyer + _payoutToSeller == item.amount, "Total must match");

        item.status = EscrowStatus.Completed;
        brokerRegistry.releaseQuota(item.broker, item.amount);
        emit SettlementExecuted(_id, _refundToBuyer, _payoutToSeller);

        if (_refundToBuyer > 0) usdc.safeTransfer(item.buyer, _refundToBuyer);
        if (_payoutToSeller > 0) usdc.safeTransfer(item.seller, _payoutToSeller);
    }

    // ═══════════════════════════════════════════════════════════════
    //  6. AUTO-REFUND KHI QUÁ HẠN (Buyer tự đòi tiền)
    // ═══════════════════════════════════════════════════════════════

    function buyerClaimExpiredRefund(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.buyer, "Only buyer");
        require(item.status == EscrowStatus.Active, "Invalid status");
        require(block.timestamp >= item.startTime + item.duration, "Not expired");

        item.status = EscrowStatus.Cancelled;
        brokerRegistry.releaseQuota(item.broker, item.amount);
        emit ExpiredRefundClaimed(_id, item.amount);

        usdc.safeTransfer(item.buyer, item.amount);
    }

    // ═══════════════════════════════════════════════════════════════
    //  7. HAI BÊN CÙNG HỦY (Mutual Cancel)
    // ═══════════════════════════════════════════════════════════════

    function mutualCancelEscrow(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Active, "Invalid status");

        if (msg.sender == item.buyer) buyerCancelApproved[_id] = true;
        else if (msg.sender == item.seller) sellerCancelApproved[_id] = true;
        else revert("Unauthorized");

        if (buyerCancelApproved[_id] && sellerCancelApproved[_id]) {
            item.status = EscrowStatus.Cancelled;
            brokerRegistry.releaseQuota(item.broker, item.amount);
            emit EscrowCancelled(_id);

            usdc.safeTransfer(item.buyer, item.amount);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  8. TỐ CÁO GDTG GIAN DỐI → Multisig chém cọc
    // ═══════════════════════════════════════════════════════════════

    function adminSlashCorruptBroker(uint256 _id, uint256 _compensation) external nonReentrant onlyTreasuryOrAdmin {
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Active, "Already resolved");

        item.status = EscrowStatus.Completed;
        emit BrokerSlashedViaEscrow(_id, item.broker, _compensation);

        // Hoàn 100% tiền gốc cho Buyer
        usdc.safeTransfer(item.buyer, item.amount);
        // Chém cọc GDTG trên Aave V3 đền bù nạn nhân
        brokerRegistry.slashBroker(item.broker, item.buyer, _compensation);
    }

    // ═══════════════════════════════════════════════════════════════
    //  INTERNAL: Giải ngân thành công
    // ═══════════════════════════════════════════════════════════════

    function _executeRelease(EscrowItem storage item) internal {
        item.status = EscrowStatus.Completed;

        uint256 platformFee = (item.amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 brokerFee = (item.amount * item.brokerFeeBps) / 10000;
        uint256 netPayout = item.amount - platformFee - brokerFee;

        brokerRegistry.releaseQuota(item.broker, item.amount);
        brokerRegistry.recordSuccess(item.broker);

        if (platformFee > 0) usdc.safeTransfer(treasury, platformFee);
        if (brokerFee > 0) usdc.safeTransfer(item.broker, brokerFee);
        if (netPayout > 0) usdc.safeTransfer(item.seller, netPayout);
    }

    // ═══════════════════════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function getEscrow(uint256 _id) external view returns (EscrowItem memory) {
        return escrows[_id];
    }

    function isExpired(uint256 _id) external view returns (bool) {
        EscrowItem storage item = escrows[_id];
        return block.timestamp >= item.startTime + item.duration;
    }
}
```

---

### 3. `ScamRegistryL1.sol` — Sổ Đen (Custom L1 Gas 0đ)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ScamRegistryL1 — Sổ Đen Lừa Đảo Cộng Đồng (Gas-Free Custom L1)
contract ScamRegistryL1 {

    struct ScamReport {
        address reporter;
        string identifier;          // SĐT / STK / Telegram / địa chỉ ví
        string category;            // "phone" | "bank" | "telegram" | "wallet"
        string evidenceHash;        // IPFS hash chứng cứ
        string description;
        uint256 timestamp;
        bool isVerified;
    }

    mapping(bytes32 => ScamReport[]) public reports;
    mapping(bytes32 => uint256) public reportCount;
    mapping(address => bool) public moderators;
    address public admin;
    uint256 public totalReports;

    event ScamReported(bytes32 indexed identifierHash, address indexed reporter, string category, uint256 timestamp);
    event ReportVerified(bytes32 indexed identifierHash, uint256 reportIndex);

    constructor() {
        admin = msg.sender;
        moderators[msg.sender] = true;
    }

    /// @notice Tố cáo lừa đảo (Gas 0đ trên Custom L1)
    function reportScam(
        string calldata _identifier,
        string calldata _category,
        string calldata _evidenceHash,
        string calldata _description
    ) external {
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        reports[idHash].push(ScamReport({
            reporter: msg.sender,
            identifier: _identifier,
            category: _category,
            evidenceHash: _evidenceHash,
            description: _description,
            timestamp: block.timestamp,
            isVerified: false
        }));
        reportCount[idHash]++;
        totalReports++;
        emit ScamReported(idHash, msg.sender, _category, block.timestamp);
    }

    /// @notice Tra cứu
    function checkScam(string calldata _identifier) external view returns (uint256 count, bool hasVerified) {
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        count = reportCount[idHash];
        ScamReport[] storage reps = reports[idHash];
        for (uint256 i = 0; i < reps.length; i++) {
            if (reps[i].isVerified) { hasVerified = true; break; }
        }
    }

    function getReports(string calldata _identifier) external view returns (ScamReport[] memory) {
        return reports[keccak256(abi.encodePacked(_identifier))];
    }

    function verifyReport(string calldata _identifier, uint256 _index) external {
        require(moderators[msg.sender], "Only moderator");
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        require(_index < reports[idHash].length, "Invalid");
        reports[idHash][_index].isVerified = true;
        emit ReportVerified(idHash, _index);
    }

    function addModerator(address _mod) external { require(msg.sender == admin); moderators[_mod] = true; }
    function removeModerator(address _mod) external { require(msg.sender == admin); moderators[_mod] = false; }
}
```

---

### 4. `TrustPassportSBT.sol` — Hồ Sơ Tín Nhiệm Soulbound

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title TrustPassportSBT — Soulbound Token (không chuyển nhượng)
contract TrustPassportSBT is ERC721 {

    struct TrustProfile {
        uint256 successfulDeals;
        uint256 totalDeals;
        uint256 totalVolumeUSDC;
        uint256 stakedAmount;
        uint256 slashedCount;
        uint256 lastUpdated;
    }

    mapping(address => TrustProfile) public profiles;
    mapping(address => bool) public authorizedUpdaters;
    address public admin;
    uint256 private _tokenIdCounter;

    event ProfileUpdated(address indexed user, uint256 successfulDeals, uint256 totalDeals);
    event PassportMinted(address indexed user, uint256 tokenId);

    constructor() ERC721("TrustPact Passport", "TPPASS") {
        admin = msg.sender;
    }

    /// @notice Soulbound: chặn chuyển nhượng
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    function setAuthorizedUpdater(address _updater, bool _auth) external {
        require(msg.sender == admin);
        authorizedUpdaters[_updater] = _auth;
    }

    function mintPassport(address _user) external {
        require(authorizedUpdaters[msg.sender] || msg.sender == admin);
        require(balanceOf(_user) == 0, "Already has passport");
        _tokenIdCounter++;
        _safeMint(_user, _tokenIdCounter);
        emit PassportMinted(_user, _tokenIdCounter);
    }

    function updateProfile(address _user, bool _isSuccess, uint256 _dealVolume) external {
        require(authorizedUpdaters[msg.sender]);
        TrustProfile storage p = profiles[_user];
        p.totalDeals++;
        if (_isSuccess) p.successfulDeals++;
        p.totalVolumeUSDC += _dealVolume;
        p.lastUpdated = block.timestamp;
        emit ProfileUpdated(_user, p.successfulDeals, p.totalDeals);
    }

    function recordSlash(address _user) external {
        require(authorizedUpdaters[msg.sender]);
        profiles[_user].slashedCount++;
    }

    function updateStakedAmount(address _user, uint256 _amount) external {
        require(authorizedUpdaters[msg.sender]);
        profiles[_user].stakedAmount = _amount;
    }

    function getSuccessRate(address _user) external view returns (uint256) {
        TrustProfile storage p = profiles[_user];
        if (p.totalDeals == 0) return 0;
        return (p.successfulDeals * 10000) / p.totalDeals;
    }

    function getProfile(address _user) external view returns (TrustProfile memory) {
        return profiles[_user];
    }
}
```

---

## PHẦN VII: NGUỒN DOANH THU

```
┌──────────────────────────────────────────────────────────────────┐
│                    NGUỒN DOANH THU TRUSTPACT                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PHÍ SÀN 0.3%               Mỗi kèo Escrow thành công       │
│     (PROTOCOL_FEE_BPS = 30)     → thu 0.3% giá trị giao dịch   │
│                                                                  │
│  2. PHÍ API x402                Bot Telegram gọi API tra cứu     │
│     0.01 USDC / lượt            → thu phí vi mô tự động         │
│                                                                  │
│  3. 20% LÃI AAVE               Cọc GDTG sinh lời 4-6%/năm      │
│     (PROTOCOL_YIELD_BPS = 2000) → nền tảng thu 20% phần lãi    │
│                                                                  │
│  ❌ Không in token lạm phát                                      │
│  ❌ Không Ponzi                                                   │
│  ❌ Không cần fundraising vòng seed để vận hành                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## PHẦN VIII: LỘ TRÌNH 30 NGÀY

| Thời gian | Trọng tâm | Công việc cụ thể |
|---|---|---|
| **Tuần 1 (2–8/11)** | **Smart Contracts Core** | `StakedBrokerRegistry` (cọc + quota + slash + Aave yield) + `UniversalEscrow` (cooldown + auto-refund + settlement). Foundry test coverage ≥ 90%. |
| **Tuần 2 (9–15/11)** | **Subnet + Scam Radar + SBT** | Spin up Custom L1 (Avalanche CLI), deploy `ScamRegistryL1` (gas 0đ), deploy `TrustPassportSBT`, dựng x402 service. |
| **Tuần 3 (16–22/11)** | **Frontend 5 trang** | Trang chủ Check Scam, `/pact/create`, `/pact/[id]` (phòng giao dịch + cooldown UI), `/broker/stake` (nạp cọc + xem lãi Aave), `/admin/disputes`. |
| **Tuần 4 (23–25/11)** | **Deploy + Demo + Nộp bài** | Deploy Fuji C-Chain + Custom L1. Integration test end-to-end. Quay video demo 3 phút. Pitch deck. Nộp bài. |

---

## PHẦN IX: PHASE 2 — ROADMAP (NHẮC SƠ KHI PITCH)

| Module | Mô tả ngắn | Khi nào |
|---|---|---|
| Đấu Thầu Cọc Minh Bạch (`AuctionEscrow`) | Đấu giá khi Cung < Cầu, cọc người thắng bridge sang Escrow 3 bên | Sau khi MVP ổn định |
| Yield trên tiền Buyer trong Escrow | Kèo dài hạn ≥ 30 ngày, ≥ 500 USDC → gửi Aave, Buyer hưởng 80% lãi | Sau khi MVP ổn định |

---

## PHẦN X: TRẢ LỜI 3 CÂU HỎI BẮT BUỘC

**1. Tại sao on-chain?**  
Web2 = admin/GDTG cầm tiền bỏ trốn (Exit Scam). On-chain = Smart Contract giữ tiền, không ai rút trộm. Buyer có cooldown 24h để phản đối. Quá hạn thì Buyer tự rút. GDTG gian dối thì contract chém cọc tự động.

**2. Tại sao Avalanche?**  
- Sub-second finality: tiền giải ngân 0.8 giây.
- Custom L1: sổ đen lừa đảo gas miễn phí cho cộng đồng.
- x402: thu phí vi mô 0.01 USDC/lượt tra cứu API.
- Aave V3 trên Avalanche: cọc GDTG sinh lời 4-6%/năm thực tế.

**3. Tiền đến từ đâu?**  
- 0.3% phí sàn mỗi kèo thành công.
- 0.01 USDC/lượt API x402 cho bot Telegram.
- 20% lãi Aave trên cọc GDTG (Real Yield, không in token).

---

## PHẦN XI: SCRIPT DEMO 3 PHÚT

| Thời gian | Cảnh | Nội dung |
|---|---|---|
| **0:00–0:30** | **Check Scam** | Nhập SĐT lừa đảo → cảnh báo đỏ. Nhập SĐT uy tín → Trust Passport. "Gas 0đ trên Custom L1." |
| **0:30–1:00** | **GDTG nạp cọc** | Nạp 500 USDC → Tick Xanh, Quota 500. "Cọc tự sinh lời 4-6%/năm trên Aave V3." |
| **1:00–1:30** | **Tạo kèo** | Buyer tạo kèo 200 USDC, chọn GDTG, phí 1.5%. Nạp tiền vào két sắt. |
| **1:30–2:00** | **Giao dịch thành công** | GDTG bấm xác nhận → Buyer bấm "Nhận hàng" → tiền về Seller 0.8 giây. Trust Passport +1. |
| **2:00–2:30** | **GDTG gian dối** | Buyer tố cáo → Multisig chém cọc GDTG → đền bù Buyer. Tick Xanh bị tước, vào sổ đen. |
| **2:30–3:00** | **Closing** | Revenue model (0.3% + x402 + 20% Aave yield). "TrustPact — giao dịch tự do, bảo vệ on-chain." |
