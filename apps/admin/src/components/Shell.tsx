import { LOCALE_NAMES, LOCALES, type Locale } from '@pure-ivy/shared';

import ivyLogo from '../assets/ivy-logo.svg';
import { Accent, useI18n, useSetLocale, type MessageKey } from '../i18n';
import { Icon, type IconName } from './Icon';
import { useToast } from './ui';

/** Agenda, Pilates and Webshop jump to their part of the overview; the rest follow in a later step. */
const NAV: { icon: IconName; label: MessageKey; section?: string }[] = [
  { icon: 'grid', label: 'nav.overview' },
  { icon: 'calendar', label: 'nav.agenda', section: 'agenda' },
  { icon: 'list', label: 'nav.pilates', section: 'pilates' },
  { icon: 'bag', label: 'nav.webshop', section: 'webshop' },
  { icon: 'users', label: 'nav.clients' },
  { icon: 'mail', label: 'nav.campaigns' },
  { icon: 'sliders', label: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useI18n();
  const toast = useToast();
  const go = (index: number) => {
    const item = NAV[index];
    if (index === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (item.section) document.getElementById(item.section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else toast(t('nav.soon', { label: t(item.label) }));
  };
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={ivyLogo} alt="Ivy Clinics" height={22} />
      </div>

      <nav className="nav" aria-label={t('nav.label')}>
        {NAV.map((item, index) => (
          <button key={item.label} aria-current={index === 0 ? 'page' : undefined} onClick={() => go(index)}>
            <Icon name={item.icon} />
            {t(item.label)}
          </button>
        ))}
      </nav>

      <div className="test-box">
        <strong>{t('test.title')}</strong>
        {t('test.body')}
      </div>
    </aside>
  );
}

type TopbarProps = {
  now: Date;
  playing: boolean;
  progress: number;
  onPlay: () => void;
  onStop: () => void;
  onTour: () => void;
};

export function Topbar({ now, playing, progress, onPlay, onStop, onTour }: TopbarProps) {
  const i18n = useI18n();
  const { t, clock, locale } = i18n;
  const setLocale = useSetLocale();
  const toast = useToast();
  return (
    <header className="topbar rise">
      <div>
        <h1 className="greeting">
          <Accent text={i18n.greeting(now)} />
        </h1>
        <p className="subline">
          {i18n.dayLong(now)} · {t('top.subline')}
        </p>
      </div>
      <div className="top-actions">
        <span className="demo-chip">{t('top.demo')}</span>
        <label className="lang-select">
          <Icon name="globe" size={17} />
          <select value={locale} aria-label={t('lang.label')} onChange={(event) => setLocale(event.target.value as Locale)}>
            {LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_NAMES[code]}
              </option>
            ))}
          </select>
        </label>
        <button className="tour-button" onClick={onTour}>
          <Icon name="help" size={17} />
          {t('top.tour')}
        </button>
        <button className="search" onClick={() => toast(t('top.searchSoon'))}>
          <Icon name="search" size={18} />
          {t('top.search')}
          <kbd>⌘K</kbd>
        </button>
        {playing ? (
          <button className="play is-playing" onClick={onStop} aria-label={t('top.stop')}>
            <Icon name="stop" size={16} />
            <span className="play-time">{clock(now)}</span>
            <span className="play-bar">
              <i style={{ width: `${progress * 100}%` }} />
            </span>
          </button>
        ) : (
          <button className="play" onClick={onPlay}>
            <Icon name="play" size={16} />
            {t('top.play')}
          </button>
        )}
        <span className="live-chip" title={t('top.liveTitle')}>
          <i className="live-dot" />
          {playing ? t('top.demoTime') : t('top.live', { time: now })}
        </span>
        <button className="icon-button" aria-label={t('top.notifications')} onClick={() => toast(t('top.noNotifications'))}>
          <Icon name="bell" />
        </button>
        <span className="avatar" aria-label={t('top.admin')}>
          IC
        </span>
      </div>
    </header>
  );
}
