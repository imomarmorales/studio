'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function getTodayWithTime(hour: number, minute: number = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function generateQRToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

const eventosEjemplo = [
  {
    title: "Conferencia Inaugural - Futuro de la Tecnología",
    description: "Charla magistral sobre las tendencias tecnológicas que marcarán la próxima década. Exploraremos IA, blockchain, computación cuántica y más.",
    dateTime: getTodayWithTime(9, 0),
    endDateTime: getTodayWithTime(10, 30),
    location: "Auditorio Principal",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    pointsPerAttendance: 150,
    qrToken: generateQRToken(),
    qrValid: true,
    speakers: ["Dr. Carlos Rodríguez"],
    duration: "1.5 horas"
  },
  {
    title: "Taller: Machine Learning Práctico",
    description: "Taller hands-on donde aprenderás los conceptos básicos de ML con ejemplos prácticos en Python y scikit-learn.",
    dateTime: getTodayWithTime(11, 0),
    endDateTime: getTodayWithTime(13, 0),
    location: "Laboratorio A-203",
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
    pointsPerAttendance: 200,
    qrToken: generateQRToken(),
    qrValid: true,
    speakers: ["Dra. Ana Martínez", "Ing. Pedro López"],
    duration: "2 horas"
  },
  {
    title: "Panel: Ética en Inteligencia Artificial",
    description: "Mesa redonda con expertos discutiendo los desafíos éticos de la IA moderna y su impacto en la sociedad.",
    dateTime: getTodayWithTime(14, 0),
    endDateTime: getTodayWithTime(15, 30),
    location: "Sala de Conferencias B",
    imageUrl: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80",
    pointsPerAttendance: 100,
    qrToken: generateQRToken(),
    qrValid: true,
    speakers: ["Panel de Expertos en IA"],
    duration: "1.5 horas"
  },
  {
    title: "Workshop: CI/CD con GitHub Actions",
    description: "Aprende a automatizar tus despliegues con pipelines modernos usando GitHub Actions, Docker y Kubernetes.",
    dateTime: getTodayWithTime(16, 0),
    endDateTime: getTodayWithTime(18, 0),
    location: "Laboratorio B-105",
    imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
    pointsPerAttendance: 200,
    qrToken: generateQRToken(),
    qrValid: true,
    speakers: ["Ing. Roberto Sánchez"],
    duration: "2 horas"
  },
  {
    title: "Networking & Coffee Break",
    description: "Momento para conectar con otros participantes, compartir experiencias y disfrutar de un café. Oportunidad perfecta para hacer networking.",
    dateTime: getTodayWithTime(18, 30),
    endDateTime: getTodayWithTime(19, 30),
    location: "Jardín Central",
    imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    pointsPerAttendance: 50,
    qrToken: generateQRToken(),
    qrValid: true,
    speakers: [],
    duration: "1 hora"
  }
];

export function ImportarEventosEjemplo() {
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ exitosos: number; errores: number } | null>(null);

  const importarEventos = async () => {
    if (!firestore) {
      alert('Firebase no está inicializado');
      return;
    }

    setLoading(true);
    setResultado(null);

    let exitosos = 0;
    let errores = 0;

    for (const evento of eventosEjemplo) {
      try {
        await addDoc(collection(firestore, 'events'), evento);
        console.log(`✅ Agregado: ${evento.title}`);
        exitosos++;
      } catch (error) {
        console.error(`❌ Error al agregar ${evento.title}:`, error);
        errores++;
      }
    }

    setResultado({ exitosos, errores });
    setLoading(false);

    if (exitosos > 0) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-blue-900 dark:text-blue-100">
          🚀 Importar Eventos de Ejemplo
        </CardTitle>
        <CardDescription>
          Agrega 5 eventos de prueba para ver cómo funciona el itinerario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-2">
          <p>Se agregarán estos eventos para HOY:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>09:00 - Conferencia Inaugural (150 pts)</li>
            <li>11:00 - Taller ML (200 pts)</li>
            <li>14:00 - Panel IA (100 pts)</li>
            <li>16:00 - Workshop CI/CD (200 pts)</li>
            <li>18:30 - Networking (50 pts)</li>
          </ul>
        </div>

        {resultado && (
          <div className="p-4 rounded-md bg-white dark:bg-gray-900 border">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">
                {resultado.exitosos} eventos agregados
              </span>
            </div>
            {resultado.errores > 0 && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mt-2">
                <XCircle className="w-5 h-5" />
                <span>{resultado.errores} errores</span>
              </div>
            )}
            {resultado.exitosos > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Recargando página...
              </p>
            )}
          </div>
        )}

        <Button
          onClick={importarEventos}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando eventos...
            </>
          ) : (
            'Importar Eventos de Ejemplo'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Después ve a <strong>/agenda</strong> → pestaña <strong>"Mi Itinerario"</strong>
        </p>
      </CardContent>
    </Card>
  );
}
