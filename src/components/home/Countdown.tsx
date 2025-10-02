"use client";

import { useState, useEffect } from "react";

const eventDate = new Date("2025-11-18T09:00:00");

// Define a type for the time left
type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// Function to calculate time left
const calculateTimeLeft = (): TimeLeft | null => {
  const now = new Date();
  const difference = eventDate.getTime() - now.getTime();

  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return { days: 0, hours: 0, minutes: 0, seconds: 0 };
};

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Set initial time on client mount
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clear interval on cleanup
    return () => clearInterval(timer);
  }, []);

  const countdownItems = [
    { label: 'Días', value: timeLeft?.days ?? 0 },
    { label: 'Horas', value: timeLeft?.hours ?? 0 },
    { label: 'Minutos', value: timeLeft?.minutes ?? 0 },
    { label: 'Segundos', value: timeLeft?.seconds ?? 0 }
  ];

  return (
    <div className="flex justify-center space-x-2 md:space-x-4" aria-label="Cuenta regresiva para el evento">
      {countdownItems.map((item, i) => (
        <div key={i} className="text-center bg-white/10 backdrop-blur-sm p-4 rounded-lg w-24">
          <span className="text-3xl md:text-5xl font-bold font-headline">
            {timeLeft ? String(item.value).padStart(2, '0') : '00'}
          </span>
          <p className="text-xs md:text-sm uppercase tracking-widest">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
