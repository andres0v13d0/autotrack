import React, { useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  onClose?: () => void;
}

export default function SignaturePad({ value, onChange, onClose }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange('');
    }
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx && value) {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  }, []);

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
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
      />
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
