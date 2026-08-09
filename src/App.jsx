import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// シーン1〜10の設定データ
const sceneConfigs = {
  1: { time: 60, target: 10, speed: 1.0, interval: 1800 },
  2: { time: 55, target: 12, speed: 1.2, interval: 1600 },
  3: { time: 50, target: 15, speed: 1.4, interval: 1400 },
  4: { time: 45, target: 18, speed: 1.6, interval: 1200 },
  5: { time: 40, target: 20, speed: 1.8, interval: 1000 },
  6: { time: 35, target: 22, speed: 2.0, interval: 900 },
  7: { time: 30, target: 25, speed: 2.2, interval: 800 },
  8: { time: 28, target: 28, speed: 2.4, interval: 750 },
  9: { time: 25, target: 30, speed: 2.6, interval: 700 },
  10: { time: 20, target: 35, speed: 3.0, interval: 600 }
};

export default function App() {
  const [screen, setScreen] = useState('login'); // login, menu, game
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentScene, setCurrentScene] = useState(1);
  const [maxUnlockedScene, setMaxUnlockedScene] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetCount, setTargetCount] = useState(10);
  const [rankings, setRankings] = useState([]);
  
  const [roaches, setRoaches] = useState([]);
  const gameAreaRef = useRef(null);
  
  // 内部ロジック用のゴキブリ保持リスト（再描画を防ぐためのref）
  const roachesDataRef = useRef([]);

  // ローカルストレージから進行状況の読み込み
  useEffect(() => {
    const saved = localStorage.getItem('ron_max_scene');
    if (saved) {
      const parsed = parseInt(saved, 10);
      setMaxUnlockedScene(parsed);
      setCurrentScene(parsed);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!username.trim()) {
      setAuthError('ユーザー名を入力してください');
      return;
    }
    if (!password) {
      setAuthError('パスワードを入力してください');
      return;
    }

    // ログイン API 呼び出し
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setAuthError(data.error || 'ログインに失敗しました');
          return;
        }
        setUserId(data.userId || null);
        setUsername(data.username || username);
        setScreen('menu');
      })
      .catch(() => setAuthError('通信エラーが発生しました'));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!username.trim()) {
      setAuthError('ユーザー名を入力してください');
      return;
    }
    if (!password) {
      setAuthError('パスワードを入力してください');
      return;
    }

    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setAuthError(data.error || '登録に失敗しました');
          return;
        }
        alert('登録に成功しました。ログインしてください。');
        setAuthMode('login');
      })
      .catch(() => setAuthError('通信エラーが発生しました'));
  };

  // メニュー画面でランキングを取得して表示
  useEffect(() => {
    if (screen !== 'menu') return;
    let mounted = true;
    fetch('/api/ranking')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setRankings(data);
        else setRankings([]);
      })
      .catch(() => setRankings([]));
    return () => { mounted = false; };
  }, [screen]);

  const handleClearData = async () => {
    if (!confirm('データを完全に削除します。よろしいですか？（不可逆）')) return;
    const token = prompt('管理トークンを入力してください');
    if (!token) return alert('トークンが必須です');

    try {
      const res = await fetch('/api/clear-data', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (!res.ok) return alert('削除に失敗しました: ' + (data.error || res.status));
      alert('データを削除しました');
      setRankings([]);
    } catch (err) {
      alert('通信エラーが発生しました');
    }
  };

  const startGame = () => {
    const config = sceneConfigs[currentScene];
    setScore(0);
    setTimeLeft(config.time);
    setTargetCount(config.target);
    roachesDataRef.current = [];
    setRoaches([]);
    setScreen('game');
  };

  // ゲーム中のタイマーとゴキブリ出現制御
  useEffect(() => {
    if (screen !== 'game') return;

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

    const config = sceneConfigs[currentScene];
    const spawner = setInterval(() => {
      if (gameAreaRef.current) {
        const area = gameAreaRef.current;
        const maxX = area.clientWidth - 60;
        const maxY = area.clientHeight - 60;
        const newRoach = {
          id: 'roach_' + Date.now() + '_' + Math.random(),
          x: Math.random() * Math.max(maxX, 10),
          y: Math.random() * Math.max(maxY, 10),
          vx: (Math.random() - 0.5) * 4 * config.speed,
          vy: (Math.random() - 0.5) * 4 * config.speed,
        };
        roachesDataRef.current.push(newRoach);
        setRoaches([...roachesDataRef.current]);
      }
    }, config.interval);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [screen, currentScene]);

  // ゴキブリの自動移動アニメーションループ（DOMを直接書き換えて再描画競合を回避）
  useEffect(() => {
    if (screen !== 'game') return;

    let animationId;
    const updateLoop = () => {
      if (gameAreaRef.current) {
        const area = gameAreaRef.current;
        const maxX = area.clientWidth - 60;
        const maxY = area.clientHeight - 60;

        roachesDataRef.current = roachesDataRef.current.map((r) => {
          let nextX = r.x + r.vx;
          let nextY = r.y + r.vy;
          let nextVx = r.vx;
          let nextVy = r.vy;

          if (nextX <= 0 || nextX >= maxX) nextVx *= -1;
          if (nextY <= 0 || nextY >= maxY) nextVy *= -1;

          // DOM要素が存在すれば直接スタイルを書き換えて高速移動させる
          const el = document.getElementById(r.id);
          if (el) {
            el.style.left = `${nextX}px`;
            el.style.top = `${nextY}px`;
          }

          return { ...r, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
        });
      }
      animationId = requestAnimationFrame(updateLoop);
    };

    animationId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animationId);
  }, [screen]);

  // ゴキブリクリック（タップ）時のスコア加算と消去処理
  const handleRoachClick = (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Ref配列から除外
    roachesDataRef.current = roachesDataRef.current.filter((r) => r.id !== id);
    setRoaches([...roachesDataRef.current]);

    // スコアを加算
    setScore((prev) => {
      const nextScore = prev + 1;
      if (nextScore >= targetCount) {
        setTimeout(() => {
          alert(`おめでとうございます！シーン ${currentScene} クリア！`);
          if (currentScene >= maxUnlockedScene && currentScene < 10) {
            const nextMax = currentScene + 1;
            setMaxUnlockedScene(nextMax);
            localStorage.setItem('ron_max_scene', nextMax);
            setCurrentScene(nextMax);
          }
          setScreen('menu');
        }, 50);
      }
      return nextScore;
    });
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        
        {/* ログイン画面 */}
        {screen === 'login' && (
          <div>
            <img 
              src="/images/black_cat.png" 
              alt="ロンくん" 
              style={styles.profileImg} 
            />
            <h1 style={styles.h1}>ロン君のゴキ退治 v2</h1>
            <h3 style={styles.h3}>{authMode === 'login' ? 'ログイン' : '新規ユーザー登録'}</h3>
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
              {authError && <p style={{ color: 'orange', margin: '6px 0' }}>{authError}</p>}
              <button type="submit" style={styles.button}>{authMode === 'login' ? 'ログインして開始' : '登録して開始'}</button>
            </form>
            <p style={{ marginTop: '12px', cursor: 'pointer', color: '#ddd' }} onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>
              {authMode === 'login' ? '新規アカウントを作成する' : '既存のアカウントでログインする'}
            </p>
          </div>
        )}

        {/* メニュー画面 */}
        {screen === 'menu' && (
          <div>
            <img 
              src="/images/black_cat.png" 
              alt="ロンくん" 
              style={styles.profileImg} 
            />
            <h1 style={styles.h1}>シーン選択</h1>
            <p style={{ margin: '0 0 10px 0' }}>プレイヤー: {username}</p>
            <label style={styles.label}>挑戦するシーンを選んでください（1〜10）</label>
            <select 
              value={currentScene} 
              onChange={(e) => setCurrentScene(Number(e.target.value))}
              style={styles.select}
            >
              {[...Array(10)].map((_, i) => {
                const sceneNum = i + 1;
                const config = sceneConfigs[sceneNum];
                const isLocked = sceneNum > maxUnlockedScene;
                return (
                  <option key={sceneNum} value={sceneNum} disabled={isLocked}>
                    シーン {sceneNum} (制限 {config.time}秒 / 目標 {config.target}匹) {isLocked ? '【未解放】' : ''}
                  </option>
                );
              })}
            </select>
            <button onClick={startGame} style={styles.button}>ゲームスタート</button>
            <button onClick={() => setScreen('login')} style={{...styles.button, backgroundColor: '#d32f2f'}}>ログアウト</button>
            <div className="history-section">
              <h3>ランキング（Top 10）</h3>
              {rankings.length === 0 ? (
                <p style={{ margin: 0 }}>読み込み中またはデータがありません</p>
              ) : (
                <ul>
                  {rankings.map((r, i) => (
                    <li key={i}>
                      <strong>{i + 1}. {r.username}</strong> - {r.total_point}pt ({r.score} / {r.time_left})
                      <br />
                      <small style={{ color: '#ccc' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ marginTop: '12px' }}>
              <button onClick={handleClearData} style={{...styles.button, backgroundColor:'#b71c1c'}}>管理: データを全削除</button>
            </div>
          </div>
        )}

        {/* ゲーム画面 */}
        {screen === 'game' && (
          <div>
            <div style={styles.gameHeader}>
              <div>Stage {currentScene}</div>
              <div>退治数: {score} / {targetCount}</div>
              <div>残り: {timeLeft}秒</div>
            </div>

            <div ref={gameAreaRef} style={styles.gameArea}>
              {roaches.map((r) => (
                <div
                  key={r.id}
                  id={r.id}
                  onClick={(e) => handleRoachClick(r.id, e)}
                  style={{
                    ...styles.roach,
                    left: `${r.x}px`,
                    top: `${r.y}px`,
                  }}
                >
                  <img
                    src="/images/cockroach.png"
                    alt="ゴキブリ"
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                  />
                </div>
              ))}
            </div>

            <button onClick={() => setScreen('menu')} style={{...styles.button, backgroundColor: '#d32f2f', marginTop: '15px'}}>
              メニューに戻る
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// デザインスタイル
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
    marginBottom: '10px'
  },
  h1: { fontSize: '24px', margin: '10px 0 20px 0' },
  h3: { margin: '10px 0' },
  label: { display: 'block', marginBottom: '8px', textAlign: 'left', fontSize: '14px' },
  input: {
    width: '100%', padding: '12px', margin: '8px 0 16px 0',
    border: '1px solid #444', borderRadius: '6px',
    background: '#2a3e2a', color: 'white', boxSizing: 'border-box', fontSize: '16px'
  },
  select: {
    width: '100%', padding: '12px', margin: '8px 0 16px 0',
    border: '1px solid #444', borderRadius: '6px',
    background: '#2a3e2a', color: 'white', boxSizing: 'border-box', fontSize: '16px'
  },
  button: {
    width: '100%', padding: '12px', backgroundColor: '#4CAF50',
    color: 'white', border: 'none', borderRadius: '6px',
    fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
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
    touchAction: 'none'
  },
  roach: {
    position: 'absolute',
    width: '55px',
    height: '55px',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: 10
  }
};