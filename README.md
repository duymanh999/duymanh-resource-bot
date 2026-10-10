# Telegram Resource Portal

Mẫu bot Telegram + website tải xuống các tệp bạn sở hữu hoặc được phép phân phối. Có thể chỉnh sửa bằng trình duyệt trên iPhone.

## Chức năng
- Website liệt kê tệp đã khai báo trong `RESOURCES`.
- Nút tải xuống từng tệp.
- Bot Telegram: `/start`, `/help`, `/files`, `/get ID`.
- Endpoint kiểm tra trạng thái: `/health`.

## Triển khai (GitHub + Render)
1. Tạo bot qua `@BotFather` trong Telegram và sao chép token. Giữ token bí mật.
2. Tạo repository GitHub mới, ví dụ `telegram-resource-portal`.
3. Tải lên `server.js`, `package.json`, `README.md` và thư mục `resources/` từ iPhone.
4. Trên Render, tạo **New Web Service** và kết nối repository.
5. Build command: `npm install`
6. Start command: `npm start`
7. Thêm Environment Variables:
   - `TELEGRAM_BOT_TOKEN` = token từ BotFather
   - `SITE_URL` = URL Render của website, ví dụ `https://ten-dich-vu.onrender.com`
8. Deploy. Mở URL website; mở bot Telegram và gửi `/start`, `/files`.

Nếu URL Render thay đổi, cập nhật biến `SITE_URL` rồi deploy lại.

## Thêm tệp
- Tải tệp của bạn vào thư mục `resources/`.
- Thêm thông tin tương ứng vào mảng `RESOURCES` trong `server.js` (mỗi tệp cần `id` duy nhất, `title`, `filename`, `description`).
- Commit thay đổi lên GitHub để Render tự triển khai lại nếu bật auto-deploy.

## Lưu ý
- Không đưa token vào `server.js`, GitHub hoặc website.
- Chỉ chia sẻ tệp bạn sở hữu hoặc có quyền phân phối.
- Đây là mẫu chia sẻ tệp; nó không tự cài đặt, sửa đổi hay thay thế tệp trong trò chơi trên iPhone.
- Render có thể thay đổi giới hạn và yêu cầu gói dịch vụ; kiểm tra thông tin hiện hành của nền tảng trước khi triển khai.
