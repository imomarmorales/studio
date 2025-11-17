'use client';

import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { firebaseApp, auth, firestore, storage } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <title>Semana de la Ingeniería 2025</title>
        <meta name="description" content="Congreso académico de la Facultad de Ingeniería Tampico de la UAT" />
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider
          firebaseApp={firebaseApp}
          auth={auth}
          firestore={firestore}
          storage={storage}
        >
          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
