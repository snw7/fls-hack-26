import type { PropsWithChildren, ReactNode } from 'react';

interface AppShellProps extends PropsWithChildren {
  banner?: ReactNode;
}

export function AppShell({ banner, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell__ambient" aria-hidden="true" />
      <img
        src="/logo.svg"
        alt="Finanz Informatik"
        className="app-shell__logo"
      />
      <main className="app-main">
        {banner}
        {children}
      </main>
    </div>
  );
}
