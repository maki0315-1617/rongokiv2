import React from 'react';
import './Cockroach.css';

function Cockroach({ id, direction, type, position, duration, className, onClick }) {
  // ★ public/images/ 配下の固定URLを直接指定することで、ビルド時の暗号化を完全に回避します
  let imageSrc = '/images/cockroach.png';
  let altText = 'ゴキブリ';

  if (type === 'bad') {
    imageSrc = '/images/cockroach_bad.png';
    altText = 'バッドゴキブリ';
  }
  if (type === 'special') {
    imageSrc = '/images/cockroach_special.png';
    altText = 'スペシャルゴキブリ';
  }

  const style = {
    animationDuration: `${duration}s`,
    position: 'absolute',
    cursor: 'pointer',
    zIndex: 100,
    userSelect: 'none',
    width: '60px',  // ゲームとして叩きやすい適切なサイズに固定
    height: '60px'
  };

  // 出現方向に応じた初期位置の設定
  if (direction === 'top' || direction === 'bottom') {
    style.left = `${position}%`;
    style[direction] = '-60px';
  } else {
    style.top = `${position}%`;
    style[direction] = '-60px';
  }

  return (
    <img
      src={imageSrc}
      alt={altText}
      className={`cockroach-unit roach-${direction} ${type} ${className || ''}`}
      style={style}
      onClick={() => onClick(id, type)}
    />
  );
}

export default Cockroach;
