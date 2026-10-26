import { useState } from 'react';

import { useDemoClock } from './clock';
import { Sidebar, Topbar } from './components/Shell';
import { Tour } from './components/Tour';
import { ToastProvider } from './components/ui';
import { Overview } from './dash/Overview';
import { I18nProvider } from './i18n';

function Panel() {
  const clock = useDemoClock();
  const [touring, setTouring] = useState(false);
  return (
    <div className="app">
      <ToastProvider>
        <Sidebar />
        <main className="main">
          <Topbar
            now={clock.now}
            playing={clock.playing}
            progress={clock.progress}
            onPlay={clock.play}
            onStop={clock.stop}
            onTour={() => setTouring(true)}
          />
          <Overview now={clock.now} playing={clock.playing} />
        </main>
        <Tour open={touring} onOpen={() => setTouring(true)} onClose={() => setTouring(false)} />
      </ToastProvider>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <Panel />
    </I18nProvider>
  );
}
