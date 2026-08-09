import React, { useState, useEffect, useRef } from 'react';

// シーンごとの設定データ
const sceneConfigs = {
  1: { time: 60, target: 10, speed: 1.0 },
  2: { time: 55, target: 12, speed: 1.2 },
  3: { time: 50, target: 15, speed: 1.4 },
  4: { time: 45, target: 18, speed: 1.6 },
  5: { time: 40, target: 20, speed: 1.8 },
  6: { time: 35, target: 22, speed: 2.0 },
  7: { time: 30, target: 25, speed: 2.2 },
  8: { time: 28, target: 28, speed: 2.4 },
  9: { time: 25, target: 30, speed: 2.6 },
  10: { time: 20, target: 35, speed: 3.0 }
};

export default function App() {
  const [screen, setScreen] = useState('login'); // login, menu, game, ranking
  const [username, setUsername] = useState('');
  const [selectedScene, setSelectedScene] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetCount, setTargetCount] = useState(10);
  
  const [roaches, setRoaches] = useState([]);
  const gameAreaRef = useRef(null);
  const requestRef = useRef(null);

  // ログイン処理
  const handleLogin = (e) => {
    e.preventDefault();
    setScreen('menu');
  };

  // ゲームスタート
  const startGame = () => {
    const config = sceneConfigs[selectedScene];
    setSelectedScene(selectedScene);
    setTimeLeft(config.time);
    setTargetCount(config.target);
    setScore(0);
    setRoaches([]);
    setScreen('game');
  };

  // ゲーム中のタイマーとゴキブリ出現
  useEffect(() => {
    if (screen !== 'game') return;

    // 制限時間タイマー
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('時間切れです…！もう一度挑戦してください。');
          setScreen('menu');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ゴキブリ自動発生
    const config = sceneConfigs[selectedScene];
    const spawner = setInterval(() => {
      if (gameAreaRef.current) {
        const area = gameAreaRef.current;
        const maxX = area.clientWidth - 50;
        const maxY = area.clientHeight - 50;
        const newRoach = {
          id: Date.now() + Math.random(),
          x: Math.random() * maxX,
          y: Math.random() * maxY,
          vx: (Math.random() - 0.5) * 4 * config.speed,
          vy: (Math.random() - 0.5) * 4 * config.speed,
        };
        setRoaches((prev) => [...prev, newRoach]);
      }
    }, Math.max(800, 2000 - (selectedScene * 120)));

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [screen, selectedScene]);

  // ゴキブリのランダム移動アニメーションループ
  useEffect(() => {
    if (screen !== 'game') return;

    const updateLoop = () => {
      if (gameAreaRef.current) {
        const area = gameAreaRef.current;
        const maxX = area.clientWidth - 50;
        const maxY = area.clientHeight - 50;

        setRoaches((prevRoaches) =>
          prevRoaches.map((r) => {
            let nextX = r.x + r.vx;
            let nextY = r.y + r.vy;
            let nextVx = r.vx;
            let nextVy = r.vy;

            if (nextX <= 0 || nextX >= maxX) nextVx *= -1;
            if (nextY <= 0 || nextY >= maxY) nextVy *= -1;

            if (Math.random() < 0.03) {
              nextVx += (Math.random() - 0.5) * 2;
              nextVy += (Math.random() - 0.5) * 2;
            }

            return { ...r, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
          })
        );
      }
      requestRef.current = requestAnimationFrame(updateLoop);
    };

    requestRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [screen]);

  // ゴキブリをタップ/クリックした時の処理
  const handleRoachClick = (id) => {
    setScore((prev) => {
      const nextScore = prev + 1;
      const config = sceneConfigs[selectedScene];
      if (nextScore >= config.target) {
        alert(`おめでとうございます！シーン ${selectedScene} クリア！`);
        if (selectedScene < 10) {
          setSelectedScene(selectedScene + 1);
        }
        setScreen('menu');
      }
      return nextScore;
    });

    setRoaches((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        
        {/* ログイン画面 */}
        {screen === 'login' && (
          <div>
            <img 
              src="images/ron.jpg" 
              alt="ロンくん" 
              style={styles.profileImg} 
              onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150&auto=format&fit=crop&q=80'} 
            />
            <h1 style={styles.h1}>ロン君のゴキ退治 v2</h1>
            <h3 style={styles.h3}>ログイン</h3>
            <form onSubmit={handleLogin}>
              <input 
                type="text" 
                placeholder="ユーザー名 (半角英数字)" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
              <input 
                type="password" 
                placeholder="パスワード" 
                style={styles.input}
              />
              <button type="submit" style={styles.button}>ログインして開始</button>
            </form>
            <span style={styles.linkText} onClick={() => setScreen('menu')}>
              ゲストとして遊ぶ / メニューへ
            </span>
          </div>
        )}

        {/* メニュー・シーン選択画面 */}
        {screen === 'menu' && (
          <div>
            <img 
              src="images/ron.jpg" 
              alt="ロンくん" 
              style={styles.profileImg} 
              onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150&auto=format&fit=crop&q=80'} 
            />
            <h1 style={styles.h1}>シーン選択</h1>
            <label style={styles.label}>挑戦するシーンを選んでください</label>
            <select 
              value={selectedScene} 
              onChange={(e) => setSelectedScene(Number(e.target.value))}
              style={styles.select}
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  シーン {i + 1} (制限 {sceneConfigs[i + 1].time}秒 / 目標 {sceneConfigs[i + 1].target}匹)
                </option>
              ))}
            </select>
            <button onClick={startGame} style={styles.button}>ゲームスタート</button>
            <button onClick={() => setScreen('ranking')} style={{...styles.button, backgroundColor: '#2196F3'}}>ランキングを見る</button>
          </div>
        )}

        {/* ゲーム画面 */}
        {screen === 'game' && (
          <div>
            {/* スコアとタイムが重ならないようにflexboxで左右に配置 */}
            <div style={styles.gameHeader}>
              <span>Stage {selectedScene}</span>
              <span>退治数: {score} / {targetCount}</span>
              <span>残り: {timeLeft}秒</span>
            </div>
            
            <div ref={gameAreaRef} style={styles.gameArea}>
              {roaches.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleRoachClick(r.id)}
                  style={{
                    ...styles.roach,
                    left: `${r.x}px`,
                    top: `${r.y}px`,
                    backgroundImage: "url('images/roach.png')",
                  }}
                  onPointerDown={(e) => {
                    // タップやクリックのすり抜け防止
                    e.stopPropagation();
                    handleRoachClick(r.id);
                  }}
                >
                  {/* 画像がない場合の絵文字フォールバック */}
                  <span style={{ fontSize: '32px', lineHeight: '50px' }}>🪳</span>
                </div>
              ))}
            </div>

            <button onClick={() => setScreen('menu')} style={{...styles.button, backgroundColor: '#d32f2f', marginTop: '15px'}}>
              メニューに戻る
            </button>
          </div>
        )}

        {/* ランキング画面 */}
        {screen === 'ranking' && (
          <div>
            <h1 style={styles.h1}>プレイヤーランキング</h1>
            <ul style={styles.rankingList}>
              <li style={styles.rankingItem}><span>1位: ロンマニア</span><span>シーン 10クリア</span></li>
              <li style={styles.rankingItem}><span>2位: {username || 'ゲスト'}</span><span>シーン {selectedScene}挑戦中</span></li>
              <li style={styles.rankingItem}><span>3位: ゴキハンター</span><span>シーン 5クリア</span></li>
            </ul>
            <button onClick={() => setScreen('menu')} style={styles.button}>メニューに戻る</button>
          </div>
        )}

      </div>
    </div>
  );
}

// スタイル定義
const styles = {
  body: {
    backgroundColor: '#112211',
    color: '#ffffff',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    margin: 0,
    boxSizing: 'border-box'
  },
  container: {
    width: '100%',
    maxWidth: '480px',
    background: '#1a2e1a',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    padding: '20px',
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  profileImg: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #4CAF50',
    marginBottom: '10px',
    backgroundColor: '#333'
  },
  h1: { fontSize: '24px', margin: '10px 0 20px 0' },
  h3: { margin: '10px 0' },
  label: { display: 'block', marginBottom: '8px', textAlign: 'left', fontSize: '14px' },
  input: {
    width: '100%',
    padding: '12px',
    margin: '8px 0 16px 0',
    border: '1px solid #444',
    borderRadius: '6px',
    background: '#2a3e2a',
    color: 'white',
    boxSizing: 'border-box',
    fontSize: '16px'
  },
  select: {
    width: '100%',
    padding: '12px',
    margin: '8px 0 16px 0',
    border: '1px solid #444',
    borderRadius: '6px',
    background: '#2a3e2a',
    color: 'white',
    boxSizing: 'border-box',
    fontSize: '16px'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  linkText: {
    color: '#81C784',
    cursor: 'pointer',
    marginTop: '15px',
    display: 'inline-block',
    fontSize: '14px',
    textDecoration: 'underline'
  },
  gameHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#112211',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontWeight: 'bold',
    fontSize: '15px'
  },
  gameArea: {
    position: 'relative',
    width: '100%',
    height: '360px',
    background: '#0d1a0d',
    border: '2px solid #335533',
    borderRadius: '8px',
    overflow: 'hidden',
    touchAction: 'manipulation'
  },
  roach: {
    position: 'absolute',
    width: '50px',
    height: '50px',
    cursor: 'pointer',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transform: 'translate(-50%, -50%)',
    userSelect: 'none'
  },
  rankingList: {
    listStyle: 'none',
    padding: 0,
    margin: '15px 0',
    textAlign: 'left',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  rankingItem: {
    padding: '8px 10px',
    borderBottom: '1px solid #335533',
    fontSize: '15px',
    display: 'flex',
    justifyContent: 'space-between'
  }
};