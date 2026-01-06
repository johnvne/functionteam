
# Manager Tool V - Hướng dẫn triển khai

Hệ thống quản lý chuyên nghiệp cho Team V1.

## 🚀 QUY TRÌNH CHẠY LOCAL (Sửa lỗi Module Not Found)

1. Tải toàn bộ mã nguồn về máy.
2. Mở thư mục dự án bằng **VS Code**.
3. Mở Terminal và chạy lệnh sau (bắt buộc):
   ```bash
   npm install
   ```
   *Lệnh này sẽ tải các thư viện như Vite, React, Lucide về máy của bạn.*
   
4. Sau khi lệnh trên chạy xong, gõ lệnh sau để mở web:
   ```bash
   npm run dev
   ```
5. Truy cập `http://localhost:5173` để bắt đầu.

## 🌍 CÁCH ĐƯA LÊN GITHUB PAGES

1. Chạy lệnh:
   ```bash
   npm run build
   ```
2. Thư mục `dist` sẽ được tạo ra.
3. Upload **toàn bộ nội dung bên trong thư mục `dist`** lên GitHub.
4. Vào Settings dự án trên GitHub -> Pages -> Chọn nhánh chính -> Save.

---
**Lưu ý:** Nếu bạn dùng Vercel, chỉ cần push code lên GitHub, Vercel sẽ tự động làm hết các bước trên cho bạn.
