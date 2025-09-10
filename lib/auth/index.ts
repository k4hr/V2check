// lib/auth/index.ts
// Совместимый реэкспорт под импортами '@/lib/auth'.
// Некоторые файлы в проекте импортируют отсюда getTelegramIdStrict.
export {
  verifyInitData,
  getTelegramId,
  getTelegramIdStrict,
} from './verifyInitData';
