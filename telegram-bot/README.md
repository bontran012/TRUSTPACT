# 🤖 TrustPact Telegram Bot — Scam Radar & SBT Lookup

Bot Telegram tra cứu tức thì danh sách đen lừa đảo (Scam Radar L1) và hộ chiếu tín nhiệm (TrustPassport SBT) trên Avalanche.

---

## ⚡ Các Tính Năng Chính
1. **Tra cứu tức thì**: Nhắn tin `/check <STK/User/Ví>` để kiểm tra độ uy tín trong 1 giây.
2. **Bảo vệ nhóm chat tự động**: Thêm bot vào các nhóm Telegram OTC, khi có thành viên gửi STK ngân hàng lừa đảo, bot sẽ tự động cảnh báo toàn nhóm.
3. **Mở Két Sắt 3 Bên**: Gõ `/pact` để nhận link mở phòng ký quỹ an toàn trực tiếp trên Web DApp.

---

## 🚀 Hướng Dẫn Khởi Chạy Trong 1 Phút

### Bước 1: Tạo Bot trên Telegram
1. Mở Telegram và tìm **`@BotFather`**.
2. Gõ lệnh `/newbot`, đặt tên bot (ví dụ: `TrustPact Radar Bot`) và username (ví dụ: `TrustPactRadarBot`).
3. Sao chép chuỗi mã Token bí mật (HTTP API Token).

### Bước 2: Cài Đặt và Điền Token
1. Sao chép file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Điền Token vào file `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ```

### Bước 3: Chạy Bot
```bash
# Cài đặt thư viện
npm install

# Khởi chạy bot
npm run dev
```

---

## 📝 Danh Sách Lệnh Mẫu
* `/check 1903889922101` — Kiểm tra STK lừa đảo bị tố cáo
* `/check @hoangminh_otc` — Kiểm tra GDTG uy tín đã có SBT bảo chứng
* `/pact` — Hướng dẫn mở phòng Két Sắt ký quỹ bảo vệ tiền
* `/help` — Xem danh sách trợ giúp
