export default function WhyTrustUs() {
  return (
    <div className="mt-12 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Dlaczego warto nam zaufać</h2>
        <p className="text-lg text-gray-600">Twój wybór transportu nigdy nie był tak prosty</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ffc428] to-[#f5b920] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-8 h-8 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#215387]">Prosty proces</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                Składasz zapytanie, otrzymujesz oferty od przewoźników i wybierasz najlepszą — wszystko w jednym miejscu. Zapomnij o niekończących się telefonach i maelach!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#215387]">Bezpieczeństwo i weryfikacja</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                Współpracujemy wyłącznie ze sprawdzonymi lokalnymi przewoźnikami. Każdy przewoźnik jest weryfikowany, a opinie pasażerów są zawsze dostępne.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#215387]">Oszczędność czasu</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                Zamiast dzwonić do wielu przewoźników — wszystko odbywa się w jednym miejscu. Średni czas odpowiedzi to tylko 11 minut!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#215387] to-[#1a4469] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 text-[#215387]">Odpowiedzialny model współpracy</h3>
              <p className="text-gray-700 leading-relaxed text-sm">
                Wayoo wspiera standardy ESG i porządkuje proces organizacji transportu po stronie hotelu. Razem budujemy lepszą przyszłość!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
