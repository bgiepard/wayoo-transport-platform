'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { transportRequests, offers } from '@/lib/data';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { currentUser } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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
        { label: 'Zasady współpracy', href: '/zasady-wspolpracy' },
        { label: 'Korzyści partnerskie', href: '/korzysci-partnerskie' },
        { label: 'Nasi partnerzy', href: '/nasi-partnerzy-transport' },
      ],
    },
    // {
    //   title: 'Zrównoważony rozwój i ESG',
    //   links: [
    //     { label: 'Strategia ESG', href: '/strategia-esg' },
    //     { label: 'Zrównoważona mobilność', href: '/zrownowazona-mobilnosc' },
    //     { label: 'Inicjatywy środowiskowe', href: '/inicjatywy-srodowiskowe' },
    //     { label: 'Standardy ESG dla partnerów', href: '/standardy-esg' },
    //     { label: 'Raport ESG', href: '/raport-esg' },
    //   ],
    // },
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

  // Get notifications (new offers with request details)
  const getNotifications = () => {
    if (!currentUser || currentUser.role !== 'passenger') return [];
    const myRequests = transportRequests.filter((r) => r.userId === currentUser.id);
    const notifications: Array<{ request: typeof transportRequests[0]; offersCount: number }> = [];

    myRequests.forEach((request) => {
      const pendingOffers = offers.filter(
        (o) => o.requestId === request.id && o.status === 'pending'
      );
      if (pendingOffers.length > 0) {
        notifications.push({
          request,
          offersCount: pendingOffers.length,
        });
      }
    });

    return notifications.sort(
      (a, b) => b.request.updatedAt.getTime() - a.request.updatedAt.getTime()
    );
  };

  const notifications = getNotifications();

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min temu`;
    if (hours < 24) return `${hours}h temu`;
    if (days < 7) return `${days} dni temu`;
    return date.toLocaleDateString('pl-PL');
  };

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
            {/* Notifications Icon with Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:text-[#ffc428] transition-colors relative inline-flex items-center"
                title="Powiadomienia"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {newOffersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ffc428] text-[#215387] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {newOffersCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 z-50">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-2xl py-2 max-h-[500px] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Powiadomienia</h3>
                      {newOffersCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {newOffersCount} {newOffersCount === 1 ? 'nowa' : 'nowych'}
                        </span>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-4xl mb-2">🔔</div>
                        <p className="text-gray-500 text-sm">Brak nowych powiadomień</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map(({ request, offersCount }) => (
                          <Link
                            key={request.id}
                            href={`/passenger/requests/${request.id}`}
                            onClick={() => setShowNotifications(false)}
                            className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-[#ffc428] rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-[#215387]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {offersCount} {offersCount === 1 ? 'nowa oferta' : 'nowe oferty'}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {request.from.city} → {request.to.city}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(request.updatedAt)}
                                </p>
                              </div>

                              <svg
                                className="w-4 h-4 text-gray-400 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <Link
                          href="/passenger/requests"
                          onClick={() => setShowNotifications(false)}
                          className="text-sm text-[#215387] hover:text-[#1a4469] font-medium flex items-center justify-center gap-1"
                        >
                          Zobacz wszystkie zapytania
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/passenger/requests"
              className="text-white hover:text-[#ffc428] font-medium transition-colors"
            >
              Moje Zapytania
            </Link>

            <Link
              href="/passenger/account"
              className="text-white hover:text-[#ffc428] font-medium transition-colors"
            >
              Moje Konto
            </Link>
          </div>
        </div>
      </div>
    </nav>

    {/* Dropdown Menu */}
    <div className="bg-[#081c83]/95 border-b border-white/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between space-x-8 py-3">
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
