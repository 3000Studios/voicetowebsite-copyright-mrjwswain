import React from 'react';

interface SplitLinkProps {
  children: React.ReactNode;
  className?: string;
}

export const SplitLink: React.FC<SplitLinkProps> = ({ children, className = "" }) => {
  return (
    <div className={`split-link ${className}`}>
      <span className="link--text">{children}</span>
    </div>
  );
};
