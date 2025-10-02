"use client";

import { useState, useEffect } from "react";

const eventDate = new Date("2025-11-18T09:00:00");

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) {
    return (
      <div className="flex justify-center space-x-2 md:space-x-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
            <div className="text-3xl md:text-5xl font-bold font-headline animate-pulse">--</div>
            <div className="text-xs md:text-sm uppercase tracking-widest animate-pulse">----</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center space-x-2 md:space-x-4" aria-label="Cuenta regresiva para el evento">
      <div className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
        <span className="text-3xl md:text-5xl font-bold font-headline">{String(timeLeft.days).padStart(2, '0')}</span>
        <p className="text-xs md:text-sm uppercase tracking-widest">Días</p>
      </div>
      <div className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
        <span className="text-3xl md:text-5xl font-bold font-headline">{String(timeLeft.hours).padStart(2, '0')}</span>
        <p className="text-xs md:text-sm uppercase tracking-widest">Horas</p>
      </div>
      <div className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
        <span className="text-3xl md:text-5xl font-bold font-headline">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <p className="text-xs md:text-sm uppercase tracking-widest">Minutos</p>
      </div>
      <div className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
        <span className="text-3xl md:text-5xl font-bold font-headline">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <p className="text-xs md:text-sm uppercase tracking-widest">Segundos</p>
      </div>
    </div>
  );
}
