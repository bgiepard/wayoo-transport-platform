import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#081c83] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo i opis */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <Image
                src="/wayoo-logo.png"
                alt="wayoo"
                width={180}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-white/80 leading-relaxed mb-4">
              Platforma łącząca pasażerów z profesjonalnymi przewoźnikami.
              Szybki, wygodny i bezpieczny sposób na organizację transportu grupowego.
            </p>
            <p className="text-white/60 text-sm">
              © 2024 wayoo. Wszelkie prawa zastrzeżone.
            </p>
          </div>

          {/* Informacje */}
          <div>
            <h3 className="text-lg font-bold mb-4">Informacje</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/o-nas" className="text-white/80 hover:text-[#ffc428] transition-colors">
                  O nas
                </Link>
              </li>
              <li>
                <Link href="/jak-to-dziala" className="text-white/80 hover:text-[#ffc428] transition-colors">
                  Jak to działa
                </Link>
              </li>
              <li>
                <Link href="/dla-przewoznikow" className="text-white/80 hover:text-[#ffc428] transition-colors">
                  Dla przewoźników
                </Link>
              </li>
              <li>
                <Link href="/cennik" className="text-white/80 hover:text-[#ffc428] transition-colors">
                  Cennik
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-lg font-bold mb-4">Kontakt</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>
                <strong>Email:</strong><br />
                kontakt@wayoo.pl
              </li>
              <li>
                <strong>Telefon:</strong><br />
                +48 123 456 789
              </li>
              <li className="pt-2">
                <strong>Adres:</strong><br />
                ul. Przykładowa 123<br />
                00-001 Warszawa
              </li>
            </ul>
          </div>
        </div>

        {/* Dolna sekcja */}
        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-white/60 text-sm">
              <strong className="text-white/80">wayoo Sp. z o.o.</strong><br />
              NIP: 1234567890 | REGON: 123456789<br />
              KRS: 0000123456
            </div>
            <div className="text-right text-sm">
              <Link href="/regulamin" className="text-white/80 hover:text-[#ffc428] transition-colors mr-4">
                Regulamin
              </Link>
              <Link href="/polityka-prywatnosci" className="text-white/80 hover:text-[#ffc428] transition-colors">
                Polityka prywatności
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
