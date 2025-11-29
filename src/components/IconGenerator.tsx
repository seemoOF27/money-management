import { useEffect, useRef } from 'react';

interface IconGeneratorProps {
  size: number;
  fileName: string;
}

export function IconGenerator({ size, fileName }: IconGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for better quality
    const scale = 2;
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(scale, scale);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');

    // Draw background circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (size / 2) - 4, 0, Math.PI * 2);
    ctx.fill();

    // Scale factors
    const s = size / 180;

    // Draw wallet body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(37 * s, 65 * s, 106 * s, 56 * s);

    // Draw wallet flap
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(40 * s, 65 * s);
    ctx.lineTo(40 * s, 50 * s);
    ctx.quadraticCurveTo(40 * s, 42 * s, 48 * s, 42 * s);
    ctx.lineTo(132 * s, 42 * s);
    ctx.quadraticCurveTo(140 * s, 42 * s, 140 * s, 50 * s);
    ctx.lineTo(140 * s, 65 * s);
    ctx.closePath();
    ctx.fill();

    // Draw card slot
    ctx.fillStyle = 'rgba(5, 150, 105, 0.6)';
    ctx.fillRect(48 * s, 75 * s, 84 * s, 6 * s);

    // Draw Riyal symbol
    ctx.fillStyle = '#059669';
    ctx.font = `bold ${32 * s}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ر.س', 90 * s, 100 * s);

    // Draw coins
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4 * s;

    // Large coin
    ctx.beginPath();
    ctx.arc(125 * s, 108 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small coin
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(55 * s, 108 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [size]);

  const downloadIcon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow">
      <canvas ref={canvasRef} className="border border-gray-300 rounded" />
      <button
        onClick={downloadIcon}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        تحميل {fileName}
      </button>
    </div>
  );
}

export function IconGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-700 mb-6 text-center">
          توليد أيقونات PWA
        </h1>
        <p className="text-center text-gray-600 mb-8">
          اضغط على الزر تحت كل أيقونة لتحميلها، ثم ضعها في مجلد /public
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <IconGenerator size={180} fileName="icon-180.png" />
          <IconGenerator size={192} fileName="icon-192.png" />
          <IconGenerator size={512} fileName="icon-512.png" />
          <IconGenerator size={1024} fileName="icon-1024.png" />
        </div>
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-blue-700 mb-3">التعليمات:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>قم بتحميل جميع الأيقونات الأربعة</li>
            <li>ضع الملفات في مجلد <code className="bg-blue-100 px-2 py-1 rounded">/public</code></li>
            <li>أعد تشغيل التطبيق</li>
            <li>اختبر التثبيت على iOS Safari</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
