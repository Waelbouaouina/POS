import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAAD Distribution — ERP Volailles',
  description: 'Système de gestion POS pour la distribution de volailles — SAAD Distribution',
  keywords: ['ERP', 'POS', 'Volailles', 'SAAD Distribution', 'Bon de Livraison'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
