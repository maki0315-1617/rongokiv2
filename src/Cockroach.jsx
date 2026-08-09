import React from 'react';
import './Cockroach.css';

function Cockroach({ id, direction, type, position, duration, className, onClick }) {
  let emoji = '🪳';
  let labelText = 'ゴキ';
  let badgeColor = '#8B4513';

  if (type === 'bad') {
    emoji = '🦂';
    labelText = 'バッド';
    badgeColor = '#FF0000';
  }
  if (type === 'special') {
    emoji = '🐝';
    labelText = 'レア';
    badgeColor = '#FFD700';
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(id, type);
  };

  return (
    <div
      className={`cockroach-unit roach-${direction} ${type} ${className || ''}`}
      style={{
        '--roach-duration': `${duration}s`,
        '--roach-pos': `${position}%`,
      }}
      onPointerDown={handlePointerDown}
      role="button"
      aria-label={labelText}
    >
      <span style={{ fontSize: '38px', lineHeight: 1, pointerEvents: 'none' }}>{emoji}</span>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: badgeColor,
          padding: '2px 5px',
          borderRadius: '3px',
          marginTop: '2px',
          pointerEvents: 'none',
          textShadow: '1px 1px 1px black',
        }}
      >
        {labelText}
      </span>
    </div>
  );
}

export default Cockroach;
