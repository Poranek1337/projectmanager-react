import React from 'react';

export const TabBar = ({ children, className = '', ...props }) => {
  const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
  return (
    <div className={`flex border-b ${isElectron ? 'bg-white/50 backdrop-blur-md' : 'bg-white'} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default TabBar; 