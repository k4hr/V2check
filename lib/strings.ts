// lib/strings.ts
import type { Locale } from './i18n';

type Dict = Record<string, string>;
const D = (d: Dict) => d;

export const STRINGS: Record<Locale, Dict> = {
  ru: D({
    brand:'LiveManager', tagline:'Умные инструменты на каждый день',
    cabinet:'Личный кабинет', buy:'Купить подписку', tasks:'Ежедневные задачи', expert:'Эксперт центр',
    pro:'Pro', proPlus:'Pro+', langBtn:'Сменить язык/страну', chooseLang:'Выберите язык интерфейса',
    save:'Сохранить', cancel:'Отмена',
  }),
  en: D({
    brand:'LiveManager', tagline:'Smart tools for every day',
    cabinet:'Account', buy:'Buy subscription', tasks:'Daily tasks', expert:'Expert center',
    pro:'Pro', proPlus:'Pro+', langBtn:'Change language/country', chooseLang:'Choose interface language',
    save:'Save', cancel:'Cancel',
  }),
  uk: D({
    brand:'LiveManager', tagline:'Розумні інструменти на щодень',
    cabinet:'Особистий кабінет', buy:'Придбати підписку', tasks:'Щоденні задачі', expert:'Експерт-центр',
    pro:'Pro', proPlus:'Pro+', langBtn:'Змінити мову/країну', chooseLang:'Виберіть мову інтерфейсу',
    save:'Зберегти', cancel:'Скасувати',
  }),
  kk: D({
    brand:'LiveManager', tagline:'Күнделікті ақылды құралдар',
    cabinet:'Жеке кабинет', buy:'Жазылымды сатып алу', tasks:'Күнделікті тапсырмалар', expert:'Сарапшы орталығы',
    pro:'Pro', proPlus:'Pro+', langBtn:'Тілді/елді өзгерту', chooseLang:'Интерфейс тілін таңдаңыз',
    save:'Сақтау', cancel:'Болдырмау',
  }),
  tr: D({
    brand:'LiveManager', tagline:'Her gün için akıllı araçlar',
    cabinet:'Hesabım', buy:'Abonelik satın al', tasks:'Günlük görevler', expert:'Uzman merkezi',
    pro:'Pro', proPlus:'Pro+', langBtn:'Dili/ülkeyi değiştir', chooseLang:'Arayüz dilini seçin',
    save:'Kaydet', cancel:'İptal',
  }),
  az: D({
    brand:'LiveManager', tagline:'Hər gün üçün ağıllı alətlər',
    cabinet:'Şəxsi kabinet', buy:'Abunə al', tasks:'Gündəlik tapşırıqlar', expert:'Ekspert mərkəzi',
    pro:'Pro', proPlus:'Pro+', langBtn:'Dili/ölkəni dəyiş', chooseLang:'İnterfeys dilini seçin',
    save:'Yadda saxla', cancel:'Ləğv et',
  }),
  ka: D({
    brand:'LiveManager', tagline:'ჭკვიანი ინსტრუმენტები ყოველდღისთვის',
    cabinet:'პირადი კაბინეტი', buy:'გამოწერის ყიდვა', tasks:'ყოველდღიური ამოცანები', expert:'ექსპერტული ცენტრი',
    pro:'Pro', proPlus:'Pro+', langBtn:'ენის/ქვეყნის შეცვლა', chooseLang:'აირჩიეთ ინტერფეისის ენა',
    save:'შენახვა', cancel:'გაუქმება',
  }),
  hy: D({
    brand:'LiveManager', tagline:'Խելացի գործիքներ ամեն օր',
    cabinet:'Անձնական գրասենյակ', buy:'Գնել բաժանորդագրություն', tasks:'Ամենօրյա առաջադրանքներ', expert:'Փորձագետների կենտրոն',
    pro:'Pro', proPlus:'Pro+', langBtn:'Փոխել լեզուն/երկիրը', chooseLang:'Ընտրեք ինտերֆեյսի լեզուն',
    save:'Պահպանել', cancel:'Չեղարկել',
  }),
  be: D({
    brand:'LiveManager', tagline:'Разумныя інструменты на кожны дзень',
    cabinet:'Асабісты кабінет', buy:'Набыць падпіску', tasks:'Штодзённыя задачы', expert:'Эксперт-цэнтр',
    pro:'Pro', proPlus:'Pro+', langBtn:'Змяніць мову/краіну', chooseLang:'Абярыце мову інтэрфейсу',
    save:'Захаваць', cancel:'Адмена',
  }),
  uz: D({
    brand:'LiveManager', tagline:'Har kungi aqlli vositalar',
    cabinet:'Shaxsiy kabinet', buy:'Obunani xarid qilish', tasks:'Kundalik vazifalar', expert:'Ekspert markazi',
    pro:'Pro', proPlus:'Pro+', langBtn:'Til/mamlakatni o‘zgartirish', chooseLang:'Interfeys tilini tanlang',
    save:'Saqlash', cancel:'Bekor qilish',
  }),
  ky: D({
    brand:'LiveManager', tagline:'Күндөлүк акылдуу куралдар',
    cabinet:'Жеке кабинет', buy:'Жазылууну сатып алуу', tasks:'Күндөлүк тапшырмалар', expert:'Эксперт борбору',
    pro:'Pro', proPlus:'Pro+', langBtn:'Тилди/өлкөнү алмаштыруу', chooseLang:'Интерфейс тилин тандаңыз',
    save:'Сактоо', cancel:'Жокко чыгаруу',
  }),
  ro: D({
    brand:'LiveManager', tagline:'Instrumente inteligente pentru fiecare zi',
    cabinet:'Cabinet personal', buy:'Cumpără abonament', tasks:'Sarcini zilnice', expert:'Centrul de experți',
    pro:'Pro', proPlus:'Pro+', langBtn:'Schimbă limba/țara', chooseLang:'Alege limba interfeței',
    save:'Salvează', cancel:'Anulează',
  }),
  ar: D({
    brand:'LiveManager', tagline:'أدوات ذكية لكل يوم',
    cabinet:'الحساب', buy:'شراء الاشتراك', tasks:'المهام اليومية', expert:'مركز الخبراء',
    pro:'Pro', proPlus:'Pro+', langBtn:'تغيير اللغة/الدولة', chooseLang:'اختر لغة الواجهة',
    save:'حفظ', cancel:'إلغاء',
  }),
  he: D({
    brand:'LiveManager', tagline:'כלים חכמים לכל יום',
    cabinet:'חשבון', buy:'רכישת מנוי', tasks:'משימות יומיות', expert:'מרכז מומחים',
    pro:'Pro', proPlus:'Pro+', langBtn:'שנה שפה/מדינה', chooseLang:'בחר שפת ממשק',
    save:'שמור', cancel:'בטל',
  }),
  hi: D({
    brand:'LiveManager', tagline:'हर दिन के लिए स्मार्ट टूल्स',
    cabinet:'खाता', buy:'सदस्यता खरीदें', tasks:'दैनिक कार्य', expert:'विशेषज्ञ केंद्र',
    pro:'Pro', proPlus:'Pro+', langBtn:'भाषा/देश बदलें', chooseLang:'इंटरफ़ेस भाषा चुनें',
    save:'सेव', cancel:'रद्द करें',
  }),
  id: D({
    brand:'LiveManager', tagline:'Alat pintar untuk setiap hari',
    cabinet:'Akun', buy:'Beli langganan', tasks:'Tugas harian', expert:'Pusat ahli',
    pro:'Pro', proPlus:'Pro+', langBtn:'Ubah bahasa/negara', chooseLang:'Pilih bahasa antarmuka',
    save:'Simpan', cancel:'Batal',
  }),
  ms: D({
    brand:'LiveManager', tagline:'Alat pintar untuk setiap hari',
    cabinet:'Akaun', buy:'Beli langganan', tasks:'Tugasan harian', expert:'Pusat pakar',
    pro:'Pro', proPlus:'Pro+', langBtn:'Tukar bahasa/negara', chooseLang:'Pilih bahasa antara muka',
    save:'Simpan', cancel:'Batal',
  }),
  fil: D({
    brand:'LiveManager', tagline:'Matalinong gamit para araw-araw',
    cabinet:'Account', buy:'Bumili ng subscription', tasks:'Araw-araw na gawain', expert:'Expert center',
    pro:'Pro', proPlus:'Pro+', langBtn:'Palitan ang wika/bansa', chooseLang:'Piliin ang wika ng interface',
    save:'I-save', cancel:'Kanselahin',
  }),
  vi: D({
    brand:'LiveManager', tagline:'Công cụ thông minh cho mỗi ngày',
    cabinet:'Tài khoản', buy:'Mua gói thuê bao', tasks:'Nhiệm vụ hằng ngày', expert:'Trung tâm chuyên gia',
    pro:'Pro', proPlus:'Pro+', langBtn:'Đổi ngôn ngữ/quốc gia', chooseLang:'Chọn ngôn ngữ giao diện',
    save:'Lưu', cancel:'Hủy',
  }),
  th: D({
    brand:'LiveManager', tagline:'เครื่องมืออัจฉริยะสำหรับทุกวัน',
    cabinet:'บัญชี', buy:'ซื้อการสมัครสมาชิก', tasks:'งานประจำวัน', expert:'ศูนย์ผู้เชี่ยวชาญ',
    pro:'Pro', proPlus:'Pro+', langBtn:'เปลี่ยนภาษา/ประเทศ', chooseLang:'เลือกภาษาของอินเทอร์เฟซ',
    save:'บันทึก', cancel:'ยกเลิก',
  }),
  pl: D({
    brand:'LiveManager', tagline:'Inteligentne narzędzia na co dzień',
    cabinet:'Konto', buy:'Kup subskrypcję', tasks:'Codzienne zadania', expert:'Centrum ekspertów',
    pro:'Pro', proPlus:'Pro+', langBtn:'Zmień język/kraj', chooseLang:'Wybierz język interfejsu',
    save:'Zapisz', cancel:'Anuluj',
  }),
  cs: D({
    brand:'LiveManager', tagline:'Chytré nástroje na každý den',
    cabinet:'Účet', buy:'Koupit předplatné', tasks:'Denní úkoly', expert:'Expertní centrum',
    pro:'Pro', proPlus:'Pro+', langBtn:'Změnit jazyk/zemi', chooseLang:'Zvolte jazyk rozhraní',
    save:'Uložit', cancel:'Zrušit',
  }),
  sk: D({
    brand:'LiveManager', tagline:'Inteligentné nástroje na každý deň',
    cabinet:'Účet', buy:'Kúpiť predplatné', tasks:'Denné úlohy', expert:'Expertné centrum',
    pro:'Pro', proPlus:'Pro+', langBtn:'Zmeniť jazyk/krajinu', chooseLang:'Zvoľte jazyk rozhrania',
    save:'Uložiť', cancel:'Zrušiť',
  }),
  hu: D({
    brand:'LiveManager', tagline:'Okos eszközök minden napra',
    cabinet:'Fiók', buy:'Előfizetés vásárlása', tasks:'Napi feladatok', expert:'Szakértői központ',
    pro:'Pro', proPlus:'Pro+', langBtn:'Nyelv/ország módosítása', chooseLang:'Válassz felületnyelvet',
    save:'Mentés', cancel:'Mégse',
  }),
  bg: D({
    brand:'LiveManager', tagline:'Интелигентни инструменти за всеки ден',
    cabinet:'Профил', buy:'Купи абонамент', tasks:'Ежедневни задачи', expert:'Експертен център',
    pro:'Pro', proPlus:'Pro+', langBtn:'Промени език/държава', chooseLang:'Изберете език на интерфейса',
    save:'Запази', cancel:'Отказ',
  }),
  sr: D({
    brand:'LiveManager', tagline:'Паметни алати за сваки дан',
    cabinet:'Налог', buy:'Купи претплату', tasks:'Дневни задаци', expert:'Експерт центар',
    pro:'Pro', proPlus:'Pro+', langBtn:'Промени језик/државу', chooseLang:'Изабери језик интерфејса',
    save:'Сачувај', cancel:'Откажи',
  }),
};

export const t = (locale: Locale, key: string, fallback?: string) =>
  STRINGS[locale]?.[key] ?? STRINGS.ru[key] ?? fallback ?? key;
