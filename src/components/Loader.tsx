export function Loader({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-200 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <p className="text-gray-700">{text}</p>
      </div>
    </div>
  );
}

export function ButtonLoader() {
  return (
    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  );
}
