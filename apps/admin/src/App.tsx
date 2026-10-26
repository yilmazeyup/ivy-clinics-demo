import { useDemoClock } from './clock';
import { Sidebar, Topbar } from './components/Shell';
import { ToastProvider } from './components/ui';
import { Overview } from './dash/Overview';

export function App() {
  const clock = useDemoClock();
  return (
    <div className="app">
      <ToastProvider>
        <Sidebar />
        <main className="main">
          <Topbar now={clock.now} playing={clock.playing} progress={clock.progress} onPlay={clock.play} onStop={clock.stop} />
          <Overview now={clock.now} playing={clock.playing} />
        </main>
      </ToastProvider>
    </div>
  );
}
