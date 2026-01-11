import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Companion',
  description: 'A minimal, production-ready AI Companion chat app.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}

