import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props}>{children}</div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-b font-semibold text-lg ${className}`} {...props}>{children}</div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold mb-2 ${className}`} {...props}>{children}</h3>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-t ${className}`} {...props}>{children}</div>
);

export default Card; 