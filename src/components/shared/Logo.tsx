import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  // Añadimos un timestamp para "cache busting". Esto fuerza al navegador a cargar la nueva imagen.
  const cacheBuster = `?v=${new Date().getTime()}`;

  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <Image 
          src={`/logo.png${cacheBuster}`} 
          alt="Logo Semana de la Ingeniería"
          width={40}
          height={40}
          className="object-contain"
          // La propiedad 'key' ayuda a React a reconocer que el componente ha cambiado.
          key={cacheBuster}
        />
        <span>Semana de la Ingeniería</span>
    </Link>
  );
}
