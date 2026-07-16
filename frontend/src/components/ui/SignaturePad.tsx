import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  onClose?: () => void;
}

export default function SignaturePad({ value, onChange, onClose }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas with proper scaling for high DPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    // Get the actual display size of the canvas
    const width = containerRef.current.clientWidth || 400;
    const height = 150;

    // Set display size (CSS pixels)
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Set internal resolution (actual pixels)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Scale context for high DPI
      ctx.scale(dpr, dpr);
      
      // Set default drawing settings
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';

      setContext(ctx);

      // Load existing signature if provided
      if (value) {
        const img = new Image();
        img.src = value;
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        };
      }
    }
  }, [value]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) / dpr,
        y: (touch.clientY - rect.top) / dpr,
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) / dpr,
        y: (e.clientY - rect.top) / dpr,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!context) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawing || !context) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  const stopDrawing = (
    e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    setIsDrawing(false);
    if (context) {
      context.closePath();
    }

    // Save the canvas as image
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
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
      <div
        ref={containerRef}
        className="w-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="block w-full bg-white"
          style={{ cursor: 'crosshair', display: 'block' }}
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
