import Link from 'next/link';
import Image from 'next/image';
import { Flame } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Flame className="h-5 w-5" />
        </div>
        <span>Ingeniería 2025</span>
    </Link>
  );
}
