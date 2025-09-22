// app/assistant/strings.ts
import { getRootLabel, getSubLabel } from './config';

/** Все тексты, которые «меняем» */
export const UI = {
  appTitle: 'Юридический ассистент',
  backBtn: '← Назад',
  typing: 'Думаю…',
  inputPlaceholder: 'Сообщение…',
  chooseAbovePlaceholder: 'Выберите вариант выше',
  paywall:
    'Ответ подготовлен. Чтобы увидеть его целиком и получить пошаговые действия, оформите подписку Juristum Pro.',
  saveOk: '✅ Дело сохранено в Личный кабинет → Мои дела.',
  saveFail: '⚠️ Не удалось сохранить дело. Откройте Личный кабинет и попробуйте позже.',
  saveError: '⚠️ Сбой при сохранении дела. Попробуйте позже.',
  openCase: (id: string) => `Открыть дело ›`,
};

/** Заголовок дела — автоматически берёт названия из категорий */
export function composeCaseTitle(rootKey: string, subKey: string) {
  const rootLabel = getRootLabel(rootKey);
  const subLabel = getSubLabel(rootKey, subKey);
  return subLabel ? `${rootLabel} — ${subLabel}` : rootLabel;
}
