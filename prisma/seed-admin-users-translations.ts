import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// Strip Prisma-specific query params (like ?schema=public) that pg doesn't understand
const dbUrl = process.env.DATABASE_URL.split('?')[0];
const adapter = new PrismaPg(dbUrl);
const prisma = new PrismaClient({adapter});

type Entry = {namespace: string; key: string; valueVi: string; valueEn: string};

const ENTRIES: Entry[] = [
  {
    namespace: 'admin',
    key: 'users.title',
    valueVi: 'Người dùng',
    valueEn: 'Users',
  },
  {
    namespace: 'admin',
    key: 'users.new',
    valueVi: 'Thêm người dùng',
    valueEn: 'Add user',
  },
  {
    namespace: 'admin',
    key: 'users.edit',
    valueVi: 'Sửa người dùng',
    valueEn: 'Edit user',
  },
  {
    namespace: 'admin',
    key: 'users.nameLabel',
    valueVi: 'Tên',
    valueEn: 'Name',
  },
  {
    namespace: 'admin',
    key: 'users.emailLabel',
    valueVi: 'Email',
    valueEn: 'Email',
  },
  {
    namespace: 'admin',
    key: 'users.passwordLabel',
    valueVi: 'Mật khẩu',
    valueEn: 'Password',
  },
  {
    namespace: 'admin',
    key: 'users.passwordHelp',
    valueVi: 'Để trống nếu giữ mật khẩu hiện tại.',
    valueEn: 'Leave blank to keep current password.',
  },
  {
    namespace: 'admin',
    key: 'users.roleLabel',
    valueVi: 'Vai trò',
    valueEn: 'Role',
  },
  {
    namespace: 'admin',
    key: 'users.bioLabel',
    valueVi: 'Giới thiệu',
    valueEn: 'Bio',
  },
  {
    namespace: 'admin',
    key: 'users.bioViLabel',
    valueVi: 'Giới thiệu (VI)',
    valueEn: 'Bio (VI)',
  },
  {
    namespace: 'admin',
    key: 'users.bioEnLabel',
    valueVi: 'Giới thiệu (EN)',
    valueEn: 'Bio (EN)',
  },
  {
    namespace: 'admin',
    key: 'users.count',
    valueVi:
      '{count, plural, =0 {Không có người dùng} one {# người dùng} other {# người dùng}}',
    valueEn: '{count, plural, =0 {No users} one {# user} other {# users}}',
  },
  {
    namespace: 'admin',
    key: 'users.birthDateLabel',
    valueVi: 'Ngày sinh',
    valueEn: 'Birth date',
  },
  {
    namespace: 'admin',
    key: 'users.orderLabel',
    valueVi: 'Thứ tự trong đội',
    valueEn: 'Team order',
  },
  {
    namespace: 'admin',
    key: 'users.isCoreTeamLabel',
    valueVi: 'Hiển thị trên trang About',
    valueEn: 'Show on About page',
  },
  {
    namespace: 'admin',
    key: 'users.allowAuthLabel',
    valueVi: 'Cho phép đăng nhập',
    valueEn: 'Allow sign-in',
  },
  {
    namespace: 'admin',
    key: 'users.save',
    valueVi: 'Lưu',
    valueEn: 'Save',
  },
  {
    namespace: 'admin',
    key: 'users.cancel',
    valueVi: 'Hủy',
    valueEn: 'Cancel',
  },
  {
    namespace: 'admin',
    key: 'users.delete',
    valueVi: 'Xóa',
    valueEn: 'Delete',
  },
  {
    namespace: 'admin',
    key: 'users.deleteConfirm',
    valueVi: 'Xóa người dùng "{name}"?',
    valueEn: 'Delete user "{name}"?',
  },
  {
    namespace: 'admin',
    key: 'users.pickImage',
    valueVi: 'Chọn ảnh',
    valueEn: 'Select photo',
  },
  {
    namespace: 'admin',
    key: 'users.removeImage',
    valueVi: 'Gỡ bỏ',
    valueEn: 'Remove',
  },
  {
    namespace: 'admin',
    key: 'users.modalTitle',
    valueVi: 'Chọn ảnh đội ngũ',
    valueEn: 'Choose a team photo',
  },
  {
    namespace: 'admin',
    key: 'users.validation.nameRequired',
    valueVi: 'Bắt buộc nhập tên',
    valueEn: 'Name required',
  },
  {
    namespace: 'admin',
    key: 'users.validation.emailRequired',
    valueVi: 'Bắt buộc nhập email',
    valueEn: 'Email required',
  },
  {
    namespace: 'admin',
    key: 'users.validation.emailFormat',
    valueVi: 'Email không hợp lệ',
    valueEn: 'Email must be a valid address',
  },
  {
    namespace: 'admin',
    key: 'users.validation.passwordRequired',
    valueVi: 'Bắt buộc nhập mật khẩu',
    valueEn: 'Password required',
  },
  {
    namespace: 'admin',
    key: 'users.validation.passwordShort',
    valueVi: 'Mật khẩu phải có ít nhất 8 ký tự',
    valueEn: 'Password must be at least 8 characters',
  },
  {
    namespace: 'admin',
    key: 'users.validation.roleRequired',
    valueVi: 'Bắt buộc chọn vai trò',
    valueEn: 'Role required',
  },
];

async function main() {
  for (const entry of ENTRIES) {
    await prisma.translation.upsert({
      where: {namespace_key: {namespace: entry.namespace, key: entry.key}},
      update: {valueVi: entry.valueVi, valueEn: entry.valueEn},
      create: entry,
    });
  }
  console.log(`Seeded ${ENTRIES.length} admin.users.* translations.`);
}

main()
  .catch((err) => {
    console.error('Seed admin-users-translations failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
