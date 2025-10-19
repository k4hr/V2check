/* path: lib/i18n/ChatGPT.ts */
'use client';

import type { Locale } from '@/lib/i18n';

/** Набор ключей, которые использует страница ChatGPT */
export type ChatDict = {
  title: string;
  subtitle: string;
  systemPrompt: string;

  proBadge: string;

  uploadingFail: string;
  svcDown: string;
  done: string;
  freeLimit: (n: number) => string;

  favOnlyPro: string;
  saved: string;
  saveFail: string;
  starOnTitle: string;
  starOffTitle: string;

  placeholder: string;
  download: string;
  open: string;
  thinking: string;
  hello: string;
  noText: string;

  attachNote: (n: number) => string;
  imagesMarker: string;
  imagesHeader: string;
  errorShort: string;

  attachAria: string;
  attachTitle: (max: number) => string;
  attachTitleDefault: string;

  sendAria: string;
  sendTitle: string;
};

/** Переводы для всех поддерживаемых локалей */
export const CHATGPT: Record<Locale, ChatDict> = {
  ru: {
    title: 'CHATGPT 5',
    subtitle: 'Свободное общение. Спросите что угодно.',
    systemPrompt: 'Ты дружелюбный ассистент. Пиши по делу и без Markdown.',

    proBadge: 'Pro+ активен',

    uploadingFail: 'Не удалось загрузить все вложения. Попробуем ещё раз?',
    svcDown: 'Сервис временно недоступен. Попробуем ещё раз?',
    done: 'Готово. Продолжим?',
    freeLimit: (n) => `Исчерпан дневной бесплатный лимит (${n}). Оформите Pro или попробуйте завтра.`,

    favOnlyPro: 'Избранное доступно только в Pro+.',
    saved: 'Чат сохранён в избранное ★',
    saveFail: 'Не удалось сохранить в избранное.',
    starOnTitle: 'Убрать из избранного',
    starOffTitle: 'Сохранить весь чат в избранное (Pro+)',

    placeholder: 'Я вас слушаю...',
    download: 'Скачать',
    open: 'Открыть',
    thinking: 'Думаю…',
    hello: 'Привет! Чем помочь?',
    noText: '(сообщение без текста)',

    attachNote: (n) => `\n📎 Вложений: ${n}`,
    imagesMarker: '(изображения)',
    imagesHeader: 'Прикреплённые изображения:',
    errorShort: 'Ошибка',

    attachAria: 'Прикрепить',
    attachTitle: (max) => `Достигнут лимит ${max} фото`,
    attachTitleDefault: 'Прикрепить изображения',

    sendAria: 'Отправить',
    sendTitle: 'Отправить',
  },

  en: {
    title: 'CHATGPT 5',
    subtitle: 'Free-form chat. Ask anything.',
    systemPrompt: 'You are a friendly assistant. Be concise and do not use Markdown.',

    proBadge: 'Pro+ active',

    uploadingFail: 'Failed to upload all attachments. Try again?',
    svcDown: 'Service is temporarily unavailable. Try again?',
    done: 'Done. Continue?',
    freeLimit: (n) => `Daily free limit reached (${n}). Get Pro or try again tomorrow.`,

    favOnlyPro: 'Favorites are available in Pro+ only.',
    saved: 'Chat saved to favorites ★',
    saveFail: 'Failed to save to favorites.',
    starOnTitle: 'Remove from favorites',
    starOffTitle: 'Save entire chat to favorites (Pro+)',

    placeholder: "I'm listening...",
    download: 'Download',
    open: 'Open',
    thinking: 'Thinking…',
    hello: 'Hi! How can I help?',
    noText: '(message without text)',

    attachNote: (n) => `\n📎 Attachments: ${n}`,
    imagesMarker: '(images)',
    imagesHeader: 'Attached images:',
    errorShort: 'Error',

    attachAria: 'Attach',
    attachTitle: (max) => `Limit ${max} photos reached`,
    attachTitleDefault: 'Attach images',

    sendAria: 'Send',
    sendTitle: 'Send',
  },

  uk: {
    title: 'CHATGPT 5',
    subtitle: 'Вільне спілкування. Питайте що завгодно.',
    systemPrompt: 'Ти дружній асистент. Пиши по суті й без Markdown.',

    proBadge: 'Pro+ активний',

    uploadingFail: 'Не вдалося завантажити всі вкладення. Спробувати ще раз?',
    svcDown: 'Сервіс тимчасово недоступний. Спробувати ще раз?',
    done: 'Готово. Продовжимо?',
    freeLimit: (n) => `Вичерпано денний безкоштовний ліміт (${n}). Оформіть Pro або спробуйте завтра.`,

    favOnlyPro: 'Вибране доступне лише в Pro+.',
    saved: 'Чат збережено у вибране ★',
    saveFail: 'Не вдалося зберегти у вибране.',
    starOnTitle: 'Прибрати з вибраного',
    starOffTitle: 'Зберегти весь чат у вибране (Pro+)',

    placeholder: 'Я вас слухаю...',
    download: 'Завантажити',
    open: 'Відкрити',
    thinking: 'Думаю…',
    hello: 'Привіт! Чим допомогти?',
    noText: '(повідомлення без тексту)',

    attachNote: (n) => `\n📎 Вкладень: ${n}`,
    imagesMarker: '(зображення)',
    imagesHeader: 'Прикріплені зображення:',
    errorShort: 'Помилка',

    attachAria: 'Прикріпити',
    attachTitle: (max) => `Досягнуто ліміт ${max} фото`,
    attachTitleDefault: 'Прикріпити зображення',

    sendAria: 'Надіслати',
    sendTitle: 'Надіслати',
  },

  be: {
    title: 'CHATGPT 5',
    subtitle: 'Вольнае зносіны. Пытайце што заўгодна.',
    systemPrompt: 'Ты дружалюбны памочнік. Пішы па сутнасці і без Markdown.',

    proBadge: 'Pro+ актыўны',

    uploadingFail: 'Не ўдалося загрузіць усе ўкладанні. Паспрабаваць яшчэ?',
    svcDown: 'Сэрвіс часова недаступны. Паспрабаваць яшчэ?',
    done: 'Гатова. Працягнем?',
    freeLimit: (n) => `Скончыўся дзённы бясплатны ліміт (${n}). Аформіце Pro або паспрабуйце заўтра.`,

    favOnlyPro: 'Абранае даступна толькі ў Pro+.',
    saved: 'Чат захаваны ў абранае ★',
    saveFail: 'Не ўдалося захаваць у абранае.',
    starOnTitle: 'Прыбраць з абранага',
    starOffTitle: 'Захаваць увесь чат у абранае (Pro+)',

    placeholder: 'Я вас слухаю...',
    download: 'Спампаваць',
    open: 'Адкрыць',
    thinking: 'Думаю…',
    hello: 'Прывітанне! Чым дапамагчы?',
    noText: '(паведамленне без тэксту)',

    attachNote: (n) => `\n📎 Укладанняў: ${n}`,
    imagesMarker: '(выявы)',
    imagesHeader: 'Прыкрепленыя выявы:',
    errorShort: 'Памылка',

    attachAria: 'Прыкласці',
    attachTitle: (max) => `Дасягнуты ліміт ${max} фота`,
    attachTitleDefault: 'Прыкласці выявы',

    sendAria: 'Адправіць',
    sendTitle: 'Адправіць',
  },

  kk: {
    title: 'CHATGPT 5',
    subtitle: 'Еркін сөйлесу. Қалағаныңызды сұраңыз.',
    systemPrompt: 'Сен достық көмекшісің. Нақты жаз және Markdown қолданба.',

    proBadge: 'Pro+ белсенді',

    uploadingFail: 'Барлық файлды жүктеу мүмкін болмады. Қайта көрейік пе?',
    svcDown: 'Қызмет уақытша қолжетімсіз. Қайта көрейік пе?',
    done: 'Дайын. Жалғастырамыз ба?',
    freeLimit: (n) => `Күнделікті тегін лимит аяқталды (${n}). Pro алыңыз немесе ертең көріңіз.`,

    favOnlyPro: 'Таңдаулылар тек Pro+ пакетінде.',
    saved: 'Чат таңдаулыларға сақталды ★',
    saveFail: 'Таңдаулыларға сақтау сәтсіз.',
    starOnTitle: 'Таңдаулылардан алып тастау',
    starOffTitle: 'Бүкіл чатты таңдаулыларға сақтау (Pro+)',

    placeholder: 'Мен тыңдап тұрмын...',
    download: 'Жүктеп алу',
    open: 'Ашу',
    thinking: 'Ойлануда…',
    hello: 'Сәлем! Қалай көмектесемін?',
    noText: '(мәтінсіз хабарлама)',

    attachNote: (n) => `\n📎 Тіркемелер: ${n}`,
    imagesMarker: '(суреттер)',
    imagesHeader: 'Тіркелген суреттер:',
    errorShort: 'Қате',

    attachAria: 'Тіркеу',
    attachTitle: (max) => `Шектеу ${max} фото`,
    attachTitleDefault: 'Суреттерді тіркеу',

    sendAria: 'Жіберу',
    sendTitle: 'Жіберу',
  },

  uz: {
    title: 'CHATGPT 5',
    subtitle: 'Erkin suhbat. Istagan narsani so‘rang.',
    systemPrompt: 'Siz do‘stona yordamchisiz. Qisqa yozing va Markdown ishlatmang.',

    proBadge: 'Pro+ faol',

    uploadingFail: 'Barcha ilovalarni yuklab bo‘lmadi. Qayta urinaymi?',
    svcDown: 'Xizmat vaqtincha mavjud emas. Qayta urinaymi?',
    done: 'Tayyor. Davom etamizmi?',
    freeLimit: (n) => `Kunlik bepul limit tugadi (${n}). Pro oling yoki ertaga urinib ko‘ring.`,

    favOnlyPro: 'Sevimlilar faqat Pro+ da.',
    saved: 'Chat sevimlilarga saqlandi ★',
    saveFail: 'Sevimlilarga saqlash muvaffaqiyatsiz.',
    starOnTitle: 'Sevimlilardan olib tashlash',
    starOffTitle: 'Butun chatni sevimlilarga saqlash (Pro+)',

    placeholder: 'Tinglayapman...',
    download: 'Yuklab olish',
    open: 'Ochish',
    thinking: 'O‘ylayapman…',
    hello: 'Salom! Qanday yordam bera olaman?',
    noText: '(matnsiz xabar)',

    attachNote: (n) => `\n📎 Ilovalar: ${n}`,
    imagesMarker: '(rasmlar)',
    imagesHeader: 'Biriktirilgan rasmlar:',
    errorShort: 'Xato',

    attachAria: 'Biriktirish',
    attachTitle: (max) => `Chegara: ${max} ta foto`,
    attachTitleDefault: 'Rasm biriktirish',

    sendAria: 'Yuborish',
    sendTitle: 'Yuborish',
  },

  ky: {
    title: 'CHATGPT 5',
    subtitle: 'Эркин баарлашуу. Каалаганыңызды сураңыз.',
    systemPrompt: 'Сен достук жардамчысың. Негизгисин гана жаз жана Markdown колдонбо.',

    proBadge: 'Pro+ активдүү',

    uploadingFail: 'Бардык тиркемелер жүктөлгөн жок. Кайра аракет кылабызбы?',
    svcDown: 'Кызмат убактылуу жеткиликсиз. Кайра аракет кылабызбы?',
    done: 'Даяр. Улантабызбы?',
    freeLimit: (n) => `Күндөлүк акысыз лимит бүттү (${n}). Pro алыңыз же эртең сынап көрүңүз.`,

    favOnlyPro: 'Тандалгандар Pro+та гана жеткиликтүү.',
    saved: 'Чат тандалгандарга сакталды ★',
    saveFail: 'Тандалгандарга сактоо ишке ашкан жок.',
    starOnTitle: 'Тандалгандардан алып салуу',
    starOffTitle: 'Чатты толугу менен тандалгандарга сактоо (Pro+)',

    placeholder: 'Угуп жатам...',
    download: 'Жүктөп алуу',
    open: 'Ачуу',
    thinking: 'Ойлонууда…',
    hello: 'Салам! Кандай жардам берейин?',
    noText: '(текстсиз билдирүү)',

    attachNote: (n) => `\n📎 Тиркемелер: ${n}`,
    imagesMarker: '(сүрөттөр)',
    imagesHeader: 'Тиркелген сүрөттөр:',
    errorShort: 'Ката',

    attachAria: 'Тиркөө',
    attachTitle: (max) => `Лимит: ${max} фото`,
    attachTitleDefault: 'Сүрөт тиркөө',

    sendAria: 'Жиберүү',
    sendTitle: 'Жиберүү',
  },

  fa: {
    title: 'CHATGPT 5',
    subtitle: 'گفت‌وگوی آزاد. هر چه می‌خواهید بپرسید.',
    systemPrompt: 'شما دستیار صمیمی هستید. خلاصه بنویسید و از مارک‌داون استفاده نکنید.',

    proBadge: '+Pro فعال',

    uploadingFail: 'بارگذاری همهٔ پیوست‌ها ناموفق بود. دوباره تلاش کنیم؟',
    svcDown: 'سرویس موقتاً در دسترس نیست. دوباره تلاش کنیم؟',
    done: 'تمام. ادامه بدهیم؟',
    freeLimit: (n) => `سقف رایگان روزانه تمام شد (${n}). Pro بخرید یا فردا دوباره امتحان کنید.`,

    favOnlyPro: 'علاقه‌مندی‌ها فقط در Pro+ در دسترس است.',
    saved: 'گفتگو در علاقه‌مندی‌ها ذخیره شد ★',
    saveFail: 'ذخیره در علاقه‌مندی‌ها ناموفق بود.',
    starOnTitle: 'حذف از علاقه‌مندی‌ها',
    starOffTitle: 'ذخیرهٔ کل گفتگو در علاقه‌مندی‌ها (Pro+)',

    placeholder: 'گوش می‌دهم...',
    download: 'دانلود',
    open: 'باز کردن',
    thinking: 'در حال فکر…',
    hello: 'سلام! چطور می‌توانم کمک کنم؟',
    noText: '(پیام بدون متن)',

    attachNote: (n) => `\n📎 پیوست‌ها: ${n}`,
    imagesMarker: '(تصاویر)',
    imagesHeader: 'تصاویر پیوست‌شده:',
    errorShort: 'خطا',

    attachAria: 'پیوست',
    attachTitle: (max) => `محدودیت ${max} عکس`,
    attachTitleDefault: 'پیوست‌کردن تصویر',

    sendAria: 'ارسال',
    sendTitle: 'ارسال',
  },

  hi: {
    title: 'CHATGPT 5',
    subtitle: 'खुली बातचीत. जो चाहें पूछें।',
    systemPrompt:
      'आप एक मित्रवत सहायक हैं। संक्षेप में लिखें और Markdown न इस्तेमाल करें.',

    proBadge: 'Pro+ सक्रिय',

    uploadingFail: 'सभी अटैचमेंट अपलोड नहीं हो पाए। फिर से कोशिश करें?',
    svcDown: 'सेवा अस्थायी रूप से उपलब्ध नहीं है। फिर से कोशिश करें?',
    done: 'हो गया. आगे बढ़ें?',
    freeLimit: (n) =>
      `दैनिक मुफ़्त सीमा पूरी हुई (${n}). Pro लें या कल फिर कोशिश करें.`,

    favOnlyPro: 'पसंदीदा केवल Pro+ में उपलब्ध है.',
    saved: 'चैट पसंदीदा में सहेजी गई ★',
    saveFail: 'पसंदीदा में सहेजना विफल.',
    starOnTitle: 'पसंदीदा से हटाएँ',
    starOffTitle: 'पूरी चैट को पसंदीदा में सहेजें (Pro+)',

    placeholder: 'मैं सुन रहा/रही हूँ...',
    download: 'डाउनलोड',
    open: 'खोलें',
    thinking: 'सोच रहा/रही हूँ…',
    hello: 'नमस्ते! मैं कैसे मदद कर सकता/सकती हूँ?',
    noText: '(बिना टेक्स्ट का संदेश)',

    attachNote: (n) => `\n📎 संलग्नक: ${n}`,
    imagesMarker: '(छवियाँ)',
    imagesHeader: 'संलग्न छवियाँ:',
    errorShort: 'त्रुटि',

    attachAria: 'संलग्न करें',
    attachTitle: (max) => `सीमा: ${max} फ़ोटो`,
    attachTitleDefault: 'छवियाँ संलग्न करें',

    sendAria: 'भेजें',
    sendTitle: 'भेजें',
  },
};

/** Вернёт словарь для нужной локали, с безопасным падением на ru */
export function getChatStrings(locale: Locale): ChatDict {
  return CHATGPT[locale] ?? CHATGPT.ru;
}

/** Опциональный хелпер-точечка, если хочешь адресоваться по ключу */
export function chatT<K extends keyof ChatDict>(
  locale: Locale,
  key: K,
  ...args: ChatDict[K] extends (...a: any[]) => any ? Parameters<ChatDict[K]> : never
): ChatDict[K] {
  const dict = getChatStrings(locale);
  const value = dict[key];
  // если значение — функция, выполним её с аргументами
  // типизация выше уже это учитывает
  // @ts-expect-error — TS не умеет в условную диспетчеризацию значений
  return typeof value === 'function' ? value(...args) : value;
}
