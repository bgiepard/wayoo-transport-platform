import DriverNavigation from '@/components/DriverNavigation';
import Footer from '@/components/Footer';

interface DriverLayoutProps {
  children: React.ReactNode;
}

export default function DriverLayout({ children }: DriverLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DriverNavigation />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
