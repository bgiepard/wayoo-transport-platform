import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@/app/globals.css';
import PasswordModal from '@/components/PasswordModal';

const AuthProvider = dynamic(
  () => import('@/lib/auth-context').then((mod) => mod.AuthProvider),
  { ssr: false }
);

const DriverLayout = dynamic(
  () => import('@/components/layouts/DriverLayout'),
  { ssr: false }
);

const PassengerLayout = dynamic(
  () => import('@/components/layouts/PassengerLayout'),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Sprawdź czy użytkownik jest już autoryzowany
    if (typeof window !== 'undefined') {
      const authorized = localStorage.getItem('wayoo_authorized');
      if (authorized === 'true') {
        setIsAuthorized(true);
      }
      // Set current path from window.location
      setCurrentPath(window.location.pathname);
    }
    setIsLoading(false);
  }, []);

  // Update path on navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };

      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, []);

  const handlePasswordSuccess = () => {
    setIsAuthorized(true);
  };

  // Nie renderuj nic podczas ładowania (aby uniknąć błysku)
  if (isLoading) {
    return null;
  }

  // Determine which layout to use based on the path
  const isDriverPanel = currentPath.startsWith('/driver');
  const Layout = isDriverPanel ? DriverLayout : PassengerLayout;

  return (
    <>
      <Head>
        <title>wayoo - Łączymy pasażerów z przewoźnikami</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      {!isAuthorized && <PasswordModal onSuccess={handlePasswordSuccess} />}

      <AuthProvider>
        <div style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </div>
      </AuthProvider>
    </>
  );
}
