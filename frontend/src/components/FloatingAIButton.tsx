import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import AISustainabilitySearch from './AISustainabilitySearch';

const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[998] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed bottom-24 right-5 z-[999] w-[380px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-green-200 overflow-hidden transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <AISustainabilitySearch compact onCourseClick={() => setIsOpen(false)} />
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed bottom-6 right-5 z-[999] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95',
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        )}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Sustainability Assistant'}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <Sparkles size={22} className="text-white" />
        )}
      </button>
    </>
  );
};

export default FloatingAIButton;
