import type { PropsWithChildren } from 'react';

interface AppShellProps extends PropsWithChildren {}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell__ambient" aria-hidden="true" />
      <img
        src="/logo.svg"
        alt="Finanz Informatik"
        className="app-shell__logo"
      />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
