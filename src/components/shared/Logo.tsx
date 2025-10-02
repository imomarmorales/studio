import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <Image 
          src="/logo.png" 
          alt="Logo Semana de la Ingeniería"
          width={40}
          height={40}
          className="object-contain"
        />
        <span>Ingeniería 2025</span>
    </Link>
  );
}
