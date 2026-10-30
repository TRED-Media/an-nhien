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

## Ver 3.1 — chính điện và hoạt cảnh

Chạm tòa chùa hoặc nút **Vào chính điện** để đi qua cửa vào map nội thất. Nút **Ra sân** và cửa cuối sảnh đưa về sân. Sảnh có ánh vàng ấm, ba tượng Phật, bệ sen, nến, cửa gỗ và bốn cột chạm hoa văn; thời tiết ngoài sân không hiển thị trong nhà.

- **Cơm chay:** chạm bát/nút 5 lần, cách nhau 1,5 giây; nhân vật nâng bát, gắp cơm.
- **Quỳ lạy:** giữ đệm/nút 2,4 giây cho mỗi lạy, thả tay giữa ba lạy.
- **Thiền nghe pháp:** giữ đệm/nút 24 giây, có thể nghỉ rồi tiếp tục; lời giảng chuyển theo thời gian an trú. Bật đọc bằng Web Speech của thiết bị nếu muốn nghe, chất lượng giọng Việt phụ thuộc trình duyệt/giọng đã cài. Lời giảng là nội dung ngắn viết cho game.

Ba sinh hoạt trong sảnh là trải nghiệm thư giãn, không cộng XP/công đức. Các hoạt động ngoài sân vẫn dùng phần thưởng và RPC Supabase hiện có. Không cần migration cho bản cập nhật này.

Nhân vật có hoạt cảnh cúi chào, cầm hương, nghiêng giỏ cá, gõ mõ, lần chuỗi, quét sân, ngồi thở, ăn cơm và quỳ lạy. Realtime gửi map và trạng thái động tác; chỉ hiển thị bạn cùng map, vẫn dùng phòng được bảo vệ hiện có.

## Ver 3.2 — thao tác toàn màn hình, mỗi lần +1 XP

Mở một hoạt động để vào màn hình riêng. Vuốt xuống lần chuỗi, thả cá, thiền và quỳ lạy; vuốt lên dâng hương; vuốt ngang hoặc dọc quét sân; chạm mõ để tụng kinh và chạm bát cơm để ăn chay. Mỗi thao tác đúng cộng **1 XP và 1 công đức**, kể cả sinh hoạt chính điện. Không yêu cầu đủ bộ, không chờ thời gian tối thiểu, không cooldown và không giới hạn số lần. Quà ngày vẫn là phần thưởng riêng, nhận một lần/ngày.

### Cấu hình Supabase cho ver 3.2

1. Trong project `luqduzgcakwalsunbtuw`, chạy `supabase/migrations/002_repeatable_actions.sql`. RPC `record_activity` kiểm tra người dùng, hoạt động, quyền bật/tắt và cộng điểm cố định phía server; UUID mỗi thao tác chống cộng trùng khi gửi lại. Không cho client gửi số XP.
2. Trong Supabase Authentication → Sign In / Providers → Email, tắt **Confirm email**. Đây là cấu hình Auth phía Supabase, không thể bỏ qua bằng public key hay sửa JavaScript.
3. Kiểm tra đăng ký bằng tài khoản do người dùng kiểm soát: nhận session ngay và vào game. Client tự chuyển sang game khi đăng ký thành công; nếu server vẫn yêu cầu email, báo đúng cấu hình còn thiếu.

Migration `repeatable_activity_actions` đã áp dụng trên project `luqduzgcakwalsunbtuw`; `verify_actions.sql` đạt kiểm tra +1 XP, chơi liên tục, gửi lại không cộng trùng và bảo vệ XP. Auth settings đã xác minh `mailer_autoconfirm: true` sau khi chủ project tắt Confirm email. Khách lưu tại máy, tài khoản thật dùng RPC mới; nếu RPC chưa có hoặc mất mạng, giao diện báo XP chưa lưu và cho thử lại, không cộng điểm giả vào hồ sơ. Hàng đợi tài khoản lưu cục bộ theo user để thử lại sau tải lại. Gửi lại giữ nguyên UUID để không cộng điểm hai lần.
