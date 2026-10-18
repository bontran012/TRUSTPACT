# 📋 TRUSTPACT (UYTINNET) — MASTER BLUEPRINT (PROTECTIVE ESCROW PROTOCOL)
### *Giao Thức Ký Quỹ Bảo Vệ 3 Bên, Tín Nhiệm On-Chain & Phân Xử Minh Bạch trên Avalanche*
*(The Universal 3-Party Verifiable Protective Escrow & Dispute Resolution Protocol)*

> **Mục tiêu:** Xây dựng MVP nộp bài thi Avalanche Team1 Vietnam UniHack 2026 (2–30/11/2026).  
> **Track đăng ký:** **Track A: Social Finance (Custom Topic / My Own Idea)**.  
> **Triết lý cốt lõi:**  
> **"Thuận theo tự nhiên — Việc của nền tảng là lo toàn bộ logic bảo vệ 3 bên. Người dùng giao dịch bất cứ thứ gì là quyền của họ, TrustPact đứng ở vai trò hạ tầng bảo vệ dòng tiền, thực thi đúng cam kết và xử lý khiếu nại minh bạch bằng Smart Contract."**

---

## PHẦN I: MA TRẬN LOGIC XỬ LÝ 3 BÊN (BUYER - SELLER - BROKER)

Hệ thống hoạt động như một cỗ máy trạng thái (State Machine) độc lập, phi tập trung và không phụ thuộc vào loại tài sản hay dịch vụ giao dịch:

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
 3. Kiểm tra bàn giao        2. Nhận hạn mức bảo lãnh Quota  3. Cam kết thời hạn
 4. Nhận lại tiền nếu quá    3. Chứng kiến & kiểm tra giao   4. Bàn giao hàng/dịch vụ
    hạn hoặc lỗi từ Seller      nhận theo thỏa thuận 2 bên   5. Nhận tiền sau 0.8 giây
 5. Nút Tố Cáo GDTG lên Sàn  4. Bấm giải ngân hoặc thực thi     khi giao dịch hoàn tất
                                thỏa thuận 2 bên tự chốt
```

---

### 1. Chi Tiết Logic: Mỗi Bên Cần Làm Gì?

#### A. Bên Bán (Seller) cần làm gì?
1. **Tạo kèo hoặc chấp nhận kèo giao dịch:** Nhập thông tin giao dịch (Tên món hàng/dịch vụ, số tiền cần thanh toán, thời hạn cam kết bàn giao).
2. **Thống nhất chọn GDTG:** Hai bên cùng thống nhất chọn 1 người trung gian (GDTG) có Tick Xanh bảo chứng trên sàn.
3. **Tiến hành bàn giao:** Bàn giao tài sản / dịch vụ cho Bên Mua (hoặc thông qua GDTG làm chứng) đúng theo thỏa thuận và đúng thời hạn đã cam kết.
4. **Nhận tiền:** Khi bàn giao xong xuôi, tiền thanh toán sẽ tự động chuyển về ví Bên Bán trong vòng **0.8 giây**.

#### B. Bên Mua (Buyer) cần làm gì?
1. **Tra cứu uy tín trước khi chốt kèo:** Sử dụng công cụ Check Scam Radar để tra cứu SĐT, STK ngân hàng, Telegram handle của Bên Bán và GDTG (Gas 0đ).
2. **Nạp tiền vào Két Sắt Smart Contract (`UniversalEscrow`):** Chuyển tiền cọc/tiền hàng vào hợp đồng. Tiền bị khóa cứng trên blockchain, không ai có thể rút trộm (kể cả Admin sàn hay GDTG).
3. **Tiếp nhận & Kiểm tra bàn giao:** Kiểm tra tài sản/dịch vụ được bàn giao xem có đúng như cam kết ban đầu hay không.
4. **Bảo vệ quyền lợi khi có sự cố:**
   - Nếu Bên Bán ngâm kèo hoặc không bàn giao: GDTG kiểm soát phòng giao dịch, xác minh và bấm nút hoàn 100% tiền cọc cho Bên Mua ngay lập tức.
   - Nếu GDTG không làm được việc, vô trách nhiệm hoặc thông đồng trục lợi: Bên Mua bấm nút tối hậu thư **"TỐ CÁO GDTG LÊN SÀN"** để sàn can thiệp, chém cọc bảo hiểm GDTG đền bù thiệt hại.

#### C. Bên Trung Gian / GDTG (Broker) cần làm gì?
1. **Nạp cọc bảo hiểm (Staked Bond):** GDTG nạp một khoản tiền cọc bảo hiểm (USDC) vào Smart Contract (`StakedBrokerRegistry`). Nạp bao nhiêu thì hệ thống cấp hạn mức bảo lãnh tối đa bấy nhiêu (`allocateQuota`). Có cọc bảo hiểm thì mới được cấp Tick Xanh uy tín.
2. **Kiểm soát & Điều phối phòng giao dịch:** Tham gia phòng giao dịch 3 bên, giám sát quá trình bàn giao giữa hai bên.
3. **Thực thi phân chia tiền:**
   - **Khi giao dịch hoàn tất:** Bấm nút `brokerConfirmDelivery` để Smart Contract tự động giải ngân cho Bên Bán và nhận phí dịch vụ 1.5%.
   - **Khi Bên Bán ngâm kèo / không bàn giao:** GDTG bấm nút `brokerRefundBuyer` để hoàn trả 100% tiền cọc cho Bên Mua ngay lập tức.
   - **Khi có phát sinh trục trặc:** Đóng vai trò cầu nối để hai bên tự đàm phán. Khi hai bên đã chốt xong con số, GDTG nhập đúng số tiền vào nút `brokerMediateSettlement` để hợp đồng chia/hoàn tiền theo đúng thỏa thuận của hai bên.

---

### 2. Khi Hoàn Tất Giao Dịch, Hệ Thống Làm Gì Cho Họ?

Khi giao dịch thành công, Smart Contract tự động thực thi các nghiệp vụ sau trong **0.8 giây**:
1. **Giải ngân tiền hàng:** Chuyển tiền trực tiếp từ Két sắt về ví Bên Bán.
2. **Trả phí dịch vụ cho GDTG:** Trích 1.5% phí hoa hồng chuyển thẳng về ví GDTG.
3. **Thu phí sàn tối thiểu:** Trích 0.3% phí giao dịch về quỹ Treasury nền tảng.
4. **Giải phóng Hạn Mức (Quota) cho GDTG:** Hệ thống tự động mở lại hạn mức bảo lãnh tương ứng để GDTG tiếp tục nhận các kèo trung gian mới (`releaseQuota`).
5. **Cập nhật Điểm Tín Nhiệm On-Chain (Trust Passport SBT):**
   - Tăng số đơn thành công (`+1 successful deal`) cho cả Bên Bán và GDTG.
6. **Chi trả Lãi Suất Két Sắt (Yield Vault - nếu thỏa điều kiện kép: kỳ hạn >= 30 ngày VÀ cọc >= 500 USDC):** Hợp đồng tự động rút gốc + lãi từ Aave V3: 80% tiền lãi kết chuyển cho Người nạp cọc (bù đắp chi phí/lạm phát), 20% tiền lãi chuyển về Quỹ Treasury của nền tảng (phí quản lý).

---

### 3. Khi Khiếu Nại & Tranh Chấp, Hệ Thống Xử Lý Như Thế Nào?

Hệ thống thiết kế cơ chế bảo vệ 3 tầng rõ ràng, đảm bảo tiền không bao giờ bị chiếm dụng oan uổng:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CƠ CHẾ KIỂM SOÁT CỦA GDTG & XỬ LÝ KHIẾU NẠI TRÊN SÀN        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. GDTG KIỂM SOÁT TRONG PHÒNG GIAO DỊCH:                                    │
│ - Bàn giao thành công: GDTG bấm giải ngân cho Bên Bán (`brokerConfirmDelivery`)│
│ - Bên Bán ngâm kèo / không bàn giao: GDTG xác minh và bấm nút hoàn 100%     │
│   tiền cho Bên Mua ngay lập tức (`brokerRefundBuyer`).                      │
│ - Có phát sinh trục trặc: Hai bên tự trao đổi, đàm phán phương án           │
│   (hoàn cọc, gia hạn, hoặc chia tỷ lệ). GDTG bấm nút thực thi đúng thỏa thuận│
│   hai bên đã chốt (`brokerMediateSettlement`).                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. KHI GDTG KHÔNG LÀM ĐƯỢC VIỆC / GIAN DỐI (TÒA ÁN SÀN & CHÉM CỌC):        │
│ - Nếu GDTG vô trách nhiệm, ngâm kèo, lặn mất hoặc thông đồng trục lợi:      │
│ - Người dùng bấm nút tối hậu thư "TỐ CÁO GDTG LÊN SÀN" kèm log chat chứng cứ│
│ - Sàn kiểm tra bằng chứng vi phạm rõ ràng:                                  │
│ - Sàn gọi lệnh `adminSlashCorruptBroker`:                                    │
│   + Hoàn trả 100% tiền cọc gốc cho Bên Mua.                                 │
│   + Chém thẳng một khoản tiền từ CỌC BẢO HIỂM của GDTG đền bù cho nạn nhân! │
│   + Tước Tick Xanh vĩnh viễn, khóa hạn mức và đưa địa chỉ GDTG vào Sổ Đen.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN II: CHI TIẾT 5 PHÂN HỆ SẢN PHẨM HOÀN CHỈNH SẼ XÂY DỰNG

```
                             HỆ SINH THÁI TRUSTPACT
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
    [ PHÂN HỆ 1 ]                [ PHÂN HỆ 2 ]                [ PHÂN HỆ 3 ]
   CHECK SCAM RADAR            PHÒNG GIAO DỊCH 3 BÊN         ĐẤU GIÁ CỌC MINH BẠCH
   & HỒ SƠ TÍN NHIỆM          (Buyer - GDTG - Seller)        (Khi Cung < Cầu)
 - Tra cứu SĐT/STK/Telegram   - Khóa tiền két sắt            - Mở phiên đấu thầu cọc
   (Gas 0đ trên Custom L1)    - GDTG chứng kiến giao nhận    - Khóa cọc thầu (Bid bond)
 - Tỷ lệ thành công %         - GDTG bấm nút giải ngân       - Hoàn người thua < 1s
 - Cọc bảo hiểm đang khóa     - GDTG hoàn cọc nếu ngâm      - Chuyển cọc người thắng
 - API x402 cho Bot Telegram  - Tố cáo GDTG lên Sàn             vào Escrow 3 bên
          │                            │                            │
          └────────────────────────────┼────────────────────────────┘
                                       │
          ┌────────────────────────────┴────────────────────────────┐
          ▼                                                         ▼
    [ PHÂN HỆ 4 ]                                             [ PHÂN HỆ 5 ]
   KÉT SẮT & SỔ THU CHI NHÓM                                 KÉT SẮT SINH LỜI THỰC
   (Transparent Group Vault)                                 (YieldVaultAdapter - Aave V3)
 - Nộp tiền ghi sổ thu on-chain                             - Điều kiện kép: >= 30 ngày & >= 500 USDC
 - Tạo lệnh chi kèm hóa đơn IPFS                            - Lãi thực tế 4% – 6%/năm trên Aave V3
 - Duyệt N/M thành viên (Multi-Approval)                    - Người nạp cọc nhận 80% tiền lãi
 - Đủ duyệt tự động xuất tiền                               - Nền tảng (chúng ta) thu 20% phí quản lý
```

---

### 1. PHÂN HỆ 1: CHECK SCAM RADAR & SOULBOUND TRUST PASSPORT (Phòng Bệnh Trước Khi Giao Dịch)
* **Bản chất & Mục tiêu:** Giải quyết khâu phòng ngừa rủi ro trước khi hai bên bước vào giao dịch. Cung cấp công cụ kiểm tra độ uy tín và lịch sử gian lận của đối tác hoàn toàn minh bạch.
* **Cơ chế Tra Cứu & Tố Cáo Trên Avalanche Custom L1 (Gas 0 đồng):**
  * Lưu trữ dữ liệu danh sách đen (SĐT, STK ngân hàng, Username Telegram, địa chỉ ví gian lận) trên Custom L1 Subnet (`ScamRegistryL1.sol`).
  * Người dùng cộng đồng tra cứu và gửi báo cáo tố cáo lừa đảo kèm chứng cứ hoàn toàn **miễn phí gas 100%** (không tốn chi phí giao dịch).
* **Cổng API Chuẩn x402 (Nguồn thu vi mô cho nền tảng):**
  * Tích hợp chuẩn x402 Micropayments trên Avalanche: Các bot Telegram, web check scam bên ngoài khi gọi API tra cứu tự động sẽ thanh toán vi mô **0.01 USDC / lượt tra cứu**. Tạo dòng doanh thu tự động cho giao thức.
* **Hộ Chiếu Tín Nhiệm On-Chain (Trust Passport Soulbound Token - SBT):**
  * Mỗi người dùng và GDTG sau các giao dịch thành công sẽ được mint/update huy hiệu SBT gắn chặt với địa chỉ ví (không thể chuyển nhượng, không thể làm giả).
  * Công khai các chỉ số: Số đơn hoàn tất thành công, tỷ lệ thành công (%), số tiền bảo chứng đang khóa trong hệ thống.

---

### 2. PHÂN HỆ 2: PHÒNG GIAO DỊCH 3 BÊN BẢO VỆ TOÀN NĂNG (`UniversalEscrow` & `StakedBrokerRegistry`)
* **Bản chất & Triết lý vận hành:**
  * Là trái tim của toàn bộ giao thức TrustPact. Smart Contract đóng vai trò két sắt giữ tiền 3 bên: **Bên Mua (Người trả tiền) — Bên Trung Gian (GDTG/Cò có cọc bảo hiểm) — Bên Bán (Người giao hàng/dịch vụ)**.
  * **Thuận theo tự nhiên:** Nền tảng không can thiệp nội dung giao dịch (người dùng giao dịch tài sản số, code, acc game, đồ công nghệ cũ, vé hay bất cứ thứ gì là quyền của họ). Việc của nền tảng là lo toàn bộ logic bảo vệ an toàn dòng tiền.
* **Cơ chế Cọc Bảo Hiểm & Hạn Mức Quota Động Cho GDTG (`StakedBrokerRegistry`):**
  * GDTG bắt buộc nạp tiền cọc bảo hiểm (USDC) vào Smart Contract thì mới được cấp Tick Xanh và cấp hạn mức bảo lãnh tương ứng (`stakedBalance >= activeHoldingAllocated`).
* **Luồng Giao Dịch Chuẩn Khi Hoàn Tất:**
  * Bên Mua nạp tiền khóa vào két sắt $\rightarrow$ Tiền bị khóa cứng, không một ai (kể cả Admin sàn hay GDTG) có thể tự ý rút trộm.
  * Hai bên bàn giao xong xuôi $\rightarrow$ GDTG bấm nút xác nhận (`brokerConfirmDelivery`) $\rightarrow$ Smart Contract tự động giải ngân cho Bên Bán trong **0.8 giây**, trả 1.5% phí hoa hồng cho GDTG, thu 0.3% phí sàn và giải phóng Quota cho GDTG.
* **Cơ Chế 3 Cấp Độ Bảo Vệ Khi Có Trục Trặc Hoặc Khiếu Nại:**
  * **Cấp 1 — Tự do đàm phán giải quyết:** Khi có lỗi phát sinh, hai bên tự trao đổi và thống nhất phương án xử lý thực tế (Hủy kèo hoàn cọc 100% cho bên mua; gia hạn khắc phục; hoặc thống nhất tỷ lệ phân chia cọc). GDTG làm chứng và bấm nút `brokerMediateSettlement` để Smart Contract thực thi đúng con số hai bên đã chốt.
  * **Cấp 2 — Bên bán ngâm kèo / không giao / mất tích (GDTG bấm hoàn tiền ngay):** GDTG kiểm soát toàn bộ phòng giao dịch, khi xác minh Bên Bán không giao đúng hẹn hoặc bùng kèo $\rightarrow$ GDTG bấm nút `brokerRefundBuyer` để **hoàn 100% tiền cọc về ví Bên Mua ngay lập tức**, giải phóng Quota hạn mức mà không cần chờ đợi bất kỳ bộ đếm thời gian nào!
  * **Cấp 3 — GDTG gian dối / thông đồng trục lợi (Tòa án sàn & Chém cọc):** Người dùng bấm nút **"TỐ CÁO GDTG LÊN SÀN"** kèm chứng cứ chat $\rightarrow$ Sàn kiểm tra vi phạm và gọi lệnh `adminSlashCorruptBroker`: Hoàn 100% tiền gốc cho Bên Mua, **chém thẳng từ CỌC BẢO HIỂM của GDTG đền bù cho nạn nhân**, tước Tick Xanh vĩnh viễn và đưa vào sổ đen on-chain.

---

### 3. PHÂN HỆ 3: ĐẤU THẦU CỌC MINH BẠCH THỰC CHIẾN (`AuctionEscrow`)
* **Bản chất & Mục tiêu:** Giải quyết các tình huống thị trường có sự cạnh tranh gay gắt: Hoặc nhiều người tranh mua 1 tài sản hiếm (Cung < Cầu), hoặc nhiều bên tranh nhận 1 công việc/gói thầu (Cầu < Cung).
* **Quy Tắc Vận Hành Đanh Thép (Bỏ Toàn Bộ Lý Thuyết Gia Hạn Giờ Rườm Rà):**
  * **Hạn chót CỐ ĐỊNH (Fixed-Deadline):** Phiên đấu giá kết thúc đúng thời điểm đã định (`endTime`). Hết giờ là chốt phiên ngay lập tức, **ai trả giá cao nhất khi hết giờ là thắng luôn ("trả giá cao là ăn")**. Tuyệt đối không kéo dài lê thê làm phiền người dùng.
  * **Bước giá tối thiểu (`minBidIncrement`):** Bắt buộc lượt trả giá sau phải cao hơn lượt trước ít nhất một khoản quy định (ví dụ tối thiểu $10 hoặc 5%), loại bỏ hoàn toàn trò spam 1 đồng lẻ.
  * **Cọc bảo chứng nạp trước (`bidBond`):** Bắt buộc mọi người tham gia đều phải nạp cọc trước vào hợp đồng để loại bỏ 100% nick ảo trả giá bừa.
* **Xử Lý Dòng Tiền Tức Thì Sau Khi Chốt Phiên:**
  * **Người Thắng Thầu:** Tiền cọc bảo chứng được **chuyển thẳng (bridge) sang làm tiền cọc trong Phòng Giao Dịch 3 Bên (`UniversalEscrow`)** để kích hoạt quy trình bàn giao. Người thắng không cần chờ đợi hay nạp thêm cọc gì nữa.
  * **Toàn Bộ Người Thua:** Hợp đồng cho phép **rút lại 100% tiền cọc ngay lập tức** qua hàm `claimRefund` với độ phức tạp $O(1)$ gas (không lo nghẽn mạng).

#### Chi Tiết 2 Loại Hình & Danh Mục Đấu Giá Thực Tế:
* **Loại 1: Forward Auction (Đấu giá cạnh tranh thuận):**
  * *Bản chất:* Người bán đưa tài sản lên sàn (Kênh YouTube/TikTok, Domain đẹp, Acc game VIP, Đồ công nghệ/Xe cũ, Vé VIP concert, Lô hàng thanh lý). Người mua tranh nhau trả giá cao nhất để sở hữu.
* **Loại 2: Reverse Job Bidding (Đấu thầu cạnh tranh ngược):**
  * *Bản chất:* Chủ dự án đăng bài cần thuê ngoài (Thuê Dev viết tool MMO/bot/web, Outsource thiết kế phần mềm, Thương lái đấu thầu mua trọn vườn nông sản). Các bên nhận việc nạp cọc đấu thầu giá rẻ và cam kết tiến độ để giành quyền làm việc.

---

### 4. PHÂN HỆ 4: KÉT SẮT & SỔ THU CHI NHÓM MINH BẠCH (`CommunityFund` & `CommunityFundFactory`)
* **Bản chất (Bỏ Sạch Lý Thuyết DAO Hàn Lâm):**
  * Không áp dụng cơ chế DAO lý thuyết (Moloch, Ragequit, Timelock 48h, Guardian Veto...).
  * Nền tảng chỉ cung cấp giải pháp thực tế: **Két sắt giữ tiền chung an toàn (Non-custodial Group Vault)** và **Sổ thu chi sao kê on-chain từng xu theo thời gian thực (Real-time Audit Log)**.
  * Nhóm dùng vào việc gì (quỹ team dev chi trả server Cloud, quỹ phòng trọ chung tiền điện nước, quỹ dự án MMO, quỹ lớp, quỹ gia đình...) hoàn toàn do người dùng tự quyết!
* **Quy Trình Vận Hành 3 Bước Đơn Giản & Minh Bạch:**
  * **Bước 1 — Nộp tiền vào quỹ (`deposit`):** Bất kỳ ai nộp tiền vào két sắt đều được ghi nhận công khai trên blockchain (ai nộp, nộp bao nhiêu, nội dung/lời nhắn gì).
  * **Bước 2 — Tạo lệnh chi tiêu (`createSpendRequest`):** Thành viên nhóm tạo đề xuất rút tiền kèm địa chỉ người nhận, số tiền, lý do chi tiêu và link ảnh hóa đơn/chứng từ (IPFS).
  * **Bước 3 — Duyệt chi đa chữ ký (Multi-Approval N/M):** Nhóm tự quy định cần bao nhiêu thành viên bấm duyệt (ví dụ: cần 2 trên 3 thành viên bấm Duyệt). Khi đủ số người bấm duyệt, Smart Contract **ngay lập tức tự động chuyển tiền thẳng cho người nhận** và cập nhật trạng thái `Executed`.
* **Nhà Máy Khởi Tạo Nhanh (`CommunityFundFactory`):**
  * Cho phép bất kỳ hội nhóm nào khởi tạo một quỹ nhóm minh bạch trên Avalanche chỉ với 1 giao dịch, khai báo danh sách ví thành viên và số lượt duyệt cần thiết.

---

### 5. PHÂN HỆ 5: KÉT SẮT SINH LỜI THỰC TẾ (`YieldVaultAdapter` - Aave V3)
* **Bản chất & Nguồn Tiền Sinh Lời (Real Yield):**
  * Tiền cọc nhàn rỗi nằm chờ trong Smart Contract được tự động kết nối vào **Aave V3 Lending Pool trên Avalanche** để hưởng lãi suất thực tế từ những người vay thế chấp tài sản (Supply APY dao động **4% – 6%/năm**).
  * Lãi sinh ra liên tục **từng giây (Continuous Compounding per Second)** trên blockchain. Tuyệt đối không in token lạm phát để trả lãi.
* **Điều Kiện Kép Bắt Buộc Để Kích Hoạt Sinh Lời (Chống Lỗ Phí Gas):**
  * **Điều kiện 1:** Thời gian giữ cọc $\ge$ **30 NGÀY**.
  * **Điều kiện 2:** Số tiền cọc $\ge$ **500 USDC**.
  * *(Nếu thiếu 1 trong 2 điều kiện: Giữ nguyên USDC tĩnh trong két sắt Escrow $\rightarrow$ 100% không tốn phí gas phụ, giải ngân tức thì trong 0.8 giây).*
* **Nguyên Tắc Ăn Chia Tiền Lãi (80% / 20%):**
  * **Người Nạp Cọc (Thằng bỏ vốn) hưởng 80% TIỀN LÃI:** Tiền cọc không bị chôn vốn chết, tự đẻ ra lợi nhuận giúp bù đắp chi phí/phí sàn.
  * **Nền tảng (Chúng ta) thu 20% TIỀN LÃI:** Đây là phí quản lý hiệu suất (Performance Fee), tạo dòng doanh thu thụ động ròng cho giao thức.
* **Phân Định Rõ Ràng Đối Tượng & Dòng Tiền Cho 3 Nguồn Tiền Lớn:**

| Nguồn Tiền Cọc | Người Bỏ Vốn Nạp Cọc | Người Nhận Vốn Gốc Khi Xong | Người Nhận 80% Tiền Lãi | Người Nhận 20% Tiền Lãi |
|---|---|---|---|---|
| **1. Kèo Escrow 3 bên** (`UniversalEscrow`) | **Bên Mua (Buyer)** | **Bên Bán** *(nếu thành công)*<br>hoặc **Bên Mua** *(nếu hủy kèo)* | **Bên Mua (Buyer)** *(thằng bỏ vốn)* | **Nền tảng (Chúng ta)** |
| **2. Cọc bảo hiểm GDTG** (`StakedBrokerRegistry`) | **GDTG (Broker)** | **GDTG** *(khi unstake rút cọc)* | **GDTG (Broker)** *(thằng bỏ vốn)* | **Nền tảng (Chúng ta)** |
| **3. Két sắt Quỹ nhóm** (`CommunityFund`) | **Thành viên Hội nhóm** | **Bên nhận chi / Vendor** *(khi duyệt chi)* | **Nhập thẳng vào Két sắt Quỹ nhóm** | **Nền tảng (Chúng ta)** |

---

## PHẦN III: QUY TRÌNH KỸ THUẬT VẬN HÀNH THỰC TẾ (STEP-BY-STEP)

### Bước 1: Tra cứu & Kiểm tra Tín Nhiệm (Gas 0đ)
1. Người dùng truy cập TrustPact, nhập thông tin đối tác (SĐT, STK ngân hàng, Telegram handle):
   - Hệ thống quét trên mạng lưới `ScamRegistryL1` (Subnet gas 0đ).
   - Nếu có lịch sử xấu: Cảnh báo ngay lập tức.
   - Nếu có hồ sơ uy tín: Hiển thị số đơn đã hoàn tất, tỷ lệ thành công, số tiền cọc bảo hiểm đang khóa.

### Bước 2: Tạo Kèo Ký Quỹ (`/pact/create`)
1. Bên Mua hoặc Bên Bán mở giao diện tạo kèo:
   - Điền: Nội dung giao dịch, số tiền thanh toán, thời hạn bàn giao.
   - Chọn GDTG: Chọn 1 GDTG uy tín có sẵn trên sàn hoặc điền địa chỉ ví của GDTG đã thống nhất.
2. Bấm **[Tạo Kèo]** $\rightarrow$ Hệ thống sinh ra 1 đường link duy nhất: `trustpact.vn/pact/[id]`.
   *(Mỗi phòng giao dịch có ID duy nhất gắn liền với Smart Contract trên blockchain, triệt tiêu 100% nạn clone nick mạo danh).*

### Bước 3: Nạp tiền vào Két Sắt (`/pact/[id]`)
1. Cả 3 bên cùng truy cập link phòng giao dịch:
   - Bên Mua quét mã chuyển tiền (USDC) vào Smart Contract `UniversalEscrow`.
   - Hạn mức bảo lãnh của GDTG bị trừ tương ứng trên hệ thống (`allocateQuota`).
   - Phòng chat 3 bên được mở ra để trao đổi và lưu trữ bằng chứng.

### Bước 4: Bàn giao & Giải quyết (GDTG Kiểm Soát Toàn Bộ Phòng Giao Dịch)
1. **Bàn giao thành công:** Hai bên xác nhận xong $\rightarrow$ GDTG bấm **"Xác nhận bàn giao"** (`brokerConfirmDelivery`) $\rightarrow$ Tiền về ví Bên Bán trong 0.8 giây, GDTG nhận 1.5% phí hoa hồng (hoặc Bên Mua tự bấm `buyerConfirmDelivery`).
2. **Có trục trặc / Thỏa thuận lại:** Hai bên tự do đàm phán phương án $\rightarrow$ GDTG bấm **"Thực thi thỏa thuận đàm phán"** (`brokerMediateSettlement`) $\rightarrow$ Hợp đồng phân chia tiền theo đúng con số hai bên đã chốt.
3. **Bên Bán ngâm kèo / bùng kèo / mất tích:** GDTG kiểm soát phòng giao dịch, xác minh và bấm nút **"Hoàn tiền cho Bên Mua"** (`brokerRefundBuyer`) $\rightarrow$ 100% tiền cọc hoàn về ví Bên Mua ngay lập tức, không để giam vốn.
4. **GDTG không làm được việc / vô trách nhiệm / gian dối:** Người dùng bấm **"TỐ CÁO GDTG LÊN SÀN"** $\rightarrow$ Sàn (chúng ta) can thiệp xử lý, gọi lệnh `adminSlashCorruptBroker`: Hoàn 100% tiền cho Bên Mua và **chém cọc bảo hiểm của GDTG đền bù cho nạn nhân**!

---

## PHẦN IV: CẤU TRÚC DỰ ÁN & MÃ NGUỒN SMART CONTRACTS CHI TIẾT

```
trustpact/
├── contracts/                        # Foundry project — Smart contracts trên Avalanche
│   ├── foundry.toml
│   ├── src/
│   │   ├── core/
│   │   │   ├── StakedBrokerRegistry.sol # Quản lý Cọc Bảo Hiểm GDTG, Quota hạn mức & Slashing
│   │   │   ├── DelegationManager.sol    # Đăng ký thông tin giao dịch & Duyệt ủy quyền GDTG
│   │   │   ├── UniversalEscrow.sol      # Két sắt 3 bên (GDTG kiểm soát: Giải ngân, Hoàn tiền, Đàm phán; Sàn chém cọc GDTG nếu gian dối)
│   │   │   ├── AuctionEscrow.sol        # Đấu giá cọc minh bạch, hoàn tiền người thua < 1s
│   │   │   ├── CommunityFund.sol        # Két sắt nhóm & Sổ thu chi minh bạch (Multi-approval & Real-time audit log)
│   │   │   └── YieldVaultAdapter.sol    # Kết nối Aave/Benqi sinh lãi 4-6%/năm trên tiền cọc nhàn rỗi
│   │   ├── reputation/
│   │   │   └── TrustPassportSBT.sol     # Hồ sơ tín nhiệm Soulbound (Số đơn, % thành công, Hạn mức)
│   │   ├── scam-radar/
│   │   │   └── ScamRegistryL1.sol       # Sổ đen Check Scam (Deploy trên Custom L1 gas 0đ)
│   │   └── interfaces/
│   │       ├── IBrokerRegistry.sol
│   │       ├── IDelegation.sol
│   │       ├── IUniversalEscrow.sol
│   │       ├── IAuctionEscrow.sol
│   │       └── ICommunityFund.sol
│   ├── test/
│   │   ├── StakedBroker.t.sol           # Test nạp cọc, rút cọc, kiểm soát quota, slash cọc
│   │   ├── DelegationManager.t.sol      # Test đăng ký giao dịch, GDTG xin nhận kèo, duyệt ủy quyền
│   │   ├── UniversalEscrow.t.sol        # Test quy trình 3 bên, thực thi thỏa thuận, tố cáo GDTG
│   │   ├── AuctionEscrow.t.sol          # Test mở thầu, nộp bid bond, hoàn tiền người thua
│   │   ├── CommunityFund.t.sol          # Test nộp quỹ, tạo đề xuất chi, vote giải ngân
│   │   └── ScamRegistryL1.t.sol         # Test tố cáo và tra cứu sổ đen
│   └── script/
│       ├── DeployCChain.s.sol
│       └── DeployL1.s.sol
│
├── l1-network/                       # Custom L1 Config (Avalanche CLI)
│   ├── genesis.json                  # Genesis block cho Trust L1 (Token gas: TPACT miễn phí)
│   └── README.md
│
├── x402-service/                     # Cổng API Check Scam chuẩn x402 (Thu phí 0.01 USDC)
│   ├── src/
│   │   ├── server.ts
│   │   └── x402-middleware.ts
│   └── package.json
│
├── app/                              # Next.js 14 Frontend PWA
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Trang chủ: Tra cứu SĐT/STK/Telegram Check Scam & Điểm Tín Nhiệm
│   │   │   ├── pact/
│   │   │   │   ├── create/page.tsx   # Bên mua/bán tạo kèo & chọn 1 GDTG uy tín
│   │   │   │   └── [id]/page.tsx     # Phòng giao dịch 3 bên: chat, nạp cọc, GDTG bàn giao, tố cáo
│   │   │   ├── listing/
│   │   │   │   ├── create/page.tsx   # Đăng bài giao dịch
│   │   │   │   └── [id]/page.tsx     # GDTG xin nhận bảo lãnh & Chủ kèo duyệt ủy quyền
│   │   │   ├── broker/
│   │   │   │   └── stake/page.tsx    # Nơi GDTG nạp cọc bảo hiểm lấy Tick Xanh & Quota
│   │   │   ├── auction/
│   │   │   │   └── [id]/page.tsx     # Sàn đấu giá cọc thời gian thực
│   │   │   ├── funds/
│   │   │   │   └── [id]/page.tsx     # Dashboard Quỹ Nhóm: nộp quỹ, vote chi tiêu
│   │   │   └── admin/
│   │   │       └── disputes/page.tsx # Tòa án Tối cao: Sàn xem chứng cứ và chém cọc GDTG gian dối
│   │   └── components/
│   └── package.json
│
└── docs/
    ├── pitch-deck.md
    └── demo-script.md
```

---

## PHẦN V: THIẾT KẾ CÁC SMART CONTRACTS CỐT LÕI (SOLIDITY CODE)

### 1. `StakedBrokerRegistry.sol` — Quản Lý Cọc Bảo Hiểm GDTG, Quota Động & Slashing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title StakedBrokerRegistry — Quản lý Cọc Bảo Hiểm GDTG & Kiểm Soát Hạn Mức Bảo Lãnh
contract StakedBrokerRegistry is ReentrancyGuard {

    IERC20 public immutable usdc;
    
    struct BrokerProfile {
        uint256 stakedBalance;          // Tiền cọc bảo hiểm đang khóa (USDC)
        uint256 activeHoldingAllocated; // Tiền đang bảo lãnh cho các đơn đang chạy (Quota)
        uint256 successfulDeals;        // Số đơn hoàn tất thành công
        uint256 slashedCount;           // Số lần bị xử phạt bồi thường
        bool isVerified;                // Tick xanh bảo chứng
        uint256 lastActiveTimestamp;
    }

    mapping(address => BrokerProfile) public brokers;
    address public escrowContract;
    address public admin;

    event BrokerStaked(address indexed broker, uint256 amount, uint256 totalStake);
    event BrokerUnstaked(address indexed broker, uint256 amount);
    event StakeSlashed(address indexed broker, address indexed victim, uint256 compensation);

    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "Only Escrow allowed");
        _;
    }

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        admin = msg.sender;
    }

    function setEscrowContract(address _escrow) external {
        require(msg.sender == admin, "Only admin");
        escrowContract = _escrow;
    }

    /// @notice GDTG nạp một khoản cọc bảo hiểm bất kỳ (tùy hạn mức mong muốn, _amount > 0)
    function stakeInsurance(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Stake amount must be > 0");
        usdc.transferFrom(msg.sender, address(this), _amount);

        BrokerProfile storage b = brokers[msg.sender];
        b.stakedBalance += _amount;
        b.isVerified = true;
        b.lastActiveTimestamp = block.timestamp;

        emit BrokerStaked(msg.sender, _amount, b.stakedBalance);
    }

    /// @notice Rút cọc bảo hiểm (Chỉ được rút phần tiền KHÔNG vướng bận kèo nào đang mở)
    function unstakeInsurance(uint256 _amount) external nonReentrant {
        BrokerProfile storage b = brokers[msg.sender];
        require(b.stakedBalance - b.activeHoldingAllocated >= _amount, "Stake is backing active deals");

        b.stakedBalance -= _amount;
        if (b.stakedBalance == 0) {
            b.isVerified = false;
        }

        usdc.transfer(msg.sender, _amount);
        emit BrokerUnstaked(msg.sender, _amount);
    }

    /// @notice Khóa hạn mức khi GDTG nhận bảo lãnh 1 kèo mới (Chặn ôm kèo vượt cọc)
    function allocateQuota(address _broker, uint256 _dealAmount) external onlyEscrow returns (bool) {
        BrokerProfile storage b = brokers[_broker];
        if (!b.isVerified || b.stakedBalance < b.activeHoldingAllocated + _dealAmount) {
            return false;
        }
        b.activeHoldingAllocated += _dealAmount;
        b.lastActiveTimestamp = block.timestamp;
        return true;
    }

    /// @notice Giải phóng hạn mức khi kèo hoàn tất
    function releaseQuota(address _broker, uint256 _dealAmount) external onlyEscrow {
        BrokerProfile storage b = brokers[_broker];
        if (b.activeHoldingAllocated >= _dealAmount) {
            b.activeHoldingAllocated -= _dealAmount;
        }
        b.successfulDeals++;
        b.lastActiveTimestamp = block.timestamp;
    }

    /// @notice Chặt cọc bảo hiểm của GDTG đền bù cho nạn nhân khi GDTG gian lận / thông đồng
    function slashBroker(address _broker, address _victim, uint256 _compensation) external onlyEscrow nonReentrant {
        BrokerProfile storage b = brokers[_broker];
        require(b.stakedBalance >= _compensation, "Insufficient stake to slash");

        b.stakedBalance -= _compensation;
        if (b.activeHoldingAllocated >= _compensation) {
            b.activeHoldingAllocated -= _compensation;
        }
        b.slashedCount++;
        b.lastActiveTimestamp = block.timestamp;

        usdc.transfer(_victim, _compensation);
        emit StakeSlashed(_broker, _victim, _compensation);
    }
}
```

---

### 2. `DelegationManager.sol` — Đăng Ký Giao Dịch & Duyệt Ủy Quyền GDTG (Anti-Scam Listing)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DelegationManager — Quản lý đăng ký giao dịch và ủy quyền GDTG
contract DelegationManager is ReentrancyGuard {

    struct ListingItem {
        uint256 id;
        address owner;                  // Chủ tài sản / Người bán
        string title;                   // Tên món hàng / dịch vụ giao dịch
        bytes32 metadataHash;           // Hash chi tiết lưu trên IPFS
        uint256 expectedPrice;          // Số tiền thanh toán
        bool isActive;
    }

    struct BrokerDelegation {
        address broker;
        uint256 commitmentBond;         // Tiền cọc cam kết bảo lãnh cho đơn này
        bool isApprovedByOwner;         // Chủ đơn đã duyệt ủy quyền
        bool isActive;
    }

    mapping(uint256 => ListingItem) public listings;
    mapping(uint256 => mapping(address => BrokerDelegation)) public delegations;
    uint256 public listingCounter;

    event ListingCreated(uint256 indexed id, address indexed owner, string title);
    event BrokerRequested(uint256 indexed listingId, address indexed broker, uint256 commitmentBond);
    event BrokerApproved(uint256 indexed listingId, address indexed broker);

    /// @notice Bước 1: Bên Bán đăng ký đơn giao dịch lên hệ thống
    function createListing(
        string calldata _title,
        bytes32 _metadataHash,
        uint256 _expectedPrice
    ) external returns (uint256) {
        listingCounter++;
        listings[listingCounter] = ListingItem({
            id: listingCounter,
            owner: msg.sender,
            title: _title,
            metadataHash: _metadataHash,
            expectedPrice: _expectedPrice,
            isActive: true
        });

        emit ListingCreated(listingCounter, msg.sender, _title);
        return listingCounter;
    }

    /// @notice Bước 2: GDTG bấm xin nhận trung gian đơn này & cam kết trách nhiệm
    function requestDelegation(uint256 _listingId, uint256 _commitmentBond) external {
        require(listings[_listingId].isActive, "Listing inactive");
        require(listings[_listingId].owner != msg.sender, "Owner cannot be broker");

        delegations[_listingId][msg.sender] = BrokerDelegation({
            broker: msg.sender,
            commitmentBond: _commitmentBond,
            isApprovedByOwner: false,
            isActive: true
        });

        emit BrokerRequested(_listingId, msg.sender, _commitmentBond);
    }

    /// @notice Bước 3: Bên Bán duyệt xác nhận ủy quyền chính thức cho GDTG
    function approveBroker(uint256 _listingId, address _broker) external {
        require(listings[_listingId].owner == msg.sender, "Only owner can approve");
        require(delegations[_listingId][_broker].isActive, "No active request");

        delegations[_listingId][_broker].isApprovedByOwner = true;
        emit BrokerApproved(_listingId, _broker);
    }
}
```

---

### 3. `UniversalEscrow.sol` — Két Sắt 3 Bên & Xử Lý Tranh Chấp (Buyer - GDTG - Seller)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IStakedBrokerRegistry {
    function slashBroker(address _broker, address _victim, uint256 _compensation) external;
    function releaseQuota(address _broker, uint256 _dealAmount) external;
}

/// @title UniversalEscrow — Phòng Ký Quỹ 3 Bên (Buyer - Staked GDTG - Seller)
contract UniversalEscrow is ReentrancyGuard {

    enum EscrowStatus { Active, Completed, Cancelled }

    struct EscrowItem {
        uint256 id;
        address payable buyer;          // Người mua / Người thuê / Bên nạp tiền
        address payable seller;         // Người bán / Người cung cấp dịch vụ
        address broker;                 // GDTG bảo chứng
        uint256 amount;                 // Tiền cọc/tiền hàng (USDC)
        uint256 duration;               // Thời hạn bàn giao
        uint256 startTime;
        EscrowStatus status;
        bool buyerCancelApproved;
        bool sellerCancelApproved;
    }

    IERC20 public immutable usdc;
    uint256 public constant PROTOCOL_FEE_BPS = 30;          // 0.3% phí sàn
    uint256 public constant BROKER_FEE_BPS = 150;           // 1.5% phí hoa hồng cho GDTG
    address public treasury;
    address public brokerRegistry;

    mapping(uint256 => EscrowItem) public escrows;
    uint256 public counter;

    event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, address broker, uint256 amount);
    event RefundExecuted(uint256 indexed id, uint256 amount);
    event AutoRefundTriggered(uint256 indexed id, uint256 amount);
    event SettlementExecuted(uint256 indexed id, uint256 paidToSeller, uint256 returnedToBuyer);
    event EscrowCancelled(uint256 indexed id);
    event BrokerSlashedViaEscrow(uint256 indexed id, address indexed broker, uint256 compensation);

    constructor(address _usdc, address _treasury, address _brokerRegistry) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
        brokerRegistry = _brokerRegistry;
    }

    /// @notice 1. Bên Mua nạp tiền vào Két sắt 3 bên
    function createEscrow(
        address payable _seller,
        address _broker,
        uint256 _amount,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(_amount > 0, "Amount > 0");
        usdc.transferFrom(msg.sender, address(this), _amount);

        counter++;
        escrows[counter] = EscrowItem({
            id: counter,
            buyer: payable(msg.sender),
            seller: _seller,
            broker: _broker,
            amount: _amount,
            duration: _duration,
            startTime: block.timestamp,
            refundRequestTime: 0,
            status: EscrowStatus.Active,
            buyerCancelApproved: false,
            sellerCancelApproved: false
        });

        emit EscrowCreated(counter, msg.sender, _seller, _broker, _amount);
        return counter;
    }

    /// @notice 1b. Tạo Két sắt 3 bên từ Hợp đồng Đấu thầu (AuctionEscrow Bridge)
    function createEscrowFor(
        address payable _buyer,
        address payable _seller,
        address _broker,
        uint256 _amount,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(_amount > 0, "Amount > 0");
        require(_buyer != address(0), "Invalid buyer address");
        usdc.transferFrom(msg.sender, address(this), _amount);

        counter++;
        escrows[counter] = EscrowItem({
            id: counter,
            buyer: _buyer,
            seller: _seller,
            broker: _broker,
            amount: _amount,
            duration: _duration,
            startTime: block.timestamp,
            refundRequestTime: 0,
            status: EscrowStatus.Active,
            buyerCancelApproved: false,
            sellerCancelApproved: false
        });

        emit EscrowCreated(counter, _buyer, _seller, _broker, _amount);
        return counter;
    }

    /// @notice 2. GDTG XÁC NHẬN BÀN GIAO THÀNH CÔNG: Tiền về Seller, GDTG nhận hoa hồng 1.5%
    function brokerConfirmDelivery(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker, "Only assigned broker");
        require(item.status == EscrowStatus.Active, "Invalid status");

        item.status = EscrowStatus.Completed;

        uint256 platformFee = (item.amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 brokerFee = (item.amount * BROKER_FEE_BPS) / 10000;
        uint256 netPayout = item.amount - platformFee - brokerFee;

        if (item.broker != address(0) && brokerRegistry != address(0)) {
            IStakedBrokerRegistry(brokerRegistry).releaseQuota(item.broker, item.amount);
        }

        usdc.transfer(treasury, platformFee);
        usdc.transfer(item.broker, brokerFee); // GDTG nhận phí tại đây
        usdc.transfer(item.seller, netPayout); // Tiền về Seller trong 0.8s

        emit SettlementExecuted(_id, netPayout, 0);
    }

    /// @notice 3. GDTG KIỂM SOÁT: Bên Bán ngâm kèo / không giao / bùng kèo -> GDTG bấm nút HOÀN 100% TIỀN CHO BÊN MUA NGAY LẬP TỨC
    function brokerRefundBuyer(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker, "Only assigned broker");
        require(item.status == EscrowStatus.Active, "Invalid status");

        item.status = EscrowStatus.Completed;

        if (item.broker != address(0) && brokerRegistry != address(0)) {
            IStakedBrokerRegistry(brokerRegistry).releaseQuota(item.broker, item.amount);
        }

        usdc.transfer(item.buyer, item.amount);
        emit RefundExecuted(_id, item.amount);
    }

    /// @notice 4. GDTG THỰC THI THỎA THUẬN ĐÀM PHÁN: Khi 2 bên tự thống nhất phương án xử lý (chia tiền tùy 2 bên thỏa thuận)
    function brokerMediateSettlement(uint256 _id, uint256 _refundToBuyer, uint256 _payoutToSeller) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker, "Only assigned broker");
        require(item.status == EscrowStatus.Active, "Invalid status");
        require(_refundToBuyer + _payoutToSeller == item.amount, "Total must match escrow amount");

        item.status = EscrowStatus.Completed;

        if (item.broker != address(0) && brokerRegistry != address(0)) {
            IStakedBrokerRegistry(brokerRegistry).releaseQuota(item.broker, item.amount);
        }

        if (_refundToBuyer > 0) usdc.transfer(item.buyer, _refundToBuyer);
        if (_payoutToSeller > 0) usdc.transfer(item.seller, _payoutToSeller);

        emit SettlementExecuted(_id, _payoutToSeller, _refundToBuyer);
    }

    /// @notice 5. HAI BÊN ĐỒNG THUẬN HỦY GIAO DỊCH (Mutual Cancel)
    function mutualCancelEscrow(uint256 _id) external nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Active, "Invalid status");

        if (msg.sender == item.buyer) {
            item.buyerCancelApproved = true;
        } else if (msg.sender == item.seller) {
            item.sellerCancelApproved = true;
        } else {
            revert("Unauthorized");
        }

        if (item.buyerCancelApproved && item.sellerCancelApproved) {
            item.status = EscrowStatus.Cancelled;

            if (item.broker != address(0) && brokerRegistry != address(0)) {
                IStakedBrokerRegistry(brokerRegistry).releaseQuota(item.broker, item.amount);
            }

            usdc.transfer(item.buyer, item.amount);
            emit EscrowCancelled(_id);
        }
    }

    /// @notice 6. KHI GDTG KHÔNG LÀM ĐƯỢC VIỆC / GIAN DỐI / THÔNG ĐỒNG: Người dùng TỐ CÁO LÊN SÀN -> Sàn chém cọc GDTG đền bù nạn nhân
    function adminSlashCorruptBroker(uint256 _id, uint256 _compensation) external nonReentrant {
        require(msg.sender == treasury, "Only platform admin");
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Active, "Escrow already resolved");
        require(item.broker != address(0) && brokerRegistry != address(0), "No broker");

        item.status = EscrowStatus.Completed;

        // 1. Hoàn trả 100% tiền cọc gốc cho Bên Mua
        usdc.transfer(item.buyer, item.amount);

        // 2. Chém cọc bảo hiểm của GDTG từ StakedBrokerRegistry đền bù thêm cho nạn nhân
        IStakedBrokerRegistry(brokerRegistry).slashBroker(item.broker, item.buyer, _compensation);

        emit BrokerSlashedViaEscrow(_id, item.broker, _compensation);
    }
}
```

---

### 4. `AuctionEscrow.sol` — Đấu Thầu Cọc Minh Bạch Thực Chiến (Hạn Chót Cố Định & Mức Tăng Giá Tối Thiểu)

> **Cơ Chế Đấu Giá Chuẩn Thực Tế:**
> 1. **Thời Hạn Cố Định — Hết Giờ Là Chốt:** Bỏ hoàn toàn cơ chế gia hạn kéo dài thời gian lằng nhằng. Người tạo phiên đặt hạn chót cố định, đúng giờ hết hạn là chốt ngay lập tức, ai trả giá cao nhất là THẮNG LUÔN ("trả giá cao là ăn").
> 2. **Bước Giá Tối Thiểu Bắt Buộc (`minBidIncrement`):** Khi tạo phiên, người bán đặt mức tăng giá tối thiểu rõ ràng (ví dụ: mỗi lượt trả sau phải cao hơn người trước ít nhất 100.000đ hay 5 USDC). Triệt tiêu hoàn toàn trò spam 1 wei mà không cần kéo dài giờ.
> 3. **Bảo Chứng Tiền Cọc & Chuyển Thẳng Sang Escrow 3 Bên:**
>    - Người tham gia khi trả giá đã phải nạp cọc bảo chứng (để chống trả giá ảo).
>    - Khi hết giờ và chốt phiên: Tiền cọc của người thắng **tự động chuyển thẳng (bridge) sang hợp đồng Phòng Giao Dịch 3 Bên (`UniversalEscrow`)** để tiến hành giao dịch ngay. Người thắng không cần chờ đợi hay nạp thêm cọc gì nữa!
>    - Toàn bộ những người trả giá thua được **hợp đồng hoàn trả 100% tiền cọc ngay lập tức** ($O(1)$ gas an toàn, không tắc nghẽn).
> 4. **Phao Cứu Sinh (Safety Hatch 7 Ngày):** Nếu sau 7 ngày kết thúc mà bên bán bỏ quên phiên, bất kỳ ai cũng có thể kích hoạt hủy để tất cả người tham gia rút 100% cọc về ví an toàn.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/IAuctionEscrow.sol";
import "../interfaces/IUniversalEscrow.sol";

/// @title AuctionEscrow — Hợp Đồng Đấu Thầu Cọc Minh Bạch Thực Chiến
contract AuctionEscrow is IAuctionEscrow, ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public treasury;
    address public universalEscrowContract;
    uint256 public auctionCounter;

    uint256 public constant AUCTION_FEE_BPS = 150; // 1.50% phí đấu giá thành công
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SAFETY_ABANDON_WINDOW = 7 days; // Phao cứu sinh sau 7 ngày nếu không ai chốt

    mapping(uint256 => AuctionSession) internal _auctions;
    mapping(uint256 => Bid[]) internal _auctionBids;
    mapping(uint256 => mapping(address => uint256)) public userBidBondDeposited;
    mapping(uint256 => mapping(address => bool)) public hasClaimedRefund;

    constructor(
        address _usdc,
        address _treasury,
        address _universalEscrow,
        address _owner
    ) Ownable(_owner) {
        require(_usdc != address(0) && _treasury != address(0), "Zero address");
        usdc = IERC20(_usdc);
        treasury = _treasury;
        universalEscrowContract = _universalEscrow;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }

    function setUniversalEscrow(address _escrow) external onlyOwner {
        universalEscrowContract = _escrow;
    }

    /// @notice Mở phiên đấu giá mới với Hạn chót cố định và Mức tăng giá tối thiểu rõ ràng
    function createAuction(
        AuctionType auctionType,
        bytes32 itemHash,
        address broker,
        uint256 floorPrice,
        uint256 minBidIncrement,
        uint256 requiredBidBond,
        uint256 durationSeconds
    ) external override returns (uint256) {
        require(floorPrice > 0, "Floor price must be > 0");
        require(minBidIncrement > 0, "Min increment must be > 0");
        require(durationSeconds >= 1 hours && durationSeconds <= 7 days, "Duration: 1h - 7d");

        auctionCounter++;
        _auctions[auctionCounter] = AuctionSession({
            id: auctionCounter,
            auctionType: auctionType,
            itemHash: itemHash,
            seller: payable(msg.sender),
            broker: broker,
            floorPrice: floorPrice,
            minBidIncrement: minBidIncrement,
            requiredBidBond: requiredBidBond,
            endTime: block.timestamp + durationSeconds,
            status: AuctionStatus.Active,
            winningBidder: address(0),
            winningPrice: 0
        });

        emit AuctionCreated(
            auctionCounter,
            auctionType,
            itemHash,
            msg.sender,
            floorPrice,
            minBidIncrement,
            block.timestamp + durationSeconds
        );
        return auctionCounter;
    }

    /// @notice Tham gia trả giá: Trả giá cao hơn mức tối thiểu & nạp cọc bảo chứng đấu giá
    function submitBid(
        uint256 auctionId,
        uint256 offerPrice,
        string calldata terms
    ) external override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < a.endTime, "Auction ended - time is up!");

        if (a.winningPrice == 0) {
            require(offerPrice >= a.floorPrice, "Offer below floor price");
        } else {
            require(
                offerPrice >= a.winningPrice + a.minBidIncrement,
                "Offer must exceed current high by minBidIncrement"
            );
        }

        if (a.requiredBidBond > 0 && userBidBondDeposited[auctionId][msg.sender] == 0) {
            userBidBondDeposited[auctionId][msg.sender] = a.requiredBidBond;
            usdc.safeTransferFrom(msg.sender, address(this), a.requiredBidBond);
        }

        a.winningBidder = msg.sender;
        a.winningPrice = offerPrice;

        _auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            offerPrice: offerPrice,
            termsDescription: terms,
            bidBondAmount: a.requiredBidBond,
            isClaimed: false
        }));

        emit BidSubmitted(auctionId, msg.sender, offerPrice, a.requiredBidBond);
    }

    /// @notice Chốt phiên đấu giá khi hết hạn: Người trả cao nhất THẮNG LUÔN, cọc chuyển thẳng sang Escrow 3 bên
    function settleAuction(uint256 auctionId) external override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status == AuctionStatus.Active, "Already settled or closed");
        require(block.timestamp >= a.endTime, "Auction still ongoing");
        require(a.winningBidder != address(0), "No bids received");

        a.status = AuctionStatus.Settled;
        uint256 escrowId = 0;

        uint256 winningBond = userBidBondDeposited[auctionId][a.winningBidder];
        uint256 platformFee = (winningBond * AUCTION_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netBond = winningBond - platformFee;

        if (platformFee > 0) {
            usdc.safeTransfer(treasury, platformFee);
        }

        if (netBond > 0 && universalEscrowContract != address(0)) {
            usdc.forceApprove(universalEscrowContract, netBond);
            escrowId = IUniversalEscrow(universalEscrowContract).createEscrowForBuyer(
                a.winningBidder,
                a.seller,
                a.broker,
                address(usdc),
                netBond,
                30 days
            );
        }

        emit AuctionSettled(auctionId, a.winningBidder, a.winningPrice, escrowId);
    }

    /// @notice Người thua cuộc rút lại 100% tiền cọc bảo chứng của mình an toàn ngay lập tức
    function claimRefund(uint256 auctionId) public override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status != AuctionStatus.Active, "Auction still active");
        require(msg.sender != a.winningBidder || a.status == AuctionStatus.Cancelled, "Winner bond was bridged to escrow");
        require(!hasClaimedRefund[auctionId][msg.sender], "Already claimed");

        uint256 deposited = userBidBondDeposited[auctionId][msg.sender];
        require(deposited > 0, "No bond to refund");

        hasClaimedRefund[auctionId][msg.sender] = true;
        usdc.safeTransfer(msg.sender, deposited);

        emit BidRefundClaimed(auctionId, msg.sender, deposited);
    }

    /// @notice Rút gộp tiền cọc từ nhiều phiên đấu giá trong 1 giao dịch
    function batchClaimRefunds(uint256[] calldata auctionIds) external override {
        for (uint256 i = 0; i < auctionIds.length; i++) {
            if (!hasClaimedRefund[auctionIds[i]][msg.sender] && userBidBondDeposited[auctionIds[i]][msg.sender] > 0) {
                AuctionSession storage a = _auctions[auctionIds[i]];
                if (a.status != AuctionStatus.Active && (msg.sender != a.winningBidder || a.status == AuctionStatus.Cancelled)) {
                    claimRefund(auctionIds[i]);
                }
            }
        }
    }

    /// @notice Phao cứu sinh: Nếu sau 7 ngày kết thúc mà chưa ai chốt phiên, bất kỳ ai cũng có thể hủy để rút cọc
    function cancelExpiredUnsettledAuction(uint256 auctionId) external override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status == AuctionStatus.Active, "Not active");
        require(block.timestamp >= a.endTime + SAFETY_ABANDON_WINDOW, "Safety window not reached");

        a.status = AuctionStatus.Cancelled;
        emit AuctionCancelled(auctionId);
    }

    function getAuction(uint256 auctionId) external view override returns (AuctionSession memory) {
        return _auctions[auctionId];
    }
}
```

---

### 5. `CommunityFund.sol` — Két Sắt & Sổ Thu Chi Nhóm Minh Bạch (Transparent Group Vault & Real-Time Audit Log)

> **Mục tiêu thực tế:** Nền tảng không can thiệp hay áp đặt quy tắc quản trị lý thuyết hàn lâm. TrustPact chỉ cung cấp giải pháp **Két sắt giữ tiền chung an toàn (Non-custodial)** và **Sổ thu chi sao kê minh bạch từng xu trên chuỗi (Real-time Audit Log)**.
> - Tiền nằm trong két Smart Contract, không một cá nhân nào (dù là trưởng nhóm hay thủ quỹ) có thể tự ý ôm tiền bỏ chạy.
> - Chi tiêu chỉ được phép xuất tiền khi đủ số lượng thành viên trong nhóm bấm nút Duyệt (`requiredApprovals`).
> - Mọi khoản nạp và chi đều lưu vết vĩnh viễn trên blockchain kèm lý do và chứng từ hóa đơn IPFS.
> - Nhóm dùng vào việc gì (quỹ team dev/MMO, quỹ lớp học, quỹ phòng trọ chung tiền cọc/điện nước, quỹ gia đình, CLB thể thao...) hoàn toàn do người dùng tự do quyết định!

#### A. Kiến Trúc Vận Hành Đơn Giản & Thực Chiến:
1. **Nộp tiền vào quỹ (`deposit`):** Bất kỳ ai cũng có thể nộp tiền vào két sắt kèm lời nhắn/lý do. Sổ thu tiền ghi nhận rõ người nạp, số tiền, thời gian và nội dung đóng góp.
2. **Tạo lệnh chi tiêu (`createSpendRequest`):** Thành viên nhóm tạo đề xuất chi tiền (địa chỉ người nhận, số tiền, lý do chi, link hóa đơn/chứng từ IPFS).
3. **Phê duyệt đa chữ ký (`approveSpendRequest`):** Các thành viên trong nhóm vào xem hóa đơn/lý do và bấm nút Duyệt.
4. **Tự động xuất tiền (`Auto-Disburse`):** Ngay khi số lượt duyệt đạt đủ điều kiện (`approvalCount >= requiredApprovals`), Smart Contract **ngay lập tức tự động chuyển tiền** thẳng cho người nhận, cập nhật trạng thái `Executed` và ghi vào sổ chi tiêu.
5. **Hủy lệnh chi (`cancelSpendRequest`):** Người tạo hoặc quản trị quỹ có thể hủy đề xuất nếu không chi nữa.

---

#### B. Mã Nguồn Hợp Đồng Chuẩn Mực (`CommunityFund.sol`):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/ICommunityFund.sol";

/// @title CommunityFund — Két Sắt & Sổ Thu Chi Nhóm Minh Bạch (Transparent Group Vault)
contract CommunityFund is ICommunityFund, ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    string public fundName;
    string public fundDescription;
    uint256 public requiredApprovals;

    uint256 public totalDepositedBalance;
    uint256 public totalSpentBalance;

    DepositRecord[] internal _depositRecords;
    SpendRequest[] internal _spendRequests;

    mapping(address => bool) public isMember;
    address[] public memberList;

    mapping(uint256 => mapping(address => bool)) public hasApproved;

    modifier onlyMember() {
        require(isMember[msg.sender], "Only fund members allowed");
        _;
    }

    constructor(
        address _token,
        string memory _name,
        string memory _description,
        address[] memory _initialMembers,
        uint256 _requiredApprovals,
        address _manager
    ) Ownable(_manager) {
        require(_token != address(0), "Invalid token address");
        require(_initialMembers.length > 0, "Must have initial members");
        require(_requiredApprovals > 0 && _requiredApprovals <= _initialMembers.length, "Invalid required approvals");

        token = IERC20(_token);
        fundName = _name;
        fundDescription = _description;
        requiredApprovals = _requiredApprovals;

        for (uint256 i = 0; i < _initialMembers.length; i++) {
            address m = _initialMembers[i];
            require(m != address(0), "Zero member address");
            if (!isMember[m]) {
                isMember[m] = true;
                memberList.push(m);
                emit MemberAdded(m);
            }
        }
    }

    /// @notice Nộp tiền vào quỹ: Bất kỳ ai cũng có thể đóng góp, ghi nhận rõ vào sổ cái
    function deposit(uint256 amount, string calldata note) external override nonReentrant {
        require(amount > 0, "Amount must be > 0");
        token.safeTransferFrom(msg.sender, address(this), amount);

        totalDepositedBalance += amount;
        _depositRecords.push(DepositRecord({
            depositor: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            note: note
        }));

        emit MoneyDeposited(msg.sender, amount, note, block.timestamp);
    }

    /// @notice Tạo lệnh chi tiêu: Thành viên nhóm tạo đề xuất rút tiền kèm lý do và chứng từ
    function createSpendRequest(
        address payable recipient,
        uint256 amount,
        string calldata reason,
        string calldata proofUri
    ) external override onlyMember returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(token.balanceOf(address(this)) >= amount, "Insufficient fund balance");

        uint256 reqId = _spendRequests.length;
        _spendRequests.push(SpendRequest({
            id: reqId,
            proposer: msg.sender,
            recipient: recipient,
            amount: amount,
            reason: reason,
            proofUri: proofUri,
            approvalCount: 0,
            status: RequestStatus.Pending,
            createdAt: block.timestamp,
            executedAt: 0
        }));

        emit SpendRequestCreated(reqId, msg.sender, recipient, amount, reason);
        return reqId;
    }

    /// @notice Duyệt lệnh chi: Thành viên kiểm tra lý do/hóa đơn, bấm Duyệt. Đủ duyệt là tiền tự xuất!
    function approveSpendRequest(uint256 requestId) external override onlyMember nonReentrant {
        require(requestId < _spendRequests.length, "Request does not exist");
        SpendRequest storage req = _spendRequests[requestId];
        require(req.status == RequestStatus.Pending, "Request not pending");
        require(!hasApproved[requestId][msg.sender], "Already approved by this member");

        hasApproved[requestId][msg.sender] = true;
        req.approvalCount++;

        emit SpendRequestApproved(requestId, msg.sender, req.approvalCount);

        if (req.approvalCount >= requiredApprovals) {
            req.status = RequestStatus.Executed;
            req.executedAt = block.timestamp;
            totalSpentBalance += req.amount;

            token.safeTransfer(req.recipient, req.amount);
            emit SpendRequestExecuted(requestId, req.recipient, req.amount);
        }
    }

    /// @notice Hủy lệnh chi: Người tạo đề xuất hoặc quản lý có thể hủy nếu không chi nữa
    function cancelSpendRequest(uint256 requestId) external override nonReentrant {
        require(requestId < _spendRequests.length, "Request does not exist");
        SpendRequest storage req = _spendRequests[requestId];
        require(req.status == RequestStatus.Pending, "Request not pending");
        require(msg.sender == req.proposer || msg.sender == owner(), "Only proposer or owner can cancel");

        req.status = RequestStatus.Cancelled;
        emit SpendRequestCancelled(requestId);
    }

    /// @notice Quản lý quỹ: Thay đổi số lượng người duyệt cần thiết
    function setRequiredApprovals(uint256 newRequired) external onlyOwner {
        require(newRequired > 0 && newRequired <= memberList.length, "Invalid approval count");
        requiredApprovals = newRequired;
    }

    /// @notice Thêm thành viên mới vào nhóm
    function addMember(address newMember) external onlyOwner {
        require(newMember != address(0) && !isMember[newMember], "Invalid member");
        isMember[newMember] = true;
        memberList.push(newMember);
        emit MemberAdded(newMember);
    }

    /// @notice Lấy thông tin 1 lệnh chi
    function getSpendRequest(uint256 requestId) external view override returns (SpendRequest memory) {
        require(requestId < _spendRequests.length, "Request does not exist");
        return _spendRequests[requestId];
    }

    /// @notice Lấy toàn bộ danh sách lệnh chi (Sổ chi tiêu công khai)
    function getAllSpendRequests() external view returns (SpendRequest[] memory) {
        return _spendRequests;
    }

    /// @notice Lấy toàn bộ lịch sử nộp tiền (Sổ thu tiền công khai)
    function getDepositRecords() external view override returns (DepositRecord[] memory) {
        return _depositRecords;
    }

    /// @notice Lấy danh sách thành viên nhóm
    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    /// @notice Xem số dư thực tế hiện tại của két sắt
    function getVaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
```

---

### 6. `YieldVaultAdapter.sol` — Két Sắt Sinh Lời Thực Trên Aave V3 (Real Yield 80/20 & Kỳ Hạn Tối Thiểu 30 Ngày)

> **Quy tắc kinh tế thực chiến:**
> 1. **"Thằng nào cọc thằng đó hưởng":** Ai bỏ vốn nạp cọc (Bên mua trong Escrow, GDTG nạp cọc bảo chứng, hoặc Quỹ nhóm nộp tiền) thì người đó hưởng **80% tiền lãi** sinh ra từ chính dòng tiền của họ.
> 2. **"Nền tảng (chúng ta) thu phí quản lý":** Nền tảng TrustPact tự động cắt **20% tiền lãi** làm phí hiệu suất vận hành (Performance Fee). Đây là nguồn doanh thu thụ động bền vững của giao thức.
> 3. **Điều kiện kép kích hoạt:**
>    - Thời gian giữ cọc: $\ge$ **30 NGÀY**
>    - Số tiền cọc: $\ge$ **500 USDC**
>    *(Nếu không đủ 2 điều kiện này: Giữ nguyên USDC tĩnh trong Escrow $\rightarrow$ 0 tốn phí gas phụ, giải ngân tức thì trong 0.8 giây).*

#### Chi Tiết Đối Tượng Cho 3 Nguồn Tiền Lớn:

1. **Kèo Escrow 3 bên dài hạn (`UniversalEscrow` $\ge$ 30 ngày & $\ge$ 500 USDC):**
   - **Người bỏ vốn (Depositor):** **Bên Mua (Buyer)** — người nạp tiền hàng/tiền cọc khóa vào két sắt.
   - **Khi giao dịch thành công:** Bên Bán nhận 100% TIỀN GỐC; Bên Mua nhận 80% TIỀN LÃI (tiền thưởng thực tế giúp bù trượt giá, bù phí sàn); Nền tảng (chúng ta) thu 20% TIỀN LÃI + phí sàn 0.3%; GDTG nhận phí dịch vụ 1.5%.
   - **Khi giao dịch hủy / thất bại:** Bên Mua nhận lại 100% TIỀN GỐC + 80% TIỀN LÃI; Nền tảng thu 20% TIỀN LÃI.

2. **Tiền cọc bảo hiểm uy tín của GDTG (`StakedBrokerRegistry` $\ge$ 500 USDC):**
   - **Người bỏ vốn (Depositor):** **GDTG (Broker)** — người nạp cọc bảo chứng lấy Tick Xanh và Quota làm ăn.
   - **Đối tượng hưởng lãi:** GDTG nhận 80% TIỀN LÃI sinh ra từ tiền cọc của họ (vừa làm GDTG kiếm phí 1.5%, vừa có lãi như gửi ngân hàng, tiền cọc không bị chôn vốn chết); Nền tảng thu 20% TIỀN LÃI.
   - **Khi GDTG rút cọc (Unstake):** GDTG nhận lại 100% TIỀN CỌC GỐC + 80% TIỀN LÃI lũy kế; Nền tảng thu 20% TIỀN LÃI lũy kế.

3. **Két sắt Quỹ nhóm (`CommunityFund` $\ge$ 500 USDC):**
   - **Người bỏ vốn (Depositor):** **Các thành viên trong Hội nhóm** (Team dev, phòng trọ, nhóm bạn, quỹ lớp, team MMO...).
   - **Đối tượng hưởng lãi:** **Nhập thẳng vào Két sắt Quỹ nhóm (Lãi kép - 80% TIỀN LÃI)** giúp ngân sách nhóm tự tăng trưởng liên tục; Nền tảng thu 20% TIỀN LÃI.
   - **Khi nhóm chi tiêu:** Trích tiền (gốc + lãi tích lũy) chuyển thẳng cho Bên nhận tiền / Nhà cung cấp (Vendor) sau khi đủ số thành viên duyệt chi.

| Nguồn Tiền Cọc | Người Bỏ Vốn Nạp Cọc | Người Nhận Vốn Gốc Khi Xong | Người Nhận 80% Tiền Lãi | Người Nhận 20% Tiền Lãi |
|---|---|---|---|---|
| **1. Kèo Escrow 3 bên** | **Bên Mua (Buyer)** | **Bên Bán** *(thành công)* hoặc **Bên Mua** *(hủy kèo)* | **Bên Mua (Buyer)** *(thằng bỏ vốn)* | **Nền tảng (Chúng ta)** |
| **2. Cọc bảo hiểm GDTG** | **GDTG (Broker)** | **GDTG** *(khi unstake rút cọc)* | **GDTG (Broker)** *(thằng bỏ vốn)* | **Nền tảng (Chúng ta)** |
| **3. Két sắt Quỹ nhóm** | **Thành viên Hội nhóm** | **Bên nhận chi / Vendor** *(khi duyệt chi)* | **Nhập thẳng vào Két sắt Quỹ nhóm** | **Nền tảng (Chúng ta)** |

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @title YieldVaultAdapter
/// @notice Két sắt tự động kết nối Aave V3 trên Avalanche sinh lãi thực tế (Real Yield).
contract YieldVaultAdapter is ERC4626, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable underlyingAsset;
    address public aavePool;
    address public aToken;
    address public authorizedEscrow;

    // Ăn chia trên TIỀN LÃI sinh ra: Thằng nạp cọc ăn 80%, Nền tảng (chúng ta) ăn 20%
    uint256 public constant DEPOSITOR_YIELD_BPS = 8000;   // 80%
    uint256 public constant PROTOCOL_FEE_BPS = 2000;      // 20%
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Điều kiện kép để kích hoạt sinh lời (loại bỏ 100% rủi ro lỗ gas):
    // 1. Thời gian giữ cọc tối thiểu: 30 NGÀY
    // 2. Số tiền cọc tối thiểu: 500 USDC
    uint256 public constant MIN_HOLDING_DURATION = 30 days;
    uint256 public constant MIN_YIELD_DEPOSIT_AMOUNT = 500 * 1e6; // 500 USDC

    event YieldHarvested(
        uint256 totalYield,
        address indexed depositor,
        uint256 depositorShare,
        address indexed protocolTreasury,
        uint256 protocolShare
    );

    error ZeroAddress();
    error Unauthorized();
    error ZeroAmount();

    modifier onlyAuthorizedEscrow() {
        if (msg.sender != authorizedEscrow && msg.sender != owner()) revert Unauthorized();
        _;
    }

    constructor(
        IERC20 _asset,
        address _aavePool,
        address _aToken
    ) ERC4626(_asset) ERC20("TrustPact Yield Vault", "tpUSDC") Ownable(msg.sender) {
        underlyingAsset = _asset;
        aavePool = _aavePool;
        aToken = _aToken;
    }

    function setAuthorizedEscrow(address _escrow) external onlyOwner {
        if (_escrow == address(0)) revert ZeroAddress();
        authorizedEscrow = _escrow;
    }

    function setAavePool(address _aavePool, address _aToken) external onlyOwner {
        aavePool = _aavePool;
        aToken = _aToken;
    }

    function totalAssets() public view override returns (uint256) {
        uint256 localBal = underlyingAsset.balanceOf(address(this));
        if (aToken != address(0)) {
            return localBal + IERC20(aToken).balanceOf(address(this));
        }
        return localBal;
    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        if (aavePool != address(0)) {
            underlyingAsset.forceApprove(aavePool, assets);
            IAavePool(aavePool).supply(address(underlyingAsset), assets, address(this), 0);
        }
    }

    function _withdraw(address caller, address receiver, address _owner, uint256 assets, uint256 shares) internal override {
        if (aavePool != address(0)) {
            uint256 localBal = underlyingAsset.balanceOf(address(this));
            if (localBal < assets) {
                uint256 needed = assets - localBal;
                IAavePool(aavePool).withdraw(address(underlyingAsset), needed, address(this));
            }
        }
        super._withdraw(caller, receiver, _owner, assets, shares);
    }

    function distributeAccruedYield(
        address depositor,
        address protocolTreasury,
        uint256 grossWithdrawn,
        uint256 originalPrincipal
    ) external onlyAuthorizedEscrow returns (uint256 profit) {
        if (grossWithdrawn <= originalPrincipal) return 0;
        profit = grossWithdrawn - originalPrincipal;

        uint256 depositorYield = (profit * DEPOSITOR_YIELD_BPS) / BPS_DENOMINATOR;
        uint256 protocolShare = profit - depositorYield;

        if (depositorYield > 0 && depositor != address(0)) {
            underlyingAsset.safeTransfer(depositor, depositorYield);
        }
        if (protocolShare > 0 && protocolTreasury != address(0)) {
            underlyingAsset.safeTransfer(protocolTreasury, protocolShare);
        }

        emit YieldHarvested(profit, depositor, depositorYield, protocolTreasury, protocolShare);
    }
}
```

---

## PHẦN VI: LỘ TRÌNH THỰC HIỆN 30 NGÀY NỘP BÀI THI AVALANCHE UNIHACK

| Thời gian | Mục tiêu trọng tâm | Chi tiết công việc |
|---|---|---|
| **Tuần 1 (2–8/11)** | **Core Contracts & Test Suite** | Viết xong và test 100% `StakedBrokerRegistry`, `DelegationManager`, `UniversalEscrow` (3 bên) và `AuctionEscrow` bằng Foundry. |
| **Tuần 2 (9–15/11)** | **Custom L1 & x402 Micropayments** | Spin up `trustpact-l1` bằng Avalanche CLI, deploy `ScamRegistryL1.sol` (gas 0đ), dựng server x402 thu phí 0.01 USDC cho bot check scam Telegram. |
| **Tuần 3 (16–22/11)** | **Frontend PWA & Webhook Banking** | Build Next.js 14 Web App: Trang check scam, Trang tạo kèo 3 bên, Phòng giao dịch 3 bên (`/pact/[id]`), Admin Panel tố cáo GDTG. |
| **Tuần 4 (23–25/11)** | **Deploy Fuji, Quay Demo & Nộp bài** | Deploy toàn bộ lên Fuji C-Chain và Custom L1. Quay video demo 3 phút, nộp bài trước hạn chót 05:59 ngày 25/11/2026. |

---

## PHẦN VII: TRẢ LỜI 3 CÂU HỎI BẮT BUỘC KHI PITCHING VỚI GIÁM KHẢO

**1. Tại sao phải on-chain (Why on-chain)?**  
Nếu làm Web2, admin sàn hoặc GDTG cá nhân cầm tiền cọc $\rightarrow$ Vướng rủi ro ôm hàng trăm triệu đến hàng tỷ đồng tiền quỹ bảo hiểm bỏ trốn (Exit Scam xảy ra liên tục). On-chain biến Smart Contract thành két sắt tự động không ai có thể rút trộm. Tiền chỉ giải ngân khi có lệnh xác nhận bàn giao hoặc thỏa thuận đàm phán hợp lệ; và nếu GDTG gian dối, hợp đồng tự động chém cọc bảo hiểm đền bù cho nạn nhân!

**2. Tại sao phải Avalanche (Why Avalanche)?**  
- **Tốc độ dưới 1 giây (Sub-second finality):** Bàn giao tài sản, bấm duyệt là tiền về tài khoản trong **0.8 giây**.
- **Custom L1 (Subnet):** Lưu trữ hàng triệu số điện thoại, số tài khoản ngân hàng và username Telegram lừa đảo hoàn toàn miễn phí gas cho cộng đồng.
- **Chuẩn x402:** Cho phép thu phí vi mô 0.01 USDC mỗi lượt tra cứu uy tín từ các bot Telegram check scam tự động.

**3. Tiền / Yield đến từ đâu (Where does money/yield come from)?**  
- **Lãi suất thực (Real Yield):** Tiền cọc nhàn rỗi (kỳ hạn $\ge$ 30 ngày) được tự động gửi vào Aave V3 trên Avalanche sinh lãi 4–6%/năm từ nhu cầu vay thế chấp thật của thị trường. **Người nạp cọc nhận 80% tiền lãi, nền tảng (chúng ta) thu 20% phí quản lý hiệu suất.**
- **Phí giao dịch ký quỹ:** Thu 0.3% phí khi giao dịch thành công.
- **Phí đấu giá:** Thu 1.5% trên hợp đồng trúng thầu khi cung < cầu.
- **Phí API x402:** Thu 0.01 USDC/lần tra cứu từ bot Telegram bên ngoài.
*(Không in token lạm phát, không Ponzi).*

