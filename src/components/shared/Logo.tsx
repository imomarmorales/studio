import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image 
        src="/header-logos.png"
        alt="Logos de la UAT y Facultad de Ingeniería de Tampico"
        width={300}
        height={50}
        className="object-contain"
        priority
      />
    </Link>
  );
}
