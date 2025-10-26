'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Request camera access
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        throw new Error('Camera not available');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning for QR codes
      startScanning();
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsScanning(false);
    setScanSuccess(false);
  };

  const startScanning = () => {
    const scan = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code && code.data) {
            // QR code detected!
            setScanSuccess(true);
            setIsScanning(false);
            
            // Wait a moment to show success animation
            setTimeout(() => {
              onScan(code.data);
            }, 500);
            return;
          }
        }
      }
      
      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(scan);
    };
    
    scan();
  };

  const handleManualInput = () => {
    stopCamera();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-md w-full overflow-hidden border border-white/20 shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
                  <p className="text-white/80 text-sm">Point camera at wallet QR code</p>
                </div>
              </div>
            </div>

            {/* Scanner Area */}
            <div className="p-6 space-y-4">
              {error ? (
                <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">Camera Error</p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square bg-black rounded-2xl overflow-hidden border-2 border-cyan-500/30">
                  {/* Video element */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  
                  {/* Scanning overlay */}
                  {isScanning && !scanSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Corner markers */}
                      <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-cyan-400 rounded-tl-lg" />
                      <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-cyan-400 rounded-tr-lg" />
                      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-cyan-400 rounded-bl-lg" />
                      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-cyan-400 rounded-br-lg" />
                      
                      {/* Scanning line */}
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                        animate={{ y: [-100, 100] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                  
                  {/* Success overlay */}
                  {scanSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="bg-green-500 rounded-full p-6"
                      >
                        <CheckCircle className="h-16 w-16 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-white/70 text-sm text-center">
                  {scanSuccess 
                    ? '✓ QR Code detected successfully!'
                    : isScanning 
                    ? 'Position the QR code within the frame'
                    : 'Initializing camera...'}
                </p>
              </div>

              {/* Manual Input Option */}
              <button
                onClick={handleManualInput}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors"
              >
                Enter Address Manually
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
