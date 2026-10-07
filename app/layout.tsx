import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

export const metadata: Metadata = {
  title: 'School Manager RDC',
  description: 'Plateforme numérique de gestion scolaire sécurisée et évolutive pour la République Démocratique du Congo.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'School Manager RDC',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-167.png', sizes: '167x167', type: 'image/png' },
    ],
  },
};

/* `resizes-content` : sur Android, le clavier virtuel réduit la zone visible au lieu de
   recouvrir la barre de saisie de SchoolChat. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="School Manager RDC" />
        <meta name="application-name" content="School Manager RDC" />
      </head>
      <body>
        <PWAProvider>
          <OfflineIndicator />
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
