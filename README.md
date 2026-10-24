# 🛡️ TrustPact (UyTinNet)
### Institutional Tri-Party Escrow & Scam Radar on Avalanche
> **Avalanche UniHack 2026** — *Track A: Social Finance (SocialFi)*

[![Live Web](https://img.shields.io/badge/Live%20Demo-trustpact--mocha.vercel.app-E84142?style=for-the-badge&logo=vercel&logoColor=white)](https://trustpact-mocha.vercel.app/)
[![Telegram Bot](https://img.shields.io/badge/Telegram%20Bot-@TrustPact__Sentinel__bot-229ED9?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/TrustPact_Sentinel_bot)
[![Network](https://img.shields.io/badge/Avalanche%20Fuji-C--Chain%20%2343113-E84142?style=for-the-badge&logo=avalanche&logoColor=white)](https://testnet.snowtrace.io/address/0xb3e0586F61a2dC5C1055528f0939E2fbDcE38Ad0)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.24-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Foundry-100%25%20Tests%20Passing-FFDB1C?style=for-the-badge)](https://getfoundry.sh/)

---

## 🌐 Hệ Sinh Thái Trực Tuyến (Live Deployments)

- 🚀 **Trang Web Hoạt Động (Production Web App):** [https://trustpact-mocha.vercel.app](https://trustpact-mocha.vercel.app)
- 🤖 **Bot Telegram Giám Sát & Tra Cứu Scam 24/7:** [@TrustPact_Sentinel_bot](https://t.me/TrustPact_Sentinel_bot)
- 📜 **Trang Minh Chứng Pháp Lý & Công Nghệ:** [https://trustpact-mocha.vercel.app/compliance](https://trustpact-mocha.vercel.app/compliance)

---

## 🏛️ Smart Contracts Đã Triển Khai Trên Avalanche Fuji C-Chain (#43113)

Tất cả 4 hợp đồng cốt lõi đã được biên dịch bằng **Foundry**, phát sóng on-chain (broadcast) và xác thực bytecode trên mạng Avalanche Fuji Testnet:

| Tên Hợp Đồng | Địa Chỉ Ví Smart Contract (Fuji C-Chain) | Trình Khám Phá (Snowtrace Explorer) |
| :--- | :--- | :--- |
| **`UniversalEscrow.sol`** | `0xb3e0586F61a2dC5C1055528f0939E2fbDcE38Ad0` | [Xem trên Snowtrace](https://testnet.snowtrace.io/address/0xb3e0586F61a2dC5C1055528f0939E2fbDcE38Ad0) |
| **`StakedBrokerRegistry.sol`** | `0x7eB341096Ca95BB4F227A10daEd9c413F2F60Ca2` | [Xem trên Snowtrace](https://testnet.snowtrace.io/address/0x7eB341096Ca95BB4F227A10daEd9c413F2F60Ca2) |
| **`TrustPassportSBT.sol`** | `0x84d9F79A513D5CBFe6dC1E5B971cc811e64d3296` | [Xem trên Snowtrace](https://testnet.snowtrace.io/address/0x84d9F79A513D5CBFe6dC1E5B971cc811e64d3296) |
| **`ScamRegistryL1.sol`** | `0x3f8C012cee1412170386a6a8C8968F903C8f3362` | [Xem trên Snowtrace](https://testnet.snowtrace.io/address/0x3f8C012cee1412170386a6a8C8968F903C8f3362) |

> **Wiring Liên Kết Bảo Mật On-Chain:**
> - `StakedBrokerRegistry.setEscrowContract(UniversalEscrow)` đã kích hoạt thành công.
> - `TrustPassportSBT.setAuthorizedUpdater(StakedBrokerRegistry)` đã kích hoạt thành công.

---

## ⚖️ Tuân Thủ Khung Pháp Lý Việt Nam (UniHack Rule 8 Compliance)

Dự án TrustPact được thiết kế với sự thấu hiểu sâu sắc và tôn trọng tuyệt đối hệ thống pháp luật Việt Nam:

### 1. Tuyên Bố Giới Hạn Pháp Lý Bắt Buộc:
- ⚠️ **Crypto KHÔNG PHẢI là phương tiện thanh toán hợp pháp tại Việt Nam** (Căn cứ theo *Nghị định 80/2016/NĐ-CP*, *Nghị định 52/2024/NĐ-CP* và *Công văn 5747/NHNN-PC* của Ngân hàng Nhà nước).
- ❌ TrustPact **tuyệt đối không** sử dụng tiền mã hóa để trả lương, thanh toán học phí, hoặc mua bán hàng hóa tiêu dùng thay thế cho Đồng Việt Nam (VND).
- ❌ TrustPact **không thực hiện tư vấn tài chính hay đầu tư có thu phí** (vốn đòi hỏi giấy phép quản lý quỹ của Ủy ban Chứng khoán Nhà nước).
- ❌ Mọi tài sản chứng khoán token hóa (Tokenized Stocks) đều được geoblocked theo đúng quy định quốc tế và luật pháp Việt Nam.

### 2. Bản Chất Pháp Lý Dân Sự Của TrustPact:
- ⚖️ **Cơ Chế Ký Cược / Đặt Cọc Bảo Đảm Thực Hiện Nghĩa Vụ Dân Sự** theo **Điều 292** và **Điều 328 Bộ luật Dân sự 2015**:
  > *"Đặt cọc là việc một bên giao cho bên kia một khoản tiền hoặc kim khí quý, đá quý hoặc vật có giá trị khác trong một thời hạn để bảo đảm giao kết hoặc thực hiện hợp đồng."* (Khoản 1 Điều 328 BLDS 2015).
- Trong giao dịch P2P tài sản số và dịch vụ phần mềm xuyên biên giới, tài sản số (USDC/Digital Assets) đóng vai trò là **"Vật có giá trị dân sự"** do các bên đương sự tự nguyện ủy thác vào két sắt hợp đồng thông minh phi tập trung để làm tài sản bảo đảm.
- **Két sắt `UniversalEscrow`** đóng vai trò là bên thứ ba giữ vật ký cược trung lập, tự động hóa thanh toán hoặc hoàn tiền theo đúng cam kết dân sự, loại bỏ hoàn toàn tình trạng quỵt nợ hoặc lừa đảo.
- **Thương nhân Trung gian (Broker)** đóng vai trò là Bên thứ ba chứng kiến / hòa giải độc lập. Để hành nghề, Broker phải ký cược tài sản vào `StakedBrokerRegistry`, chịu chế tài phạt cọc (Slashing) bồi thường 100% nếu có hành vi gian lận.

---

## 🎯 Ba Trụ Cột Công Nghệ Avalanche Bắt Buộc (UniHack Rule 9 Answers)

Hội đồng giám khảo UniHack 2026 đặt ra 3 câu hỏi cốt lõi cho mọi dự án tham gia:

### 1. Tại sao phải On-Chain? (Why On-Chain?)
- **Triệt tiêu hoàn toàn nạn Exit Scam:** Trong các nhóm giao dịch trung gian truyền thống tại Việt Nam (Zalo, Telegram, Facebook), quản trị viên hoặc bên trung gian rất dễ ôm tiền bỏ trốn khi gặp giao dịch lớn hoặc bị hack tài khoản mạng xã hội. Két sắt On-chain (`UniversalEscrow`) khóa tiền trực tiếp bằng mã nguồn mở bất biến, không một cá nhân nào có quyền tự ý biển thủ.
- **Giải quyết tranh chấp minh bạch không phụ thuộc ngân hàng:** Giao dịch ngân hàng Web2 thường xuyên gặp rủi ro tài khoản bị phong tỏa, lệnh chuyển tiền bị treo hoặc làm giả ảnh chụp chuyển khoản (Fake Bill). On-chain quyết toán tự động, tiền vào ví tức thì với bằng chứng giao dịch không thể làm giả.
- **Định danh Tín nhiệm Soulbound Token (TrustPassport SBT):** Mọi giao dịch thành công, điểm đánh giá và lịch sử cọc của Broker được khắc vĩnh viễn lên SBT (ERC-721 phi chuyển nhượng). Chống hoàn toàn tình trạng mua bán nick trung gian cũ để đi lừa đảo.

### 2. Tại sao là Avalanche? (Why Avalanche?)
- **Tốc độ xác thực cực nhanh (Sub-second Finality < 0.8s):** Nhờ cơ chế đồng thuận **Snowman Consensus** trên Avalanche C-Chain, các giao dịch nạp cọc, xác nhận bàn giao và giải ngân diễn ra trong nháy mắt. Điều này giải quyết bài toán cốt tử về trải nghiệm người dùng trong thương mại P2P mà Ethereum (12s) hay các L2 (cần chờ rollup finality) không thể đáp ứng.
- **Kiến trúc Đa Chuỗi C-Chain + Custom L1 (Subnet):**
  - **Avalanche C-Chain:** Đảm nhận vai trò Két sắt Ký Quỹ giá trị cao, nạp cọc bảo chứng và kết nối giao thức thanh khoản Aave V3.
  - **Custom L1 Subnet (Zero-Gas):** Đảm nhận vai trò Radar Tra cứu & Báo cáo Sổ đen lừa đảo cộng đồng với chi phí mạng **0đ Gas**. Nhờ đó, bot Telegram và người dùng phổ thông có thể thực hiện hàng triệu lượt tra cứu mỗi ngày mà không bị tốn phí hay nghẽn mạng chính.
- **Avalanche Teleporter (ICM):** Đồng bộ hóa trạng thái gian lận giữa Custom L1 và C-Chain bằng công nghệ Inter-Chain Messaging bản địa.

### 3. Lợi tức từ đâu ra? (Where does Yield come from?)
- **Nguyên tắc cốt tử (UniHack Rule 7):** Tuyệt đối **KHÔNG** in token lạm phát vô căn cứ hay sử dụng mô hình Ponzi lấy tiền người sau trả người trước.
- **Tích Hợp Thực Tế Với Aave V3 Liquidity Pool Trên Avalanche:** Tiền cọc bảo lãnh của các Broker trong `StakedBrokerRegistry.sol` được tự động nạp vào Aave V3 Fuji Lending Pool (`0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40`), tạo ra dòng tiền lãi thực (**Real-Yield APY ~5.20%**) từ nhu cầu vay vốn thị trường.
- **Cơ chế phân bổ lợi tức 80/20 bền vững:**
  - **80% Lợi tức Aave** được trả định kỳ cho Broker như một phần thưởng kinh tế khuyến khích họ duy trì cọc lớn để bảo lãnh giao dịch.
  - **20% Lợi tức Aave** được đưa vào Quỹ Bảo Hiểm & Vận Hành (Protocol Treasury & Insurance Pool) để bù đắp rủi ro cho người dùng khi xảy ra bất khả kháng.
  - **Vốn cọc gốc (Principal) luôn được bảo toàn 100%**, chỉ có tiền lãi phát sinh mới được phân phối.

---

## 🏛️ Kiến Trúc Tổng Thể (Architecture Overview)

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
|   - Báo cáo cộng đồng gas-free    |                         |   - Giải ngân tức thì 0.8 giây    |
| • TrustPassportSBT.sol            |                         | • StakedBrokerRegistry.sol        |
|   - Soulbound ERC-721 định danh   |                         |   - Hạn mức cọc bảo chứng (120%)  |
|   - Điểm tín nhiệm, Star Rating   |                         |   - Tích hợp Aave V3 Lending Pool |
+-----------------------------------+                         +-----------------+-----------------+
                 ^                                                              |
                 |                                                              v
+----------------+------------------+                         +-----------------------------------+
|        x402 Micro-Payment         |                         |       Aave V3 Lending Pool        |
|    Telegram Bot Sentinel API      |                         |    (Real-Yield aUSDC Compounding) |
+-----------------------------------+                         +-----------------------------------+
```

---

## 📂 Cấu Trúc Thư Mục (Repository Structure)

```
TRUSTPACT/
├── contracts/                   # Smart Contract Suite (Foundry)
│   ├── src/
│   │   ├── core/
│   │   │   ├── UniversalEscrow.sol         # Két sắt ký quỹ 3 bên (Điều 328 BLDS)
│   │   │   └── StakedBrokerRegistry.sol    # Quản lý cọc & Aave V3 Real-Yield
│   │   ├── scam-radar/
│   │   │   └── ScamRegistryL1.sol          # Sổ đen gian lận L1 0đ Gas
│   │   ├── reputation/
│   │   │   └── TrustPassportSBT.sol        # Soulbound Token tín nhiệm
│   │   └── interfaces/                     # Contract Interfaces
│   ├── script/                             # Foundry Deployment Scripts
│   │   ├── DeployCChain.s.sol              # Triển khai Fuji C-Chain
│   │   └── DeployL1.s.sol                  # Triển khai Custom L1
│   └── test/                               # Foundry Test Suite (100% Pass)
├── frontend/                    # Web Application (Next.js 14 App Router)
│   ├── app/
│   │   ├── page.tsx                        # Cổng Tra cứu Scam & Tín nhiệm SBT
│   │   ├── pact/create/page.tsx            # Studio Khởi tạo Hợp đồng Ký quỹ
│   │   ├── pact/[id]/page.tsx              # Phòng Đối soát Ký quỹ 3 Bên
│   │   ├── pact/page.tsx                   # Sổ Kèo Của Tôi (My Deals)
│   │   ├── broker/stake/page.tsx           # Dashboard Quản lý Cọc & Lãi Aave V3
│   │   ├── compliance/page.tsx             # Trang Pháp Lý VN & 3 Trụ Cột Avalanche
│   │   └── api/telegram-webhook/route.ts   # Webhook Bot Telegram Serverless
│   ├── src/lib/contracts.ts                # ABIs, Addresses & Web3 Helpers
│   └── public/images/                      # 3D Assets & Photorealistic Avatars
├── l1-network/                  # Avalanche Custom L1 Network Configuration
│   ├── genesis.json                        # Zero-gas Subnet EVM Genesis
│   └── README.md                           # Hướng dẫn tạo Subnet với Avalanche CLI
└── x402-service/                # Micro-payment Gateway & Telegram Telemetry
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start)

### Yêu Cầu Tiên Quyết (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 trở lên)
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)
- [Git](https://git-scm.com/)

---

### 1. Khởi Chạy Web App (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000) hoặc truy cập trực tiếp bản cloud tại [https://trustpact-mocha.vercel.app](https://trustpact-mocha.vercel.app).

---

### 2. Kiểm Thử Smart Contracts (Foundry Test Suite)

```bash
cd contracts
forge test -vvv
```

Toàn bộ các bộ test kiểm tra nghiêm ngặt:
- ✅ **Happy Path:** Buyer nạp cọc -> Broker kiểm duyệt -> Giải ngân tức thì 0.8s về Seller + phí về Broker.
- ✅ **Broker Hoàn Tiền:** Broker bấm hoàn 100% về cho Buyer khi giao dịch không thành công.
- ✅ **Tự Động Rút Tiền Quá Hạn (Timeout Auto-Refund):** Buyer tự rút tiền khi hết duration mà Broker/Seller không giải quyết.
- ✅ **Hòa Giải Hai Bên (Settlement):** Chia tỷ lệ hoàn tiền Buyer và trả Seller theo thỏa thuận.
- ✅ **Chế Tài Chém Cọc (Slashing):** Phạt cọc Broker gian lận, bồi thường 100% cho Buyer.
- ✅ **Aave V3 Real-Yield:** Tích hợp chia lãi 80% cho Broker và 20% cho sàn.
- ✅ **Soulbound Token (SBT):** Đúc chứng chỉ uy tín, chặn 100% lệnh chuyển nhượng ví (`transferFrom` reverts).

---

## 👥 Đội Ngũ Phát Triển (Team)

Dự án được xây dựng và hoàn thiện cho cuộc thi **Avalanche UniHack 2026** (Track A: Social Finance).

- **GitHub Repository:** [https://github.com/bontran012/TRUSTPACT](https://github.com/bontran012/TRUSTPACT)
- **Production Web App:** [https://trustpact-mocha.vercel.app](https://trustpact-mocha.vercel.app)
- **Telegram Sentinel Bot:** [@TrustPact_Sentinel_bot](https://t.me/TrustPact_Sentinel_bot)
- **License:** MIT
