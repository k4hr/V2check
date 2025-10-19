/* path: lib/i18n.ts */
'use client';

/* ========= Типы и константы ========= */

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

/** Языки для селектора в UI (флаги/ярлыки) */
export const UI_LOCALES: Array<{ code: Locale; label: string; flag: string; native?: string }> = [
  { code: 'ru', label: 'Русский',     flag: '🇷🇺', native: 'Русский' },
  { code: 'en', label: 'English',     flag: '🇬🇧', native: 'English' },
  { code: 'uk', label: 'Українська',  flag: '🇺🇦', native: 'Українська' },
  { code: 'be', label: 'Беларуская',  flag: '🇧🇾', native: 'Беларуская' },
  { code: 'kk', label: 'Қазақша',     flag: '🇰🇿', native: 'Қазақша' },
  { code: 'uz', label: 'Oʻzbekcha',   flag: '🇺🇿', native: 'Oʻzbekcha' },
  { code: 'ky', label: 'Кыргызча',    flag: '🇰🇬', native: 'Кыргызча' },
  { code: 'fa', label: 'فارسی',       flag: '🇮🇷', native: 'فارسی' },
  { code: 'hi', label: 'हिन्दी',      flag: '🇮🇳', native: 'हिन्दी' },
];

/** Языки с письмом RTL */
const RTL_LANGS: Locale[] = ['fa'];
export const isRTL = (l: Locale) => RTL_LANGS.includes(l);

/* ================== СЛОВАРЬ ================== */
/** Короткие ключи, переиспользуются по всему приложению. */
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

    // избранное / общее
    favoritesEmpty:'Здесь будут сохраняться ваши чаты, при активной подписке Pro+',
    backToCabinet:'Назад в кабинет',
    untitled:'Без названия',
    loadError:'Ошибка загрузки',

    /* ===== Chat (CHATGPT 5) ===== */
    chatTitle:'CHATGPT 5',
    chatSubtitle:'Свободное общение. Спросите что угодно.',
    chatSystemPrompt:'Ты дружелюбный ассистент. Пиши по делу и без Markdown.',
    chatHello:'Привет! Чем помочь?',
    chatThinking:'Думаю…',
    chatPlaceholder:'Я вас слушаю...',
    chatDownload:'Скачать',
    chatOpen:'Открыть',
    chatDone:'Готово. Продолжим?',
    chatSvcDown:'Сервис временно недоступен. Попробуем ещё раз?',
    chatUploadFail:'Не удалось загрузить все вложения. Попробуем ещё раз?',
    chatFreeLimit:(n:number)=>`Исчерпан дневной бесплатный лимит (${n}). Оформите Pro или попробуйте завтра.`,
    chatProBadge:'Pro+ активен',
    chatFavOnlyPro:'Избранное доступно только в Pro+.',
    chatSaved:'Чат сохранён в избранное ★',
    chatSaveFail:'Не удалось сохранить в избранное.',
    chatFavRemove:'Убрать из избранного',
    chatFavAdd:'Сохранить весь чат в избранное (Pro+)',
    chatNoText:'(сообщение без текста)',
    chatAttachNote:(n:number)=>`\n📎 Вложений: ${n}`,
    chatImagesMarker:'(изображения)',
    chatImagesHeader:'Прикреплённые изображения:',
    chatErrorShort:'Ошибка',
    chatAttachAria:'Прикрепить',
    chatAttachTitle:(max:number)=>`Достигнут лимит ${max} фото`,
    chatAttachTitleDefault:'Прикрепить изображения',
    chatSendAria:'Отправить',
    chatSendTitle:'Отправить',
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

    favoritesEmpty:'Your chats will appear here with an active Pro+ subscription',
    backToCabinet:'Back to account',
    untitled:'Untitled',
    loadError:'Load error',

    /* ===== Chat (CHATGPT 5) ===== */
    chatTitle:'CHATGPT 5',
    chatSubtitle:'Free-form chat. Ask anything.',
    chatSystemPrompt:'You are a friendly assistant. Be concise and do not use Markdown.',
    chatHello:'Hi! How can I help?',
    chatThinking:'Thinking…',
    chatPlaceholder:"I'm listening...",
    chatDownload:'Download',
    chatOpen:'Open',
    chatDone:'Done. Continue?',
    chatSvcDown:'Service is temporarily unavailable. Try again?',
    chatUploadFail:'Failed to upload all attachments. Try again?',
    chatFreeLimit:(n:number)=>`Daily free limit reached (${n}). Get Pro or try again tomorrow.`,
    chatProBadge:'Pro+ active',
    chatFavOnlyPro:'Favorites are available in Pro+ only.',
    chatSaved:'Chat saved to favorites ★',
    chatSaveFail:'Failed to save to favorites.',
    chatFavRemove:'Remove from favorites',
    chatFavAdd:'Save chat to favorites (Pro+)',
    chatNoText:'(message without text)',
    chatAttachNote:(n:number)=>`\n📎 Attachments: ${n}`,
    chatImagesMarker:'(images)',
    chatImagesHeader:'Attached images:',
    chatErrorShort:'Error',
    chatAttachAria:'Attach',
    chatAttachTitle:(max:number)=>`Limit reached: ${max} images`,
    chatAttachTitleDefault:'Attach images',
    chatSendAria:'Send',
    chatSendTitle:'Send',
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

    favoritesEmpty:'Тут зберігатимуться ваші чати за активної підписки Pro+',
    backToCabinet:'Назад до кабінету', // фикс опечатки
    untitled:'Без назви',
    loadError:'Помилка завантаження',
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

    favoritesEmpty:'Тут будуць захоўвацца вашыя чаты пры актыўнай падпісцы Pro+',
    backToCabinet:'Назад у кабінет',
    untitled:'Без назвы',
    loadError:'Памылка загрузкі',
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

    favoritesEmpty:'Pro+ белсенді жазылымында чаттарыңыз осында сақталады',
    backToCabinet:'Кабинетке қайту',
    untitled:'Атаусыз',
    loadError:'Жүктеу қатесі',
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

    favoritesEmpty:'Pro+ faol obunada suhbatlaringiz shu yerda saqlanadi',
    backToCabinet:'Kabinetga qaytish',
    untitled:'Nomsiz',
    loadError:'Yuklash xatosi',
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

    favoritesEmpty:'Pro+ активдүү жазылууда чаттарыңыз бул жерде сакталат',
    backToCabinet:'Кабинетке кайтуу',
    untitled:'Аталышы жок',
    loadError:'Жүктөө катасы',
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

    favoritesEmpty:'با اشتراک فعال Pro+، گفتگوهای شما در اینجا نمایش داده می‌شوند',
    backToCabinet:'بازگشت به حساب',
    untitled:'بدون عنوان',
    loadError:'خطا در بارگذاری',
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

    favoritesEmpty:'सक्रिय Pro+ सदस्यता के साथ आपके चैट यहाँ दिखेंगे',
    backToCabinet:'वापस खाते में',
    untitled:'शीर्षक रहित',
    loadError:'लोड त्रुटि',
  },
};

/* Небольшой помощник для безопасного доступа к строкам */
export const t = (locale: Locale, key: string, fallback?: string): any =>
  STRINGS[locale]?.[key] ?? STRINGS[FALLBACK][key] ?? fallback ?? key;

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
    fa:'fa', 'fa-ir':'fa', 'fa-af':'fa',
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

/** Применяем язык к документу (lang + dir) */
export function applyLocaleToDocument(locale: Locale) {
  try {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
  } catch {}
}

/** Сохраняем язык в куки + html@lang/dir */
export function setLocaleEverywhere(code: Locale) {
  const safe = KNOWN.includes(code) ? code : FALLBACK;
  writeCookie('locale', safe);
  writeCookie('NEXT_LOCALE', safe);
  applyLocaleToDocument(safe);
}

/** Одноразовый авто-сейв: если куки нет — определяем и записываем */
export function ensureLocaleCookie() {
  const cur = readCookie('locale') || readCookie('NEXT_LOCALE');
  if (!cur) {
    const guess = readLocale();
    setLocaleEverywhere(guess);
  } else {
    // синхронизируем dir на случай ручной правки или миграции
    applyLocaleToDocument(normalizeToKnown(cur) || FALLBACK);
  }
}
