'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { users, transportRequests, offers } from '@/lib/data';

export default function Navigation() {
  const { currentUser, setCurrentUser, isPassenger, isCarrier } = useAuth();

  // Count new offers for passenger
  const getNewOffersCount = () => {
    if (!currentUser || currentUser.role !== 'passenger') return 0;
    const myRequests = transportRequests.filter((r) => r.userId === currentUser.id);
    const newOffersCount = myRequests.reduce((count, request) => {
      const requestOffers = offers.filter((o) => o.requestId === request.id && o.status === 'pending');
      return count + requestOffers.length;
    }, 0);
    return newOffersCount;
  };

  const newOffersCount = getNewOffersCount();

  return (
    <nav className="bg-[#081c83] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/wayoo-logo.png"
                alt="wayoo"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isPassenger && (
              <Link
                href="/passenger/requests"
                className="text-white hover:text-[#ffc428] font-medium transition-colors relative inline-flex items-center gap-2"
              >
                Moje Zapytania
                {newOffersCount > 0 && (
                  <span className="absolute -top-2 -right-6 bg-[#ffc428] text-[#215387] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {newOffersCount}
                  </span>
                )}
              </Link>
            )}

            {isCarrier && (
              <>
                <Link
                  href="/carrier/requests"
                  className="text-white hover:text-[#ffc428] font-medium transition-colors"
                >
                  Zapytania
                </Link>
                <Link
                  href="/carrier/my-offers"
                  className="text-white hover:text-[#ffc428] font-medium transition-colors"
                >
                  Moje Oferty
                </Link>
                <Link
                  href="/carrier/vehicles"
                  className="text-white hover:text-[#ffc428] font-medium transition-colors"
                >
                  Flota
                </Link>
              </>
            )}

            {/* Role Switcher */}
            <div className="border-l border-white/30 pl-6 flex items-center gap-3">
              <button
                onClick={() => {
                  // Przełącz na pasażera (Jan Kowalski - id: 1)
                  const passenger = users.find((u) => u.id === '1');
                  setCurrentUser(passenger || null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isPassenger
                    ? 'bg-[#ffc428] text-[#215387] shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Pasażer
              </button>
              <button
                onClick={() => {
                  // Przełącz na przewoźnika (Michał Wiśniewski - id: 3)
                  const carrier = users.find((u) => u.id === '3');
                  setCurrentUser(carrier || null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isCarrier
                    ? 'bg-[#ffc428] text-[#215387] shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Przewoźnik
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
