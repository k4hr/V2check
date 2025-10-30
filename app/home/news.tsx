// app/home/news.tsx

// Общий тип карточки новости
export type NewsItem = {
  id: string;                // любой уникальный id
  title: string;             // заголовок
  tag?: string;              // бейдж: "-70%", "Розыгрыш", "Апдейт"
  image: string;             // public-путь или абсолютный URL
  href: string;              // ссылка (внутренняя/внешняя)
  locale?: 'ru' | 'en';      // ограничить показ по локали (не обязательно)
};

// Единый источник правды: правим только этот массив
export const NEWS: NewsItem[] = [
  {
    id: 'sale-pro',
    title: 'Скидки на подписку Pro / Pro+',
    tag: '-70%',
    image: '/news/pro-sale.jpg',   // помести картинку в /public/news/
    href: '/pro',
  },
  {
    id: 'giveaway',
    title: 'Розыгрыш трёх Pro+ на месяц',
    tag: 'Розыгрыш',
    image: '/news/giveaway.jpg',
    href: '/news/giveaway',
  },
  {
    id: 'update-yookassa',
    title: 'Обновление: оплата картой (ЮKassa)',
    tag: 'Апдейт',
    image: '/news/yookassa.jpg',
    href: '/changelog#payments',
  },
  // примеры локализованных карточек:
  // { id: 'en-welcome', title: 'Welcome offer', tag: '-50%', image: '/news/en-offer.jpg', href: '/pro', locale: 'en' },
];
