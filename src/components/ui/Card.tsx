
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, onClick, noPadding = false }) => {
  return (
    <div 
      className={`glass-card rounded-[2.5rem] transition-all duration-300 ${noPadding ? 'p-0' : 'p-6 md:p-8'} ${className} ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      {title && (
        <div className="mb-6 flex items-center justify-between px-2">
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight uppercase leading-none">{title}</h3>
          <div className="h-[2px] flex-1 bg-slate-100/50 ml-6 rounded-full"></div>
        </div>
      )}
      {children}
    </div>
  );
};
