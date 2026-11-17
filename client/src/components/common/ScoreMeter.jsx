import React from 'react';

export default function ScoreMeter({ score = 0, size = 'md', showLabel = true, variant = 'badge' }) {
  const numericScore = Math.max(0, Math.min(100, Math.round(score)));

  let colorScheme = {
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    barFill: 'bg-emerald-500',
    ringStroke: '#10b981',
    label: 'Compliant'
  };

  if (numericScore < 70) {
    colorScheme = {
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
      barFill: 'bg-rose-500',
      ringStroke: '#f43f5e',
      label: 'Critical Risk'
    };
  } else if (numericScore < 90) {
    colorScheme = {
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      barFill: 'bg-amber-500',
      ringStroke: '#f59e0b',
      label: 'Needs Review'
    };
  }

  if (variant === 'bar') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1">
          {showLabel && <span className="font-medium text-slate-600">Compliance Score</span>}
          <span className="font-bold text-slate-900">{numericScore}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${colorScheme.barFill}`}
            style={{ width: `${numericScore}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'ring') {
    const radius = size === 'lg' ? 44 : 32;
    const strokeWidth = size === 'lg' ? 8 : 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (numericScore / 100) * circumference;
    const svgSize = (radius + strokeWidth) * 2;

    return (
      <div className="inline-flex flex-col items-center justify-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width={svgSize} height={svgSize} className="transform -rotate-90">
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              stroke={colorScheme.ringStroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`font-extrabold tracking-tight text-slate-900 ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
              {numericScore}%
            </span>
          </div>
        </div>
        {showLabel && (
          <span className="mt-1.5 text-xs font-semibold text-slate-600">
            {colorScheme.label}
          </span>
        )}
      </div>
    );
  }

  // Default: badge
  return (
    <div className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-lg font-bold text-xs ${colorScheme.badgeBg}`}>
      <span className="font-mono text-xs">{numericScore}%</span>
      {showLabel && <span className="font-medium text-slate-600">• {colorScheme.label}</span>}
    </div>
  );
}
