'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { CongressEvent } from '@/lib/types';
import { RefreshCw, Ban, CheckCircle, Download, Printer, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { generateQRToken } from '@/lib/event-utils';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EventQrManagementDialogProps {
  event: CongressEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
}

export function EventQrManagementDialog({ event, isOpen, onOpenChange, onEventUpdated }: EventQrManagementDialogProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isTogglingValidity, setIsTogglingValidity] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  if (!event) return null;

  const qrData = `${event.id}|${event.qrToken}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}`;

  const handleRegenerateQR = async () => {
    if (!firestore || !event) return;
    setIsRegenerating(true);

    try {
      const newToken = generateQRToken(12);
      const eventRef = doc(firestore, 'events', event.id);
      await updateDoc(eventRef, {
        qrToken: newToken,
        qrValid: true, // Reactivate when regenerating
      });

      toast({
        title: '🔄 QR Regenerado',
        description: 'Se ha generado un nuevo código QR. El anterior ya no es válido.',
      });

      onEventUpdated?.();
      setShowRegenerateConfirm(false);
    } catch (error) {
      console.error('Error regenerating QR:', error);
      toast({
        variant: 'destructive',
        title: 'Error al regenerar QR',
        description: 'No se pudo regenerar el código QR.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleValidity = async () => {
    if (!firestore || !event) return;
    setIsTogglingValidity(true);

    try {
      const eventRef = doc(firestore, 'events', event.id);
      await updateDoc(eventRef, {
        qrValid: !event.qrValid,
      });

      toast({
        title: event.qrValid ? '🚫 QR Invalidado' : '✅ QR Reactivado',
        description: event.qrValid 
          ? 'El código QR ya no puede ser usado para marcar asistencia.'
          : 'El código QR ha sido reactivado.',
      });

      onEventUpdated?.();
    } catch (error) {
      console.error('Error toggling QR validity:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cambiar el estado del QR.',
      });
    } finally {
      setIsTogglingValidity(false);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR-${event.title.replace(/\s+/g, '-')}-${event.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR - ${event.title}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                font-family: Arial, sans-serif;
              }
              h1 { margin: 20px 0; }
              img { border: 4px solid #000; padding: 20px; }
              .info { margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <h1>${event.title}</h1>
            <img src="${qrCodeUrl}" alt="Código QR" />
            <div class="info">
              <p><strong>Fecha:</strong> ${new Date(event.dateTime).toLocaleDateString('es-ES')}</p>
              <p><strong>Lugar:</strong> ${event.location}</p>
              <p><strong>Puntos:</strong> ${event.pointsPerAttendance}</p>
              <p><strong>Estado:</strong> ${event.qrValid ? 'Válido' : 'Invalidado'}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="relative pr-8">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 rounded-full z-50"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle>Gestionar QR: {event.title}</DialogTitle>
            <DialogDescription>
              Descarga, imprime, regenera o invalida el código QR del evento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 p-4">
            {/* QR Code */}
            <div className={cn(
              "border-4 p-4 rounded-lg bg-white transition-all",
              event.qrValid ? "border-green-500" : "border-red-500 opacity-50"
            )}>
              <Image
                src={qrCodeUrl}
                alt={`Código QR para ${event.title}`}
                width={300}
                height={300}
                className="rounded-lg"
              />
              {!event.qrValid && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Ban className="h-24 w-24 text-red-500 opacity-50" />
                </div>
              )}
            </div>

            {/* Status Badge */}
            <Badge 
              variant={event.qrValid ? "default" : "destructive"}
              className="text-sm px-4 py-1"
            >
              {event.qrValid ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  QR Válido y Activo
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  QR Invalidado
                </>
              )}
            </Badge>

            {/* Info */}
            <div className="text-sm text-muted-foreground text-center space-y-1">
              <p><strong>ID:</strong> {event.id}</p>
              <p><strong>Token:</strong> <code className="bg-muted px-2 py-1 rounded">{event.qrToken}</code></p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button onClick={handleDownloadQR} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button onClick={handlePrintQR} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                onClick={() => setShowRegenerateConfirm(true)}
                variant="secondary"
                size="sm"
                disabled={isRegenerating || isTogglingValidity}
              >
                {isRegenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerar QR
              </Button>
              <Button
                onClick={handleToggleValidity}
                variant={event.qrValid ? "destructive" : "default"}
                size="sm"
                disabled={isRegenerating || isTogglingValidity}
                type="button"
              >
                {isTogglingValidity ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : event.qrValid ? (
                  <Ban className="mr-2 h-4 w-4" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {isTogglingValidity ? 'Procesando...' : event.qrValid ? 'Invalidar' : 'Reactivar'}
              </Button>
            </div>

            <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Regenerar Código QR?</AlertDialogTitle>
            <AlertDialogDescription>
              Se generará un nuevo código QR y el actual dejará de funcionar.
              Esta acción es útil si el QR ha sido comprometido o distribuido incorrectamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateQR}>
              Regenerar QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
