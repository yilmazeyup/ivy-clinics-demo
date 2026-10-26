import { PRODUCTS, type ProductId } from '@pure-ivy/shared';
import type { CSSProperties } from 'react';

import { orderTotal, ordersUntil, stockOf, type Order } from '../data/shop';
import { Accent, useI18n } from '../i18n';
import { CardHead } from './ui';

/** Today's webshop: what sells, what runs low, and how much follows a treatment. */
export function ShopCard({ orders, now }: { orders: Order[]; now: Date }) {
  const { t, tn, eur, clock, text } = useI18n();
  const today = ordersUntil(orders, now);
  const units = new Map<ProductId, number>();
  for (const order of today) for (const line of order.lines) units.set(line.product.id, (units.get(line.product.id) ?? 0) + line.qty);
  const top = PRODUCTS.filter((p) => units.has(p.id))
    .sort((a, b) => (units.get(b.id) ?? 0) - (units.get(a.id) ?? 0))
    .slice(0, 5);
  const most = Math.max(1, ...top.map((p) => units.get(p.id) ?? 0));
  const stock = PRODUCTS.map((p) => ({ product: p, left: Math.max(0, stockOf(p, now) - (units.get(p.id) ?? 0)) }))
    .filter((s) => s.left < 6)
    .sort((a, b) => a.left - b.left)
    .slice(0, 3);
  const aftercare = today.filter((o) => o.afterTreatment).length;

  return (
    <section id="webshop" className="card shop-card rise" style={{ '--d': '460ms' } as CSSProperties}>
      <CardHead eyebrow={t('shop.eyebrow')} title={<Accent text={tn('shop.title', today.length)} />}>
        <span className="phase">{t('shop.today', { amount: eur(orderTotal(today)) })}</span>
      </CardHead>
      <p className="help">{t('shop.help')}</p>

      <div className="shop-block">
        <span className="eyebrow">{t('shop.best')}</span>
        {top.length ? (
          <ul className="shop-top">
            {top.map((product) => (
              <li key={product.id}>
                <span className="shop-name">
                  {product.brand ? <b>{product.brand}</b> : null} {text(product.name)}
                </span>
                <span className="shop-bar">
                  <i style={{ width: `${((units.get(product.id) ?? 0) / most) * 100}%` }} />
                </span>
                <span className="shop-units">{units.get(product.id)}×</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="shop-empty">{t('shop.empty')}</p>
        )}
      </div>

      <div className="shop-block">
        <span className="eyebrow">{t('shop.latest')}</span>
        <ul className="shop-rows">
          {today
            .slice(-3)
            .reverse()
            .map((order) => {
              const first = order.lines[0].product;
              const extra = order.lines.reduce((n, l) => n + l.qty, 0) - 1;
              return (
                <li key={order.id}>
                  <span className="shop-time">{clock(order.at)}</span>
                  <span className="shop-name">
                    #{order.number} · {first.brand ? `${first.brand} ` : ''}
                    {text(first.name)}
                    {extra > 0 ? ` +${extra}` : ''}
                  </span>
                  <b>{eur(order.total)}</b>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="shop-block">
        <span className="eyebrow">{t('shop.stock')}</span>
        <ul className="shop-rows">
          {stock.map(({ product, left }) => (
            <li key={product.id}>
              <span className="shop-name">
                {product.brand ? `${product.brand} ` : ''}
                {text(product.name)}
              </span>
              <span className={`stock-pill ${left === 0 ? 'out' : 'low'}`}>{left === 0 ? t('shop.soldOut') : t('shop.left', { n: left })}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="shop-note">{tn('shop.note', aftercare, { total: today.length })}</p>
    </section>
  );
}
