interface VerificationStatusProps {
  verified: boolean;
  onRequestCode: () => void;
}

export default function VerificationStatus({
  verified,
  onRequestCode
}: VerificationStatusProps) {
  if (verified) {
    return (
      <div className="flex items-center gap-2 mt-2 text-sm">
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-green-600 font-semibold">Potwierdzony</span>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 text-sm mb-2">
        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-orange-600 font-medium">Niepotwierdzony</span>
      </div>
      <button
        onClick={onRequestCode}
        type="button"
        className="text-sm text-[#215387] hover:text-[#1a4469] font-semibold underline"
      >
        Wyślij kod autoryzujący
      </button>
    </div>
  );
}
