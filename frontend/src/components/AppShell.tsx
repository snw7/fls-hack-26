import type { PropsWithChildren, ReactNode } from 'react';

interface AppShellProps extends PropsWithChildren {
  appName: string;
  phase: string;
  status: string;
  onReset: () => void;
  sidebar: ReactNode;
  banner?: ReactNode;
}

export function AppShell({
  appName,
  phase,
  status,
  onReset,
  sidebar,
  banner,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell__ambient" aria-hidden="true" />
      <header className="app-header">
        <div>
          <img src="/logo.svg" alt="Finanz Informatik" className="app-header__logo" />
          <h1>{appName}</h1>
        </div>
        <div className="app-header__actions">
          <div className="phase-pill">
            <span>{phase}</span>
            <small>{status}</small>
          </div>
          <button type="button" className="ghost-button" onClick={onReset}>
            Reset session
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="sidebar-panel">{sidebar}</aside>
        <main className="main-panel">
          {banner}
          {children}
        </main>
      </div>
    </div>
  );
}

