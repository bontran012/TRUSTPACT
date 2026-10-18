# 🛡️ TrustPact (UyTinNet)
### Decentralized Social Escrow & Real-Yield Staking Protocol on Avalanche
> **Avalanche UniHack 2026** — *Track A: Social Finance (SocialFi)*

[![Avalanche](https://img.shields.io/badge/Network-Avalanche%20Fuji%20%26%20Custom%20L1-E84142?logo=avalanche&logoColor=white)](https://avax.network/)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C)](https://getfoundry.sh/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)](https://nextjs.org/)
[![Aave V3](https://img.shields.io/badge/DeFi-Aave%20V3%20Yield-B6509E?logo=aave)](https://aave.com/)

---

## 📌 Tổng Quan Dự Án (Executive Summary)

**TrustPact (UyTinNet)** là nền tảng ký quỹ giao dịch P2P và xác thực tín nhiệm phi tập trung thế hệ mới, giải quyết triệt để nạn lừa đảo trực tuyến (Scam P2P, Fake Bill, trung gian giả mạo) trong các giao dịch chuyển nhượng tài sản số, OTC crypto, tài khoản game và dịch vụ công nghệ tại Việt Nam và Đông Nam Á.

Dự án kết hợp sức mạnh kiến trúc đa chuỗi của **Avalanche (Custom L1 + Fuji C-Chain)** với hạ tầng tài chính **Aave V3 Lending Pool**:
1. **Pillar 1 — Sổ Đen & Tín Nhiệm 0đ Gas (Avalanche Custom L1 Subnet):** Cơ sở dữ liệu phòng chống lừa đảo on-chain miễn phí gas cho cộng đồng, kết hợp định danh Soulbound Token (TrustPassport SBT - ERC721 phi chuyển nhượng).
2. **Pillar 2 — Két Sắt Ký Quỹ Ba Bên (Universal Escrow):** Hợp đồng thông minh phong tỏa quỹ 3 bên (Buyer - GDTG - Seller) với tốc độ quyết toán **Snowman 0.8s**, tự động giải ngân tức thời và cơ chế bồi thường (Economic Slashing) 100% nếu phát hiện trung gian gian lận.
3. **Pillar 3 — Cọc Bảo Chứng Sinh Lợi Tức Aave V3 (DeFi Real-Yield):** Vốn cọc bảo chứng của Thương nhân Trung Gian được gửi vào Lending Pool Aave V3 để sinh lãi thụ động theo từng block (80% chia sẻ cho Broker, 20% duy trì giao thức).

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

```
                            +---------------------------------------+
                            |           TrustPact Frontend          |
                            |       Next.js 14 + TailwindCSS        |
                            +-------------------+-------------------+
                                                |
                 +------------------------------+------------------------------+
                 |                                                             |
                 v                                                             v
+-----------------------------------+                         +-----------------------------------+
|     Avalanche Custom L1 Subnet    |                         |      Avalanche Fuji C-Chain       |
|            (0đ Gas Fee)           |                         |        (0.8s Snowman Finality)    |
+-----------------------------------+                         +-----------------------------------+
| • ScamRegistryL1.sol              |                         | • UniversalEscrow.sol             |
|   - Sổ đen tài khoản / SĐT lừa đảo|                         |   - Két sắt 3 bên Buyer/Broker/Seller|
|   - Bằng chứng IPFS bất biến      |                         |   - Phê duyệt giải ngân tức thì   |
| • TrustPassportSBT.sol            |                         | • StakedBrokerRegistry.sol        |
|   - Soulbound ERC-721 định danh   |                         |   - Quản lý hạn mức cọc (120%)    |
|   - Điểm tín nhiệm, Star Rating   |                         |   - Điều phối Aave V3 Lending Pool|
+-----------------------------------+                         +-----------------+-----------------+
                 ^                                                              |
                 |                                                              v
+----------------+------------------+                         +-----------------------------------+
|        x402 Micro-Payment         |                         |       Aave V3 Lending Pool        |
|    ERC-7730 / Telegram Bot API    |                         |    (Real-Yield aUSDC Compounding) |
+-----------------------------------+                         +-----------------------------------+
```

---

## 🚀 Các Tính Năng Nổi Bật (Key Features)

### 1. Tra Cứu Gian Lận & Tín Nhiệm On-Chain (Check Scam 0đ Gas)
- Tìm kiếm tức thì số tài khoản ngân hàng, số điện thoại, địa chỉ ví.
- Báo cáo lừa đảo phi tập trung kèm bằng chứng IPFS hash.
- Phí giao dịch 0đ Gas trên Avalanche Custom L1 Subnet, mở rộng qua x402 gateway cho Telegram Bot tra cứu vi mô.

### 2. Két Sắt Ký Quỹ Ba Bên (Universal Escrow)
- **Bên Mua (Buyer):** Nạp tiền ký quỹ (USDC) vào Smart Contract an toàn. Có quyền khiếu nại hoặc tự động rút tiền nếu quá hạn quy định.
- **Bên Bán (Seller):** Yên tâm giao hàng/chuyển nhượng tài sản sau khi Smart Contract phong tỏa quỹ thành công.
- **Bên Trung Gian (Broker):** Giám định quy chuẩn bàn giao, bấm duyệt giải ngân tức thì **0.8 giây** hoặc hoàn tiền về cho Bên Mua.
- **Economic Slashing:** Giao thức tự động trích cọc Aave của Broker để đền bù 100% cho Buyer nếu Broker gian lận.

### 3. Cọc Aave V3 & Chia Sẻ Lợi Tức Thực (Real-Yield 80/20)
- Tiền cọc bảo chứng không bị nằm chết mà được điều phối vào Aave V3 sinh lời thụ động (~5.20% Supply APY).
- Lợi tức tăng trưởng liên tục theo từng block qua aUSDC.
- Cơ chế phân phối: **80% cho Broker**, **20% cho Quỹ Phát Triển Sàn**.
- Hạn mức tiếp nhận kèo linh hoạt theo tỷ lệ an toàn: `Max Limit = Vốn Cọc × 120%`.

---

## 📂 Cấu Trúc Thư Mục (Repository Structure)

```
TRUSTPACT/
├── contracts/                   # Smart Contract Suite (Foundry)
│   ├── src/
│   │   ├── core/
│   │   │   ├── UniversalEscrow.sol         # Két sắt ký quỹ 3 bên
│   │   │   └── StakedBrokerRegistry.sol    # Quản lý cọc & Aave V3
│   │   ├── scam-radar/
│   │   │   └── ScamRegistryL1.sol          # Sổ đen gian lận L1
│   │   ├── reputation/
│   │   │   └── TrustPassportSBT.sol        # Soulbound Token tín nhiệm
│   │   └── interfaces/                     # Contract Interfaces
│   ├── script/                             # Foundry Deployment Scripts
│   │   ├── DeployCChain.s.sol              # Triển khai Fuji C-Chain
│   │   └── DeployL1.s.sol                  # Triển khai Custom L1
│   └── test/                               # Foundry Test Suite (100% Pass)
├── frontend/                    # Web Application (Next.js 14 App Router)
│   ├── app/
│   │   ├── page.tsx                        # Cổng Tra cứu Scam & Tín nhiệm
│   │   ├── create/page.tsx                 # Studio Khởi tạo Hợp đồng Ký quỹ
│   │   ├── room/[id]/page.tsx              # Phòng Đối soát Ký quỹ 3 Bên
│   │   └── broker/page.tsx                 # Dashboard Quản lý Cọc Aave V3
│   ├── components/                         # UI Components & Icons
│   ├── lib/store.ts                        # Client Store & Simulated State
│   └── public/images/                      # 3D Assets & Photorealistic Avatars
├── l1-network/                  # Avalanche Custom L1 Network Configuration
│   ├── genesis.json                        # Zero-gas Subnet EVM Genesis
│   └── README.md                           # Hướng dẫn tạo Subnet với Avalanche CLI
└── x402-service/                # Micro-payment Payment Gateway (ERC-7730)
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start)

### Yêu Cầu Tiên Quyết (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 trở lên)
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)
- [Git](https://git-scm.com/)

---

### 1. Khởi Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

### 2. Kiểm Thử Smart Contracts (Foundry)

```bash
cd contracts
forge test -vvv
```

Tất cả các bài test kiểm thử kịch bản:
- Happy path giải ngân tức thì 0.8s
- Hoàn quỹ 100% cho Bên Mua
- Tự động rút quỹ khi quá hạn (Timeout Auto-Refund)
- Chém cọc trung gian gian lận (Slashing)
- Chia tách lợi tức Aave V3 (80/20 Yield Split)
- Mint & Khóa chuyển nhượng Soulbound Token (SBT)

---

### 3. Triển Khai Lên Avalanche Fuji C-Chain

```bash
cd contracts
forge script script/DeployCChain.s.sol:DeployCChain \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast \
  --verify
```

---

## 👥 Đội Ngũ Phát Triển (Team)

Dự án được xây dựng và tối ưu cho cuộc thi **Avalanche UniHack 2026**.

- **Repository:** [https://github.com/bontran012/TRUSTPACT](https://github.com/bontran012/TRUSTPACT)
- **License:** MIT
