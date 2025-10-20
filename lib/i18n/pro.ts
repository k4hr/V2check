// path: lib/i18n/pro.ts
'use client';

import type { Locale } from '@/lib/i18n';

export type ProToolKey =
  | 'morning' | 'weeklyPlan' | 'timeBlocks' | 'quickCleaning' | 'mindDump'
  | 'focusSprint' | 'habitPlan' | 'waterTracker' | 'microWorkout' | 'postureBreak'
  | 'declutterPlan' | 'errandRoute' | 'cityDay' | 'packList'
  | 'healthVisit' | 'petCare' | 'sleepHygiene' | 'mealPlanMini'
  | 'cinema' | 'seriesPick' | 'anime' | 'bookPick' | 'gamePick' | 'playlistMood' | 'boardgameMatch'
  | 'dateNight' | 'conflictNotes' | 'eventToast' | 'giftIdeas' | 'essay' | 'review' | 'rapLyrics' | 'kidsPoem'
  | 'hashtagHelper' | 'brandName' | 'babyName' | 'meetingAgenda'
  | 'chooseBetween' | 'carPick'
  | 'quickBudget' | 'debtPayoff'
  | 'wine' | 'beer' | 'spirits' | 'snackPair'
  | 'walkProgram';

export type ProDict = {
  title: string;
  chooseTool: string;
  searchPlaceholder: string;
  searchAria: string;
  notFound: string;
  tool: Record<ProToolKey, { title: string; subtitle: string; icon?: string }>;
};

export const PRO: Record<Locale, ProDict> = {
  ru: {
    title: 'Ежедневные задачи',
    chooseTool: 'Выберите инструмент',
    searchPlaceholder: 'Поиск по инструментам…',
    searchAria: 'Поиск',
    notFound: 'Ничего не найдено',
    tool: {
      morning:        { title: 'Утренний ритуал',        subtitle: 'План на 20–30 минут' },
      weeklyPlan:     { title: 'План на неделю',         subtitle: 'Неделя без стресса' },
      timeBlocks:     { title: 'Таймблоки дня',          subtitle: 'День по блокам' },
      quickCleaning:  { title: 'Быстрая уборка дома',    subtitle: 'Скорая уборка по шагам' },
      mindDump:       { title: 'Разгрузка головы',       subtitle: 'Быстрая очистка мыслей' },
      focusSprint:    { title: 'Фокус-спринт',           subtitle: '25–40 минут концентрации' },
      habitPlan:      { title: 'План привычки',          subtitle: 'Шаги, триггеры, трекер' },
      waterTracker:   { title: 'Трекер воды',            subtitle: 'Сколько пить в день' },
      microWorkout:   { title: 'Микро-тренировка',       subtitle: '5–15 минут дома' },
      postureBreak:   { title: 'Перерыв для осанки',     subtitle: '2–3 минуты выпрямиться' },
      declutterPlan:  { title: 'Разгребаем завалы',      subtitle: 'Деклаттер по зонам' },
      errandRoute:    { title: 'Маршрут дел по городу',  subtitle: 'Сэкономим время в пути' },
      cityDay:        { title: 'День в городе',          subtitle: 'Готовый мини-маршрут' },
      packList:       { title: 'Список в поездку',       subtitle: 'Ничего не забыть' },

      healthVisit:    { title: 'К визиту к врачу',       subtitle: 'Вопросы и заметки' },
      petCare:        { title: 'Уход за питомцем',       subtitle: 'Корм, прогулки, здоровье' },
      sleepHygiene:   { title: 'Гигиена сна',            subtitle: 'План улучшения сна' },
      mealPlanMini:   { title: 'Мини-план питания',      subtitle: 'Меню на 1–3 дня' },

      cinema:         { title: 'Выбрать фильм/сериал',   subtitle: 'Персональный подбор' },
      seriesPick:     { title: 'Подбор сериала',         subtitle: 'Найдем «тот самый»' },
      anime:          { title: 'Выбор аниме',            subtitle: 'Идеально под ваш вкус' },
      bookPick:       { title: 'Подбор книги',           subtitle: 'Книги под ваш вкус' },
      gamePick:       { title: 'Выбор видеоигры',        subtitle: 'Под интересы и время' },
      playlistMood:   { title: 'Плейлист по настроению', subtitle: 'Треки под вайб дня' },
      boardgameMatch: { title: 'Настолка под компанию',  subtitle: 'Матч по жанру и людям' },

      dateNight:      { title: 'Свидание-план',          subtitle: 'Сценарий под вас' },
      conflictNotes:  { title: 'Разбор конфликта',       subtitle: 'Спокойные формулировки' },
      eventToast:     { title: 'Тост/поздравление',      subtitle: 'Уместно и по делу' },
      giftIdeas:      { title: 'Идеи подарков',          subtitle: 'Под человека и бюджет' },
      essay:          { title: 'Эссе без палев',         subtitle: 'Живой человеческий стиль' },
      review:         { title: 'Отзыв/рекомендация',     subtitle: 'Позитив/нейтр/негатив' },
      rapLyrics:      { title: 'Рэп-текст',              subtitle: 'Ритм, смысл, хуки' },
      kidsPoem:       { title: 'Детский стих',           subtitle: 'Для 8–10 лет' },
      hashtagHelper:  { title: 'Хэштеги к посту',        subtitle: 'Ядро и вариации' },
      brandName:      { title: 'Название бренда',        subtitle: 'Коротко и цепко' },
      babyName:       { title: 'Имя для ребёнка',        subtitle: 'Смысл, краткие формы' },
      meetingAgenda:  { title: 'Повестка встречи',       subtitle: 'Чёткая структура' },

      chooseBetween:  { title: 'Выбор между вариантами', subtitle: 'Помогу определиться' },
      carPick:        { title: 'Подбор авто',            subtitle: 'Под бюджет и цели' },

      quickBudget:    { title: 'Быстрый бюджет',         subtitle: 'Бюджет и лимиты' },
      debtPayoff:     { title: 'Закрыть долги',          subtitle: 'План выплат и сроки' },

      wine:           { title: 'Выбор вина',             subtitle: 'Стиль и закуски' },
      beer:           { title: 'Выбор пива',             subtitle: 'Стили и пары' },
      spirits:        { title: 'Крепкий алкоголь',       subtitle: 'Профиль и подача' },
      snackPair:      { title: 'Закуска к напитку',      subtitle: 'Лучшие сочетания' },

      walkProgram:    { title: 'План прогулок',          subtitle: 'Шаги, маршруты, мотивация' },
    }
  },

  en: {
    title: 'Everyday tools',
    chooseTool: 'Pick a tool',
    searchPlaceholder: 'Search tools…',
    searchAria: 'Search',
    notFound: 'Nothing found',
    tool: {
      morning:        { title: 'Morning ritual',          subtitle: '20–30 min plan' },
      weeklyPlan:     { title: 'Weekly plan',             subtitle: 'Stress-free week' },
      timeBlocks:     { title: 'Time blocks',             subtitle: 'Block your day' },
      quickCleaning:  { title: 'Quick home clean',        subtitle: 'Step-by-step sprint' },
      mindDump:       { title: 'Mind dump',               subtitle: 'Clear your head fast' },
      focusSprint:    { title: 'Focus sprint',            subtitle: '25–40 min focus' },
      habitPlan:      { title: 'Habit plan',              subtitle: 'Steps, triggers, tracker' },
      waterTracker:   { title: 'Water tracker',           subtitle: 'How much to drink' },
      microWorkout:   { title: 'Micro workout',           subtitle: '5–15 min at home' },
      postureBreak:   { title: 'Posture break',           subtitle: '2–3 min straighten up' },
      declutterPlan:  { title: 'Declutter plan',          subtitle: 'By zones' },
      errandRoute:    { title: 'Errand route',            subtitle: 'Save travel time' },
      cityDay:        { title: 'Day in the city',         subtitle: 'Ready mini-route' },
      packList:       { title: 'Trip packing list',       subtitle: 'Forget nothing' },

      healthVisit:    { title: 'Doctor visit prep',       subtitle: 'Questions & notes' },
      petCare:        { title: 'Pet care',                subtitle: 'Food, walks, health' },
      sleepHygiene:   { title: 'Sleep hygiene',           subtitle: 'Improve your sleep' },
      mealPlanMini:   { title: 'Mini meal plan',          subtitle: 'Menu for 1–3 days' },

      cinema:         { title: 'Pick a movie/series',     subtitle: 'Personal selection' },
      seriesPick:     { title: 'Series finder',           subtitle: 'Find “the one”' },
      anime:          { title: 'Anime picker',            subtitle: 'Perfect for your taste' },
      bookPick:       { title: 'Book picker',             subtitle: 'Books you’ll enjoy' },
      gamePick:       { title: 'Game picker',             subtitle: 'For time & taste' },
      playlistMood:   { title: 'Mood playlist',           subtitle: 'Tracks for your vibe' },
      boardgameMatch: { title: 'Boardgame match',         subtitle: 'By genre & people' },

      dateNight:      { title: 'Date plan',               subtitle: 'Tailored scenario' },
      conflictNotes:  { title: 'Conflict notes',          subtitle: 'Calm wording' },
      eventToast:     { title: 'Toast / greeting',        subtitle: 'On point' },
      giftIdeas:      { title: 'Gift ideas',              subtitle: 'For person & budget' },
      essay:          { title: 'Essay (human style)',     subtitle: 'Natural voice' },
      review:         { title: 'Review / reference',      subtitle: 'Positive / neutral / negative' },
      rapLyrics:      { title: 'Rap lyrics',              subtitle: 'Rhythm, meaning, hooks' },
      kidsPoem:       { title: 'Kids’ poem',              subtitle: 'Age 8–10' },
      hashtagHelper:  { title: 'Hashtag helper',          subtitle: 'Core + variations' },
      brandName:      { title: 'Brand name',              subtitle: 'Short & catchy' },
      babyName:       { title: 'Baby name',               subtitle: 'Meaning & forms' },
      meetingAgenda:  { title: 'Meeting agenda',          subtitle: 'Clear structure' },

      chooseBetween:  { title: 'Choose between options',  subtitle: 'Help decide' },
      carPick:        { title: 'Car picker',              subtitle: 'Budget & goals' },

      quickBudget:    { title: 'Quick budget',            subtitle: 'Budget & limits' },
      debtPayoff:     { title: 'Debt payoff',             subtitle: 'Plan & timeline' },

      wine:           { title: 'Wine choice',             subtitle: 'Style & pairings' },
      beer:           { title: 'Beer choice',             subtitle: 'Styles & pairs' },
      spirits:        { title: 'Spirits',                 subtitle: 'Profile & serve' },
      snackPair:      { title: 'Snack pairing',           subtitle: 'Best matches' },

      walkProgram:    { title: 'Walk program',            subtitle: 'Steps, routes, motivation' },
    }
  },

  uk: {
    title: 'Щоденні інструменти',
    chooseTool: 'Оберіть інструмент',
    searchPlaceholder: 'Пошук інструментів…',
    searchAria: 'Пошук',
    notFound: 'Нічого не знайдено',
    tool: {
      morning:{title:'Ранковий ритуал',subtitle:'План на 20–30 хв'},
      weeklyPlan:{title:'План на тиждень',subtitle:'Тиждень без стресу'},
      timeBlocks:{title:'Таймблоки дня',subtitle:'День по блоках'},
      quickCleaning:{title:'Швидке прибирання',subtitle:'Крок за кроком'},
      mindDump:{title:'Вивантаження думок',subtitle:'Швидко очистити голову'},
      focusSprint:{title:'Фокус-спринт',subtitle:'25–40 хв концентрації'},
      habitPlan:{title:'План звички',subtitle:'Кроки, тригери, трекер'},
      waterTracker:{title:'Трекер води',subtitle:'Скільки пити за день'},
      microWorkout:{title:'Мікро-тренування',subtitle:'5–15 хв удома'},
      postureBreak:{title:'Перерва для постави',subtitle:'2–3 хв вирівнятись'},
      declutterPlan:{title:'Деклатер-план',subtitle:'За зонами'},
      errandRoute:{title:'Маршрут справ містом',subtitle:'Заощадимо час у дорозі'},
      cityDay:{title:'День у місті',subtitle:'Готовий міні-маршрут'},
      packList:{title:'Список у подорож',subtitle:'Нічого не забути'},

      healthVisit:{title:'До візиту до лікаря',subtitle:'Питання та нотатки'},
      petCare:{title:'Догляд за улюбленцем',subtitle:'Годування, прогулянки, здоровʼя'},
      sleepHygiene:{title:'Гігієна сну',subtitle:'План покращення'},
      mealPlanMini:{title:'Міні-план харчування',subtitle:'Меню на 1–3 дні'},

      cinema:{title:'Обрати фільм/серіал',subtitle:'Персональний підбір'},
      seriesPick:{title:'Підбір серіалу',subtitle:'Знайдемо «той самий»'},
      anime:{title:'Підбір аніме',subtitle:'Під ваш смак'},
      bookPick:{title:'Підбір книги',subtitle:'Книги для вас'},
      gamePick:{title:'Підбір гри',subtitle:'За інтересами й часом'},
      playlistMood:{title:'Плейлист під настрій',subtitle:'Треки під вайб'},
      boardgameMatch:{title:'Настолка для компанії',subtitle:'За жанром і людьми'},

      dateNight:{title:'Побачення-план',subtitle:'Сценарій під вас'},
      conflictNotes:{title:'Розбір конфлікту',subtitle:'Спокійні формулювання'},
      eventToast:{title:'Тост/привітання',subtitle:'Доречно й по суті'},
      giftIdeas:{title:'Ідеї подарунків',subtitle:'Під людину й бюджет'},
      essay:{title:'Есе «як людина»',subtitle:'Живий стиль'},
      review:{title:'Відгук/рекомендація',subtitle:'Позитив/нейтр/негатив'},
      rapLyrics:{title:'Реп-текст',subtitle:'Ритм, зміст, хуки'},
      kidsPoem:{title:'Дитячий вірш',subtitle:'Для 8–10 років'},
      hashtagHelper:{title:'Хештеги до поста',subtitle:'Ядро і варіації'},
      brandName:{title:'Назва бренду',subtitle:'Коротко й чіпко'},
      babyName:{title:'Імʼя для дитини',subtitle:'Значення та форми'},
      meetingAgenda:{title:'Порядок денний',subtitle:'Чітка структура'},

      chooseBetween:{title:'Вибір між варіантами',subtitle:'Допомога з рішенням'},
      carPick:{title:'Підбір авто',subtitle:'Під бюджет і цілі'},

      quickBudget:{title:'Швидкий бюджет',subtitle:'Бюджет і ліміти'},
      debtPayoff:{title:'Погашення боргів',subtitle:'План і строки'},

      wine:{title:'Вибір вина',subtitle:'Стиль і поєднання'},
      beer:{title:'Вибір пива',subtitle:'Стилі та пари'},
      spirits:{title:'Кріпкі напої',subtitle:'Профіль і подача'},
      snackPair:{title:'Закуска до напою',subtitle:'Найкращі поєднання'},

      walkProgram:{title:'Програма прогулянок',subtitle:'Кроки, маршрути, мотивація'},
    }
  },

  be: {
    title: 'Штодзённыя інструменты',
    chooseTool: 'Абярыце інструмент',
    searchPlaceholder: 'Пошук інструментаў…',
    searchAria: 'Пошук',
    notFound: 'Нічога не знойдзена',
    tool: {
      morning:{title:'Ранішні рытуал',subtitle:'План на 20–30 хв'},
      weeklyPlan:{title:'План на тыдзень',subtitle:'Тыдзень без стрэсу'},
      timeBlocks:{title:'Таймблокі дня',subtitle:'Дзень па блоках'},
      quickCleaning:{title:'Хуткая уборка',subtitle:'Крок за крокам'},
      mindDump:{title:'Выгрузка думак',subtitle:'Хутка ачысціць галаву'},
      focusSprint:{title:'Фокус-спрынт',subtitle:'25–40 хв канцэнтрацыі'},
      habitPlan:{title:'План звычкі',subtitle:'Крокі, трыгеры, трэкер'},
      waterTracker:{title:'Трэкэр вады',subtitle:'Колькі піць за дзень'},
      microWorkout:{title:'Мікра-трэніроўка',subtitle:'5–15 хв дома'},
      postureBreak:{title:'Перапынак для паставы',subtitle:'2–3 хв выраўняцца'},
      declutterPlan:{title:'Дэклатэр-план',subtitle:'Па зонах'},
      errandRoute:{title:'Маршрут спраў',subtitle:'Эканомім час у дарозе'},
      cityDay:{title:'Дзень у горадзе',subtitle:'Гатовы міні-маршрут'},
      packList:{title:'Спіс у падарожжа',subtitle:'Нічога не забыць'},

      healthVisit:{title:'Да візіту да лекара',subtitle:'Пытанні і нотаткі'},
      petCare:{title:'Дагляд за хатнім',subtitle:'Корм, прагулкі, здароўе'},
      sleepHygiene:{title:'Гігіена сну',subtitle:'Палепшыць сон'},
      mealPlanMini:{title:'Міні-план харчавання',subtitle:'Меню на 1–3 дні'},

      cinema:{title:'Выбраць фільм/серыял',subtitle:'Персанальны падбор'},
      seriesPick:{title:'Падбор серыяла',subtitle:'Знойдзем «той самы»'},
      anime:{title:'Падбор анімэ',subtitle:'Пад ваш густ'},
      bookPick:{title:'Падбор кнігі',subtitle:'Кнігі для вас'},
      gamePick:{title:'Падбор гульні',subtitle:'Па інтарэсах і часе'},
      playlistMood:{title:'Плэйліст па настроі',subtitle:'Трэкі пад вайб'},
      boardgameMatch:{title:'Настолка для кампаніі',subtitle:'Па жанры і людзях'},

      dateNight:{title:'План спаткання',subtitle:'Сцэнар пад вас'},
      conflictNotes:{title:'Разбор канфлікту',subtitle:'Спакойныя фармулёўкі'},
      eventToast:{title:'Тост/віншаванне',subtitle:'Дарэчы і па сутнасці'},
      giftIdeas:{title:'Ідэі падарункаў',subtitle:'Пад чалавека і бюджэт'},
      essay:{title:'Эсэ «па-людску»',subtitle:'Жывы стыль'},
      review:{title:'Водгук/рэкамендацыя',subtitle:'Пазітыў/нейтр/негат'},
      rapLyrics:{title:'Рэп-тэкст',subtitle:'Рытм, сэнс, хукі'},
      kidsPoem:{title:'Дзіцячы верш',subtitle:'Для 8–10 гадоў'},
      hashtagHelper:{title:'Хэштэгі да паста',subtitle:'Ядро і варыяцыі'},
      brandName:{title:'Назва брэнда',subtitle:'Каротка і кідка'},
      babyName:{title:'Імя для дзіцяці',subtitle:'Значэнне і формы'},
      meetingAgenda:{title:'Парадак сустрэчы',subtitle:'Чыстая структура'},

      chooseBetween:{title:'Выбар паміж варыянтамі',subtitle:'Паможам вызначыцца'},
      carPick:{title:'Падбор аўто',subtitle:'Пад бюджэт і мэты'},

      quickBudget:{title:'Хуткі бюджэт',subtitle:'Бюджэт і ліміты'},
      debtPayoff:{title:'Пагашэнне даўгоў',subtitle:'План і тэрміны'},

      wine:{title:'Выбар віна',subtitle:'Стыль і закускі'},
      beer:{title:'Выбар піва',subtitle:'Стылі і пары'},
      spirits:{title:'Моцны алкаголь',subtitle:'Профіль і падача'},
      snackPair:{title:'Закуска да напою',subtitle:'Лепшыя спалучэнні'},

      walkProgram:{title:'Праграма прагулкі',subtitle:'Крокі, маршруты, матывацыя'},
    }
  },

  kk: {
    title: 'Күнделікті құралдар',
    chooseTool: 'Құралды таңдаңыз',
    searchPlaceholder: 'Құралдардан іздеу…',
    searchAria: 'Іздеу',
    notFound: 'Ештеңе табылмады',
    tool: {
      morning:{title:'Таңғы ритуал',subtitle:'20–30 минуттық жоспар'},
      weeklyPlan:{title:'Апталық жоспар',subtitle:'Стресссіз апта'},
      timeBlocks:{title:'Күнді блоктау',subtitle:'Күнді блоктарға бөлу'},
      quickCleaning:{title:'Жылдам жинау',subtitle:'Қадам-қадаммен'},
      mindDump:{title:'Ойды босату',subtitle:'Басты тез тазарту'},
      focusSprint:{title:'Фокус-спринт',subtitle:'25–40 минут назар'},
      habitPlan:{title:'Әдет жоспары',subtitle:'Қадамдар, триггер, трекер'},
      waterTracker:{title:'Су трекері',subtitle:'Күніне қанша ішу'},
      microWorkout:{title:'Микро жаттығу',subtitle:'Үйде 5–15 минут'},
      postureBreak:{title:'Дене түзеу үзілісі',subtitle:'2–3 минут'},
      declutterPlan:{title:'Деклаттер жоспары',subtitle:'Аймақтар бойынша'},
      errandRoute:{title:'Қалалық істер бағыты',subtitle:'Жол уақытын үнемдеу'},
      cityDay:{title:'Қаладағы күн',subtitle:'Дайын мини-маршрут'},
      packList:{title:'Саяхат тізімі',subtitle:'Ештеңе ұмытпау'},

      healthVisit:{title:'Дәрігерге бару',subtitle:'Сұрақтар мен жазбалар'},
      petCare:{title:'Жануар күтімі',subtitle:'Қорек, серуен, денсаулық'},
      sleepHygiene:{title:'Ұйқы гигиенасы',subtitle:'Жақсарту жоспары'},
      mealPlanMini:{title:'Мини ас жоспары',subtitle:'1–3 күнге меню'},

      cinema:{title:'Фильм/сериал таңдау',subtitle:'Жеке іріктеу'},
      seriesPick:{title:'Сериал іріктеу',subtitle:'Сол «біреуін» табамыз'},
      anime:{title:'Аниме таңдау',subtitle:'Таза талғам бойынша'},
      bookPick:{title:'Кітап таңдау',subtitle:'Сізге ұнайтындар'},
      gamePick:{title:'Ойын таңдау',subtitle:'Уақыт пен талғамға'},
      playlistMood:{title:'Көңіл күй плейлісті',subtitle:'Вайбқа сай тректер'},
      boardgameMatch:{title:'Үстел ойыны',subtitle:'Жанр мен компанияға'},

      dateNight:{title:'Кездесу жоспары',subtitle:'Сізге лайық сценарий'},
      conflictNotes:{title:'Қақтығыс жазбалары',subtitle:'Сабырлы тұжырымдар'},
      eventToast:{title:'Тост/құттықтау',subtitle:'Орынды әрі нақты'},
      giftIdeas:{title:'Сыйлық идеялары',subtitle:'Адам мен бюджетке'},
      essay:{title:'Эссе (табиғи стиль)',subtitle:'Адамша жазылған'},
      review:{title:'Пікір/ұсыным',subtitle:'Позитив/нейтр/негатив'},
      rapLyrics:{title:'Рэп мәтіні',subtitle:'Ритм, мағына, хуктар'},
      kidsPoem:{title:'Балалар өлеңі',subtitle:'8–10 жас'},
      hashtagHelper:{title:'Хэштег көмекшісі',subtitle:'Ядро және вариациялар'},
      brandName:{title:'Бренд атауы',subtitle:'Қысқа әрі есте қаларлық'},
      babyName:{title:'Бала аты',subtitle:'Мағынасы мен қысқа формалар'},
      meetingAgenda:{title:'Кездесу күн тәртібі',subtitle:'Айқын құрылым'},

      chooseBetween:{title:'Варианттар арасынан таңдау',subtitle:'Шешімге көмектесу'},
      carPick:{title:'Көлік таңдау',subtitle:'Бюджет пен мақсатқа'},

      quickBudget:{title:'Жылдам бюджет',subtitle:'Бюджет пен лимиттер'},
      debtPayoff:{title:'Берешекті өтеу',subtitle:'Жоспар және мерзім'},

      wine:{title:'Шарап таңдау',subtitle:'Стиль және жұптаулар'},
      beer:{title:'Сыра таңдау',subtitle:'Стильдер және жұптар'},
      spirits:{title:'Күшті ішімдік',subtitle:'Профиль және беру'},
      snackPair:{title:'Тіскі ас жұптауы',subtitle:'Үздік үйлесімдер'},

      walkProgram:{title:'Жүріс бағдарламасы',subtitle:'Қадамдар, маршрут, мотивация'},
    }
  },

  uz: {
    title: 'Kundalik vositalar',
    chooseTool: 'Vosita tanlang',
    searchPlaceholder: 'Qidiruv…',
    searchAria: 'Qidiruv',
    notFound: 'Hech narsa topilmadi',
    tool: {
      morning:{title:'Ertalabki ritual',subtitle:'20–30 daqiqalik reja'},
      weeklyPlan:{title:'Haftalik reja',subtitle:'Stresssiz hafta'},
      timeBlocks:{title:'Kun bloklari',subtitle:'Kun bo‘lib-bo‘lib'},
      quickCleaning:{title:'Tezkor tozalash',subtitle:'Qadam-baqadam'},
      mindDump:{title:'Fikrlarni bo‘shatish',subtitle:'Boshni tez tozalash'},
      focusSprint:{title:'Fokus sprint',subtitle:'25–40 daqiqa diqqat'},
      habitPlan:{title:'Odat rejasi',subtitle:'Qadamlar, triggerlar, treker'},
      waterTracker:{title:'Suv trekeri',subtitle:'Kuniga qancha ichish'},
      microWorkout:{title:'Mikro-mashq',subtitle:'Uyda 5–15 daqiqa'},
      postureBreak:{title:'Tana holati tanaffusi',subtitle:'2–3 daqiqa'},
      declutterPlan:{title:'Declutter rejasi',subtitle:'Hududlar bo‘yicha'},
      errandRoute:{title:'Shahar ishlari marshruti',subtitle:'Yo‘l vaqtini tejash'},
      cityDay:{title:'Shaharda bir kun',subtitle:'Tayyor mini-marshrut'},
      packList:{title:'Safar ro‘yxati',subtitle:'Hech narsa unutilmasin'},

      healthVisit:{title:'Shifokorga borish',subtitle:'Savollar va yozuvlar'},
      petCare:{title:'Uy hayvoniga g‘amxo‘rlik',subtitle:'Oziq, sayr, salomatlik'},
      sleepHygiene:{title:'Uyqu gigiyenasi',subtitle:'Yaxshilash reja'},
      mealPlanMini:{title:'Mini ovqat rejasi',subtitle:'1–3 kunlik menyu'},

      cinema:{title:'Film/serial tanlash',subtitle:'Shaxsiy tanlov'},
      seriesPick:{title:'Serial tanlash',subtitle:'“O‘sha”ni topamiz'},
      anime:{title:'Anime tanlash',subtitle:'Didga mos'},
      bookPick:{title:'Kitob tanlash',subtitle:'Sizga yoqadiganlar'},
      gamePick:{title:'O‘yin tanlash',subtitle:'Vaqt va did bo‘yicha'},
      playlistMood:{title:'Kayfiyat pleylisti',subtitle:'Vaybga mos treklar'},
      boardgameMatch:{title:'Stol o‘yini',subtitle:'Janr va jamoa bo‘yicha'},

      dateNight:{title:'Uchrashuv rejasi',subtitle:'Sizga mos ssenariy'},
      conflictNotes:{title:'Nizo qaydlari',subtitle:'Sokin iboralar'},
      eventToast:{title:'To‘st/tabrik',subtitle:'O‘rinli va lo‘nda'},
      giftIdeas:{title:'Sovg‘a g‘oyalari',subtitle:'Odam va budjetga'},
      essay:{title:'Insho (tabiiy uslub)',subtitle:'Tirik ohang'},
      review:{title:'Sharh/taqdimnoma',subtitle:'Ijobiy/neytral/salbiy'},
      rapLyrics:{title:'Rep matni',subtitle:'Ritm, ma’no, xuklar'},
      kidsPoem:{title:'Bolalar she’ri',subtitle:'8–10 yosh'},
      hashtagHelper:{title:'Xeshteg yordamchisi',subtitle:'Yadro va variantlar'},
      brandName:{title:'Brend nomi',subtitle:'Qisqa va esda qoladigan'},
      babyName:{title:'Bola ismi',subtitle:'Ma’nosi va qisqa shakllar'},
      meetingAgenda:{title:'Uchrashuv kun tartibi',subtitle:'Aniq tuzilma'},

      chooseBetween:{title:'Variantlar orasidan tanlash',subtitle:'Qaror qabul qilishga yordam'},
      carPick:{title:'Avto tanlash',subtitle:'Budjet va maqsad'},

      quickBudget:{title:'Tez budjet',subtitle:'Budjet va limitlar'},
      debtPayoff:{title:'Qarzlarni to‘lash',subtitle:'Reja va muddat'},

      wine:{title:'Vino tanlash',subtitle:'Uslub va moslashtirish'},
      beer:{title:'Pivo tanlash',subtitle:'Uslublar va juftliklar'},
      spirits:{title:'Kuchli ichimliklar',subtitle:'Profil va ulash'},
      snackPair:{title:'Atirlik juftlash',subtitle:'Eng yaxshi uyg‘unlik'},

      walkProgram:{title:'Yurish dasturi',subtitle:'Qadamlar, marshrutlar, motivatsiya'},
    }
  },

  ky: {
    title: 'Күндөлүк куралдар',
    chooseTool: 'Курал тандаңыз',
    searchPlaceholder: 'Куралдарды издөө…',
    searchAria: 'Издөө',
    notFound: 'Эч нерсе табылган жок',
    tool: {
      morning:{title:'Таңкы ритуал',subtitle:'20–30 мүнөт план'},
      weeklyPlan:{title:'Жумалык план',subtitle:'Стресссиз жума'},
      timeBlocks:{title:'Күн блоктору',subtitle:'Күндү блоктоо'},
      quickCleaning:{title:'Тез тазалоо',subtitle:'Кадам-кадам'},
      mindDump:{title:'Ойду чыгарып таштоо',subtitle:'Башты бат тазалоо'},
      focusSprint:{title:'Фокус-спринт',subtitle:'25–40 мүнөт көңүл буруу'},
      habitPlan:{title:'Адат планы',subtitle:'Кадамдар, триггер, трекер'},
      waterTracker:{title:'Суу трекери',subtitle:'Күнүнө канча ичүү'},
      microWorkout:{title:'Микро машыгуу',subtitle:'Үйдө 5–15 мүнөт'},
      postureBreak:{title:'Туратылган поза',subtitle:'2–3 мүнөт түзөлүү'},
      declutterPlan:{title:'Деклаттер-план',subtitle:'Аймактар боюнча'},
      errandRoute:{title:'Шаардагы иштер маршруту',subtitle:'Жолго кетчү убакытты үнөмдөө'},
      cityDay:{title:'Шаарда бир күн',subtitle:'Даяр мини-маршрут'},
      packList:{title:'Саякат тизмеси',subtitle:'Эч нерсе унутулбасын'},

      healthVisit:{title:'Дарыгерге баруу',subtitle:'Суроолор жана жазмалар'},
      petCare:{title:'Жаныбарга кам көрүү',subtitle:'Тоют, сейилдөө, ден соолук'},
      sleepHygiene:{title:'Уйку гигиенасы',subtitle:'Жакшыртуу планы'},
      mealPlanMini:{title:'Мини-тамак планы',subtitle:'1–3 күнгө меню'},

      cinema:{title:'Фильм/сериал тандоо',subtitle:'Жеке тандоо'},
      seriesPick:{title:'Сериал тандоо',subtitle:'“Ошол эле” табылсын'},
      anime:{title:'Аниме тандоо',subtitle:'Даамга жараша'},
      bookPick:{title:'Китеп тандоо',subtitle:'Сизге жагат'},
      gamePick:{title:'Оюн тандоо',subtitle:'Убакыт жана табит'},
      playlistMood:{title:'Көңүл-күй плейлисти',subtitle:'Вайбга ылайык тректер'},
      boardgameMatch:{title:'Настолка',subtitle:'Жанр жана командага'},

      dateNight:{title:'Таанышуу кечеси',subtitle:'Сизге ылайык сценарий'},
      conflictNotes:{title:'Кайым айтышма жазмалары',subtitle:'Тынч формулировкалар'},
      eventToast:{title:'Тост/куттуктоо',subtitle:'Орундуу жана так'},
      giftIdeas:{title:'Белек идеялары',subtitle:'Адам жана бюджетке'},
      essay:{title:'Эссе (жандуу стиль)',subtitle:'Табигый үн'},
      review:{title:'Пикир/сунуштама',subtitle:'Позитив/нейтр/негатив'},
      rapLyrics:{title:'Рэп тексти',subtitle:'Ритм, маани, хуктар'},
      kidsPoem:{title:'Балдар ыры',subtitle:'8–10 жаш'},
      hashtagHelper:{title:'Хэштег жардамчысы',subtitle:'Өзөк жана варианттар'},
      brandName:{title:'Бренд аталышы',subtitle:'Кыска жана таасирдүү'},
      babyName:{title:'Баланын аты',subtitle:'Маани жана формалар'},
      meetingAgenda:{title:'Жыйын күн тартиби',subtitle:'Так структура'},

      chooseBetween:{title:'Тандоо ортосунда',subtitle:'Чечимге жардам'},
      carPick:{title:'Унаа тандоо',subtitle:'Бюджет жана максат'},

      quickBudget:{title:'Ыкчам бюджет',subtitle:'Бюджет жана чектөөлөр'},
      debtPayoff:{title:'Карыз жабуу',subtitle:'План жана мөөнөт'},

      wine:{title:'Вино тандоо',subtitle:'Стиль жана кошулмалар'},
      beer:{title:'Пиво тандоо',subtitle:'Стилдер жана жуптар'},
      spirits:{title:'Күчтүү ичимдиктер',subtitle:'Профиль жана тартуу'},
      snackPair:{title:'Закуска жуптоо',subtitle:'Эң жакшы айкалыштар'},

      walkProgram:{title:'Жүрүш программасы',subtitle:'Кадамдар, маршруттар, мотивация'},
    }
  },

  fa: {
    title: 'ابزارهای روزمره',
    chooseTool: 'یک ابزار انتخاب کنید',
    searchPlaceholder: 'جستجو در ابزارها…',
    searchAria: 'جستجو',
    notFound: 'چیزی پیدا نشد',
    tool: {
      morning:{title:'روال صبحگاهی',subtitle:'برنامهٔ ۲۰–۳۰ دقیقه‌ای'},
      weeklyPlan:{title:'برنامهٔ هفتگی',subtitle:'هفته‌ای بدون استرس'},
      timeBlocks:{title:'بلوک‌بندی روز',subtitle:'روز به بخش‌ها'},
      quickCleaning:{title:'نظافت سریع خانه',subtitle:'گام‌به‌گام'},
      mindDump:{title:'تخلیهٔ ذهن',subtitle:'پاکسازی سریع ذهن'},
      focusSprint:{title:'اسپرینت تمرکز',subtitle:'۲۵–۴۰ دقیقه تمرکز'},
      habitPlan:{title:'برنامهٔ عادت',subtitle:'گام‌ها، محرک‌ها، ردیاب'},
      waterTracker:{title:'ردیاب آب',subtitle:'در روز چقدر بنوشم'},
      microWorkout:{title:'تمرین کوتاه',subtitle:'۵–۱۵ دقیقه در خانه'},
      postureBreak:{title:'وقفهٔ وضعیت بدن',subtitle:'۲–۳ دقیقه صاف ایستادن'},
      declutterPlan:{title:'طرح نظم‌دهی',subtitle:'به تفکیک مناطق'},
      errandRoute:{title:'مسیر کارهای شهری',subtitle:'صرفه‌جویی در رفت‌وآمد'},
      cityDay:{title:'یک روز در شهر',subtitle:'مسیر آماده'},
      packList:{title:'فهرست سفر',subtitle:'چیزی فراموش نشود'},

      healthVisit:{title:'آمادگی برای پزشک',subtitle:'سوال‌ها و یادداشت‌ها'},
      petCare:{title:'مراقبت از حیوان خانگی',subtitle:'غذا، پیاده‌روی، سلامت'},
      sleepHygiene:{title:'بهداشت خواب',subtitle:'برنامهٔ بهبود'},
      mealPlanMini:{title:'برنامهٔ غذایی کوتاه',subtitle:'منو برای ۱–۳ روز'},

      cinema:{title:'انتخاب فیلم/سریال',subtitle:'انتخاب شخصی‌سازی‌شده'},
      seriesPick:{title:'پیدا کردن سریال',subtitle:'«همان یکی» را بیابیم'},
      anime:{title:'انتخاب انیمه',subtitle:'بر اساس سلیقه'},
      bookPick:{title:'انتخاب کتاب',subtitle:'کتاب‌های مناسب شما'},
      gamePick:{title:'انتخاب بازی',subtitle:'بر اساس زمان و سلیقه'},
      playlistMood:{title:'پلی‌لیست حال‌وهوا',subtitle:'آهنگ‌های مناسب حال'},
      boardgameMatch:{title:'بازی رومیزی',subtitle:'بر پایهٔ ژانر و جمع'},

      dateNight:{title:'برنامهٔ قرار',subtitle:'سناریوی مخصوص شما'},
      conflictNotes:{title:'یادداشت‌های تعارض',subtitle:'جملات آرام'},
      eventToast:{title:'توست/تبریک',subtitle:'به‌جا و خلاصه'},
      giftIdeas:{title:'ایدهٔ هدیه',subtitle:'متناسب با فرد و بودجه'},
      essay:{title:'مقاله با لحن طبیعی',subtitle:'انسانی و روان'},
      review:{title:'بررسی/توصیه‌نامه',subtitle:'مثبت/خنثی/منفی'},
      rapLyrics:{title:'متن رپ',subtitle:'ریتم، معنا، هوک'},
      kidsPoem:{title:'شعر کودکانه',subtitle:'برای ۸–۱۰ سال'},
      hashtagHelper:{title:'کمک‌یار هشتگ',subtitle:'هسته و گونه‌ها'},
      brandName:{title:'نام برند',subtitle:'کوتاه و گیرا'},
      babyName:{title:'نام نوزاد',subtitle:'معنا و شکل‌های کوتاه'},
      meetingAgenda:{title:'دستور جلسه',subtitle:'ساختار شفاف'},

      chooseBetween:{title:'انتخاب بین گزینه‌ها',subtitle:'کمک به تصمیم'},
      carPick:{title:'انتخاب خودرو',subtitle:'بر اساس بودجه و هدف'},

      quickBudget:{title:'بودجهٔ سریع',subtitle:'بودجه و حدود'},
      debtPayoff:{title:'تسویهٔ بدهی',subtitle:'برنامه و زمان‌بندی'},

      wine:{title:'انتخاب شراب',subtitle:'سبک و همراهی'},
      beer:{title:'انتخاب آبجو',subtitle:'سبک‌ها و جفت‌ها'},
      spirits:{title:'مشروبات الکلی قوی',subtitle:'پروفایل و سرو'},
      snackPair:{title:'جفتِ تنقلات',subtitle:'بهترین ترکیب‌ها'},

      walkProgram:{title:'برنامهٔ پیاده‌روی',subtitle:'گام‌ها، مسیرها، انگیزه'},
    }
  },

  hi: {
    title: 'रोज़मर्रा के टूल',
    chooseTool: 'एक टूल चुनें',
    searchPlaceholder: 'टूल खोजें…',
    searchAria: 'खोज',
    notFound: 'कुछ नहीं मिला',
    tool: {
      morning:{title:'सुबह की रुटीन',subtitle:'20–30 मिनट की योजना'},
      weeklyPlan:{title:'साप्ताहिक योजना',subtitle:'बिना तनाव का हफ्ता'},
      timeBlocks:{title:'टाइम-ब्लॉक्स',subtitle:'दिन को ब्लॉक्स में'},
      quickCleaning:{title:'जल्दी सफ़ाई',subtitle:'स्टेप-बाय-स्टेप'},
      mindDump:{title:'माइंड डम्प',subtitle:'दिमाग़ तुरंत साफ़'},
      focusSprint:{title:'फोकस स्प्रिंट',subtitle:'25–40 मिनट ध्यान'},
      habitPlan:{title:'हैबिट प्लान',subtitle:'कदम, ट्रिगर, ट्रैकर'},
      waterTracker:{title:'वॉटर ट्रैकर',subtitle:'दिन में कितना पानी'},
      microWorkout:{title:'माइक्रो वर्कआउट',subtitle:'घर पर 5–15 मिनट'},
      postureBreak:{title:'पोश्चर ब्रेक',subtitle:'2–3 मिनट सीधा होना'},
      declutterPlan:{title:'डिक्लटर प्लान',subtitle:'ज़ोन के हिसाब से'},
      errandRoute:{title:'शहर का काम-रूट',subtitle:'सफ़र का समय बचाएँ'},
      cityDay:{title:'सिटी-डे',subtitle:'तैयार मिनी-रूट'},
      packList:{title:'यात्रा सूची',subtitle:'कुछ भी न छूटे'},

      healthVisit:{title:'डॉक्टर विज़िट तैयारी',subtitle:'सवाल व नोट्स'},
      petCare:{title:'पेट-केयर',subtitle:'खाना, वॉक, स्वास्थ्य'},
      sleepHygiene:{title:'स्लीप हाइजीन',subtitle:'नींद सुधार योजना'},
      mealPlanMini:{title:'मिनी मील प्लान',subtitle:'1–3 दिन का मेन्यू'},

      cinema:{title:'फिल्म/सीरीज़ चुनें',subtitle:'पर्सनल सिलेक्शन'},
      seriesPick:{title:'सीरीज़ फाइंडर',subtitle:'“वही एक” ढूँढें'},
      anime:{title:'ऐनिमे पिकर',subtitle:'आपके स्वाद के मुताबिक'},
      bookPick:{title:'किताब पिकर',subtitle:'जो आपको पसंद आए'},
      gamePick:{title:'गेम पिकर',subtitle:'समय व स्वाद के हिसाब से'},
      playlistMood:{title:'मूड प्लेलिस्ट',subtitle:'वाइब के ट्रैक्स'},
      boardgameMatch:{title:'बोर्ड गेम मैच',subtitle:'जेनर व लोगों के अनुसार'},

      dateNight:{title:'डेट-प्लान',subtitle:'आपके लिए बना'},
      conflictNotes:{title:'कन्फ्लिक्ट नोट्स',subtitle:'शांत शब्दावली'},
      eventToast:{title:'टोस्ट/बधाई',subtitle:'उचित और संक्षेप'},
      giftIdeas:{title:'गिफ्ट आइडियाज',subtitle:'व्यक्ति व बजट अनुसार'},
      essay:{title:'नैचरल-स्टाइल निबंध',subtitle:'मानवीय लहजा'},
      review:{title:'रिव्यू/रेकमेंडेशन',subtitle:'पॉजिटिव/न्यूट्रल/नेगेटिव'},
      rapLyrics:{title:'रैप लिरिक्स',subtitle:'रिद्म, मतलब, हुक्स'},
      kidsPoem:{title:'बच्चों की कविता',subtitle:'8–10 वर्ष'},
      hashtagHelper:{title:'हैशटैग हेल्पर',subtitle:'कोर और वैरिएशंस'},
      brandName:{title:'ब्रांड-नेम',subtitle:'छोटा और कैची'},
      babyName:{title:'बेबी-नेम',subtitle:'अर्थ व संक्षिप्त रूप'},
      meetingAgenda:{title:'मीटिंग एजेंडा',subtitle:'साफ़ संरचना'},

      chooseBetween:{title:'विकल्पों में चुनाव',subtitle:'निर्णय में मदद'},
      carPick:{title:'कार-पिकर',subtitle:'बजट व लक्ष्य'},

      quickBudget:{title:'क्विक बजट',subtitle:'बजट और लिमिट'},
      debtPayoff:{title:'कर्ज़ चुकौती',subtitle:'योजना और समय-सीमा'},

      wine:{title:'वाइन चयन',subtitle:'स्टाइल व पेयरिंग'},
      beer:{title:'बीयर चयन',subtitle:'स्टाइल और पेयर्स'},
      spirits:{title:'स्पिरिट्स',subtitle:'प्रोफाइल व सर्व'},
      snackPair:{title:'स्नैक पेयरिंग',subtitle:'सर्वोत्तम मेल'},

      walkProgram:{title:'वॉक प्रोग्राम',subtitle:'कदम, रूट, मोटिवेशन'},
    }
  },
};

/** Вернёт локализованные строки для Pro-хаба (с падением на ru) */
export function getProStrings(locale: Locale): ProDict {
  return PRO[locale] ?? PRO.ru;
}
