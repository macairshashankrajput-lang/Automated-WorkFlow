import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  subtitle = 'ENTERPRISE CLOUD',
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', glyph: 'w-4 h-4', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', glyph: 'w-5 h-5', text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', glyph: 'w-7 h-7', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', glyph: 'w-9 h-9', text: 'text-2xl', sub: 'text-xs' },
    '2xl': { icon: 'w-20 h-20', glyph: 'w-12 h-12', text: 'text-3xl', sub: 'text-sm' },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Vernika Geometric Hexagon/Diamond Enterprise Crest */}
      <div
        className={`${s.icon} rounded-2xl bg-linear-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-white/30 shrink-0 relative overflow-hidden group`}
      >
        {/* Subtle interior glow */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Vernika V & Layer Geometric Brand Symbol */}
        <svg
          className={`${s.glyph} text-white drop-shadow-md`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      {showText && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-slate-900 dark:text-white tracking-tight ${s.text} font-display leading-tight`}>
              VERNIKA
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              2.0
            </span>
          </div>
          {subtitle && (
            <p className={`${s.sub} text-emerald-400 font-semibold tracking-wider uppercase leading-none mt-0.5`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
