import React, { useState } from 'react';
import './Cockroach.css';

import cockroachImage from './images/cockroach.png';
import cockroachBadImage from './images/cockroach_bad.png';
import cockroachSpecialImage from './images/cockroach_special.png';

function Cockroach({ id, direction, type, position, duration, onClick }) {
  const [isExploding, setIsExploding] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });

  let wrapperStyle = {};
  let imageStyle = {};
  let animationClass = '';

  wrapperStyle.animationDuration = `${duration}s`;

  if (direction === 'top') {
    wrapperStyle.left = `${position}%`;
    wrapperStyle.top = '-50px';
    animationClass = 'moveDown';
    imageStyle.transform = 'rotate(180deg)';   // ← 追加（下向きにする）
  } else if (direction === 'bottom') {
    wrapperStyle.left = `${position}%`;
    wrapperStyle.bottom = '-50px';
    animationClass = 'moveUp';
  } else if (direction === 'left') {
    wrapperStyle.top = `${position}%`;
    wrapperStyle.left = '-50px';
    animationClass = 'moveRight';
    imageStyle.transform = 'rotate(90deg)';
  } else if (direction === 'right') {
    wrapperStyle.top = `${position}%`;
    wrapperStyle.right = '-50px';
    animationClass = 'moveLeft';
    imageStyle.transform = 'rotate(-90deg)';
  }

  let imageSrc = cockroachImage;
  let altText = 'Cockroach';

  if (type === 'bad') {
    imageSrc = cockroachBadImage;
    altText = 'Bad Cockroach';
  } else if (type === 'special') {
    imageSrc = cockroachSpecialImage;
    altText = 'Special Cockroach';
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (isExploding) return;

    // 画面全体に対するクリック位置（clientX / clientY）をそのまま保存
    setClickPos({ x: e.clientX, y: e.clientY });
    setIsExploding(true);

    setTimeout(() => {
      onClick(id, type);
    }, 400);
  };

  return (
    <>
<div 
  className={`cockroach-wrapper ${animationClass}`} 
  style={wrapperStyle}
  onClick={handleClick}
>
  <div className="cockroach-wiggle">
    <img 
      src={imageSrc} 
      alt={altText} 
      className="cockroach-image" 
      style={imageStyle} 
    />
  </div>
</div>

      {/* エフェクトをコンテナの外に固定配置し、ズレを完全に排除 */}
      {isExploding && (
        <div 
          className="global-explosion-effect" 
          style={{ left: `${clickPos.x}px`, top: `${clickPos.y}px` }}
        >
          💥
        </div>
      )}
    </>
  );
}

export default Cockroach;