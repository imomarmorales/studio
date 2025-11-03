'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Camera } from 'lucide-react';

interface QrScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: string) => void;
}

export function QrScannerDialog({ isOpen, onOpenChange, onScanSuccess }: QrScannerDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const getCameraPermission = async () => {
      if (!isOpen) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          tick();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acceso a la Cámara Denegado',
          description: 'Por favor, habilita los permisos de la cámara en tu navegador.',
        });
        onOpenChange(false);
      }
    };
    
    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    onScanSuccess(code.data);
                    return; // Stop scanning after success
                }
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    };


    if (isOpen) {
        getCameraPermission();
    }
    

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isOpen, onScanSuccess, onOpenChange, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escanear Código QR</DialogTitle>
          <DialogDescription>
            Apunta tu cámara al código QR del evento para marcar tu asistencia.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {hasCameraPermission === false && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                    <Camera className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-bold">Cámara no disponible</h3>
                    <p className="text-center text-sm">Por favor, permite el acceso a la cámara para escanear el código QR.</p>
                 </div>
            )}
            {/* QR Code Finder Overlay */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-dashed border-primary/70 rounded-lg" />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
