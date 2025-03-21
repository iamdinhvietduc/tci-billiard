# Billiards Payment Management System

Hệ thống quản lý thanh toán cho phòng bida.

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd payment-billiard
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file môi trường:
```bash
cp .env.example .env
```

4. Cấu hình môi trường trong file `.env`:
```env
# Database Configuration
DATABASE_PATH=./data
DATABASE_BACKUP_PATH=./data/backups

# Application Configuration
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-secret-key-here

# Backup Configuration
BACKUP_RETENTION_DAYS=7
BACKUP_TIME=00:00
```

5. Tạo thư mục data:
```bash
mkdir -p data/backups
```

6. Build ứng dụng:
```bash
npm run build
```

7. Chạy ứng dụng:
```bash
npm start
```

## Cấu trúc thư mục

```
payment-billiard/
├── data/                  # Thư mục chứa database
│   ├── billiards.db      # File database chính
│   └── backups/          # Thư mục chứa backup
├── src/                   # Source code
├── public/               # Static files
├── .env                  # Cấu hình môi trường
└── package.json          # Dependencies và scripts
```

## Tính năng

- Quản lý thành viên
- Quản lý bill
- Theo dõi thanh toán
- Backup tự động
- Logging hệ thống

## Backup và Recovery

### Backup tự động
- Backup được thực hiện hàng ngày theo thời gian cấu hình
- Backup được lưu trong thư mục `data/backups`
- Số ngày lưu backup được cấu hình qua `BACKUP_RETENTION_DAYS`

### Khôi phục từ backup
1. Dừng ứng dụng
2. Sao chép file backup vào thư mục data:
```bash
cp data/backups/billiards-YYYY-MM-DD.db data/billiards.db
```
3. Khởi động lại ứng dụng

## Monitoring

### Logs
- Logs được lưu trong database (bảng `system_logs`)
- Có thể xem logs qua API endpoint `/api/logs`

### Backup Status
- Kiểm tra thư mục `data/backups` để xem các file backup
- Backup mới nhất sẽ có tên theo ngày hiện tại

## Bảo mật

1. Đảm bảo thư mục `data` có quyền truy cập phù hợp:
```bash
chmod 755 data
chmod 644 data/billiards.db
chmod 755 data/backups
```

2. Thay đổi `JWT_SECRET` trong file `.env`

3. Đảm bảo file `.env` không được commit lên git

## Troubleshooting

### Database Lock
Nếu gặp lỗi database lock:
1. Kiểm tra xem có process nào đang sử dụng database không
2. Xóa file lock nếu cần:
```bash
rm data/billiards.db-wal
rm data/billiards.db-shm
```

### Backup Failed
Nếu backup thất bại:
1. Kiểm tra quyền truy cập thư mục backup
2. Kiểm tra dung lượng ổ đĩa
3. Xem logs trong database để biết chi tiết lỗi

## Maintenance

### Dọn dẹp logs
```sql
DELETE FROM system_logs WHERE created_at < date('now', '-30 days');
```

### Vacuum Database
```sql
VACUUM;
```

## Support

Nếu cần hỗ trợ, vui lòng liên hệ:
- Email: support@example.com
- Phone: +84 xxx xxx xxx
