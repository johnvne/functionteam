<<<<<<< HEAD

=======
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
<<<<<<< HEAD
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, onClick, noPadding = false }) => {
  // Loại bỏ duration-300 nếu đã có hover-lift để sử dụng duration từ CSS (0.6s)
  const isHoverLift = className.includes('hover-lift');
  const transitionClass = isHoverLift ? 'transition-all' : 'transition-all duration-300';

  return (
    <div 
      className={`glass-card rounded-[2.5rem] ${transitionClass} ${noPadding ? 'p-0' : 'p-6 md:p-8'} ${className} ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      {title && (
        <div className="mb-6 flex items-center justify-between px-2">
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight uppercase leading-none">{title}</h3>
          <div className="h-[2px] flex-1 bg-slate-100/50 ml-6 rounded-full"></div>
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
=======
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, onClick }) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      {children}
    </div>
  );
};
>>>>>>> 6a4ea0e1836a66b5fbfad6a51d951a307b2cb7b9
