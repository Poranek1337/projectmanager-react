import React from 'react';

export const TabBar = ({ children, className = '', ...props }) => (
  <div className={`flex border-b bg-white ${className}`} {...props}>
    {children}
  </div>
);

export default TabBar; 