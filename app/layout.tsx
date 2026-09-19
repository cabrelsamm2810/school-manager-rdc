import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Manager RDC',
  description: 'Gestion scolaire sécurisée et évolutive pour la RDC.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
