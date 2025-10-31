/* path: app/home/news.tsx */

export type NewsItem = {
  id: string;
  title: string;
  tag?: string;        // бейдж: "-70%", "Розыгрыш", "Апдейт"
  image: string;       // путь из /public или абсолютный URL
  href: string;        // внутренняя или внешняя ссылка
  locale?: 'ru' | 'en';
};

// Единый список карточек новостей.
// Картинки положи в /public/news/ с заданными именами.
export const NEWS: NewsItem[] = [
  {
    id: 'sale-pro',
    title: 'Скидки на подписку',
    tag: '-70%',
    image: '/news/pro-sale.jpg',
    href: '/pro',
  },
  {
    id: 'giveaway',
    title: 'Розыгрыш подписок',
    tag: 'Розыгрыш',
    image: '/news/giveaway.jpg',
    href: '/home/game', // внутренний путь
  },
];

// Опционально: фильтр по локали
export function getNewsForLocale(locale: 'ru' | 'en'): NewsItem[] {
  return NEWS.filter(n => !n.locale || n.locale === locale);
}
