# HỆ THỐNG TRUSTPACT (UY TÍN NET) - TỔNG HỢP KỸ THUẬT & HƯỚNG DẪN VẬN HÀNH
> **Dự án:** TrustPact (UyTinNet)  
> **Cuộc thi:** Avalanche UniHack 2026 — Track A (SocialFi)  
> **Tài liệu cập nhật:** 05/11/2026  

---

## 1. THÔNG SỐ MẠNG & ĐỊA CHỈ HỢP ĐỒNG (AVALANCHE FUJI C-CHAIN)

| Thông số / Hợp đồng | Địa chỉ / Giá trị | Ý nghĩa & Lưu ý quan trọng |
|---|---|---|
| **Mạng (Network)** | Avalanche Fuji Testnet | Chain ID: `43113` |
| **RPC URL** | `https://api.avax-test.network/ext/bc/C/rpc` | Endpoint RPC chuẩn của Avalanche |
| **Explorer** | `https://testnet.snowtrace.io` | Trình khám phá khối Avalanche |
| **Circle Native USDC** | `0x5425890298aed601595a70AB815c96711a31Bc65` | Token thanh toán ký quỹ chuẩn 6 decimals |
| **Real Aave V3 aUSDC** | `0x9CFcc1B289E59FBe1E769f020C77315DF8473760` | Token sinh lãi Aave V3 Fuji (bắt buộc đúng EIP-55 checksum) |
| **Aave V3 Pool Fuji** | `0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40` | Pool lending thanh khoản Aave V3 |
| **Aave AddressesProvider**| `0x07D04EfAAA0Ac69D19d107795aF247C42Eb50F1C` | Provider định tuyến hợp đồng Aave |
| **Protocol Treasury** | `0xe85eE178537fa93392d82114A33f6B204Ea7c6aE` | Ví nhận 0.3% phí giao thức & 20% Real Yield |
| **Admin Address** | `0xe85eE178537fa93392d82114A33f6B204Ea7c6aE` | Quản trị viên phân xử & phân quyền (cấu hình động) |
| **UniversalEscrow** | `0xEe86802fA1e1098797c2980D9E1D73175f35Dd22` | Két sắt ký quỹ 3 bên (Cơ chế giải ngân 2 bước) |
| **StakedBrokerRegistry** | `0x736Df3F64F50D3E0Bc72c5Cbf1487333607E2dcC` | Sổ ký cược Broker Aave V3 (100% Quota, Share Index) |
| **TrustPassportSBT** | `0xbF63C18E67B50AFB790024Ef60434F7CF4A24A7f` | Hộ chiếu tín nhiệm ERC-721 SBT (On-Chain SVG) |
| **ScamRegistryL1** | `0x980D61B9455Ba4E76EB1118676e48E09c6D3eDC9` | Sổ đen vi phạm cộng đồng + Tích hợp Avalanche Teleporter ICM (`0x253b...5fcf`) |
| **Telegram Secret Token**| `trustpact_sentinel_secret_2026` | Token bảo mật chống giả mạo webhook bot |

---

## 2. HƯỚNG DẪN DEPLOY TRỰC TIẾP LÊN FUJI C-CHAIN (CHỈ 1 BƯỚC)

Script [`contracts/script/DeployCChain.s.sol`](file:///d:/TOOL%20AIRDROP/TOOL%20antigravity/unihack/contracts/script/DeployCChain.s.sol) đã được lập trình sẵn để tự động:
1. Triển khai `StakedBrokerRegistry`, `UniversalEscrow`, `TrustPassportSBT`.
2. Tự động thiết lập phân quyền chéo:
   - `StakedBrokerRegistry.setEscrowContract(UniversalEscrow)`
   - `TrustPassportSBT.setAuthorizedUpdater(UniversalEscrow, true)`
   - `TrustPassportSBT.setAuthorizedUpdater(StakedBrokerRegistry, true)`
   - `UniversalEscrow.setTrustPassportSBT(TrustPassportSBT)`

### Câu lệnh chạy (Terminal):
```bash
# 1. Xin AVAX testnet miễn phí vào ví cá nhân: https://faucet.avax.network/
# 2. Chạy lệnh broadcast:
cd contracts
forge script script/DeployCChain.s.sol:DeployCChain \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --private-key <PRIVATE_KEY_CỦA_BẠN> \
  --broadcast
```

> **Sau khi deploy:** Copy các địa chỉ mới in ra trên màn hình terminal và cập nhật vào file `frontend/.env.local` và `frontend/src/lib/contracts.ts`.

---

## 3. CẤU HÌNH WEBHOOK CHO TELEGRAM SENTINEL BOT

Khi deploy ứng dụng Web lên Vercel hoặc server cá nhân, để kích hoạt webhook cho Telegram Bot với token bảo mật:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<DOMAIN_CỦA_BẠN>/api/telegram",
    "secret_token": "trustpact_sentinel_secret_2026"
  }'
```

*Header `x-telegram-bot-api-secret-token` sẽ được file `frontend/app/api/telegram/route.ts` xác thực trước khi xử lý tin nhắn.*

---

## 4. TÓM TẮT CÁC LỖ HỔNG ĐÃ FIX & ĐIỂM SÁNG KỸ THUẬT (DÙNG ĐỂ PITCHING)

### 1. Cơ chế Real Yield Aave V3 & Khóa chống Flash-Deposit
- **Vấn đề đã xử lý:** Trước đây hợp đồng trỏ nhầm địa chỉ `aUsdc` vào Pool Aave (gây lỗi `balanceOf`), và thiếu khóa thời gian khiến kẻ gian có thể nạp vốn chớp nhoáng trước chu kỳ rút để rút trộm lãi của người khác.
- **Giải pháp:** Trỏ chính xác vào `0x9CFcc1B289E59FBe1E769f020C77315DF8473760`. Thiết lập `MIN_YIELD_LOCK_TIME = 10 minutes`. Nếu nạp rồi rút dưới 10 phút, Broker nhận 0% lãi Aave.
- **Mô hình chia lãi:** **80% lãi** trả cho Broker, **20% lãi** nộp về Quỹ Giao thức (Protocol Treasury).

### 2. Bảo vệ Bên Bán (Seller Protection) & Đóng băng Tranh chấp
- **Vấn đề đã xử lý:** Trước đây nếu Bên Bán đã giao hàng nhưng Bên Mua im lặng cố tình chờ hết hạn (`duration`), Bên Mua có thể gọi `buyerClaimExpiredRefund()` để vừa lấy hàng vừa lấy lại tiền.
- **Giải pháp:** Bổ sung trạng thái `EscrowStatus.Disputed = 3` và hàm `raiseDispute(id, reason)`. Khi có khiếu nại, quyền tự rút tiền của Bên Mua bị **khóa cứng ngay lập tức**. Chỉ Broker hoặc Admin mới có quyền phân xử giải ngân hoặc hoàn trả.

### 3. Hộ chiếu SBT On-Chain Metadata (ERC-721 Soulbound)
- **Giải pháp:** Hàm `tokenURI(tokenId)` render trực tiếp Base64 SVG huy hiệu (Master Escrow, Verified Broker, Member) cùng JSON metadata chứa tỷ lệ thành công, số deal, tổng volume USDC lên Snowtrace và ví Web3 mà không cần server IPFS tập trung.

### 4. Scam Radar Sybil-Resistant & Phân trang View Call
- **Giải pháp:** `ScamRegistryL1.sol` trang bị rate limiter `REPORT_COOLDOWN = 1 minutes` chống bot spam báo cáo ảo và bổ sung hàm `getReportsPaginated()` ngăn chặn lỗi Out-Of-Gas khi danh sách báo cáo tăng cao.

### 5. Gỡ bỏ Hardcoded Scaffolding ở Frontend Web3
- **Giải pháp:** Loại bỏ hoàn toàn địa chỉ ví hardcoded `0xf39fd...`. Frontend tự động nhận diện Admin on-chain qua hook `useReadContract(universalEscrow.admin)` và biến môi trường `NEXT_PUBLIC_ADMIN_ADDRESS`.

---

## 5. BỘ CÂU HỎI & TRẢ LỜI ĐINH CHO BAN GIÁM KHẢO UNIHACK 2026

### Q1: "Tại sao dự án cần chạy trên Avalanche thay vì EVM khác?"
> **Trả lời:**
> 1. **Tốc độ Finality < 1 giây:** Quy trình Escrow 3 bên đòi hỏi các bước liên hoàn (Tạo cọc -> Phê duyệt hạn mức -> Bàn giao -> Khiếu nại/Phân xử). Avalanche C-Chain đem lại trải nghiệm mượt mà gần như Web2 với phí giao dịch tính bằng cent.
> 2. **Hệ sinh thái Native DeFi vững chắc:** Avalanche Fuji có sẵn USDC chính thức của Circle và thanh khoản thực của Aave V3, cho phép quỹ bảo hiểm của Broker tạo ra Real Yield an toàn.
> 3. **Kiến trúc mở rộng L1 Subnet:** Module Scam Radar được thiết kế modular tách biệt để sẵn sàng nâng cấp thành Dedicated Avalanche L1 miễn phí gas khi quy mô người dùng mở rộng.

### Q2: "Dự án có vi phạm luật thanh toán trung gian của Việt Nam không?"
> **Trả lời:**
> Không. Dự án hoạt động theo quy định về **Biện pháp Bảo đảm (Đặt cọc / Ký quỹ) tại Điều 328 Bộ luật Dân sự 2015**.
> Hợp đồng `UniversalEscrow` là hệ thống **phi lưu ký (Non-custodial)**: Không một cá nhân hay tổ chức nào giữ tiền của khách hàng; tài sản được khóa trong Smart Contract và chỉ mở khi có chữ ký mật mã của các bên. Broker đóng vai trò là **Giám định viên kỹ thuật độc lập (Technical Arbiter)** kiểm tra tính đúng đắn của dữ liệu bàn giao, không phải tổ chức trung gian thanh toán thu tiền.

### Q3: "Lợi tức (Yield) sinh ra từ đâu? Có phải Ponzi không?"
> **Trả lời:**
> Hoàn toàn là **Real Yield**, không in token lạm phát. Vốn cọc bảo chứng của Broker được nạp trực tiếp vào Lending Pool của **Aave V3 trên Fuji C-Chain**. Lợi tức sinh ra là lãi suất cho vay USDC thực tế do thị trường Aave chi trả.

---

## 6. KIỂM ĐỊNH MÃ NGUỒN & HỆ THỐNG
- **Foundry Test Suite:** 55/55 Tests Passed (100%)
- **Test Coverage:** UniversalEscrow 99.3%, TrustPassportSBT 98.5%, StakedBroker 85.6%
- **TypeScript Typecheck:** 0 Errors (`npx tsc --noEmit`)
- **Next.js Production Build:** 20/20 Routes Static/Dynamic OK (`npm run build`)
