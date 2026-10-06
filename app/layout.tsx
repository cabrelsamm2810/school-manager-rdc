import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'School Manager RDC',
  description: 'Gestion scolaire sécurisée et évolutive pour la RDC.'
};

/* `resizes-content` : sur Android, le clavier virtuel réduit la zone visible au lieu de
   recouvrir la barre de saisie de SchoolChat. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
