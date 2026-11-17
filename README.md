# Hóa học Challenge – Bảng tuần hoàn (Hóa học 10, Kết nối tri thức)

## Nội dung phiên bản
- 10 câu hỏi: 5 Nhận biết, 3 Thông hiểu, 2 Vận dụng.
- Mỗi câu có 4 lựa chọn; 30 giây/câu; đúng +10 điểm.
- Thứ tự 10 câu và thứ tự phương án đã được xáo trộn ngẫu nhiên trong bộ dữ liệu phát hành. Khi khởi động một phiên bản máy chủ mới, có thể xáo trộn lại bằng cách chạy script `npm run shuffle` (xem ghi chú bên dưới).
- Xuất kết quả Excel `.xlsx` gồm hai trang tính: `Tong hop` và `Chi tiet`.
- Nút **Tải Excel kết quả** nằm ở trang quản trị; yêu cầu đăng nhập bằng mật khẩu `ADMIN_PASSWORD`.

## Chạy trên máy tính
1. Cài Node.js 18 trở lên.
2. Giải nén ZIP, mở Terminal/CMD tại thư mục dự án.
3. Chạy `npm install`.
4. Sao chép `.env.example` thành `.env`, đặt `ADMIN_PASSWORD` thành mật khẩu riêng.
5. Chạy `npm start`.
6. Học sinh mở `http://localhost:3000`; quản trị mở `http://localhost:3000/admin.html`.

## Đưa lên Render
- Đưa toàn bộ nội dung thư mục dự án lên GitHub.
- Tạo Web Service trên Render, chọn repository.
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: `ADMIN_PASSWORD` = mật khẩu quản trị.
- Sau khi deploy, dùng URL Render `/` cho học sinh và `/admin.html` cho giáo viên.

## Lưu trữ Excel
Bấm **📊 Tải Excel kết quả** trong trang quản trị sau khi cuộc thi kết thúc. File tải về có:
- `Tong hop`: họ tên, điểm, số câu đúng, thời gian trả lời đúng, thứ hạng.
- `Chi tiet`: từng câu, mức độ, câu hỏi, đáp án đã chọn, đáp án đúng, kết quả, điểm và thời gian.

**Quan trọng:** Trên Render Free, dữ liệu trong bộ nhớ có thể mất khi dịch vụ khởi động lại. Hãy tải Excel về máy sau mỗi cuộc thi. Để lưu bền vững qua lần khởi động lại, cần gắn Persistent Disk hoặc bổ sung cơ sở dữ liệu.

## Lưu ý về xáo trộn
Bản ZIP này chứa một thứ tự câu hỏi và phương án đã được xáo trộn. Tất cả người chơi trong cùng một phòng nhìn thấy cùng thứ tự, bảo đảm đồng bộ câu hỏi và chấm điểm chính xác. Mỗi lần muốn tạo một đề có thứ tự khác, có thể yêu cầu tạo lại gói ZIP hoặc xáo trộn `questions.json` trước khi khởi động máy chủ.
