// lib/auth.ts
// Баррель для совместимости: любой импорт "@/lib/auth" получит эти экспорты.
// Это перекрывает неоднозначность между "файл" и "папка" auth/.
export {
  verifyInitData,
  getTelegramId,
  getTelegramIdStrict,
} from './auth/verifyInitData';
