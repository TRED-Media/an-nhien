# Triển khai An Nhiên trên Vercel

Mã nguồn: https://github.com/TRED-Media/an-nhien

Bản production đã triển khai: https://annhien-six.vercel.app

Vercel project: `annhien` — `prj_TK2gUB4LiZQKU6f2WlFjhM84SGCZ`. Project đã kết nối repository GitHub. Production mở công khai; preview giữ bảo vệ đăng nhập Vercel.

Import repository này trong tài khoản Vercel, chọn framework **Other** và giữ root directory ở gốc repository. `vercel.json` đã cấu hình kiểm tra cú pháp và phục vụ thư mục `dist`.

Domain `annhien.vercel.app` bị Vercel từ chối với mã `owned-on-other-team`: đã được gán cho project thuộc team khác. Hiện sử dụng domain Vercel cấp tự động `annhien-six.vercel.app`.

Trong Supabase → Authentication → URL Configuration, thêm `https://annhien-six.vercel.app/index.html` vào Redirect URLs. Đăng ký và khôi phục mật khẩu phụ thuộc cấu hình này; cấu hình Supabase chưa được xác minh trong lần triển khai Vercel này.

## Tiếp tục chỉnh sửa ver 3

Chạy `npm start` rồi mở http://127.0.0.1:5173. Chỉnh giao diện và game trực tiếp trong `dist/`; cấu hình Supabase công khai ở `dist/config.js`. Chạy `npm run check` trước khi push. Mã nguồn hiện vẫn giữ phiên bản 2; đây là điểm bắt đầu để phát triển ver 3.
