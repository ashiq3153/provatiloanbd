import { useAppStore } from '../lib/store';

export default function PlaceholderPage({ title }: { title: string }) {
  const { language } = useAppStore();
  const isBn = language === 'bn';

  return (
    <div className="flex flex-col items-center justify-center h-full p-5 text-center pt-20 transition-colors">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm transition-colors">
        🚧
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">
        {isBn ? 'এই পেইজটি তৈরির কাজ চলছে।' : 'This page is under construction.'}
      </p>
    </div>
  );
}
