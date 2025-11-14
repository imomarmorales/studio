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
        <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="relative px-6 pt-6 pb-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full z-50 bg-background/80 hover:bg-background"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <DialogTitle className="pr-12 text-lg">Gestionar QR</DialogTitle>
            <DialogDescription className="text-sm">
              {event.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex flex-col items-center gap-3">
              {/* QR Code */}
              <div className={cn(
                "border-4 p-3 rounded-lg bg-white transition-all w-full max-w-[280px]",
                event.qrValid ? "border-green-500" : "border-red-500 opacity-50"
              )}>
                <Image
                  src={qrCodeUrl}
                  alt={`Código QR para ${event.title}`}
                  width={280}
                  height={280}
                  className="rounded-lg w-full h-auto"
                />
                {!event.qrValid && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ban className="h-20 w-20 text-red-500 opacity-50" />
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <Badge 
                variant={event.qrValid ? "default" : "destructive"}
                className="text-sm px-4 py-1.5"
              >
                {event.qrValid ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    QR Válido
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    QR Invalidado
                  </>
                )}
              </Badge>

              {/* Info */}
              <div className="text-xs text-muted-foreground text-center space-y-1 w-full">
                <p className="break-all"><strong>ID:</strong> {event.id}</p>
                <p className="break-all"><strong>Token:</strong> <code className="bg-muted px-2 py-0.5 rounded text-xs">{event.qrToken}</code></p>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="border-t px-6 py-4 bg-background space-y-3">
            {/* Download/Print */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadQR} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button onClick={handlePrintQR} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>

            {/* Regenerate/Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowRegenerateConfirm(true)}
                variant="secondary"
                size="sm"
                disabled={isRegenerating || isTogglingValidity}
                type="button"
              >
                {isRegenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerar
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
                {isTogglingValidity ? 'Cargando...' : event.qrValid ? 'Invalidar' : 'Reactivar'}
              </Button>
            </div>
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
