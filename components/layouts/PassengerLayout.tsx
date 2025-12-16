import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface PassengerLayoutProps {
  children: React.ReactNode;
}

export default function PassengerLayout({ children }: PassengerLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
