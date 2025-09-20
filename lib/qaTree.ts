// lib/qaTree.ts
export type QAOption = string;
export type Followup =
  | { id: string; label: string; type: 'single'; options: QAOption[] }
  | { id: string; label: string; type: 'text' };

export type Subcategory = { id: string; title: string };
export type Category = {
  id: string;
  title: string;
  examples?: string[];
  sub: Subcategory[];
  followups: Followup[];
};

export type QATree = {
  version: number;
  freeDailyLimit: number;
  categories: Category[];
  promptTemplate: string;
};

export const qaTree: QATree = {
  version: 2,
  freeDailyLimit: 2,
  categories: [
    {
      id: 'labor',
      title: 'Трудовые вопросы',
      examples: ['увольнение', 'зарплата', 'отпуск/больничный'],
      sub: [
        { id: 'dismissal', title: 'Увольнение' },
        { id: 'wages', title: 'Зарплата/задержка' },
        { id: 'vacation', title: 'Отпуск/больничный' },
        { id: 'contract', title: 'Договор/штрафы/дисциплина' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'role', label: 'Вы работник или работодатель?', type: 'single', options: ['Работник','Работодатель'] },
        { id: 'dates', label: 'Ключевые даты (приказ/уведомление/выплаты)?', type: 'text' },
        { id: 'docs', label: 'Есть документы/переписка?', type: 'single', options: ['Да','Нет'] }
      ]
    },
    {
      id: 'housing',
      title: 'Жильё и недвижимость',
      examples: ['аренда', 'покупка', 'ЖКХ/соседи', 'наследство'],
      sub: [
        { id: 'rent', title: 'Аренда (найм)' },
        { id: 'buy_sell', title: 'Купля-продажа' },
        { id: 'inheritance', title: 'Наследство' },
        { id: 'hoa', title: 'ЖКХ/соседи/ТСЖ' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'side', label: 'Вы арендатор/арендодатель/собственник/покупатель/продавец?', type: 'single',
          options: ['Арендатор','Арендодатель','Собственник','Покупатель','Продавец'] },
        { id: 'subject', label: 'О чём спор в двух словах?', type: 'text' },
        { id: 'dates', label: 'Есть ли важные сроки/даты?', type: 'text' }
      ]
    },
    {
      id: 'family',
      title: 'Семейные отношения',
      examples: ['развод', 'алименты', 'дети', 'имущество'],
      sub: [
        { id: 'divorce', title: 'Брак/развод' },
        { id: 'alimony', title: 'Алименты' },
        { id: 'children', title: 'Опека/место жительства ребёнка' },
        { id: 'property', title: 'Имущество супругов' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'children_count', label: 'Есть ли дети? Сколько и возраст?', type: 'text' },
        { id: 'marriage_status', label: 'Брак зарегистрирован сейчас?', type: 'single', options: ['Да','Нет'] },
        { id: 'agreements', label: 'Есть соглашения/решения суда?', type: 'single', options: ['Да','Нет'] }
      ]
    },
    {
      id: 'debts',
      title: 'Долги и кредиты',
      examples: ['банк', 'МФО', 'коллекторы', 'банкротство'],
      sub: [
        { id: 'bank', title: 'Банковский кредит' },
        { id: 'mfo', title: 'МФО/займы' },
        { id: 'collectors', title: 'Коллекторы/взыскание' },
        { id: 'bankruptcy', title: 'Банкротство (физ/ИП)' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'amount', label: 'Примерная сумма долга?', type: 'text' },
        { id: 'overdue', label: 'Есть просрочка? Сколько дней?', type: 'text' },
        { id: 'claims', label: 'Были письма/иски/исп.листы?', type: 'single', options: ['Да','Нет','Не знаю'] }
      ]
    },
    {
      id: 'court',
      title: 'Штрафы, суды, уголовные дела',
      examples: ['ГИБДД', 'админштраф', 'уголовное', 'гражданский иск'],
      sub: [
        { id: 'fines', title: 'Штрафы (ГИБДД/иные)' },
        { id: 'admin', title: 'Административное дело' },
        { id: 'criminal', title: 'Уголовное преследование' },
        { id: 'civil', title: 'Гражданский иск/суд' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'stage', label: 'Стадия: проверка/следствие/суд/исполнение?', type: 'text' },
        { id: 'articles', label: 'Какие статьи/КоАП/УК фигурируют?', type: 'text' },
        { id: 'deadline', label: 'Есть сроки обжалования/оплаты?', type: 'text' }
      ]
    },
    {
      id: 'consumers',
      title: 'Права потребителя',
      examples: ['возврат товара', 'онлайн-покупка', 'сервис некачественный'],
      sub: [
        { id: 'returns', title: 'Возврат/обмен товара' },
        { id: 'online', title: 'Интернет-магазин/маркетплейс' },
        { id: 'services', title: 'Некачественные услуги/работы' },
        { id: 'warranty', title: 'Гарантия/ремонт/СЦ' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'purchase_date', label: 'Когда покупали/заказывали?', type: 'text' },
        { id: 'defect', label: 'В чём претензия/дефект? Кратко', type: 'text' },
        { id: 'seller_response', label: 'Обращались к продавцу/поддержку? Ответ?', type: 'text' }
      ]
    },
    {
      id: 'auto',
      title: 'Авто и ДТП',
      examples: ['ДТП', 'ОСАГО/КАСКО', 'штрафы', 'каршеринг'],
      sub: [
        { id: 'accident', title: 'ДТП/оформление/выплаты' },
        { id: 'insurance', title: 'ОСАГО/КАСКО спор' },
        { id: 'fines', title: 'Штрафы/камера/оспаривание' },
        { id: 'carsharing', title: 'Каршеринг/штрафы/ущерб' },
        { id: 'other', title: 'Другое (опишу сам)' }
      ],
      followups: [
        { id: 'date_place', label: 'Дата и место события?', type: 'text' },
        { id: 'participants', label: 'Кто участвовал (вы/другие авто/пешеход)?', type: 'text' },
        { id: 'insurance_state', label: 'Страховая и этап (заявление/выплата/отказ)?', type: 'text' }
      ]
    }
  ],
  promptTemplate:
    'Ты — юридический ассистент РФ. Дай пошаговый, конкретный план действий: что сделать сегодня/на этой неделе, ' +
    'какие документы/заявления/сроки. Если уместно — укажи нормы (КоАП/ГК/ТК/СК/ЖК/УК) кратко. ' +
    'Категория: {{categoryTitle}} → Подкатегория: {{subcategoryTitle}}. ' +
    'Анкета: {{followups}}. Описание пользователя: {{userText}}. ' +
    'Кратко, без канцеляризмов, с предупреждением о рисках и сроках.'
};
