import React from 'react';

/**
 * Neural History Card for VoiceToWebsite
 * Part of the 3000Studios design system.
 */
export const HistoryCard = ({ fileName, date, size }) => {
  return (
    <div className="card-3000 hover:border-blue-500/50 group" style={{
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(10, 10, 15, 0.8)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}>
      <div className="flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-neural truncate w-40" style={{ 
            fontSize: '0.875rem', 
            fontWeight: 'bold', 
            color: '#eaf6ff',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '160px'
          }}>{fileName}</h4>
          <p className="text-xs text-slate-400" style={{ 
            fontSize: '0.75rem', 
            color: '#9dc7df',
            margin: '4px 0 0'
          }}>{new Date(date).toLocaleDateString()}</p>
        </div>
        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded" style={{
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#6ed8ff',
          background: 'rgba(110, 216, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          {size}
        </span>
      </div>
      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{
        marginTop: '1rem',
        display: 'flex',
        gap: '8px',
        transition: 'opacity 0.3s'
      }}>
        <button style={{
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: '#6ed8ff',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}>Download</button>
        <button style={{
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: '#9dc7df',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}>View Transcript</button>
      </div>
    </div>
  );
};
