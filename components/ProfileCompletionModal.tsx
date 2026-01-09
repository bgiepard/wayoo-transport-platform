'use client';

import { useState } from 'react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const [emailClicked, setEmailClicked] = useState(false);
  const [phoneClicked, setPhoneClicked] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');

  if (!isOpen) return null;

  const handleComplete = () => {
    // Check if at least one verification method is completed
    if (!emailVerified && !phoneVerified) {
      alert('Musisz potwierdzić przynajmniej email lub telefon, aby dokończyć rejestrację!');
      return;
    }

    alert('Profil został uzupełniony! Możesz teraz w pełni korzystać z platformy.');
    onClose();
  };

  const handleSkip = () => {
    if (confirm('Czy na pewno chcesz pominąć weryfikację? Będziesz mógł to zrobić później w ustawieniach konta.')) {
      onClose();
    }
  };

  const handleEmailClick = () => {
    if (!emailVerified) {
      setEmailClicked(true);
    }
  };

  const handlePhoneClick = () => {
    if (!phoneVerified) {
      setPhoneClicked(true);
    }
  };

  const handleVerifyPhone = () => {
    setCodeError('');
    // Demo verification - accept code "1234"
    if (verificationCode === '1234') {
      setPhoneVerified(true);
      setVerificationCode('');
      alert('Telefon został pomyślnie zweryfikowany!');
    } else {
      setCodeError('Nieprawidłowy kod. W trybie demo użyj: 1234');
    }
  };

  const completedSteps = (emailVerified ? 1 : 0) + (phoneVerified ? 1 : 0);
  const totalSteps = 2;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#081c83] to-[#215387] px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-[#081c83]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Uzupełnij swój profil
              </h2>
              <p className="text-white/80 text-sm">
                Jeszcze tylko kilka kroków!
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/90 text-sm font-medium">
                Postęp: {completedSteps}/{totalSteps}
              </span>
              <span className="text-white/90 text-sm font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div
                className="bg-[#ffc428] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 mb-6">
            Zweryfikuj przynajmniej jeden sposób kontaktu, aby dokończyć rejestrację
          </p>

          <div className="space-y-5">
            {/* Email Verification */}
            <div
              className={`p-5 border-2 rounded-xl transition-all ${
                emailVerified
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-[#ffc428] cursor-pointer'
              }`}
              onClick={handleEmailClick}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  emailVerified ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {emailVerified && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📧</span>
                    <span className="font-semibold text-gray-900">Potwierdź email</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Zweryfikuj swój adres email, aby otrzymywać ważne powiadomienia
                  </p>

                  {emailClicked && !emailVerified && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-blue-800 font-medium">
                            Email aktywacyjny został wysłany!
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Sprawdź swoją skrzynkę pocztową i kliknij w link aktywacyjny. W trybie demo kliknij ponownie, aby oznaczyć jako zweryfikowane.
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmailVerified(true);
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            Oznacz jako zweryfikowane (demo)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Verification */}
            <div
              className={`p-5 border-2 rounded-xl transition-all ${
                phoneVerified
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-[#ffc428] cursor-pointer'
              }`}
              onClick={handlePhoneClick}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  phoneVerified ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {phoneVerified && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📱</span>
                    <span className="font-semibold text-gray-900">Potwierdź telefon</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Zweryfikuj numer telefonu dla szybszego kontaktu
                  </p>

                  {phoneClicked && !phoneVerified && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
                      <p className="text-sm text-blue-800 font-medium mb-3">
                        Wpisz kod weryfikacyjny wysłany SMS-em
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Wpisz kod (demo: 1234)"
                          maxLength={4}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#215387] focus:border-transparent outline-none text-center text-lg font-mono"
                        />
                        <button
                          onClick={handleVerifyPhone}
                          className="px-4 py-2 bg-[#215387] text-white font-medium rounded-lg hover:bg-[#1a4469] transition-colors"
                        >
                          Weryfikuj
                        </button>
                      </div>
                      {codeError && (
                        <p className="text-xs text-red-600 mt-2">{codeError}</p>
                      )}
                      <p className="text-xs text-blue-700 mt-2">
                        W trybie demo użyj kodu: <strong>1234</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Pomiń na razie
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#215387] to-[#081c83] hover:from-[#1a4469] hover:to-[#061565] text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Zakończ
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Będziesz mógł uzupełnić te informacje później w ustawieniach konta
          </p>
        </div>
      </div>
    </div>
  );
}
