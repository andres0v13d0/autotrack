import React, { useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import SignaturePadLib from 'signature_pad';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  onClose?: () => void;
}

export default function SignaturePad({ value, onChange, onClose }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize SignaturePad
    const signaturePad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16,
      minDistance: 5,
    });

    signaturePadRef.current = signaturePad;

    // Handle empty state changes
    canvas.addEventListener('endStroke', () => {
      onChange(signaturePad.toDataURL('image/png'));
    });

    // Load existing signature if provided
    if (value) {
      signaturePad.fromDataURL(value, { ratio: window.devicePixelRatio || 1 });
    }

    // Resize canvas to fit container
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      // Redraw signature if exists
      if (value) {
        signaturePad.fromDataURL(value, { ratio });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('endStroke', () => {});
    };
  }, [value, onChange]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      onChange('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-900">Firma del Cliente</label>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={18} className="text-gray-600" />
          </button>
        )}
      </div>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white" style={{ height: '200px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{
            display: 'block',
            cursor: 'crosshair',
            WebkitTouchCallout: 'none',
          } as React.CSSProperties}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearSignature}
          className="flex-1 px-3 py-2 text-sm rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
          }}
          className="flex-1 px-3 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#10b981' }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
