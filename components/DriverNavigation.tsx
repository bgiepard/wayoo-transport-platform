'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { getCarrierByUserId, offers } from '@/lib/data';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function DriverNavigation() {
  const { currentUser } = useAuth();
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Count pending offers for driver
  const getPendingOffersCount = () => {
    if (!carrier) return 0;
    return offers.filter((o) => o.carrierId === carrier.id && o.status === 'pending').length;
  };

  const pendingOffersCount = getPendingOffersCount();

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-[#1a4469] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/driver" className="flex items-center gap-2">
              <Image
                src="/wayoo-logo.png"
                alt="wayoo"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
              <span className="px-2 py-1 bg-[#ffc428] text-[#1a4469] text-xs font-bold rounded">
                PARTNER
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/driver"
              className={`font-medium transition-colors flex items-center gap-2 ${
                isActive('/driver') && router.pathname === '/driver'
                  ? 'text-[#ffc428]'
                  : 'text-white hover:text-[#ffc428]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>

            <Link
              href="/driver/requests"
              className={`font-medium transition-colors ${
                isActive('/driver/requests')
                  ? 'text-[#ffc428]'
                  : 'text-white hover:text-[#ffc428]'
              }`}
            >
              Zapytania
            </Link>

            <Link
              href="/driver/my-offers"
              className={`font-medium transition-colors relative inline-flex items-center gap-2 ${
                isActive('/driver/my-offers')
                  ? 'text-[#ffc428]'
                  : 'text-white hover:text-[#ffc428]'
              }`}
            >
              Moje Oferty
              {pendingOffersCount > 0 && (
                <span className="absolute -top-2 -right-6 bg-[#ffc428] text-[#1a4469] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {pendingOffersCount}
                </span>
              )}
            </Link>

            <Link
              href="/driver/vehicles"
              className={`font-medium transition-colors ${
                isActive('/driver/vehicles')
                  ? 'text-[#ffc428]'
                  : 'text-white hover:text-[#ffc428]'
              }`}
            >
              Flota
            </Link>

            {/* User Menu Dropdown */}
            <div className="border-l border-white/30 pl-6 flex items-center gap-3 relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
              >
                <div className="w-8 h-8 bg-[#ffc428] rounded-full flex items-center justify-center">
                  <span className="text-[#1a4469] font-bold text-sm">
                    {carrier?.companyName?.charAt(0) || currentUser?.firstName?.charAt(0) || 'P'}
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {carrier?.companyName || currentUser?.firstName}
                </span>
                <svg
                  className={`w-4 h-4 text-white transition-transform ${
                    openDropdown === 'user' ? 'rotate-180' : ''
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

              {openDropdown === 'user' && (
                <div className="absolute right-0 top-full mt-2 w-56 z-50">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">
                        {carrier?.companyName || currentUser?.firstName}
                      </div>
                      <div className="text-xs text-gray-500">{currentUser?.email}</div>
                    </div>

                    <Link
                      href="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#081c83] hover:text-white transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Panel pasażera
                    </Link>

                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={() => alert('Wylogowanie - Demo')}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Wyloguj się
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
