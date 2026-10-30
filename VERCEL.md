# Triển khai An Nhiên trên Vercel

Mã nguồn: https://github.com/TRED-Media/an-nhien

Import repository này trong tài khoản Vercel, chọn framework **Other** và giữ root directory ở gốc repository. `vercel.json` đã cấu hình kiểm tra cú pháp và phục vụ thư mục `dist`.

Tên project mong muốn: `annhien`. Domain `annhien.vercel.app` hiện có website khác sử dụng; chỉ có thể gán nếu tài khoản có quyền quản lý domain này hoặc domain được giải phóng. Không thay thế project khác khi chưa xác định đúng quyền sở hữu.

Trong Supabase → Authentication → URL Configuration, thêm `https://annhien.vercel.app/index.html` vào Redirect URLs sau khi xác nhận domain được gán. Nếu dùng domain khác, thêm URL tương ứng. Đăng ký và khôi phục mật khẩu phụ thuộc cấu hình này.

## Tiếp tục chỉnh sửa ver 3

Chạy `npm start` rồi mở http://127.0.0.1:5173. Chỉnh giao diện và game trực tiếp trong `dist/`; cấu hình Supabase công khai ở `dist/config.js`. Chạy `npm run check` trước khi push. Mã nguồn hiện vẫn giữ phiên bản 2; đây là điểm bắt đầu để phát triển ver 3.
