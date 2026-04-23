import React, { useState, useEffect } from 'react';

interface FizzyButtonProps {
  label: string;
  onClick?: () => void;
  className?: string;
  id?: string;
}

export const FizzyButton: React.FC<FizzyButtonProps> = ({ label, onClick, className = "", id }) => {
  const [isChecked, setIsChecked] = useState(false);
  const buttonId = id || `fizzy-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
    if (e.target.checked) {
      // Simulate the process and trigger callback
      setTimeout(() => {
        if (onClick) onClick();
        setIsChecked(false); // Reset for next interaction
      }, 5000);
    }
  };

  return (
    <div className={`fizzy-button-root ${className}`}>
      <input 
        type="checkbox" 
        id={buttonId} 
        checked={isChecked}
        onChange={handleChange}
      />
      <label htmlFor={buttonId}>
        <div className="fizzy-button-inner">
          <span className="t">{isChecked ? 'Manifesting...' : label}</span>
          
          {/* Neural Spots Manifest */}
          {[...Array(52)].map((_, i) => {
            const delay = Math.random() * 0.5;
            const duration = 0.5 + Math.random() * 1;
            const size = 2 + Math.random() * 4;
            const hue = 220 + Math.random() * 60; // Indigo/Blue spectrum
            
            // Random positions for "spewing"
            const x = (Math.random() - 0.5) * 150;
            const y = (Math.random() - 0.5) * 100;

            return (
              <div 
                key={i}
                className="fizzy-button-spots"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: `hsla(${hue}, 80%, 60%, 1)`,
                  boxShadow: `0 0 8px hsla(${hue}, 80%, 60%, 0.5)`,
                  left: '50%',
                  top: '50%',
                  animation: isChecked ? `spew ${duration}s ${delay}s linear infinite` : 'none',
                  transform: isChecked ? `translate(${x}px, ${y}px)` : 'none'
                }}
              />
            );
          })}
        </div>
      </label>
    </div>
  );
};
