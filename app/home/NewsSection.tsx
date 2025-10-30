'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { NewsItem } from './news';

type Props = {
  locale: 'ru' | 'en';     // для заголовков
  items: NewsItem[];       // уже отфильтрованные новости
};

export default function NewsSection({ locale, items }: Props) {
  const t = {
    title: locale === 'en' ? 'News & promos' : 'Новости и акции',
    more:  locale === 'en' ? 'All news' : 'Все новости',
  };

  return (
    <section className="news">
      <div className="news__head">
        <h2 className="news__title">{t.title}</h2>
        <Link href="/news" className="news__more">{t.more} ›</Link>
      </div>

      <div className="news__list" role="list">
        {items.map(item => (
          <Link key={item.id} href={item.href as Route} className="news-card" role="listitem">
            <div className="news-card__media">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 75vw, 320px"
                priority={false}
                style={{ objectFit: 'cover' }}
              />
              {item.tag ? <span className="news-card__tag">{item.tag}</span> : null}
            </div>
            <div className="news-card__body">
              <div className="news-card__title">{item.title}</div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        /* ---------- Новости ---------- */
        .news { margin: 26px auto 10px; max-width: 980px; padding: 0 10px; }
        .news__head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin: 0 2px 10px; }
        .news__title { margin:0; font-size: 18px; opacity:.95; }
        .news__more { font-size: 13px; opacity:.8; text-decoration:none; }

        .news__list {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 80%;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 2px;
        }
        .news-card {
          position: relative;
          display: grid;
          grid-template-rows: 160px auto;
          border-radius: 14px;
          overflow: hidden;
          min-height: 220px;
          background: #0f1320;
          border: 1px solid rgba(255,255,255,.06);
          text-decoration: none;
          color: inherit;
          scroll-snap-align: start;
        }
        .news-card__media { position: relative; height: 160px; }
        .news-card__tag {
          position: absolute; left: 10px; top: 10px;
          padding: 4px 8px; border-radius: 10px;
          background: rgba(120,170,255,.22);
          border: 1px solid rgba(120,170,255,.35);
          font-size: 12px; white-space: nowrap;
          backdrop-filter: blur(2px);
        }
        .news-card__body { padding: 10px 12px; display:flex; align-items:center; }
        .news-card__title { font-weight: 700; line-height: 1.25; }

        @media (min-width: 760px) {
          .news__list {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            grid-template-columns: repeat(3, minmax(0,1fr));
            overflow: visible;
          }
          .news-card { grid-template-rows: 180px auto; min-height: 230px; }
        }
        @media (min-width: 1000px) {
          .news__list { grid-template-columns: repeat(4, minmax(0,1fr)); }
        }
      `}</style>
    </section>
  );
}
