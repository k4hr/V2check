/* path: lib/i18n.ts */
'use client';

export type Locale =
  | 'ru'  // Русский
  | 'en'  // English
  | 'uk'  // Українська
  | 'be'  // Беларуская
  | 'kk'  // Қазақша
  | 'uz'  // Oʻzbekcha
  | 'ky'  // Кыргызча
  | 'fa'  // فارسی
  | 'hi'; // हिन्दी

export const FALLBACK: Locale = 'ru';
export const KNOWN: Locale[] = ['ru','en','uk','be','kk','uz','ky','fa','hi'];

/* ================== СЛОВАРЬ ================== */
/** Обрати внимание: ключи — короткие и повторно используемые во всём приложении. */
export const STRINGS: Record<Locale, Record<string, any>> = {
  ru: {
    appTitle:'LiveManager', subtitle:'Умные инструменты на каждый день',
    cabinet:'Личный кабинет', buy:'Купить подписку', daily:'Ежедневные задачи',
    expert:'Эксперт центр', changeLang:'Сменить язык', chooseLang:'Выберите язык интерфейса',
    cancel:'Отмена', save:'Сохранить', pro:'Pro', proplus:'Pro+', free:'Бесплатно',
    // таблица тарифов
    compareTitle:'Сравнение тарифов', param:'Параметр', aiModel:'Модель ИИ',
    unlimited:'Без ограничений', filesWork:'Работа с файлами',
    advancedScenarios:'Продвинутые сценарии', queuePriority:'Приоритет в очереди',
    saveAnswers:'Сохранение ответов',
    // кабинет
    back:'Назад', accountTitle:'Личный кабинет', hello:'Здравствуйте,', welcome:'Добро пожаловать!',
    subStatus:'Статус подписки', checking:'Проверяем подписку…', buyExtend:'Купить/продлить подписку',
    favorites:'Избранное', notActive:'Подписка не активна.',
    proActive:(u?:string)=>`У вас подписка Pro.${u?` До ${u}`:''}`,
    proPlusActive:(u?:string)=>`У вас подписка Pro+.${u?` До ${u}`:''}`,
    activeGeneric:(u?:string)=>`Подписка активна.${u?` До ${u}`:''}`,
  },

  en: {
    appTitle:'LiveManager', subtitle:'Smart tools for every day',
    cabinet:'Account', buy:'Buy subscription', daily:'Daily tasks',
    expert:'Expert Center', changeLang:'Change language', chooseLang:'Choose interface language',
    cancel:'Cancel', save:'Save', pro:'Pro', proplus:'Pro+', free:'Free',
    compareTitle:'Plan comparison', param:'Parameter', aiModel:'AI model',
    unlimited:'Unlimited', filesWork:'File support',
    advancedScenarios:'Advanced scenarios', queuePriority:'Queue priority',
    saveAnswers:'Save answers',
    back:'Back', accountTitle:'Account', hello:'Hello,', welcome:'Welcome!',
    subStatus:'Subscription status', checking:'Checking subscription…', buyExtend:'Buy / extend subscription',
    favorites:'Favorites', notActive:'No active subscription.',
    proActive:(u?:string)=>`Your Pro plan is active.${u?` Until ${u}`:''}`,
    proPlusActive:(u?:string)=>`Your Pro+ plan is active.${u?` Until ${u}`:''}`,
    activeGeneric:(u?:string)=>`Subscription is active.${u?` Until ${u}`:''}`,
  },

  uk: {
    appTitle:'LiveManager', subtitle:'Розумні інструменти на кожен день',
    cabinet:'Обліковий запис', buy:'Купити підписку', daily:'Щоденні завдання',
    expert:'Експерт-центр', changeLang:'Змінити мову', chooseLang:'Оберіть мову інтерфейсу',
    cancel:'Скасувати', save:'Зберегти', pro:'Pro', proplus:'Pro+', free:'Безкоштовно',
    compareTitle:'Порівняння тарифів', param:'Параметр', aiModel:'Модель ШІ',
    unlimited:'Без обмежень', filesWork:'Робота з файлами',
    advancedScenarios:'Розширені сценарії', queuePriority:'Пріоритет у черзі',
    saveAnswers:'Збереження відповідей',
    back:'Назад', accountTitle:'Обліковий запис', hello:'Вітаємо,', welcome:'Ласкаво просимо!',
    subStatus:'Статус підписки', checking:'Перевіряємо підписку…', buyExtend:'Купити/продовжити підписку',
    favorites:'Вибране', notActive:'Підписка не активна.',
    proActive:(u?:string)=>`У вас підписка Pro.${u?` До ${u}`:''}`,
    proPlusActive:(u?:string)=>`У вас підписка Pro+.${u?` До ${u}`:''}`,
    activeGeneric:(u?:string)=>`Підписка активна.${u?` До ${u}`:''}`,
  },

  be: {
    appTitle:'LiveManager', subtitle:'Разумныя інструменты на кожны дзень',
    cabinet:'Асабісты кабінет', buy:'Купіць падпіску', daily:'Штодзённыя задачы',
    expert:'Эксперт-цэнтр', changeLang:'Змяніць мову', chooseLang:'Абраць мову інтэрфейсу',
    cancel:'Адмяніць', save:'Захаваць', pro:'Pro', proplus:'Pro+', free:'Бясплатна',
    compareTitle:'Параўнанне тарыфаў', param:'Параметр', aiModel:'Мадэль ШІ',
    unlimited:'Без абмежаванняў', filesWork:'Працоўныя файлы',
    advancedScenarios:'Прасунутыя сцэнарыі', queuePriority:'Прыярытэт у чарзе',
    saveAnswers:'Захаванне адказаў',
    back:'Назад', accountTitle:'Асабісты кабінет', hello:'Вітаем,', welcome:'Сардэчна запрашаем!',
    subStatus:'Статус падпіскі', checking:'Правяраем падпіску…', buyExtend:'Купіць/падаўжыць падпіску',
    favorites:'Абранае', notActive:'Падпіска не актыўная.',
    proActive:(u?:string)=>`У вас падпіска Pro.${u?` Да ${u}`:''}`,
    proPlusActive:(u?:string)=>`У вас падпіска Pro+.${u?` Да ${u}`:''}`,
    activeGeneric:(u?:string)=>`Падпіска актыўная.${u?` Да ${u}`:''}`,
  },

  kk: {
    appTitle:'LiveManager', subtitle:'Күн сайынғы ақылды құралдар',
    cabinet:'Жеке кабинет', buy:'Жазылым сатып алу', daily:'Күнделікті тапсырмалар',
    expert:'Сарапшылар орталығы', changeLang:'Тілді өзгерту', chooseLang:'Интерфейс тілін таңдаңыз',
    cancel:'Болдырмау', save:'Сақтау', pro:'Pro', proplus:'Pro+', free:'Тегін',
    compareTitle:'Тарифтерді салыстыру', param:'Параметр', aiModel:'ЖИ моделі',
    unlimited:'Шектеусіз', filesWork:'Файлдармен жұмыс',
    advancedScenarios:'Кеңейтілген сценарийлер', queuePriority:'Кезектегі басымдық',
    saveAnswers:'Жауаптарды сақтау',
    back:'Артқа', accountTitle:'Жеке кабинет', hello:'Сәлеметсіз бе,', welcome:'Қош келдіңіз!',
    subStatus:'Жазылым күйі', checking:'Жазылым тексерілуде…', buyExtend:'Жазылымды сатып алу/ұзарту',
    favorites:'Таңдаулылар', notActive:'Жазылым белсенді емес.',
    proActive:(u?:string)=>`Сізде Pro жазылымы бар.${u?` ${u} дейін`:''}`,
    proPlusActive:(u?:string)=>`Сізде Pro+ жазылымы бар.${u?` ${u} дейін`:''}`,
    activeGeneric:(u?:string)=>`Жазылым белсенді.${u?` ${u} дейін`:''}`,
  },

  uz: {
    appTitle:'LiveManager', subtitle:'Har kuni uchun aqlli vositalar',
    cabinet:'Shaxsiy kabinet', buy:'Obunani sotib olish', daily:'Kundalik vazifalar',
    expert:'Ekspert markazi', changeLang:'Tilni o‘zgartirish', chooseLang:'Interfeys tilini tanlang',
    cancel:'Bekor qilish', save:'Saqlash', pro:'Pro', proplus:'Pro+', free:'Bepul',
    compareTitle:'Tariflarni solishtirish', param:'Parametr', aiModel:'AI modeli',
    unlimited:'Cheklovsiz', filesWork:'Fayllar bilan ishlash',
    advancedScenarios:'Kengaytirilgan ssenariylar', queuePriority:'Navbat ustuvorligi',
    saveAnswers:'Javoblarni saqlash',
    back:'Orqaga', accountTitle:'Shaxsiy kabinet', hello:'Salom,', welcome:'Xush kelibsiz!',
    subStatus:'Obuna holati', checking:'Tekshirilmoqda…', buyExtend:'Obunani sotib olish / uzaytirish',
    favorites:'Sevimlilar', notActive:'Faol obuna yo‘q.',
    proActive:(u?:string)=>`Sizda Pro obuna.${u?` ${u} gacha`:''}`,
    proPlusActive:(u?:string)=>`Sizda Pro+ obuna.${u?` ${u} gacha`:''}`,
    activeGeneric:(u?:string)=>`Obuna faol.${u?` ${u} gacha`:''}`,
  },

  ky: {
    appTitle:'LiveManager', subtitle:'Күн сайынгы акылдуу куралдар',
    cabinet:'Жеке кабинет', buy:'Жазылууну сатып алуу', daily:'Күнүмдүк тапшырмалар',
    expert:'Эксперт борбору', changeLang:'Тилди өзгөртүү', chooseLang:'Интерфейстин тилин тандаңыз',
    cancel:'Жокко чыгаруу', save:'Сактоо', pro:'Pro', proplus:'Pro+', free:'Акысыз',
    compareTitle:'Тарифтерди салыштыруу', param:'Параметр', aiModel:'ЖИ модели',
    unlimited:'Чектөөсүз', filesWork:'Файлдар менен иштөө',
    advancedScenarios:'Кеңейтилген сценарийлер', queuePriority:'Кезектеги артыкчылык',
    saveAnswers:'Жоопторду сактоо',
    back:'Артка', accountTitle:'Жеке кабинет', hello:'Салам,', welcome:'Кош келиңиз!',
    subStatus:'Жазылуу абалы', checking:'Текшерилүүдө…', buyExtend:'Жазылууну сатып алуу/узартуу',
    favorites:'Тандалгандар', notActive:'Жазылуу активдүү эмес.',
    proActive:(u?:string)=>`Сизде Pro жазылуу.${u?` ${u} чейин`:''}`,
    proPlusActive:(u?:string)=>`Сизде Pro+ жазылуу.${u?` ${u} чейин`:''}`,
    activeGeneric:(u?:string)=>`Жазылуу активдүү.${u?` ${u} чейин`:''}`,
  },

  fa: {
    appTitle:'LiveManager', subtitle:'ابزارهای هوشمند برای هر روز',
    cabinet:'حساب کاربری', buy:'خرید اشتراک', daily:'وظایف روزانه',
    expert:'مرکز کارشناسان', changeLang:'تغییر زبان', chooseLang:'زبان رابط را انتخاب کنید',
    cancel:'انصراف', save:'ذخیره', pro:'Pro', proplus:'Pro+', free:'رایگان',
    compareTitle:'مقایسه طرح‌ها', param:'پارامتر', aiModel:'مدل هوش مصنوعی',
    unlimited:'بدون محدودیت', filesWork:'کار با فایل‌ها',
    advancedScenarios:'سناریوهای پیشرفته', queuePriority:'اولویت در صف',
    saveAnswers:'ذخیره پاسخ‌ها',
    back:'بازگشت', accountTitle:'حساب کاربری', hello:'سلام،', welcome:'خوش آمدید!',
    subStatus:'وضعیت اشتراک', checking:'در حال بررسی…', buyExtend:'خرید/تمدید اشتراک',
    favorites:'علاقه‌مندی‌ها', notActive:'اشتراک فعال نیست.',
    proActive:(u?:string)=>`اشتراک Pro فعال است.${u?` تا ${u}`:''}`,
    proPlusActive:(u?:string)=>`اشتراک Pro+ فعال است.${u?` تا ${u}`:''}`,
    activeGeneric:(u?:string)=>`اشتراک فعال است.${u?` تا ${u}`:''}`,
  },

  hi: {
    appTitle:'LiveManager', subtitle:'हर दिन के लिए स्मार्ट टूल',
    cabinet:'खाता', buy:'सदस्यता खरीदें', daily:'दैनिक कार्य',
    expert:'एक्सपर्ट सेंटर', changeLang:'भाषा बदलें', chooseLang:'इंटरफ़ेस भाषा चुनें',
    cancel:'रद्द करें', save:'सहेजें', pro:'Pro', proplus:'Pro+', free:'निःशुल्क',
    compareTitle:'टैरिफ़ तुलना', param:'पैरामीटर', aiModel:'एआई मॉडल',
    unlimited:'अनलिमिटेड', filesWork:'फाइल सपोर्ट',
    advancedScenarios:'एडवांस्ड सीनारियो', queuePriority:'क्यू प्राथमिकता',
    saveAnswers:'उत्तर सहेजें',
    back:'वापस', accountTitle:'खाता', hello:'नमस्ते,', welcome:'स्वागत है!',
    subStatus:'सदस्यता स्थिति', checking:'जाँच हो रही है…', buyExtend:'सदस्यता खरीदें/बढ़ाएँ',
    favorites:'पसंदीदा', notActive:'कोई सक्रिय सदस्यता नहीं।',
    proActive:(u?:string)=>`आपकी Pro योजना सक्रिय है.${u?` ${u} तक`:''}`,
    proPlusActive:(u?:string)=>`आपकी Pro+ योजना सक्रिय है.${u?` ${u} तक`:''}`,
    activeGeneric:(u?:string)=>`सदस्यता सक्रिय है.${u?` ${u} तक`:''}`,
  },
};

/* ================== КУКИ и ДЕТЕКТ ================== */

function readCookie(name: string): string {
  try {
    const p = (document.cookie || '').split('; ').find(x => x.startsWith(name + '='));
    return p ? decodeURIComponent(p.split('=').slice(1).join('=')) : '';
  } catch { return ''; }
}

function writeCookie(name: string, value: string, days = 365) {
  const maxAge = 60 * 60 * 24 * days;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

/** Нормализуем к коду из KNOWN */
function normalizeToKnown(code: string): Locale | null {
  const c = code.toLowerCase();
  const map: Record<string, Locale> = {
    ru:'ru', uk:'uk', 'uk-ua':'uk',
    be:'be', 'be-by':'be',
    kk:'kk', 'kk-kz':'kk',
    uz:'uz', 'uz-uz':'uz',
    ky:'ky', 'ky-kg':'ky',
    fa:'fa', 'fa-ir':'fa', 'fa-af':'fa', 'fa-fa':'fa', 'fa-iw':'fa',
    hi:'hi', 'hi-in':'hi',
    en:'en', 'en-us':'en', 'en-gb':'en',
  };
  return (map[c] ?? (KNOWN.includes(c as Locale) ? (c as Locale) : null));
}

/** Читаем язык: 1) cookie locale/NEXT_LOCALE 2) Telegram language_code 3) navigator.language 4) fallback */
export function readLocale(): Locale {
  const fromCookie = (readCookie('NEXT_LOCALE') || readCookie('locale') || '').toLowerCase();
  if (KNOWN.includes(fromCookie as Locale)) return fromCookie as Locale;

  // Telegram WebApp
  try {
    const lang = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    const norm = lang ? normalizeToKnown(lang) : null;
    if (norm) return norm;
  } catch {}

  // Браузер
  try {
    const lang = navigator.language || (navigator as any).userLanguage;
    const norm = lang ? normalizeToKnown(lang) : null;
    if (norm) return norm;
  } catch {}

  return FALLBACK;
}

/** Сохраняем язык сразу в две куки + html@lang */
export function setLocaleEverywhere(code: Locale) {
  const safe = KNOWN.includes(code) ? code : FALLBACK;
  writeCookie('locale', safe);
  writeCookie('NEXT_LOCALE', safe);
  try { document.documentElement.lang = safe; } catch {}
}

/** Одноразовый авто-сейв: если куки нет — определяем и записываем */
export function ensureLocaleCookie() {
  const cur = readCookie('locale') || readCookie('NEXT_LOCALE');
  if (!cur) {
    const guess = readLocale();
    setLocaleEverywhere(guess);
  }
}
