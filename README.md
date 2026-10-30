# Chùa Online — An Nhiên 2.5D

Canvas game mobile dọc. Các phần hoạt động trong sân, không còn trang dashboard hoạt động của V1.

## Chạy

Cần Node 22+; không cài npm dependency:

```
node start.cjs
```

Mở **http://127.0.0.1:5173**. Đây là URL trình duyệt, không phải tên file để nhập vào Google. Trên máy này có Node ở `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node`.

Không mở index.html bằng file://: bản mới dùng ES modules và đăng nhập, cần HTTP server hoặc hosting.

## Cách chơi

- Chạm sân hoặc WASD/mũi tên để di chuyển; nhân vật tìm đường tránh hồ/cây.
- Chạm lư hương, đến gần rồi kéo 3 nén hương từ khay vào lư.
- Chạm hồ cá, kéo giỏ xuống mặt nước 3 lần. Cá bơi, có gợn nước.
- Đến bàn kinh và gõ mõ chậm đủ 8 nhịp. Người chơi tự đọc lời niệm; không thu âm/xác nhận giọng nói.
- Đến bàn chuỗi rồi vuốt vòng quanh 18 hạt.
- Đến đệm thiền, giữ tay trên đệm 24 giây, thả để nghỉ.
- Đến sân lá, kéo chổi qua lá để dọn sạch.
- Chạm NPC để nhận lời nhắc. Chạm người chơi thật để tới chào.
- Gửi đèn tâm nguyện ở cây đèn; nội dung chỉ chủ tài khoản đọc được.
- Thời tiết nắng/gió/mưa/hoàng hôn tự đổi mỗi 75 giây hoặc chọn trong HUD; là mô phỏng, không lấy thời tiết thật.

## Supabase đã cấu hình

Project: `Chua Online` — ref `luqduzgcakwalsunbtuw`. URL và publishable key nằm trong `dist/config.js`. Không có service_role hay database password trong mã nguồn.

Migration `supabase/migrations/001_chua_online.sql` đã áp dụng, gồm:

- profiles, activity_config, activity_attempts, daily_rewards, wishes.
- RLS: hồ sơ/phiên hoạt động/tâm nguyện chỉ chủ user đọc; leaderboard chỉ trả tên/điểm/cấp.
- XP cộng qua RPC, kiểm tra user, thời gian tối thiểu, cooldown và chống nhận thưởng trùng. Các cử chỉ vẫn chạy phía client, chưa có mô phỏng authoritative trên server để chống toàn bộ gian lận.
- Quản trị kiểm tra role admin trong database. Tài khoản mới mặc định player. Chủ project cần chỉ định email/user của mình để được gán admin; không tự cho tài khoản đầu tiên làm admin.
- Phòng riêng Realtime yêu cầu đăng nhập. Presence quản lý tham gia/rời phòng; Broadcast vị trí giới hạn khoảng 3 lần/giây, hiển thị nội suy; gửi lời chào hai chiều.

Đăng nhập email/mật khẩu, đăng ký và khôi phục mật khẩu dùng Supabase Auth. Email confirmation đang bật. Redirect localhost và domain production đã thêm. Site URL đã trỏ về bản online. Sau khi đổi tên miền, thêm URL `/index.html` của tên miền mới trong Authentication > URL Configuration. Default mailer Supabase có giới hạn gửi; trước phát hành rộng cần SMTP riêng.

Khách lưu tiến trình trên máy. Khách chỉ thấy nhau ở các tab cùng origin/trình duyệt qua BroadcastChannel, **không phải phòng internet**. Tài khoản thật dùng Supabase cho tiến trình và multiplayer giữa thiết bị.

## Kiểm tra

- Cú pháp các module Node.
- Browser 390×844: cả 6 hoạt động đã chạy bằng cử chỉ; nhận đúng XP, lên cấp 2, hoàn thành 3 nhiệm vụ nhận 50 XP, lưu sau tải lại. Hai tab thấy nhau và nhận lời chào thật.
- Database transaction `supabase/verify.sql`: hai fixture user, cô lập hồ sơ, cấm cập nhật XP trực tiếp, cấm player quản trị, cấm ghi tâm nguyện user khác, cộng đúng XP và chặn thưởng trùng. PASS; toàn bộ fixture rollback.
- REST không đăng nhập bị từ chối đọc profiles. SDK tải và kết nối Auth settings thành công.
- Chưa kiểm tra email confirmation/recovery bằng hộp thư thật hay hai tài khoản Supabase trên hai thiết bị. Không tạo sẵn tài khoản/mật khẩu của người dùng.

Bản V1 cũ được giữ trong `legacy-v1/` để tham khảo, không phục vụ trong game.

## Bản online

https://an-nhien-chua-online.thinhnq-photography.chatgpt.site

Đã xuất bản owner-private: chỉ chủ Site đang có quyền truy cập. Muốn người chơi ngoài vào cần thay đổi quyền chia sẻ khi chủ app yêu cầu. Supabase project vẫn độc lập và đã hoạt động.

## Ver 3 — nhân vật và hành trình

Chọn Nam/Nữ và một trong 10 nghề có phục trang/phụ kiện riêng. Gặp trụ trì Thích An Hòa bên trái sân để làm lễ giác ngộ, nhận áo tu rồi mở các hoạt động. Nghề cũ được giữ trong hồ sơ.

| Công đức tích lũy | Tăng | Ni |
| --- | --- | --- |
| 0 + lễ nhập môn | Chú tiểu / Sa-di | Sa-di-ni |
| 200 | Đại Đức | Sư Cô |
| 600 | Thượng Tọa | Ni Sư |
| 1.500 | Hòa Thượng | Ni Trưởng (Sư Bà) |
| 3.000 | Trưởng lão Hòa Thượng | Giữ bậc Ni Trưởng |
| 6.000 | Pháp chủ | Pháp chủ |

Đủ điểm sẽ tự thăng bậc, không trừ điểm; thanh tiến độ HUD hiển thị khoảng cách đến bậc tiếp theo. Danh xưng rút gọn cho game, không dùng tuổi đời/tuổi đạo. Pháp chủ là danh hiệu cá nhân, không cấp quyền admin. Người chơi cũ giữ nguyên XP/công đức và chọn nhân vật khi vào ver 3.

Khách lưu nhân vật/lễ nhập môn trên thiết bị; tài khoản lưu trong Supabase Auth user metadata (không cần migration). Công đức tài khoản vẫn lấy từ các RPC hiện có, không lấy từ metadata. Ngoại hình được gửi kèm Realtime cho bạn cùng phòng. Chưa xác minh luồng lưu metadata với tài khoản Supabase thật trong lần cập nhật này.

Kiểm tra luật: `node --test tests/journey.test.mjs`.
