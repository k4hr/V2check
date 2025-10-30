/* path: app/home/news.tsx */

export type NewsItem = {
  id: string;
  title: string;
  tag?: string;
  image: string;
  href: string;
  locale?: 'ru' | 'en';
};

export const NEWS: NewsItem[] = [
  {
    id: 'sale-pro',
    title: 'Скидки на подписку',     // ← укоротил текст
    tag: '-70%',
    image: '/news/pro-sale.jpg',
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
];
