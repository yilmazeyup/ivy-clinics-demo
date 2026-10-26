import { PRODUCTS, type ProductId } from '@pure-clinics/shared';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import { orderTotal, ordersUntil, stockOf, type Order } from '../data/shop';
import { Accent, useI18n } from '../i18n';
import { SHOP_VIEW, ShopScene } from '../three/shop';
import { Stage, type Tip } from '../three/stage';
import { CardHead } from './ui';

/**
 * Today's webshop as a small 3D shop: the products on their shelves with the stock on the shelf edge. Every order lifts
 * its products into a parcel that leaves the counter; the latest orders are listed underneath.
 */
export function ShopView({ orders, now, fast }: { orders: Order[]; now: Date; fast: boolean }) {
  const { t, tn, eur, clock, text } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ShopScene | null>(null);
  const describe = useRef<(id: ProductId) => Tip | null>(() => null);
  const today = useMemo(() => ordersUntil(orders, now), [orders, now]);

  const sold = new Map<ProductId, number>();
  for (const order of today) for (const line of order.lines) sold.set(line.product.id, (sold.get(line.product.id) ?? 0) + line.qty);
  const levels = new Map(PRODUCTS.map((p) => [p.id, Math.max(0, stockOf(p, now) - (sold.get(p.id) ?? 0))]));
  const aftercare = today.filter((o) => o.afterTreatment).length;

  describe.current = (id) => {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return null;
    const left = levels.get(id) ?? 0;
    return {
      title: `${product.brand ? `${product.brand} ` : ''}${text(product.name)}`,
      detail: `${eur(product.price)} · ${left ? t('shop.inStock', { n: left }) : t('shop.soldOut')}<br>${t('shop.soldToday', { n: sold.get(id) ?? 0 })}`,
    };
  };

  useEffect(() => {
    const stage = new Stage(host.current!, {
      camera: SHOP_VIEW.camera,
      target: SHOP_VIEW.target,
      intro: [5.5, 4.5, 11],
      minDistance: 6,
      maxDistance: 13,
      minPolarAngle: 0.8,
      maxPolarAngle: 1.45,
      minAzimuthAngle: -0.6,
      maxAzimuthAngle: 0.7,
      fitAspect: 1.55,
      sway: 0.05,
    });
    const shop = new ShopScene(
      stage,
      PRODUCTS.map((product) => ({ product, brand: product.brand ?? 'Pure Clinics', name: text(product.name) })),
      (id) => describe.current(id),
    );
    scene.current = shop;
    return () => {
      shop.dispose();
      stage.dispose();
      scene.current = null;
    };
    // Built once per mount; the parent remounts this view when the language changes.
  }, []);

  // Stock on the shelf first, then the parcels for orders that just came in.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    scene.current?.stock(levels, (left) => ({
      text: left ? t('shop.left', { n: left }) : t('shop.soldOut'),
      tone: left === 0 ? 'out' : left < 6 ? 'low' : 'ok',
    }));
    const before = seen.current;
    seen.current = new Set(today.map((o) => o.id));
    if (!before) return;
    const fresh = today.filter((o) => !before.has(o.id));
    if (fresh.length > 6) return;
    for (const order of fresh) {
      const items = order.lines.flatMap((l) => Array<ProductId>(l.qty).fill(l.product.id));
      scene.current?.order(items, `+ ${eur(order.total)}`, fast);
    }
  }, [today]);

  return (
    <section id="webshop" className="card shop-card rise" style={{ '--d': '460ms' } as CSSProperties}>
      <CardHead eyebrow={t('shop.eyebrow')} title={<Accent text={tn('shop.title', today.length)} />}>
        <span className="phase">{t('shop.today', { amount: eur(orderTotal(today)) })}</span>
      </CardHead>
      <p className="help">{t('shop.help')}</p>
      <div className="scene-host scene-host--shop" ref={host} role="group" aria-label={t('shop.help')}>
        <span className="scene-hint">{t('shop.hint')}</span>
      </div>

      <div className="shop-block">
        <span className="eyebrow">{t('shop.latest')}</span>
        {today.length ? (
          <ul className="shop-rows">
            {today
              .slice(-3)
              .reverse()
              .map((order) => {
                const first = order.lines[0].product;
                const extra = order.lines.reduce((n, l) => n + l.qty, 0) - 1;
                return (
                  <li key={order.id} className="shop-row-new">
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
        ) : (
          <p className="shop-empty">{t('shop.empty')}</p>
        )}
      </div>
      <p className="shop-note">{tn('shop.note', aftercare, { total: today.length })}</p>
    </section>
  );
}
