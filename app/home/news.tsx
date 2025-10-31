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
    title: 'Супер розыгрыш',
    tag: 'Розыгрыш',
    image: '/news/giveaway.jpg',
    href: '/app/home/game',
  },
  {
