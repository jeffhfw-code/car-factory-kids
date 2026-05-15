import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ScreenContainerProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  showBack?: boolean;
}

export function ScreenContainer({
  title,
  subtitle,
  children,
  showBack = true,
}: ScreenContainerProps) {
  return (
    <main
      style={{
        minHeight: '100%',
        padding: 'var(--space-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}
    >
      {showBack && (
        <Link
          to="/"
          style={{
            alignSelf: 'flex-start',
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: '0 2px 0 rgba(0,0,0,0.08)',
          }}
        >
          ← Home
        </Link>
      )}
      <header>
        <h1
          style={{
            margin: 0,
            fontSize: 40,
            fontWeight: 900,
            color: 'var(--color-ink)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: '8px 0 0',
              color: 'var(--color-ink-soft)',
              fontSize: 18,
            }}
          >
            {subtitle}
          </p>
        )}
      </header>
      <section
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.06)',
          flex: 1,
        }}
      >
        {children ?? (
          <p style={{ fontSize: 20, color: 'var(--color-ink-soft)' }}>
            Coming soon — this screen is part of a later build phase.
          </p>
        )}
      </section>
    </main>
  );
}
