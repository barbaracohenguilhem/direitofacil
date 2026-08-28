import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OAB Engine',
  description: 'Preparação adaptativa para a 1ª fase da OAB.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
