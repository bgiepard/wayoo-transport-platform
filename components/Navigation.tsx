'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { users, transportRequests, offers } from '@/lib/data';
import { useState } from 'react';

export default function Navigation() {
  const { currentUser, setCurrentUser, isPassenger, isCarrier } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const menuItems = [
    {
      title: 'Podróżuj z Wayoo',
      links: [
        { label: 'Jak rezerwować przejazdy', href: '/jak-rezerwowac' },
        { label: 'Rezerwacja przejazdu', href: '/rezerwacja' },
        { label: 'Pomoc i FAQ', href: '/pomoc-faq' },
      ],
    },
    {
      title: 'Dla hoteli i obiektów',
      links: [
        { label: 'Rozwiązania biznesowe', href: '/rozwiazania-biznesowe' },
        { label: 'Panel partnerski', href: '/panel-partnerski' },
        { label: 'Korzyści ze współpracy', href: '/korzysci-wspolpraca' },
        { label: 'Historie sukcesu', href: '/historie-sukcesu' },
        { label: 'Nasi partnerzy', href: '/nasi-partnerzy-hotele' },
      ],
    },
    {
      title: 'Partnerzy transportowi',
      links: [
        { label: 'Dołącz do Wayoo', href: '/dolacz-do-wayoo' },
        { label: 'Wymagania współpracy', href: '/wymagania-wspolpracy' },
        { label: 'Korzyści partnerskie', href: '/korzysci-partnerskie' },
        { label: 'Nasi partnerzy', href: '/nasi-partnerzy-transport' },
      ],
    },
    {
      title: 'Zrównoważony rozwój i ESG',
      links: [
        { label: 'Strategia ESG', href: '/strategia-esg' },
        { label: 'Zrównoważona mobilność', href: '/zrownowazona-mobilnosc' },
        { label: 'Inicjatywy środowiskowe', href: '/inicjatywy-srodowiskowe' },
        { label: 'Standardy ESG dla partnerów', href: '/standardy-esg' },
        { label: 'Raport ESG', href: '/raport-esg' },
      ],
    },
    {
      title: 'O nas',
      links: [
        { label: 'Poznaj Wayoo', href: '/poznaj-wayoo' },
        { label: 'Misja i wartości firmy', href: '/misja-wartosci' },
        { label: 'Aktualności i media', href: '/aktualnosci-media' },
      ],
    },
    {
      title: 'Pomoc i kontakt',
      links: [
        { label: 'Pomoc i kontakt', href: '/pomoc-kontakt' },
        { label: 'Kontakt', href: '/kontakt' },
        { label: 'Współpraca partnerska', href: '/wspolpraca-partnerska' },
      ],
    },
  ];

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
    <>
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
                className="text-white hover:text-[#ffc428] font-medium transition-colors relative inline-flex items-center gap-2 mr-9"
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

    {/* Dropdown Menu */}
    <div className="bg-[#081c83]/95 border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-8 py-3">
          {menuItems.map((menu, index) => (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => setOpenDropdown(index)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="text-white hover:text-[#ffc428] font-medium px-3 py-2 text-sm transition-colors flex items-center gap-0.5">
                {menu.title}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openDropdown === index && (
                <div className="absolute left-0 mt-0 pt-2 w-56 z-50">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                    {menu.links.map((link, linkIndex) => (
                      <Link
                        key={linkIndex}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#081c83] hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
  );
}
