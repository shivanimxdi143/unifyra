import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  badge,
  actions,
  className = '',
  bodyClassName = '',
  footer = null,
  onClick = null,
  hoverable = false
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs transition-all ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
    >
      {(title || actions || badge) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-base font-semibold text-slate-900 tracking-tight truncate">
                  {title}
                </h3>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
