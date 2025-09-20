'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** Сообщение чата */
type Msg = { role: 'user' | 'assistant'; content: string };
/** Фазы навигации */
type Phase = 'root' | 'sub' | 'chat';
/** Элемент уточняющего вопроса */
type QItem = {
  text: string;
  mode?: 'input' | 'choice';
  options?: string[];
};

const COMPACT_BTN_STYLE: React.CSSProperties = {
  textAlign: 'left',
  border: '1px solid var(--border, #333)',
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 14,
  lineHeight: 1.3,
  background: 'transparent',
  color: 'inherit',
};

/** Темы (как ты прислал) */
const ROOT_TOPICS = [
  { key: 'labor',       label: 'Трудовые споры' },
  { key: 'housing',     label: 'Жилищные правоотношения' },
  { key: 'consumer',    label: 'Защита прав потребителей' },
  { key: 'family',      label: 'Семейные правоотношения' },
  { key: 'traffic',     label: 'Дорожно-транспортные споры' },
  { key: 'inheritance', label: 'Наследственные дела' },
  { key: 'land',        label: 'Земельные и имущественные споры' },
  { key: 'debt',        label: 'Договоры и взыскание задолженности' },
  { key: 'banking',     label: 'Банковские и кредитные споры' },
  { key: 'exec',        label: 'Исполнительное производство (ФССП)' },
  { key: 'admin',       label: 'Административные правонарушения' },
  { key: 'taxes',       label: 'Налоговые вопросы' },
  { key: 'other',       label: 'Другое' },
] as const;

/** Подкатегории (как ты прислал) */
const SUB_TOPICS: Record<string, { key: string; label: string }[]> = {
  labor: [
    { key: 'dismissal',  label: 'Увольнение/сокращение' },
    { key: 'salary',     label: 'Задержка/невыплата зарплаты' },
    { key: 'contract',   label: 'Трудовой договор/условия' },
    { key: 'vacation',   label: 'Отпуск/больничный' },
    { key: 'discipline', label: 'Дисциплинарное взыскание' },
    { key: 'overtime',   label: 'Сверхурочная/ночная работа' },
    { key: 'safety',     label: 'Охрана труда/несчастный случай' },
    { key: 'transfer',   label: 'Перевод/изменение условий труда' },
    { key: 'other',      label: 'Другое' },
  ],
  housing: [
    { key: 'rent',        label: 'Наём/аренда жилья' },
    { key: 'purchase',    label: 'Купля-продажа, ДКП' },
    { key: 'registration',label: 'Регистрация/выселение' },
    { key: 'neighbors',   label: 'Соседи/шум/затопление' },
    { key: 'utilities',   label: 'Коммунальные услуги, УК/ТСЖ' },
    { key: 'construction',label: 'ДДУ/застройщик/новостройка' },
    { key: 'hoa',         label: 'ТСЖ/собрания/домовое имущество' },
    { key: 'other',       label: 'Другое' },
  ],
  consumer: [
    { key: 'return',   label: 'Возврат/обмен товара' },
    { key: 'service',  label: 'Ненадлежащая услуга' },
    { key: 'online',   label: 'Онлайн-покупка/маркетплейсы' },
    { key: 'warranty', label: 'Гарантия/ремонт/неустойка' },
    { key: 'digital',  label: 'Цифровые товары/подписки' },
    { key: 'travel',   label: 'Туристические услуги' },
    { key: 'other',    label: 'Другое' },
  ],
  family: [
    { key: 'divorce',   label: 'Расторжение брака' },
    { key: 'alimony',   label: 'Алименты' },
    { key: 'children',  label: 'Опека/общение/место жительства' },
    { key: 'property',  label: 'Раздел имущества' },
    { key: 'paternity', label: 'Отцовство' },
    { key: 'guardianship', label: 'Опека/попечительство' },
    { key: 'other',     label: 'Другое' },
  ],
  traffic: [
    { key: 'fine',       label: 'Штраф/постановление' },
    { key: 'accident',   label: 'ДТП/возмещение вреда' },
    { key: 'rights',     label: 'Лишение права управления' },
    { key: 'osago',      label: 'ОСАГО/КАСКО/выплаты' },
    { key: 'carDeal',    label: 'Купля-продажа авто/автосалоны' },
    { key: 'parking',    label: 'Эвакуация/парковка' },
    { key: 'other',      label: 'Другое' },
  ],
  inheritance: [
    { key: 'acceptance', label: 'Принятие наследства/сроки' },
    { key: 'will',       label: 'Завещание/оспаривание' },
    { key: 'share',      label: 'Обязательная/супружеская доля' },
    { key: 'division',   label: 'Споры между наследниками' },
    { key: 'other',      label: 'Другое' },
  ],
  land: [
    { key: 'boundaries', label: 'Межевание/границы/самозахват' },
    { key: 'cadastral',  label: 'Кадастровая стоимость/ошибки' },
    { key: 'easement',   label: 'Сервитут/проезд/проход' },
    { key: 'permits',    label: 'Самовольная постройка/узаконение' },
    { key: 'other',      label: 'Другое' },
  ],
  debt: [
    { key: 'loan',          label: 'Займ/расписка/долг' },
    { key: 'contractBreach',label: 'Нарушение договора/неустойка' },
    { key: 'pretrial',      label: 'Претензия/досудебный порядок' },
    { key: 'writ',          label: 'Судебный приказ/исковое' },
    { key: 'cession',       label: 'Уступка права требования' },
    { key: 'other',         label: 'Другое' },
  ],
  banking: [
    { key: 'credit',       label: 'Кредитный договор' },
    { key: 'collectors',   label: 'Коллекторы/взыскание' },
    { key: 'fraud',        label: 'Мошеннические списания/чарджбэк' },
    { key: 'insurance',    label: 'Навязанная страховка' },
    { key: 'creditHistory',label: 'Кредитная история/БКИ' },
    { key: 'other',        label: 'Другое' },
  ],
  exec: [
    { key: 'bailiffs',   label: 'Действия приставов/жалобы' },
    { key: 'arrest',     label: 'Арест счетов/имущества' },
    { key: 'installment',label: 'Отсрочка/рассрочка' },
    { key: 'termination',label: 'Окончание/возврат ИЛ' },
    { key: 'other',      label: 'Другое' },
  ],
  admin: [
    { key: 'protocol',   label: 'Протокол по КоАП/защита' },
    { key: 'appeal',     label: 'Обжалование постановления' },
    { key: 'inspection', label: 'Проверки госорганов' },
    { key: 'other',      label: 'Другое' },
  ],
  taxes: [
    { key: 'deductions',  label: 'Налоговые вычеты/3-НДФЛ' },
    { key: 'selfEmp',     label: 'Самозанятые/НПД' },
    { key: 'ip',          label: 'ИП/режимы налогообложения' },
    { key: 'claims',      label: 'Требования/штрафы ФНС' },
    { key: 'propertyTax', label: 'Имущественные налоги/льготы' },
    { key: 'other',       label: 'Другое' },
  ],
  other: [{ key: 'other', label: 'Другое' }],
};

/** Уточняющие вопросы (как ты прислал) */
const RAW_FOLLOWUPS: Record<string, Record<string, (string | QItem)[]>> = {
  labor: {
    dismissal: [
      { text: 'Кем инициировано увольнение?', mode: 'choice', options: ['Работник', 'Работодатель'] },
      { text: 'Имеется приказ/уведомление под подпись?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Соблюдены ли основания (статья ТК РФ)?', mode: 'choice', options: ['Да', 'Нет/сомневаюсь'] },
      'Дата события?',
    ],
    salary: [
      'Период и размер задолженности?',
      { text: 'Есть трудовой договор?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Выплаты производятся частично?', mode: 'choice', options: ['Полностью не платят', 'Частично платят'] },
      { text: 'Писали претензию/обращались в ГИТ?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    contract: [
      { text: 'Договор подписан?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Вид договора?', mode: 'choice', options: ['Бессрочный', 'Срочный', 'ГПХ/аутстафф'] },
      'Какие условия нарушены (оклад, функция, режим)?',
    ],
    vacation: [
      { text: 'Тип отпуска/отсутствия?', mode: 'choice', options: ['Ежегодный', 'Без содержания', 'Больничный'] },
      { text: 'Проблема?', mode: 'choice', options: ['Не предоставили', 'Не оплатили', 'Задержка оплаты'] },
      'Какие документы оформлялись?',
    ],
    discipline: [
      { text: 'Вид взыскания?', mode: 'choice', options: ['Замечание', 'Выговор', 'Увольнение'] },
      { text: 'Брали объяснение и издали приказ?', mode: 'choice', options: ['Да', 'Нет/затрудняюсь'] },
      'Есть доказательства проступка?',
    ],
    overtime: [
      { text: 'Что именно?', mode: 'choice', options: ['Сверхурочная', 'Ночная', 'Выходной/праздник'] },
      { text: 'Есть приказы/табели учета?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Оплата/отгулы предоставлялись?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    safety: [
      { text: 'Случай признан производственным (акт Н-1)?', mode: 'choice', options: ['Да', 'Нет/не знаю'] },
      'Имеются меддокументы/расследование?',
      'Предъявлялись требования к работодателю/ФСС?',
    ],
    transfer: [
      { text: 'Что изменили?', mode: 'choice', options: ['Функция', 'Место работы', 'Оплата труда', 'График'] },
      { text: 'Есть ваше письменное согласие?', mode: 'choice', options: ['Да', 'Нет'] },
      'Дата и основание перевода/изменения?',
    ],
    other: ['Опишите ситуацию кратко.'],
  },

  housing: {
    rent: [
      { text: 'Статус?', mode: 'choice', options: ['Наймодатель', 'Наниматель'] },
      { text: 'Есть письменный договор и акт приёма-передачи?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Суть спора?', mode: 'choice', options: ['Долг', 'Выселение', 'Порча имущества', 'Депозит', 'Иное'] },
    ],
    purchase: [
      { text: 'Тип сделки?', mode: 'choice', options: ['ДКП', 'Ипотека', 'Уступка', 'Новостройка (ДДУ)'] },
      { text: 'Документы в наличии?', mode: 'choice', options: ['ДКП/Расписка', 'Ипотечный договор', 'Не всё/сомневаюсь'] },
      { text: 'Нарушение?', mode: 'choice', options: ['Срыв сроков', 'Недостатки', 'Не выдают ПС/ключи', 'Иное'] },
    ],
    registration: [
      { text: 'Действие?', mode: 'choice', options: ['Регистрация', 'Снятие с учёта'] },
      'Кто собственник и есть ли согласие?',
      'Были ли отказы ранее?',
    ],
    neighbors: [
      { text: 'Характер проблемы?', mode: 'choice', options: ['Шум', 'Затопление', 'Запах', 'Угрозы/конфликт'] },
      { text: 'Фиксация обращений в УК/полицию?', mode: 'choice', options: ['Есть', 'Нет'] },
      'Есть ущерб имуществу/здоровью?',
    ],
    utilities: [
      { text: 'Что нарушено?', mode: 'choice', options: ['Перебои', 'Качество', 'Тарифы/начисления'] },
      { text: 'Акты/претензии есть?', mode: 'choice', options: ['Да', 'Нет'] },
      'Период проблемы и суммы?',
    ],
    construction: [
      { text: 'Договор и стадия?', mode: 'choice', options: ['ДДУ', 'ЖСК/ПЖСК', 'Ключи/сдача'] },
      { text: 'Нарушение?', mode: 'choice', options: ['Срок', 'Качество', 'Неустойка/штраф'] },
      'Экспертиза/расчёт неустойки делались?',
    ],
    hoa: [
      { text: 'Сфера?', mode: 'choice', options: ['Общее собрание', 'Начисления', 'Домовое имущество'] },
      'Есть протокол/реестр/уведомления?',
      'В чём нарушение процедуры/содержания?',
    ],
    other: ['Опишите ситуацию.'],
  },

  consumer: {
    return: [
      'Дата покупки и стоимость?',
      { text: 'Существенный недостаток?', mode: 'choice', options: ['Да', 'Нет/не уверен'] },
      { text: 'Чек/документы сохранены?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Претензия уже направлена?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    service: [
      { text: 'Тип услуги?', mode: 'choice', options: ['Ремонт', 'Связь', 'Образование', 'Иное'] },
      'Есть договор/акт/переписка, в чём нарушение?',
      { text: 'Требование к исполнителю?', mode: 'choice', options: ['Устранить', 'Вернуть деньги', 'Неустойка/штраф'] },
    ],
    online: [
      { text: 'Площадка?', mode: 'choice', options: ['Ozon', 'WB', 'Y.Market', 'Иное'] },
      { text: 'Статус проблемы?', mode: 'choice', options: ['Не доставили', 'Не тот товар', 'Брак', 'Отказ в возврате'] },
      'Есть переписка/ответ поддержки?',
    ],
    warranty: [
      'Срок эксплуатации и характер поломки?',
      { text: 'Результат диагностики/ответ СЦ?', mode: 'choice', options: ['Отказ', 'Приняли', 'Нет ответа'] },
      { text: 'Требование?', mode: 'choice', options: ['Ремонт', 'Замена', 'Возврат денег', 'Неустойка'] },
    ],
    digital: [
      { text: 'Тип цифрового товара?', mode: 'choice', options: ['Подписка', 'ПО/лицензия', 'Игра/контент'] },
      { text: 'Нарушение?', mode: 'choice', options: ['Автосписание', 'Нет доступа', 'Некачественный сервис'] },
      'Есть оферта/переписка с поддержкой?',
    ],
    travel: [
      { text: 'Проблема?', mode: 'choice', options: ['Отмена', 'Перенос', 'Некачественная услуга'] },
      'Даты/стоимость и документы?',
      { text: 'Требование заявлялось?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    other: ['Опишите ситуацию.'],
  },

  family: {
    divorce: [
      { text: 'Есть несовершеннолетние дети?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Согласие сторон на развод?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Споры по имуществу/алименты будут?', mode: 'choice', options: ['Да', 'Нет/пока неизвестно'] },
    ],
    alimony: [
      { text: 'Есть решение/соглашение?', mode: 'choice', options: ['Судебное', 'Нотариальное', 'Нет'] },
      'Размер (доля/сумма) и задолженность?',
      { text: 'ФССП ведёт производство?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    children: [
      { text: 'Предмет спора?', mode: 'choice', options: ['Место жительства', 'Порядок общения', 'Опека'] },
      { text: 'Идёт суд/есть заключение ООП?', mode: 'choice', options: ['Да', 'Нет'] },
      'Есть характеристики/мед.справки/иные доказательства?',
    ],
    property: [
      'Состав совместного имущества и даты приобретения?',
      { text: 'Есть брачный договор?', mode: 'choice', options: ['Да', 'Нет'] },
      'Ипотека/кредиты/оценка — уточните.',
    ],
    paternity: [
      { text: 'Вопрос?', mode: 'choice', options: ['Установление', 'Оспаривание'] },
      { text: 'ДНК-исследование?', mode: 'choice', options: ['Планируется', 'Проводилось', 'Нет/затрудняюсь'] },
      'Запись об отце в акте есть/нет?',
    ],
    guardianship: [
      { text: 'Форма?', mode: 'choice', options: ['Опека', 'Попечительство'] },
      { text: 'Заключение ООП?', mode: 'choice', options: ['Есть', 'Нет'] },
      'Есть возражения родственников?',
    ],
    other: ['Опишите ситуацию.'],
  },

  traffic: {
    fine: [
      'Статья/дата постановления?',
      { text: 'Срок обжалования не истёк?', mode: 'choice', options: ['Да', 'Нет/сомневаюсь'] },
      { text: 'Доказательства есть?', mode: 'choice', options: ['Видео/фото', 'Свидетели', 'Нет'] },
    ],
    accident: [
      { text: 'Кто признан виновным?', mode: 'choice', options: ['Я', 'Вторая сторона', 'Не определено'] },
      { text: 'ОСАГО у сторон?', mode: 'choice', options: ['У всех', 'У кого-то нет', 'Не знаю'] },
      'Размер ущерба/экспертиза?',
    ],
    rights: [
      'Статья лишения и дата протокола?',
      { text: 'Дело уже в суде?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Есть процессуальные нарушения?', mode: 'choice', options: ['Есть', 'Нет/не уверен'] },
    ],
    osago: [
      { text: 'Проблема?', mode: 'choice', options: ['Отказ', 'Занижение', 'Затягивание'] },
      'Номер дела/выплаты и расчёты/экспертизы?',
      { text: 'Претензия направлена?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    carDeal: [
      { text: 'Тип сделки?', mode: 'choice', options: ['ДКП', 'Трейд-ин', 'Кредит', 'Гарантия'] },
      { text: 'Недостатки/дефекты/ПТС?', mode: 'choice', options: ['Есть', 'Нет/не знаю'] },
      'Заявлялось требование продавцу? Ответ?',
    ],
    parking: [
      { text: 'Ситуация?', mode: 'choice', options: ['Эвакуация', 'Штраф', 'Повреждение'] },
      { text: 'Документы/фото есть?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Сроки обжалования не пропущены?', mode: 'choice', options: ['Да', 'Нет/не уверен'] },
    ],
    other: ['Опишите ситуацию.'],
  },

  inheritance: {
    acceptance: [
      'Дата открытия наследства?',
      { text: 'Срок (6 мес.) пропущен?', mode: 'choice', options: ['Да', 'Нет', 'Частично/сомневаюсь'] },
      'Состав наследства и наследники?',
    ],
    will: [
      { text: 'Документ?', mode: 'choice', options: ['Завещание', 'Совместное завещание', 'Наследственный договор'] },
      { text: 'Основание оспаривания?', mode: 'choice', options: ['Недееспособность', 'Давление', 'Формальные нарушения', 'Иное'] },
      'Какие доказательства имеются?',
    ],
    share: [
      { text: 'Кто претендует?', mode: 'choice', options: ['Нетрудоспособный', 'Супруг(а)', 'Иное лицо'] },
      'Состав и режим имущества?',
      'Споры о фактическом принятии?',
    ],
    division: [
      'Объекты и стоимость?',
      'Позиции наследников/были договорённости?',
      'Проводилась оценка/опись?',
    ],
    other: ['Опишите ситуацию.'],
  },

  land: {
    boundaries: [
      { text: 'Предмет?', mode: 'choice', options: ['Межа', 'Площадь', 'Самозахват'] },
      { text: 'Документы?', mode: 'choice', options: ['Межевой план', 'ЕГРН', 'Акты согласования', 'Нет'] },
      'Была кадастровая съёмка/экспертиза?',
    ],
    cadastral: [
      { text: 'Спор о чём?', mode: 'choice', options: ['Ошибка', 'Величина стоимости'] },
      'Дата определения/отчёт оценщика?',
      { text: 'Обращались в комиссию при Росреестре?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    easement: [
      { text: 'Нужен проход/проезд/коммуникации?', mode: 'choice', options: ['Проход', 'Проезд', 'Коммуникации'] },
      { text: 'Отказ собственника?', mode: 'choice', options: ['Есть', 'Нет/не обращались'] },
      'Были переговоры/оценка платы?',
    ],
    permits: [
      { text: 'Объект?', mode: 'choice', options: ['Самострой', 'Реконструкция', 'Иное'] },
      { text: 'Разрешение/уведомление?', mode: 'choice', options: ['Есть', 'Нет'] },
      'Что хотите: узаконить/снести/узаконить реконструкцию?',
    ],
    other: ['Опишите ситуацию.'],
  },

  debt: {
    loan: [
      { text: 'Документ?', mode: 'choice', options: ['Расписка', 'Договор займа', 'Нет'] },
      'Сумма и дата возврата?',
      { text: 'Были платежи/переписка?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    contractBreach: [
      { text: 'Тип договора?', mode: 'choice', options: ['Подряд', 'Поставка', 'Услуги', 'Аренда', 'Иное'] },
      'В чём нарушение и доказательства?',
      'Претензия направлена? Срок исполнения?',
    ],
    pretrial: [
      { text: 'Претензия направлена?', mode: 'choice', options: ['Да', 'Нет'] },
      'Какие требования и расчёт суммы?',
      'Есть доказательства направления (почта/ЭДО)?',
    ],
    writ: [
      { text: 'Формат?', mode: 'choice', options: ['Судебный приказ', 'Иск'] },
      { text: 'Основания для отмены приказа?', mode: 'choice', options: ['Есть', 'Нет/не знаю'] },
      'Подведомственность/подсудность определены?',
    ],
    cession: [
      { text: 'Сделка?', mode: 'choice', options: ['Уступка', 'Суброгация'] },
      'Должник уведомлён? Возражает?',
      'Переходили ли обеспечительные меры/залог?',
    ],
    other: ['Опишите ситуацию.'],
  },

  banking: {
    credit: [
      { text: 'Тип кредита?', mode: 'choice', options: ['Потребительский', 'Ипотека', 'Карта'] },
      { text: 'Спор?', mode: 'choice', options: ['Проценты/комиссии', 'График/досрочное', 'Иное'] },
      'Есть переписка/претензия/ответ банка?',
    ],
    collectors: [
      { text: 'Кто взыскатель?', mode: 'choice', options: ['Банк', 'МФО', 'Коллекторы'] },
      { text: 'Нарушают 230-ФЗ?', mode: 'choice', options: ['Да', 'Нет/не уверен'] },
      'Есть записи звонков/жалобы?',
    ],
    fraud: [
      { text: 'Тип списания?', mode: 'choice', options: ['Перевод', 'Покупка', 'Снятие наличных'] },
      'Дата события и заявления в банк/полицию?',
      { text: 'Чарджбэк инициирован?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    insurance: [
      { text: 'Какая услуга?', mode: 'choice', options: ['Страхование жизни', 'Фин.защита', 'Иное'] },
      { text: 'Обращались в «период охлаждения»?', mode: 'choice', options: ['Да', 'Нет', 'Просрочен'] },
      'Ответ банка/страховщика?',
    ],
    creditHistory: [
      { text: 'Есть отчёт БКИ?', mode: 'choice', options: ['Да', 'Нет'] },
      'Какую запись оспариваете и последствия?',
      'Писали в банк/БКИ? Ответ имеется?',
    ],
    other: ['Опишите ситуацию.'],
  },

  exec: {
    bailiffs: [
      'Номер ИП и основание?',
      { text: 'Нарушение приставов?', mode: 'choice', options: ['Бездействие', 'Незаконные действия'] },
      'Жалобы/ходатайства подавались? Ответы?',
    ],
    arrest: [
      { text: 'Что арестовано?', mode: 'choice', options: ['Счета', 'Зарплата', 'Имущество', 'Запрет выезда'] },
      { text: 'Есть соцвыплаты/минимальный доход?', mode: 'choice', options: ['Да', 'Нет'] },
      { text: 'Требование?', mode: 'choice', options: ['Снять арест', 'Снять частично'] },
    ],
    installment: [
      'Сумма долга и доходы?',
      { text: 'Что нужно?', mode: 'choice', options: ['Отсрочка', 'Рассрочка'] },
      'Предлагали график/доказывали тяжёлое положение?',
    ],
    termination: [
      { text: 'Что произошло?', mode: 'choice', options: ['Окончание ИП', 'Возврат ИЛ'] },
      { text: 'Основание?', mode: 'choice', options: ['Оплата долга', 'Не найден должник', 'Истёк срок', 'Иное'] },
      'Нужно оспорить или вернуть ИЛ?',
    ],
    other: ['Опишите ситуацию.'],
  },

  admin: {
    protocol: [
      'Статья КоАП/постановление и дата?',
      { text: 'Процедура соблюдена?', mode: 'choice', options: ['Да', 'Нет/сомневаюсь'] },
      { text: 'Доказательства невиновности?', mode: 'choice', options: ['Есть', 'Нет'] },
    ],
    appeal: [
      'Дата получения постановления?',
      { text: 'Срок на обжалование?', mode: 'choice', options: ['Не истёк', 'Истёк/не уверен'] },
      'Какие доводы и документы прилагаете?',
    ],
    inspection: [
      { text: 'Орган и предмет проверки?', mode: 'choice', options: ['Роспотребнадзор', 'Трудовая', 'Прокуратура', 'Иное'] },
      'Есть акты/предписания/протоколы?',
      'Что оспаривается (результаты/сроки/штраф)?',
    ],
    other: ['Опишите ситуацию.'],
  },

  taxes: {
    deductions: [
      { text: 'Вид вычета?', mode: 'choice', options: ['Имущественный', 'Социальный', 'Инвестиционный'] },
      'Период, суммы и подтверждающие документы?',
      { text: '3-НДФЛ уже подавали?', mode: 'choice', options: ['Да', 'Нет'] },
    ],
    selfEmp: [
      'Регион и доходы?',
      { text: 'Проблема?', mode: 'choice', options: ['Начисления', 'Штрафы', 'Блокировка'] },
      'Переписка с ФНС/«Мой налог» есть?',
    ],
    ip: [
      { text: 'Режим?', mode: 'choice', options: ['УСН', 'ОСН', 'ПСН'] },
      { text: 'Спор?', mode: 'choice', options: ['Камеральная', 'Доначисления', 'ККТ/касса'] },
      'Решения ФНС/документы приложите.',
    ],
    claims: [
      { text: 'Требование/штраф ФНС?', mode: 'choice', options: ['Есть', 'Нет (проект)'] },
      { text: 'Нужна рассрочка/отсрочка?', mode: 'choice', options: ['Да', 'Нет'] },
      'Возражения поданы/сроки?',
    ],
    propertyTax: [
      { text: 'Какой налог?', mode: 'choice', options: ['Земля', 'Транспорт', 'Недвижимость'] },
      'Период и основание спора (льгота/ставка/база)?',
      'Обращались в ИФНС/МФЦ, ответы есть?',
    ],
    other: ['Опишите ситуацию.'],
  },

  other: { other: ['Опишите проблему и желаемый результат.'] },
};

/** Нормализация: строка → QItem(input) */
function norm(items?: (string | QItem)[]): QItem[] {
  if (!items) return [];
  return items.map((it) =>
    typeof it === 'string'
      ? { text: it, mode: 'input' as const }
      : ({ text: it.text, mode: it.mode ?? 'input', options: it.options })
  );
}

export default function AssistantPage() {
  const [phase, setPhase] = useState<Phase>('root');
  const [selectedRoot, setSelectedRoot] = useState<string>('');
  const [selectedSub,  setSelectedSub]  = useState<string>('');

  const [followupIdx, setFollowupIdx] = useState<number>(0);
  const [followupAnswers, setFollowupAnswers] = useState<string[]>([]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState<boolean>(false);

  const boxRef = useRef<HTMLDivElement>(null);

  // ?id= для дебага
  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  // Telegram WebApp init
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // Проверка подписки
  useEffect(() => {
    (async () => {
      try {
        const w: any = window;
        const initData: string | undefined = w?.Telegram?.WebApp?.initData;

        const res = await fetch(`/api/me${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
          cache: 'no-store',
        });
        const data = await res.json();
        setIsPro(Boolean(data?.subscription?.active));
      } catch { setIsPro(false); }
    })();
  }, [tgId]);

  // Автоскролл
  useEffect(() => {
    boxRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
  }, [messages]);

  // Текущий набор уточняющих
  const followupQuestions = useMemo<QItem[]>(() => {
    if (!selectedRoot || !selectedSub) return [];
    return norm(RAW_FOLLOWUPS[selectedRoot]?.[selectedSub]);
  }, [selectedRoot, selectedSub]);

  // Навигация
  function startSub(rootKey: string) {
    setSelectedRoot(rootKey);
    setSelectedSub('');
    setFollowupIdx(0);
    setFollowupAnswers([]);
    setMessages([]);
    setPhase('sub');
  }

  function followupQuestionsFor(root: string, sub: string): QItem[] {
    return norm(RAW_FOLLOWUPS[root]?.[sub]);
  }

  function chooseSub(subKey: string) {
    setSelectedSub(subKey);
    setFollowupIdx(0);
    setFollowupAnswers([]);
    setMessages([]);

    const q = followupQuestionsFor(selectedRoot, subKey); // фикс: НИКАКИХ rootKey = selectedRoot
    if (q.length > 0) {
      setMessages([{ role: 'assistant', content: q[0].text }]);
      setPhase('chat');
    } else {
      setMessages([{ role: 'assistant', content: 'Опишите вашу ситуацию.' }]);
      setPhase('chat');
    }
  }

  // Paywall (без бесплатных ответов)
  function showPaywall() {
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        content:
          'Ответ подготовлен. Чтобы увидеть его целиком и получить пошаговые действия, ' +
          'оформите подписку Juristum Pro.',
      },
    ]);
  }

  // Отправка (уточняющие → затем ИИ; без Pro — пейволл)
  async function send(userText: string) {
    const prompt = userText.trim();
    if (!prompt || loading) return;

    setMessages((m) => [...m, { role: 'user', content: prompt }]);

    // Ещё есть уточняющие?
    if (followupIdx < followupQuestions.length) {
      setFollowupAnswers((a) => {
        const next = [...a];
        next[followupIdx] = prompt;
        return next;
      });

      const nextIdx = followupIdx + 1;
      if (nextIdx < followupQuestions.length) {
        setFollowupIdx(nextIdx);
        setMessages((m) => [...m, { role: 'assistant', content: followupQuestions[nextIdx].text }]);
        return;
      }

      // Уточнения закончились
      setFollowupIdx(nextIdx);
      if (!isPro) { showPaywall(); return; }
      await askAIWithContext();
      return;
    }

    // Обычный чат
    if (!isPro) { showPaywall(); return; }
    await askAIWithContext(prompt);
  }

  async function askAIWithContext(optionalUserMessage?: string) {
    setLoading(true);
    try {
      const qaPairs =
        followupQuestions.length > 0
          ? followupQuestions.map((q, i) => `• ${q.text} — ${followupAnswers[i] ?? ''}`).join('\n')
          : '';

      const systemContext =
        `Категории: root=${selectedRoot || '—'}, sub=${selectedSub || '—'}.\n` +
        (qaPairs ? `Уточняющие:\n${qaPairs}\n` : '');

      const history: Msg[] = [
        { role: 'user', content: systemContext },
        ...messages.slice(-8),
      ];
      if (optionalUserMessage) history.push({ role: 'user', content: optionalUserMessage });

      const res = await fetch(`/api/assistant/ask${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: optionalUserMessage ?? 'Сформируй разбор и пошаговые действия.', history }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        const err = data?.error || `HTTP_${res.status}`;
        setMessages((m) => [...m, { role: 'assistant', content: `Ошибка: ${err}. Попробуйте ещё раз.` }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Сбой сети. Попробуйте ещё раз.' }]);
    } finally {
      setLoading(false);
    }
  }

  // Быстрый выбор (для mode:'choice')
  function chooseOption(opt: string) {
    void send(opt);
  }

  // Отправка из поля ввода
  function onSend() {
    const val = input.trim();
    if (!val) return;
    setInput('');
    void send(val);
  }

  // Назад
  function goBack() {
    if (phase === 'sub') {
      setPhase('root');
      setSelectedRoot('');
      setSelectedSub('');
      setFollowupIdx(0);
      setFollowupAnswers([]);
      setMessages([]);
      return;
    }
    if (phase === 'chat') {
      if (followupIdx > 0 && followupIdx <= followupQuestions.length) {
        setMessages((m) => {
          const mm = [...m];
          // чаще всего последний ассистент — текущий вопрос → уберём
          if (mm.length && mm[mm.length - 1]?.role === 'assistant') mm.pop();
          return mm;
        });
        setFollowupIdx((i) => Math.max(0, i - 1));
        return;
      }
      setPhase('sub');
      setMessages([]);
      setFollowupIdx(0);
      setFollowupAnswers([]);
      return;
    }
  }

  // Текущий уточняющий (для кнопок выбора)
  const currentQ: QItem | undefined =
    phase === 'chat' && followupIdx < followupQuestions.length
      ? followupQuestions[followupIdx]
      : undefined;

  const choiceModeActive = Boolean(currentQ && currentQ.mode === 'choice' && currentQ.options?.length);

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Юридический ассистент</h1>

      {phase !== 'root' && (
        <div style={{ marginTop: 8 }}>
          <button onClick={goBack} className="list-btn" style={{ ...COMPACT_BTN_STYLE, maxWidth: 140 }}>
            ← Назад
          </button>
        </div>
      )}

      {/* Этап 1: категории */}
      {phase === 'root' && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {ROOT_TOPICS.map((t) => (
            <button
              key={t.key}
              className="list-btn"
              onClick={() => startSub(t.key)}
              style={{ ...COMPACT_BTN_STYLE }}
            >
              <span className="list-btn__left"><b>{t.label}</b></span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>
      )}

      {/* Этап 2: подкатегории */}
      {phase === 'sub' && selectedRoot && (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {SUB_TOPICS[selectedRoot].map((s) => (
            <button
              key={s.key}
              className="list-btn"
              onClick={() => chooseSub(s.key)}
              style={{ ...COMPACT_BTN_STYLE }}
            >
              <span className="list-btn__left"><b>{s.label}</b></span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </button>
          ))}
        </div>
      )}

      {/* Этап 3: чат */}
      {phase === 'chat' && (
        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            display: 'flex',
            flexDirection: 'column',
            height: '65vh'
          }}
        >
          <div ref={boxRef} style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ opacity: .6, fontSize: 12, marginBottom: 4 }}>
                  {m.role === 'user' ? 'Вы' : 'Ассистент'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14 }}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ opacity: .6, fontSize: 14 }}>Думаю…</div>}
          </div>

          {/* Кнопки выбора для вопросов с фиксированными вариантами */}
          {choiceModeActive ? (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {currentQ!.options!.map((opt) => (
                <button
                  key={opt}
                  onClick={() => chooseOption(opt)}
                  className="list-btn"
                  style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13 }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : null}

          <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (!choiceModeActive && e.key === 'Enter' ? onSend() : null)}
                placeholder={choiceModeActive ? 'Выберите вариант выше' : 'Сообщение…'}
                disabled={choiceModeActive}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14, opacity: choiceModeActive ? 0.6 : 1
                }}
              />
              <button
                onClick={onSend}
                disabled={choiceModeActive || loading || !input.trim()}
                className="list-btn"
                style={{ padding: '0 16px' }}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 12 }} />
    </main>
  );
}
