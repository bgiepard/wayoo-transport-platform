import { useState, FormEvent } from 'react';

interface PasswordModalProps {
  onSuccess: () => void;
}

export default function PasswordModal({ onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (password === 'Wayoo!2025') {
      // Zapisz autoryzację w localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('wayoo_authorized', 'true');
      }
      onSuccess();
    } else {
      setError('Nieprawidłowe hasło');
      setIsShaking(true);
      setPassword('');

      // Usuń animację po 500ms
      setTimeout(() => {
        setIsShaking(false);
        setError('');
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#215387] mb-3">
            Strona chroniona
          </h2>
          <p className="text-gray-600">
            Wprowadź hasło, aby uzyskać dostęp
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hasło dostępu
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffc428]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wprowadź hasło"
                autoFocus
                className={`w-full pl-14 pr-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#ffc428] text-[#215387] py-4 text-lg rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Potwierdź
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
