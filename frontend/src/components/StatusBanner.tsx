interface StatusBannerProps {
  tone: 'info' | 'error';
  title: string;
  message: string;
}

export function StatusBanner({ tone, title, message }: StatusBannerProps) {
  return (
    <section className={`status-banner status-banner--${tone}`}>
      <strong>{title}</strong>
      <p>{message}</p>
    </section>
  );
}

