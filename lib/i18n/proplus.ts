/* path: lib/i18n/proplus.ts */
'use client';

import type { Route } from 'next';
import type { Locale } from '@/lib/i18n';

export type ProPlusRow = {
  emoji: string;
  title: string;
  desc: string;
  href: Route;
};

export type ProPlusDict = {
  title: string;
  subtitle: string;
  cta: string;
  rows: ProPlusRow[];
};

/** Базовые ссылки/эмодзи (общие для всех языков) */
const BASE: Array<Pick<ProPlusRow, 'emoji' | 'href'>> = [
  { emoji: '⚖️', href: '/home/pro-plus/urchatgpt' as Route },
  { emoji: '🚀', href: '/home/pro-plus/business-launch' as Route },
  { emoji: '📈', href: '/home/pro-plus/marketing' as Route },
  { emoji: '🧲', href: '/home/pro-plus/uderzhanie-klientov' as Route },
  { emoji: '🧑‍💼', href: '/home/pro-plus/pomoshchnik-rukovoditelya' as Route },
  { emoji: '📺', href: '/home/pro-plus/seo-kanaly-rosta' as Route },
  { emoji: '📄', href: '/home/pro-plus/konstruktor-dogovorov' as Route },
  { emoji: '🧾', href: '/home/pro-plus/nalogovy-konsultant' as Route },
  { emoji: '🛂', href: '/home/pro-plus/vizovy-pomoshchnik' as Route },
  { emoji: '🏋️‍♂️', href: '/home/pro-plus/lichny-trener' as Route },
  { emoji: '🥗', href: '/home/pro-plus/lichny-dietolog' as Route },
  { emoji: '🧠', href: '/home/pro-plus/lichny-psiholog' as Route },
  { emoji: '❤️', href: '/home/pro-plus/lichny-seksolog' as Route },
  { emoji: '💰', href: '/home/pro-plus/lichny-finansovy-sovetnik' as Route },
  { emoji: '💹', href: '/home/pro-plus/invest-analiz' as Route },
  { emoji: '📊', href: '/home/pro-plus/treid-analiz' as Route },
  { emoji: '💇', href: '/home/pro-plus/lichny-stilist-pricheska' as Route },
  { emoji: '🧥', href: '/home/pro-plus/lichny-stilist-odezhda' as Route },
  { emoji: '🤰', href: '/home/pro-plus/planirovanie-beremennosti' as Route },
  { emoji: '💡', href: '/home/pro-plus/kontent-analiz' as Route },
  { emoji: '🧮', href: '/home/pro-plus/reshenie-zadach' as Route },
  { emoji: '🖼️', href: '/home/pro-plus/image-gen' as Route },
  { emoji: '📝', href: '/home/pro-plus/resume-builder' as Route },
];

function makeRows(texts: Array<Omit<ProPlusRow, 'href' | 'emoji'>>): ProPlusRow[] {
  return BASE.map((b, i) => ({
    emoji: b.emoji,
    href: b.href,
    title: texts[i]?.title ?? '',
    desc: texts[i]?.desc ?? '',
  }));
}

/* ---------- RU ---------- */
const RU_ROWS = [
  { title: 'Юрист-помощник', desc: 'Решу любую твою проблему.' },
  { title: 'Бизнес: запуск', desc: 'От идеи до MVP: гипотезы, юнит-экономика, чек-листы.' },
  { title: 'Личный маркетолог', desc: 'Стратегия продвижения, контент-план, воронки, KPI.' },
  { title: 'Удержание клиентов', desc: 'Снижение оттока и рост LTV: сегменты риска, win-back, план на 90 дней.' },
  { title: 'Помощник руководителя', desc: 'Организация дня, приоритеты, письма, встречи и контроль задач.' },
  { title: 'SEO/каналы роста', desc: 'YouTube/Shorts/TG: тайтлы, описания, теги и тумбы под CTR.' },
  { title: 'Конструктор договоров', desc: 'Сгенерирую и проверю договор: риски, пункты, шаблоны.' },
  { title: 'Налоговый консультант', desc: 'Режимы, вычеты, сроки и план подачи деклараций.' },
  { title: 'Визовый помощник', desc: 'Тип визы, документы, запись и сроки подачи.' },
  { title: 'Личный тренер', desc: 'План тренировок, питание, прогресс и техника.' },
  { title: 'Личный диетолог', desc: 'Рацион под цель: калории, БЖУ, меню и список покупок.' },
  { title: 'Личный психолог', desc: 'Поддержка и КПТ: стресс, тревожность, сон, привычки.' },
  { title: 'Личный сексолог', desc: 'Деликатные вопросы о близости: коммуникация, либидо, гармония.' },
  { title: 'Личный финансовый советник', desc: 'Бюджет, инвестиции, долги: план, риски и цели.' },
  { title: 'Инвест-анализ', desc: 'Портфель, стратегия, риски, ребалансировка.' },
  { title: 'Трейд-анализ', desc: 'Стратегии, риск-менеджмент, точки входа/выхода.' },
  { title: 'Стилист: прическа', desc: 'Стрижка и укладка по фото: форма лица, стиль, уход.' },
  { title: 'Стилист: одежда', desc: 'Капсула под вас: фасоны, цвета, сочетания, магазины.' },
  { title: 'Планирование беременности', desc: 'Подготовка к зачатию: здоровье, анализы, витамины, образ жизни.' },
  { title: 'Контент-анализ', desc: 'Идеи под контент: темы, рубрики, крючки, форматы.' },
  { title: 'Решение задач', desc: 'Математика, физика и др.: быстро и с пояснениями.' },
  { title: 'Генерация изображений', desc: 'Картинки по брифу: стиль, ракурс, палитра.' },
  { title: 'Составить резюме', desc: 'Сильное CV: опыт, достижения, навыки, ATS.' },
];

/* ---------- EN ---------- */
const EN_ROWS = [
  { title: 'Legal assistant', desc: 'Solve any legal issue, step by step.' },
  { title: 'Business: launch', desc: 'From idea to MVP: hypotheses, unit economics, checklists.' },
  { title: 'Personal marketer', desc: 'Growth strategy, content plan, funnels, KPIs.' },
  { title: 'Customer retention', desc: 'Reduce churn and grow LTV: risk segments, win-back, 90-day plan.' },
  { title: 'Executive assistant', desc: 'Daily planning, priorities, email, meetings, task control.' },
  { title: 'SEO / growth channels', desc: 'YouTube/Shorts/TG: titles, descriptions, tags, thumbnails.' },
  { title: 'Contract builder', desc: 'Generate & review contracts: risks, clauses, templates.' },
  { title: 'Tax consultant', desc: 'Regimes, deductions, deadlines, filing plan.' },
  { title: 'Visa helper', desc: 'Visa type, documents, appointment, timelines.' },
  { title: 'Personal trainer', desc: 'Workout plan, nutrition, progress and technique.' },
  { title: 'Personal dietitian', desc: 'Goal-based nutrition: calories, macros, menu, shopping list.' },
  { title: 'Personal psychologist', desc: 'Support & CBT tools: stress, anxiety, sleep, habits.' },
  { title: 'Personal sexologist', desc: 'Delicate intimacy questions: communication, libido, harmony.' },
  { title: 'Financial advisor', desc: 'Budget, investing, debt: plan, risks and goals.' },
  { title: 'Investment analysis', desc: 'Portfolio, strategy, risks, rebalancing.' },
  { title: 'Trading analysis', desc: 'Strategies, risk management, entries/exits.' },
  { title: 'Stylist: hair', desc: 'Haircut & styling by photo: face shape, style, care.' },
  { title: 'Stylist: clothes', desc: 'Personal capsule: fits, colors, combos, stores.' },
  { title: 'Pregnancy planning', desc: 'Pre-conception prep: health, tests, vitamins, lifestyle.' },
  { title: 'Content analysis', desc: 'Power ideas for your content: topics, hooks, formats.' },
  { title: 'Problem solving', desc: 'Math, physics, etc.: fast solutions with explanations.' },
  { title: 'Image generation', desc: 'Create images from your brief: style, angle, palette.' },
  { title: 'Résumé builder', desc: 'Strong CV: experience, achievements, skills, ATS.' },
];

/* ---------- UK ---------- */
const UK_ROWS = [
  { title: 'Юрист-помічник', desc: 'Вирішу будь-яку вашу проблему.' },
  { title: 'Бізнес: запуск', desc: 'Від ідеї до MVP: гіпотези, юніт-економіка, чек-листи.' },
  { title: 'Персональний маркетолог', desc: 'Стратегія зростання, контент-план, воронки, KPI.' },
  { title: 'Утримання клієнтів', desc: 'Зменшення відтоку й зростання LTV: сегменти ризику, win-back, план на 90 днів.' },
  { title: 'Асистент керівника', desc: 'План дня, пріоритети, листи, зустрічі, контроль задач.' },
  { title: 'SEO/канали зростання', desc: 'YouTube/Shorts/TG: тайтли, описи, теги та тізери під CTR.' },
  { title: 'Конструктор договорів', desc: 'Згенерую та перевірю договір: ризики, пункти, шаблони.' },
  { title: 'Податковий консультант', desc: 'Режими, відрахування, строки та план подачі.' },
  { title: 'Візовий помічник', desc: 'Тип візи, документи, запис і терміни.' },
  { title: 'Персональний тренер', desc: 'План тренувань, харчування, прогрес і техніка.' },
  { title: 'Дієтолог', desc: 'Харчування під ціль: калорії, БЖВ, меню, список покупок.' },
  { title: 'Психолог', desc: 'Підтримка і КРТ-практики: стрес, тривога, сон, звички.' },
  { title: 'Сексолог', desc: 'Делікатні питання про близькість: комунікація, лібідо, гармонія.' },
  { title: 'Фінансовий радник', desc: 'Бюджет, інвестиції, борги: план, ризики і цілі.' },
  { title: 'Інвест-аналіз', desc: 'Портфель, стратегія, ризики, ребаланс.' },
  { title: 'Трейд-аналіз', desc: 'Стратегії, ризик-менеджмент, точки входу/виходу.' },
  { title: 'Стиліст: зачіска', desc: 'Стрижка та укладка за фото: форма обличчя, стиль, догляд.' },
  { title: 'Стиліст: одяг', desc: 'Капсула під вас: фасони, кольори, поєднання, магазини.' },
  { title: 'Планування вагітності', desc: 'Підготовка до зачаття: здоров’я, аналізи, вітаміни, спосіб життя.' },
  { title: 'Контент-аналіз', desc: 'Ідеї для контенту: теми, рубрики, гачки, формати.' },
  { title: 'Розв’язання задач', desc: 'Математика, фізика тощо: швидко з поясненнями.' },
  { title: 'Генерація зображень', desc: 'Картинки за брифом: стиль, ракурс, палітра.' },
  { title: 'Резюме', desc: 'Сильне CV під вакансію: досвід, досягнення, навички, ATS.' },
];

/* ---------- BE ---------- */
const BE_ROWS = [
  { title: 'Юрыст-памочнік', desc: 'Дапамагу разабрацца з любой праблемай.' },
  { title: 'Бізнес: запуск', desc: 'Ад ідэі да MVP: гіпотэзы, юніт-эканоміка, чэк-лісты.' },
  { title: 'Асабісты маркетолаг', desc: 'Стратэгія росту, кантэнт-план, варонкі, KPI.' },
  { title: 'Утрыманне кліентаў', desc: 'Скарачэнне адтоку і рост LTV: сегменты рызыкі, win-back, план на 90 дзён.' },
  { title: 'Памочнік кіраўніка', desc: 'Арганізацыя дня, прыярытэты, лісты, сустрэчы, кантроль задач.' },
  { title: 'SEO/каналы росту', desc: 'YouTube/Shorts/TG: тайтлы, апісанні, тэгі і мініяцюры.' },
  { title: 'Канструктар дамоваў', desc: 'Ствару і праверу дамову: рызыкі, пункты, шаблоны.' },
  { title: 'Падатковы кансультант', desc: 'Рэжымы, вылікі, тэрміны і план падачы.' },
  { title: 'Візавы памочнік', desc: 'Тып візы, дакументы, запіс і тэрміны.' },
  { title: 'Асабісты трэнер', desc: 'План трэніровак, харчаванне, прагрэс і тэхніка.' },
  { title: 'Дыетолаг', desc: 'Рацыён пад мэту: калорыі, БЖУ, меню і спіс пакупак.' },
  { title: 'Псіхолаг', desc: 'Падтрымка і КПТ-практыкі: стрэс, трывожнасць, сон, звычкі.' },
  { title: 'Сексолаг', desc: 'Далікатныя пытанні блізкасці: камунікацыя, лібіда, гармонія.' },
  { title: 'Фінансавы дарадца', desc: 'Бюджэт, інвестыцыі, пазыкі: план, рызыкі і мэты.' },
  { title: 'Інвест-аналіз', desc: 'Партфель, стратэгія, рызыкі, ребаланс.' },
  { title: 'Трэйд-аналіз', desc: 'Стратэгіі, рызыка-менеджмент, пункты ўваходу/выхаду.' },
  { title: 'Стыліст: прычоска', desc: 'Стрыжка і ўкладка па фота: форма твару, стыль, догляд.' },
  { title: 'Стыліст: адзенне', desc: 'Капсула пад вас: фасоны, колеры, спалучэнні, крамы.' },
  { title: 'Планаванне цяжарнасці', desc: 'Падрыхтоўка: здароўе, аналізы, вітаміны, лад жыцця.' },
  { title: 'Кантэнт-аналіз', desc: 'Ідэі для кантэнту: тэмы, рубрыкі, кручкі, фарматы.' },
  { title: 'Рашэнне задач', desc: 'Матэматыка, фізіка і інш.: хутка з тлумачэннямі.' },
  { title: 'Генерацыя выяў', desc: 'Выявы па брыфе: стыль, ракурс, палітра.' },
  { title: 'Скласці рэзюмэ', desc: 'Моцнае CV: досвед, дасягненні, навыкі, ATS.' },
];

/* ---------- KK ---------- */
const KK_ROWS = [
  { title: 'Құқықтық көмекші', desc: 'Кез келген құқықтық мәселені кезең-кезеңімен шешу.' },
  { title: 'Бизнес: іске қосу', desc: 'Идеядан MVP-ке дейін: гипотеза, юнит-экономика, чек-тізім.' },
  { title: 'Жеке маркетолог', desc: 'Өсу стратегиясы, контент жоспары, воронка, KPI.' },
  { title: 'Клиенттерді ұстап қалу', desc: 'Чурнды азайту, LTV өсіру: тәуекел сегменттері, win-back, 90 күндік жоспар.' },
  { title: 'Басшының көмекшісі', desc: 'Күн тәртібі, приоритеттер, хаттар, кездесулер, бақылау.' },
  { title: 'SEO/өсу арналары', desc: 'YouTube/Shorts/TG: атау, сипаттама, тегтер, миниатюра.' },
  { title: 'Шарт конструкторы', desc: 'Шарт жасау және тексеру: тәуекелдер, тармақтар, үлгілер.' },
  { title: 'Салық кеңесшісі', desc: 'Тәртіптер, шегерімдер, мерзімдер және тапсыру жоспары.' },
  { title: 'Виза көмекшісі', desc: 'Виза түрі, құжаттар, жазылу және мерзімдер.' },
  { title: 'Жеке жаттықтырушы', desc: 'Жаттығу жоспары, тамақтану, прогресс және техника.' },
  { title: 'Диетолог', desc: 'Мақсатқа сай рацион: калория, БЖУ, мәзір, сатып алу тізімі.' },
  { title: 'Психолог', desc: 'Қолдау және КБТ: стресс, мазасыздық, ұйқы, әдеттер.' },
  { title: 'Сексолог', desc: 'Жақындық туралы нәзік сұрақтар: коммуникация, либидо, үйлесім.' },
  { title: 'Қаржылық кеңесші', desc: 'Бюджет, инвестиция, қарыз: жоспар, тәуекел және мақсаттар.' },
  { title: 'Инвест-талдау', desc: 'Портфель, стратегия, тәуекел, ребаланс.' },
  { title: 'Трейдинг талдауы', desc: 'Стратегиялар, тәуекел-менеджмент, кіру/шығу нүктелері.' },
  { title: 'Стилист: шаш', desc: 'Фото бойынша шаш қию мен қою: бет пішіні, стиль, күтім.' },
  { title: 'Стилист: киім', desc: 'Жеке капсула: фасондар, түстер, үйлестіру, дүкендер.' },
  { title: 'Жүктілікті жоспарлау', desc: 'Жүктілікке дайындық: денсаулық, талдаулар, витаминдер, өмір салты.' },
  { title: 'Контент талдауы', desc: 'Контент идеялары: тақырыптар, айдарлар, ілгектер, форматтар.' },
  { title: 'Есеп шығару', desc: 'Математика, физика т.б.: тез әрі түсіндірмемен.' },
  { title: 'Кескін генерациясы', desc: 'Бриф бойынша суреттер: стиль, ракурс, палитра.' },
  { title: 'Резюме құрастыру', desc: 'Күшті CV: тәжірибе, жетістік, дағдылар, ATS.' },
];

/* ---------- UZ ---------- */
const UZ_ROWS = [
  { title: 'Yuridik yordamchi', desc: 'Istalgan muammoni bosqichma-bosqich hal qilamiz.' },
  { title: 'Biznes: ishga tushirish', desc: 'G‘oyadan MVPgacha: gipotezalar, unit-iqtisod, chek-ro‘yxatlar.' },
  { title: 'Shaxsiy marketolog', desc: 'O‘sish strategiyasi, kontent rejasi, voronka, KPI.' },
  { title: 'Mijozni ushlab qolish', desc: 'Churnni kamaytirish, LTVni oshirish: risk segmentlari, win-back, 90 kunlik reja.' },
  { title: 'Rahbar yordamchisi', desc: 'Kun tartibi, ustuvorliklar, xatlar, uchrashuvlar, nazorat.' },
  { title: 'SEO/o‘sish kanallari', desc: 'YouTube/Shorts/TG: sarlavha, tavsif, teglarga va thumbnailga mos.' },
  { title: 'Shartnoma konstruktori', desc: 'Shartnoma yaratish va tekshirish: xavflar, bandlar, shablonlar.' },
  { title: 'Soliq bo‘yicha maslahatchi', desc: 'Rejimlar, chegirmalar, muddatlar va topshirish rejasi.' },
  { title: 'Viza yordamchisi', desc: 'Viza turi, hujjatlar, navbat va muddatlar.' },
  { title: 'Shaxsiy trener', desc: 'Mashg‘ulot rejasi, ovqatlanish, progress va texnika.' },
  { title: 'Diyetolog', desc: 'Maqsadga mos ovqat: kaloriya, makro, menyu, xarid ro‘yxati.' },
  { title: 'Psixolog', desc: 'Qo‘llab-quvvatlash va KBT: stress, xavotir, uyqu, odatlar.' },
  { title: 'Seksolog', desc: 'Nozik savollar: muloqot, libido, uyg‘unlik.' },
  { title: 'Moliyaviy maslahatchi', desc: 'Byudjet, investitsiya, qarz: rejalar, xavflar, maqsadlar.' },
  { title: 'Invest-tahlil', desc: 'Portfel, strategiya, xavf, rebilans.' },
  { title: 'Treyd-tahlil', desc: 'Strategiyalar, risk-menedjment, kirish/chiqish nuqtalari.' },
  { title: 'Stilist: soch', desc: 'Foto bo‘yicha soch turmagi: yuz shakli, uslub, parvarish.' },
  { title: 'Stilist: kiyim', desc: 'Shaxsiy kapsula: fasonlar, ranglar, uyg‘unlash, do‘konlar.' },
  { title: 'Homiladorlikni rejalash', desc: 'Tayyorlov: salomatlik, tahlillar, vitaminlar, turmush tarzi.' },
  { title: 'Kontent-tahlil', desc: 'Kontent g‘oyalari: mavzular, ruknlar, ilgaklar, formatlar.' },
  { title: 'Masalalarni yechish', desc: 'Matematika, fizika va boshq.: tez va tushuntirish bilan.' },
  { title: 'Rasm generatsiyasi', desc: 'Brif bo‘yicha rasmlar: uslub, rakurs, palitra.' },
  { title: 'Rezyume tayyorlash', desc: 'Kuchli CV: tajriba, yutuqlar, ko‘nikmalar, ATS.' },
];

/* ---------- KY ---------- */
const KY_ROWS = [
  { title: 'Юридикалык жардамчы', desc: 'Каалаган укуктук маселени кадам-кадам менен чечебиз.' },
  { title: 'Бизнес: ишке киргизүү', desc: 'Идеядан MVPге чейин: гипотеза, юнит-экономика, чек-тизмелер.' },
  { title: 'Жеке маркетолог', desc: 'Өсүү стратегиясы, контент-план, воронка, KPI.' },
  { title: 'Кардарды кармап туруу', desc: 'Чыгып кетүүнү азайтуу, LTV өсүрүү: тобокел сегменттери, win-back, 90 күндүк план.' },
  { title: 'Жетекчинин жардамчысы', desc: 'Күндүк тартип, приоритеттер, каттар, жолугушуулар, көзөмөл.' },
  { title: 'SEO/өсүү каналдары', desc: 'YouTube/Shorts/TG: аталыштар, сүрөттөмө, тегдер, алдынкы сүрөт.' },
  { title: 'Келишим конструктору', desc: 'Келишим түзүү жана текшерүү: тобокелдиктер, пункттар, шаблондор.' },
  { title: 'Салык кеңешчиси', desc: 'Тартиптер, чегеримдер, мөөнөттөр жана тапшыруу планы.' },
  { title: 'Виза жардамчысы', desc: 'Виза түрү, документтер, жазылуу жана мөөнөттөр.' },
  { title: 'Жеке машыктыруучу', desc: 'Тренировка планы, тамактануу, прогресс жана техника.' },
  { title: 'Диетолог', desc: 'Максатка жараша рацион: калория, макроэлементтер, меню, тизмек.' },
  { title: 'Психолог', desc: 'Колдоо жана КБТ: стресс, тынчсыздануу, уйку, адаттар.' },
  { title: 'Сексолог', desc: 'Назик суроолор: коммуникация, либидо, гармония.' },
  { title: 'Каржы кеңешчиси', desc: 'Бюджет, инвестиция, карыз: план, тобокелдик, максат.' },
  { title: 'Инвест-талдоо', desc: 'Портфель, стратегия, тобокелдик, ребаланс.' },
  { title: 'Трейдинг талдоо', desc: 'Стратегиялар, риск-менеджмент, кирүү/чыгуу чекиттери.' },
  { title: 'Стилист: чач', desc: 'Сүрөт боюнча чач тарач: бет формасы, стил, кам көрүү.' },
  { title: 'Стилист: кийим', desc: 'Жеке капсула: фасондор, түстөр, айкалыштар, дүкөндөр.' },
  { title: 'Кош бойлуулукту пландоо', desc: 'Даярдык: ден соолук, анализдер, витаминдер, жашоо образы.' },
  { title: 'Контент талдоо', desc: 'Контент идеялары: темалар, рубрикалар, илгичтер, форматтар.' },
  { title: 'Маселелерди чечүү', desc: 'Математика, физика ж.б.: тез жана түшүндүрмө менен.' },
  { title: 'Сүрөт генерациясы', desc: 'Бриф боюнча сүрөттөр: стил, ракурс, палитра.' },
  { title: 'Резюме түзүү', desc: 'Күчтүү CV: тажрыйба, жетишкендиктер, көндүмдөр, ATS.' },
];

/* ---------- FA ---------- */
const FA_ROWS = [
  { title: 'دستیار حقوقی', desc: 'حل مرحله‌به‌مرحلهٔ هر مسئلهٔ حقوقی.' },
  { title: 'کسب‌وکار: راه‌اندازی', desc: 'از ایده تا MVP: فرضیه‌ها، اقتصاد واحد، چک‌لیست‌ها.' },
  { title: 'بازاریاب شخصی', desc: 'استراتژی رشد، برنامهٔ محتوا، قیف فروش، KPI.' },
  { title: 'حفظ مشتری', desc: 'کاهش ریزش و افزایش LTV: بخش‌های پرریسک، بازگشت، برنامهٔ ۹۰ روزه.' },
  { title: 'دستیار مدیر', desc: 'سازماندهی روز، اولویت‌ها، ایمیل‌ها، جلسات و پیگیری کارها.' },
  { title: 'سئو/کانال‌های رشد', desc: 'YouTube/Shorts/TG: عنوان، توضیح، تگ و تصویر بندانگشتی.' },
  { title: 'سازندهٔ قرارداد', desc: 'تولید و بررسی قرارداد: ریسک‌ها، بندها، الگوها.' },
  { title: 'مشاور مالیات', desc: 'رژیم‌ها، معافیت‌ها، مهلت‌ها و برنامهٔ ارسال.' },
  { title: 'دستیار ویزا', desc: 'نوع ویزا، مدارک، وقت‌دهی و زمان‌بندی.' },
  { title: 'مربی شخصی', desc: 'برنامهٔ تمرین، تغذیه، پیشرفت و تکنیک.' },
  { title: 'متخصص تغذیه', desc: 'رژیم متناسب با هدف: کالری، ماکروها، منو و لیست خرید.' },
  { title: 'روان‌شناس', desc: 'حمایت و ابزارهای CBT: استرس، اضطراب، خواب، عادت‌ها.' },
  { title: 'سکسولوگ', desc: 'سوالات ظریف دربارهٔ صمیمیت: ارتباط، لیبیدو، هارمونی.' },
  { title: 'مشاور مالی', desc: 'بودجه، سرمایه‌گذاری، بدهی: برنامه، ریسک‌ها و اهداف.' },
  { title: 'تحلیل سرمایه‌گذاری', desc: 'پرتفوی، استراتژی، ریسک‌ها، بالانس مجدد.' },
  { title: 'تحلیل معامله‌گری', desc: 'استراتژی‌ها، مدیریت ریسک، نقاط ورود/خروج.' },
  { title: 'استایلیست: مو', desc: 'مدل و حالت بر اساس عکس: فرم صورت، سبک، مراقبت.' },
  { title: 'استایلیست: لباس', desc: 'کپسول شخصی: فرم‌ها، رنگ‌ها، ترکیب‌ها، فروشگاه‌ها.' },
  { title: 'برنامه‌ریزی بارداری', desc: 'آمادگی پیش از بارداری: سلامت، آزمایش‌ها، ویتامین‌ها، سبک زندگی.' },
  { title: 'تحلیل محتوا', desc: 'ایده‌های قوی برای محتوا: موضوعات، قلاب‌ها، فرمت‌ها.' },
  { title: 'حل مسائل', desc: 'ریاضی، فیزیک و… سریع با توضیح.' },
  { title: 'تولید تصویر', desc: 'تصاویر بر اساس بریف: سبک، زاویه، پالت.' },
  { title: 'ساخت رزومه', desc: 'رزومهٔ قوی: تجربه، دستاوردها، مهارت‌ها، ATS.' },
];

/* ---------- HI ---------- */
const HI_ROWS = [
  { title: 'कानूनी सहायक', desc: 'किसी भी कानूनी समस्या का चरण-दर-चरण समाधान.' },
  { title: 'बिज़नेस: लॉन्च', desc: 'आइडिया से MVP तक: हाइपोथेसिस, यूनिट-इकोनॉमिक्स, चेकलिस्ट.' },
  { title: 'पर्सनल मार्केटर', desc: 'ग्रोथ स्ट्रेटजी, कंटेंट प्लान, फनल्स, KPI.' },
  { title: 'कस्टमर रिटेंशन', desc: 'चर्न कम करें, LTV बढ़ाएँ: रिस्क सेगमेंट, विन-बैक, 90-दिन योजना.' },
  { title: 'एग्जीक्यूटिव असिस्टेंट', desc: 'दिन का संगठन, प्राथमिकताएँ, ईमेल, मीटिंग, टास्क कंट्रोल.' },
  { title: 'SEO/ग्रोथ चैनल', desc: 'YouTube/Shorts/TG: टाइटल, डिस्क्रिप्शन, टैग, थंबनेल.' },
  { title: 'कॉन्ट्रैक्ट बिल्डर', desc: 'कॉन्ट्रैक्ट बनाएं और जाँचें: रिस्क, क्लॉज़, टेम्पलेट.' },
  { title: 'टैक्स कंसल्टेंट', desc: 'रूल्स, डिडक्शन, डेडलाइन और फाइलिंग प्लान.' },
  { title: 'वीज़ा हेल्पर', desc: 'वीज़ा प्रकार, दस्तावेज, अपॉइंटमेंट और समयसीमा.' },
  { title: 'पर्सनल ट्रेनर', desc: 'वर्कआउट प्लान, न्यूट्रिशन, प्रोग्रेस और टेकनीक.' },
  { title: 'डायटिशियन', desc: 'लक्ष्य-आधारित डाइट: कैलोरी, मैक्रोज़, मेनू, शॉपिंग लिस्ट.' },
  { title: 'साइकोलॉजिस्ट', desc: 'सपोर्ट और CBT: तनाव, चिंता, नींद, आदतें.' },
  { title: 'सेक्सोलॉजिस्ट', desc: 'निजता के सवाल: कम्युनिकेशन, लिबिडो, हार्मनी.' },
  { title: 'फाइनेंशियल एडवाइज़र', desc: 'बजट, निवेश, कर्ज: प्लान, रिस्क और लक्ष्य.' },
  { title: 'इन्वेस्टमेंट एनालिसिस', desc: 'पोर्टफोलियो, रणनीति, जोखिम, रीबैलेंस.' },
  { title: 'ट्रेडिंग एनालिसिस', desc: 'रणनीतियाँ, रिस्क मैनेजमेंट, एंट्री/एग्जिट पॉइंट.' },
  { title: 'स्टाइलिस्ट: हेयर', desc: 'फोटो से हेयरकट/स्टाइल: फेस शेप, स्टाइल, केयर.' },
  { title: 'स्टाइलिस्ट: कपड़े', desc: 'पर्सनल कैप्सूल: फिट, रंग, कॉम्बो, स्टोर्स.' },
  { title: 'प्रेग्नेंसी प्लानिंग', desc: 'गर्भधारण से पहले की तैयारी: स्वास्थ्य, टेस्ट, विटामिन, लाइफ़स्टाइल.' },
  { title: 'कंटेंट एनालिसिस', desc: 'आपके कंटेंट के लिए दमदार आइडिया: टॉपिक, हुक, फॉर्मैट.' },
  { title: 'समस्या-समाधान', desc: 'गणित, भौतिकी आदि: तेज़ और व्याख्या सहित.' },
  { title: 'इमेज जेनरेशन', desc: 'ब्रीफ से इमेज: स्टाइल, एंगल, पैलेट.' },
  { title: 'रिज़्यूमे बिल्डर', desc: 'मजबूत CV: अनुभव, उपलब्धियाँ, कौशल, ATS.' },
];

/* ---------- Словарь ---------- */
export const PROPLUS: Record<Locale, ProPlusDict> = {
  ru: { title: 'Эксперт центр Pro+', subtitle: 'Выберите инструмент', cta: 'Попробовать', rows: makeRows(RU_ROWS) },
  en: { title: 'Pro+ Expert Hub', subtitle: 'Choose a tool', cta: 'Try', rows: makeRows(EN_ROWS) },
  uk: { title: 'Експерт-центр Pro+', subtitle: 'Оберіть інструмент', cta: 'Спробувати', rows: makeRows(UK_ROWS) },
  be: { title: 'Эксперт-цэнтр Pro+', subtitle: 'Абярыце інструмент', cta: 'Паспрабаваць', rows: makeRows(BE_ROWS) },
  kk: { title: 'Pro+ сарапшы орталығы', subtitle: 'Құралды таңдаңыз', cta: 'Қолданып көру', rows: makeRows(KK_ROWS) },
  uz: { title: 'Pro+ ekspert markazi', subtitle: 'Asbobni tanlang', cta: 'Sinab ko‘rish', rows: makeRows(UZ_ROWS) },
  ky: { title: 'Pro+ адистер борбору', subtitle: 'Курал тандаңыз', cta: 'Сынап көрүү', rows: makeRows(KY_ROWS) },
  fa: { title: 'مرکز کارشناسی Pro+', subtitle: 'ابزار را انتخاب کنید', cta: 'امتحان کنید', rows: makeRows(FA_ROWS) },
  hi: { title: 'Pro+ विशेषज्ञ केंद्र', subtitle: 'एक टूल चुनें', cta: 'आज़माएँ', rows: makeRows(HI_ROWS) },
};

/** Безопасные геттеры */
export function getProPlusStrings(locale: Locale): ProPlusDict {
  return PROPLUS[locale] ?? PROPLUS.ru;
}

export function proPlusT<K extends keyof ProPlusDict>(locale: Locale, key: K): ProPlusDict[K] {
  return getProPlusStrings(locale)[key];
}
