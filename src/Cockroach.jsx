import React from 'react';
import './Cockroach.css';

function Cockroach({ id, direction, type, position, duration, className, onClick }) {
  // タイプごとに色を分ける（画像がなくても判別可能にする）
  let backgroundColor = '#8B4513'; // 通常：茶色
  let label = 'ゴキ';
  if (type === 'bad') {
    backgroundColor = '#FF0000'; // バッド：赤色
    label = 'バッド';
  }
  if (type === 'special') {
    backgroundColor = '#FFD700'; // スペシャル：金色
    label = 'レア';
  }

  // 動きのアニメーションスタイル
  const style = {
    animationDuration: `${duration}s`,
    backgroundColor: backgroundColor,
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    position: 'absolute',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    zIndex: 100,
    userSelect: 'none'
  };

  // 出現方向に応じた初期位置の設定
  if (direction === 'top' || direction === 'bottom') {
    style.left = `${position}%`;
    style[direction] = '-50px';
  } else {
    style.top = `${position}%`;
    style[direction] = '-50px';
  }

  return (
    <div
      className={`cockroach-unit roach-${direction} ${type} ${className || ''}`}
      style={style}
      onClick={() => onClick(id, type)}
    >
      {label}
    </div>
  );
}

export default Cockroach;
