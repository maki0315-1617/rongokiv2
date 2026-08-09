import React from 'react';
import './Cockroach.css';

function Cockroach({ id, direction, type, position, duration, className, onClick }) {
  // ★画像エラーを100%回避するため、絵文字と文字を合体させて確実に物体を出現させます
  let emoji = '🪳'; // 通常ゴキブリ
  let labelText = 'ゴキ';
  let badgeColor = '#8B4513'; // 茶色

  if (type === 'bad') {
    emoji = '🦂'; // バッドゴキブリ（サソリ）
    labelText = 'バッド';
    badgeColor = '#FF0000'; // 赤色
  }
  if (type === 'special') {
    emoji = '🐝'; // スペシャルゴキブリ（ハチ）
    labelText = 'レア';
    badgeColor = '#FFD700'; // 金色
  }

  // ★【最重要】クリック面積を確実に確保するため、幅と高さをしっかりと固定します
  const style = {
    animationDuration: `${duration}s`,
    position: 'absolute',
    cursor: 'pointer',
    zIndex: 100,
    userSelect: 'none',
    width: '65px',
    height: '65px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // 出現方向に応じた初期位置の設定
  if (direction === 'top' || direction === 'bottom') {
    style.left = `${position}%`;
    style[direction] = '-70px';
  } else {
    style.top = `${position}%`;
    style[direction] = '-70px';
  }

  return (
    <div
      className={`cockroach-unit roach-${direction} ${type} ${className || ''}`}
      style={style}
      onClick={() => onClick(id, type)}
    >
      {/* 100%表示される巨大な絵文字（これで見た目を確定させます） */}
      <span style={{ fontSize: '38px', lineHeight: 1, pointerEvents: 'none' }}>{emoji}</span>
      
      {/* タイプを識別しやすくするための小さな文字ラベル */}
      <span style={{ 
        fontSize: '10px', 
        fontWeight: 'bold', 
        color: '#fff', 
        backgroundColor: badgeColor, 
        padding: '2px 5px', 
        borderRadius: '3px',
        marginTop: '2px',
        pointerEvents: 'none',
        textShadow: '1px 1px 1px black'
      }}>
        {labelText}
      </span>
    </div>
  );
}

export default Cockroach;
