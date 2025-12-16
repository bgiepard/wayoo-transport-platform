import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '@/app/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import DriverLayout from '@/components/layouts/DriverLayout';
import PassengerLayout from '@/components/layouts/PassengerLayout';
import PasswordModal from '@/components/PasswordModal';

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Sprawdź czy użytkownik jest już autoryzowany
    const authorized = localStorage.getItem('wayoo_authorized');
    if (authorized === 'true') {
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, []);

  const handlePasswordSuccess = () => {
    setIsAuthorized(true);
  };

  // Nie renderuj nic podczas ładowania (aby uniknąć błysku)
  if (isLoading) {
    return null;
  }

  // Determine which layout to use based on the path
  const isDriverPanel = router.pathname.startsWith('/driver');
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
