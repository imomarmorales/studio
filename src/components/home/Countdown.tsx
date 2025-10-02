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
    // This effect runs only on the client, after the initial render
    setIsClient(true);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    // Calculate time left immediately on mount
    calculateTimeLeft();

    // Then set up the interval
    const timer = setInterval(calculateTimeLeft, 1000);

    // Clear interval on cleanup
    return () => clearInterval(timer);
  }, []);

  if (!isClient) {
    // Render a placeholder on the server and during the initial client render
    return (
      <div className="flex justify-center space-x-2 md:space-x-4">
        {[
          {label: 'Días', value: '00'}, 
          {label: 'Horas', value: '00'}, 
          {label: 'Minutos', value: '00'}, 
          {label: 'Segundos', value: '00'}
        ].map((item, i) => (
          <div key={i} className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
            <div className="text-3xl md:text-5xl font-bold font-headline">{item.value}</div>
            <div className="text-xs md:text-sm uppercase tracking-widest">{item.label}</div>
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
