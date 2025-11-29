import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';

function IconCanvas({ size }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const s = size / 180;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');

    // Draw background circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (size / 2) - (4 * s), 0, Math.PI * 2);
    ctx.fill();

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
      link.download = `icon-${size}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 1.0);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-100">
      <h3 className="text-center mb-4 font-semibold text-emerald-700">
        {size}×{size} بكسل
      </h3>
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="border-2 border-gray-200 rounded-lg"
          style={{ maxWidth: '200px', maxHeight: '200px', width: '100%', height: 'auto' }}
        />
      </div>
      <button
        onClick={downloadIcon}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
      >
        <Download size={20} />
        تحميل icon-{size}.png
      </button>
    </div>
  );
}

export default function IconsDownloader() {
  const downloadAll = async () => {
    const sizes = [180, 192, 512, 1024];
    for (const size of sizes) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = document.querySelector(`canvas[width="${size}"]`) as HTMLCanvasElement;
      if (canvas) {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `icon-${size}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
      }
    }
    
    // Also download app-icon.png (512x512)
    await new Promise(resolve => setTimeout(resolve, 500));
    const canvas512 = document.querySelector(`canvas[width="512"]`) as HTMLCanvasElement;
    if (canvas512) {
      canvas512.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'app-icon.png';
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-4">
            🎨 توليد أيقونات PWA
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            قم بتحميل جميع الأيقونات وضعها في مجلد <code className="bg-emerald-100 px-2 py-1 rounded">/public</code>
          </p>
          <button
            onClick={downloadAll}
            className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg text-lg font-semibold"
          >
            📥 تحميل جميع الأيقونات (5 ملفات)
          </button>
          <p className="text-sm text-gray-500 mt-2">
            سيتم تحميل: icon-180.png, icon-192.png, icon-512.png, icon-1024.png, app-icon.png
          </p>
        </div>

        {/* Warning about app-icon.png */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-center">
            ⚠️ <strong>مهم:</strong> تأكد من تحميل <code className="bg-yellow-100 px-2 py-1 rounded">app-icon.png</code> أيضاً - iOS لا يدعم SVG!
          </p>
        </div>

        {/* Icons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <IconCanvas size={180} />
          <IconCanvas size={192} />
          <IconCanvas size={512} />
          <IconCanvas size={1024} />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
            📋 التعليمات
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">1️⃣</span>
              <span>اضغط على "تحميل جميع الأيقونات" أو قم بتحميل كل أيقونة على حدة</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">2️⃣</span>
              <span>ستحصل على 5 ملفات PNG: <code className="bg-blue-100 px-2 py-1 rounded">app-icon.png</code>, <code className="bg-blue-100 px-2 py-1 rounded">icon-180.png</code>, <code className="bg-blue-100 px-2 py-1 rounded">icon-192.png</code>, <code className="bg-blue-100 px-2 py-1 rounded">icon-512.png</code>, <code className="bg-blue-100 px-2 py-1 rounded">icon-1024.png</code></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">3️⃣</span>
              <span>ضع هذه الملفات في مجلد <code className="bg-blue-100 px-2 py-1 rounded">/public</code> في مشروعك</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">4️⃣</span>
              <span>أعد تشغيل التطبيق أو أعد تحميل الصفحة</span>
            </li>
          </ol>
        </div>

        {/* iOS Instructions */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
            📱 تثبيت PWA على iPhone
          </h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex gap-3 items-start">
              <span className="text-2xl">🌐</span>
              <div>
                <p className="font-semibold">افتح التطبيق في Safari</p>
                <p className="text-sm text-gray-600">يجب استخدام Safari وليس Chrome أو متصفح آخر</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">📤</span>
              <div>
                <p className="font-semibold">اضغط زر المشاركة (Share)</p>
                <p className="text-sm text-gray-600">الزر في الأسفل (المربع مع السهم للأعلى)</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">➕</span>
              <div>
                <p className="font-semibold">اختر "أضف إلى الشاشة الرئيسية"</p>
                <p className="text-sm text-gray-600">Add to Home Screen</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold">اضغط "إضافة"</p>
                <p className="text-sm text-gray-600">الآن افتح التطبيق من الشاشة الرئيسية</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-block bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            🏠 العودة للتطبيق
          </a>
        </div>
      </div>
    </div>
  );
}
