'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({ content, position = 'top' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!visible) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  const positionClasses: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-gray-700 border-4 border-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-700 border-4 border-transparent',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-gray-700 border-4 border-transparent',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-gray-700 border-4 border-transparent',
  };

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="Information"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors flex-shrink-0"
      >
        <Info className="h-2.5 w-2.5" />
      </button>

      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} w-max max-w-[220px]`}
        >
          <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 leading-relaxed shadow-lg whitespace-normal">
            {content}
          </div>
          <span className={`absolute ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
