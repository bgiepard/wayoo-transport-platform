import { useState, useRef, KeyboardEvent } from 'react';

interface VerificationCodeInputProps {
  onVerify: (code: string) => void;
  onCancel: () => void;
  type: 'email' | 'phone';
}

export default function VerificationCodeInput({
  onVerify,
  onCancel,
  type
}: VerificationCodeInputProps) {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const handleChange = (index: number, value: string) => {
    // Akceptuj tylko cyfry
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus na następne pole
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: wróć do poprzedniego pola
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join('');
    if (fullCode.length === 4) {
      onVerify(fullCode);
    }
  };

  const label = type === 'email' ? 'email' : 'telefon';

  return (
    <div className="mt-4 p-4 border-2 border-[#ffc428] rounded-xl bg-yellow-50">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Wprowadź 4-cyfrowy kod wysłany na {label}
        </p>
        <div className="flex gap-3 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
              autoFocus={index === 0}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={code.join('').length !== 4}
          className="flex-1 bg-[#215387] text-white px-4 py-2 rounded-xl hover:bg-[#1a4469] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Zweryfikuj
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
        >
          Anuluj
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Demo: użyj kodu <span className="font-mono font-bold text-[#215387]">1234</span>
      </p>
    </div>
  );
}
