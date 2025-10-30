/* path: app/home/news-section.tsx */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import type { NewsItem } from './news';

type Props = {
  locale: 'ru' | 'en';
  items: NewsItem[];
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
        {items.map((item) => (
          <Link key={item.id} href={item.href as Route} className="news-card" role="listitem">
            <div className="media-frame">
              <div className="news-card__media">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 980px) 33vw, 320px"
                  priority={false}
                  style={{ objectFit: 'cover' }}
                />
                {item.tag ? <span className="news-card__tag">{item.tag}</span> : null}
                <span className="ring" aria-hidden />
                <span className="shine" aria-hidden />
              </div>
            </div>

            <div className="news-card__body">
              <div className="news-card__title" title={item.title}>
                {item.title}
              </div>
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
          grid-auto-columns: 82%;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 2px 2px 4px;
        }

        .news-card {
          position: relative;
          display: grid;
          grid-template-rows: auto auto;
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          background: #0f1320;
          border: 1px solid rgba(255,255,255,.06);
          box-shadow: 0 10px 26px rgba(0,0,0,.35);
          scroll-snap-align: start;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .news-card:active { transform: translateY(1px) scale(.995); }
        .news-card:hover { box-shadow: 0 16px 36px rgba(0,0,0,.45); }

        .media-frame {
          padding: 8px;
          border-radius: 16px 16px 12px 12px;
          background: radial-gradient(120% 140% at 8% 0%, rgba(76,130,255,.10), rgba(255,255,255,.03));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
        }

        /* 16:9 обложка */
        .news-card__media {
          position: relative;
          aspect-ratio: 16 / 9;
          width: 100%;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 8px 22px rgba(0,0,0,.35);
          transform: translateZ(0);
        }
        .ring { position:absolute; inset:0; border-radius:12px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
        .shine { position:absolute; left:0; right:0; top:0; height:40%; background: linear-gradient(to bottom, rgba(255,255,255,.12), rgba(255,255,255,0)); pointer-events:none; }

        .news-card__tag {
          position: absolute; left: 10px; top: 10px;
          padding: 4px 8px; border-radius: 10px;
          background: rgba(120,170,255,.22);
          border: 1px solid rgba(120,170,255,.35);
          font-size: 12px; white-space: nowrap;
          backdrop-filter: blur(2px);
        }

        /* Подпись: одна строка, рамка+тень */
        .news-card__body {
          padding: 10px 12px 12px;
          display:flex; align-items:center;
        }
        .news-card__title {
          display: inline-block;
          max-width: 100%;
          padding: 6px 10px;
          border-radius: 10px;
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.10);
          box-shadow:
            0 4px 16px rgba(0,0,0,.30),
            inset 0 0 0 1px rgba(255,255,255,.03);
          font-weight: 700;
          font-size: 14px;            /* меньше, чтобы помещалось */
          line-height: 1;
          white-space: nowrap;         /* одна строка */
          overflow: hidden;
          text-overflow: ellipsis;     /* эллипсис если совсем узко */
          letter-spacing: .1px;
        }

        @media (min-width: 760px) {
          .news__list {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            grid-template-columns: repeat(3, minmax(0,1fr));
            overflow: visible;
          }
        }
        @media (min-width: 1000px) {
          .news__list { grid-template-columns: repeat(4, minmax(0,1fr)); }
        }
      `}</style>
    </section>
  );
}
