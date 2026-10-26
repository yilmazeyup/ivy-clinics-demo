import ivyLogo from '../assets/ivy-logo.svg';
import { clock, dayLong, greeting } from '../data/format';
import { Icon, type IconName } from './Icon';
import { useToast } from './ui';

/** Agenda, Pilates and Webshop jump to their part of the overview; the rest follow in a later step. */
const NAV: { icon: IconName; label: string; section?: string }[] = [
  { icon: 'grid', label: 'Overzicht' },
  { icon: 'calendar', label: 'Agenda', section: 'klinieken' },
  { icon: 'list', label: 'Pilates', section: 'pilates' },
  { icon: 'bag', label: 'Webshop', section: 'webshop' },
  { icon: 'users', label: 'Cliënten' },
  { icon: 'mail', label: 'Campagnes' },
  { icon: 'sliders', label: 'Instellingen' },
];

export function Sidebar() {
  const toast = useToast();
  const go = (index: number) => {
    const item = NAV[index];
    if (index === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (item.section) document.getElementById(item.section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else toast(`${item.label} volgt in de volgende stap van de demo.`);
  };
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={ivyLogo} alt="Ivy Clinics" height={22} />
      </div>

      <nav className="nav" aria-label="Beheer">
        {NAV.map((item, index) => (
          <button key={item.label} aria-current={index === 0 ? 'page' : undefined} onClick={() => go(index)}>
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="test-box">
        <strong>Testomgeving</strong>
        Alle namen, afspraken, bestellingen en betalingen zijn testgegevens. Mollie staat in testmodus.
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
};

export function Topbar({ now, playing, progress, onPlay, onStop }: TopbarProps) {
  const toast = useToast();
  return (
    <header className="topbar rise">
      <div>
        <h1 className="greeting">
          {greeting(now)}, <em>team Ivy</em>.
        </h1>
        <p className="subline">{dayLong(now)} · vier klinieken, de pilatesstudio en de webshop</p>
      </div>
      <div className="top-actions">
        <span className="demo-chip">Demo · fictieve gegevens</span>
        <button className="search" onClick={() => toast('Zoeken werkt in de volgende stap van de demo.')}>
          <Icon name="search" size={18} />
          Zoek cliënt, les of bestelling
          <kbd>⌘K</kbd>
        </button>
        {playing ? (
          <button className="play is-playing" onClick={onStop} aria-label="Stop het afspelen">
            <Icon name="stop" size={16} />
            <span className="play-time">{clock(now)}</span>
            <span className="play-bar">
              <i style={{ width: `${progress * 100}%` }} />
            </span>
          </button>
        ) : (
          <button className="play" onClick={onPlay}>
            <Icon name="play" size={16} />
            Speel de dag af
          </button>
        )}
        <span className="live-chip" title="De gegevens volgen de klok">
          <i className="live-dot" />
          {playing ? 'Demo-tijd' : `Live · ${clock(now)}`}
        </span>
        <button className="icon-button" aria-label="Meldingen" onClick={() => toast('Geen nieuwe meldingen.')}>
          <Icon name="bell" />
        </button>
        <span className="avatar" aria-label="Ingelogd als beheerder">
          IC
        </span>
      </div>
    </header>
  );
}
