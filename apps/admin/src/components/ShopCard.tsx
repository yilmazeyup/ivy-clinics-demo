import { PRODUCTS, type ProductId } from '@pure-ivy/shared';
import type { CSSProperties } from 'react';

import { clock, eur } from '../data/format';
import { orderTotal, ordersUntil, productName, stockOf, type Order } from '../data/shop';
import { CardHead } from './ui';

/** Today's webshop: what sells, what runs low, and how much follows a treatment. */
export function ShopCard({ orders, now }: { orders: Order[]; now: Date }) {
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
      <CardHead
        eyebrow="Webshop"
        title={
          <>
            {today.length} <em>{today.length === 1 ? 'bestelling' : 'bestellingen'}</em>
          </>
        }
      >
        <span className="phase">{eur(orderTotal(today))} vandaag</span>
      </CardHead>

      <div className="shop-block">
        <span className="eyebrow">Best verkocht vandaag</span>
        {top.length ? (
          <ul className="shop-top">
            {top.map((product) => (
              <li key={product.id}>
                <span className="shop-name">
                  {product.brand ? <b>{product.brand}</b> : null} {product.name.nl}
                </span>
                <span className="shop-bar">
                  <i style={{ width: `${((units.get(product.id) ?? 0) / most) * 100}%` }} />
                </span>
                <span className="shop-units">{units.get(product.id)}×</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="shop-empty">Nog geen bestellingen vandaag.</p>
        )}
      </div>

      <div className="shop-block">
        <span className="eyebrow">Laatste bestellingen</span>
        <ul className="shop-rows">
          {today
            .slice(-3)
            .reverse()
            .map((order) => {
              const extra = order.lines.reduce((n, l) => n + l.qty, 0) - 1;
              return (
                <li key={order.id}>
                  <span className="shop-time">{clock(order.at)}</span>
                  <span className="shop-name">
                    #{order.number} · {productName(order.lines[0].product)}
                    {extra > 0 ? ` +${extra}` : ''}
                  </span>
                  <b>{eur(order.total)}</b>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="shop-block">
        <span className="eyebrow">Voorraad</span>
        <ul className="shop-rows">
          {stock.map(({ product, left }) => (
            <li key={product.id}>
              <span className="shop-name">{productName(product)}</span>
              <span className={`stock-pill ${left === 0 ? 'out' : 'low'}`}>{left === 0 ? 'uitverkocht' : `nog ${left}`}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="shop-note">
        <b>{aftercare}</b> van de {today.length} bestellingen {aftercare === 1 ? 'volgt' : 'volgen'} op een behandeling, met de nazorg die de
        specialist aanraadde.
      </p>
    </section>
  );
}
