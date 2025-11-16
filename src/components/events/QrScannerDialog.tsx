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
import { Camera, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (data: string) => void;
}

// Helper function to validate QR format
function isValidEventQR(qrData: string): boolean {
  const parts = qrData.split('|');
  // Must have exactly 2 parts: eventId and qrToken
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

export function QrScannerDialog({ isOpen, onOpenChange, onScanSuccess }: QrScannerDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const getCameraPermission = async () => {
      if (!isOpen) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        setIsScanning(true);
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
                    // Validate QR format before accepting
                    if (!isValidEventQR(code.data)) {
                        // Ignore invalid QR codes, keep scanning
                        animationFrameId = requestAnimationFrame(tick);
                        return;
                    }
                    
                    // Valid QR detected - Visual feedback
                    setScanSuccess(true);
                    setIsScanning(false);
                    
                    // Play success sound (beep)
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800; // Higher frequency for success
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    
                    // Delay before calling success callback
                    setTimeout(() => {
                      onScanSuccess(code.data);
                      onOpenChange(false);
                    }, 500);
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
      setIsScanning(false);
      setScanSuccess(false);
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
            
            {/* Success Overlay */}
            {scanSuccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/80 text-white animate-in fade-in duration-300">
                    <CheckCircle2 className="h-16 w-16 mb-2 animate-pulse" />
                    <h3 className="text-xl font-bold">¡Código QR Detectado!</h3>
                </div>
            )}
            
            {/* Camera Permission Error */}
            {hasCameraPermission === false && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                    <Camera className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-bold">Cámara no disponible</h3>
                    <p className="text-center text-sm">Por favor, permite el acceso a la cámara para escanear el código QR.</p>
                 </div>
            )}
            
            {/* QR Code Finder Overlay - Only show when scanning */}
            {isScanning && !scanSuccess && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary animate-pulse" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary animate-pulse" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary animate-pulse" />
                  
                  {/* Center square */}
                  <div className="absolute inset-4 border-2 border-dashed border-primary/50 rounded-lg" />
                </div>
                
                {/* Scanning instruction */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-sm font-medium text-white bg-black/60 rounded-full px-4 py-2 inline-block">
                    Apunta al código QR del evento
                  </p>
                </div>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
