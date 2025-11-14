"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";

interface TimeSelectProps {
  value?: string; // Formato "HH:mm" en 24h
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function TimeSelect({ value, onChange, placeholder = "Seleccionar hora" }: TimeSelectProps) {
  // Convertir de 24h a 12h para mostrar
  const convert24to12 = (time24: string) => {
    if (!time24) return { hour: "", minute: "", period: "AM" };
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return {
      hour: hour12.toString(),
      minute: minutes.toString().padStart(2, '0'),
      period
    };
  };

  // Convertir de 12h a 24h para guardar
  const convert12to24 = (hour: string, minute: string, period: string) => {
    if (!hour || !minute) return '';
    
    let hours24 = parseInt(hour);
    if (period === 'PM' && hours24 !== 12) {
      hours24 += 12;
    } else if (period === 'AM' && hours24 === 12) {
      hours24 = 0;
    }
    
    return `${hours24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  const current = convert24to12(value || '');
  const [hour, setHour] = React.useState(current.hour);
  const [minute, setMinute] = React.useState(current.minute);
  const [period, setPeriod] = React.useState<'AM' | 'PM'>(current.period as 'AM' | 'PM');

  // Sincronizar cuando cambie el value externo
  React.useEffect(() => {
    const newCurrent = convert24to12(value || '');
    setHour(newCurrent.hour);
    setMinute(newCurrent.minute);
    setPeriod(newCurrent.period as 'AM' | 'PM');
  }, [value]);

  // Notificar cambios
  React.useEffect(() => {
    if (hour && minute) {
      const time24 = convert12to24(hour, minute, period);
      onChange?.(time24);
    }
  }, [hour, minute, period]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 flex gap-2">
        {/* Selector de Hora */}
        <Select value={hour} onValueChange={setHour}>
          <SelectTrigger className="w-[90px]">
            <SelectValue placeholder="Hora">
              {hour || <span className="text-muted-foreground">Hora</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-2xl font-semibold text-muted-foreground">:</span>

        {/* Selector de Minutos */}
        <Select value={minute} onValueChange={setMinute}>
          <SelectTrigger className="w-[90px]">
            <SelectValue placeholder="Min">
              {minute || <span className="text-muted-foreground">Min</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector AM/PM */}
        <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Clock className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
