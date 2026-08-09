import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Cockroach from './Cockroach';

// 背景用の画像インポート
import trashPileImage from './images/trash_pile.png';
import blackCatImage from './images/black_cat.png';

const cockroachTypes = ['normal', 'bad', 'special'];

function App() {
  const [gameState, setGameState] = useState('auth'); // auth, start, playing, clear, gameover
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [score, setScore] = useState(0);
  const [cockroaches, setCockroaches] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  
  // ユーザー状態
  const [user, setUser] = useState(null); 
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // ランキングデータ
  const [rankings, setRankings] = useState([]);
  const [finalScore, setFinalScore] = useState(0);

  // Strict Modeによるタイマー破壊を完全に防ぐためのRef管理
  const stateRef = useRef({ score: 0, timeLeft: 60, gameState: 'auth' });
  const userRef = useRef(null);

  useEffect(() => {
    stateRef.current = { score, timeLeft, gameState };
  }, [score, timeLeft, gameState]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ランキングを本番DBから取得する関数
  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/ranking');
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (e) {
      console.error("Failed to fetch rankings", e);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [gameState]);

  // 会員登録・ログイン処理
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || '認証エラーが発生しました');
        return;
      }

      if (authMode === 'register') {
        alert('ユーザー登録が完了しました！ログインしてください。');
        setAuthMode('login');
        setPasswordInput('');
      } else {
        setUser({ id: data.userId, username: data.username });
        setGameState('start');
      }
    } catch (e) {
      setAuthError('サーバーとの通信に失敗しました');
    }
  };

  // ゲーム中のタイマー・出現・終了処理
  useEffect(() => {
    if (gameState !== 'playing') return;

    let active = true;
    const roachTimeouts = [];

    const countdown = setInterval(() => {
      if (!active) return;
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    const spawnCockroach = () => {
      if (!active || stateRef.current.gameState !== 'playing') return;

      const currentSeconds = stateRef.current.timeLeft;
      const isHard = currentSeconds <= 30;

      if (!isHard && Math.random() < 0.35) return;

      const id = `${Date.now()}-${Math.random()}`;
      const directions = ['top', 'bottom', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const type = cockroachTypes[Math.floor(Math.random() * cockroachTypes.length)];
      const baseDuration = isHard ? (Math.random() * 0.5 + 1.2) : (Math.random() * 0.8 + 3.0);

      const newCockroach = {
        id,
        direction,
        type,
        position: Math.random() * 60 + 20,
        duration: baseDuration,
        isReverse: isHard && Math.random() > 0.5,
      };

      setCockroaches((prev) => [...prev, newCockroach]);

      const removeTimeout = setTimeout(() => {
        if (!active) return;
        setCockroaches((prev) => prev.filter((c) => c.id !== id));
      }, (newCockroach.duration + 0.5) * 1000);
      roachTimeouts.push(removeTimeout);
    };

    spawnCockroach();
    const spawnInterval = setInterval(spawnCockroach, 350);

    const timer = setTimeout(async () => {
      if (!active) return;
      const currentScore = stateRef.current.score;
      const currentUser = userRef.current;
      if (currentUser?.id) {
        try {
          await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, score: currentScore, timeLeft: 0 }),
          });
        } catch (e) {
          console.error('Failed to save score', e);
        }
      }
      setFinalScore(currentScore);
      setGameState('gameover');
      setCockroaches([]);
    }, 60000);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(spawnInterval);
      clearInterval(countdown);
      roachTimeouts.forEach(clearTimeout);
    };
  }, [gameState]);

  const handleCockroachClick = (id, type) => {
    if (stateRef.current.gameState !== 'playing') return;

    let points = 1;
    if (type === 'bad') points = -3;
    if (type === 'special') points = 2;

    setCockroaches((prev) => prev.filter((c) => c.id !== id));

    setScore((prevScore) => {
      const nextScore = Math.max(0, prevScore + points);

      if (nextScore >= 10) {
        const currentLeftTime = stateRef.current.timeLeft;
        const currentUser = userRef.current;

        if (currentUser?.id) {
          fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, score: nextScore, timeLeft: currentLeftTime }),
          })
            .then((res) => res.json())
            .then((data) => setFinalScore(data.totalPoint ?? nextScore + currentLeftTime))
            .catch(() => setFinalScore(nextScore + currentLeftTime));
        } else {
          setFinalScore(nextScore + currentLeftTime);
        }

        setGameState('clear');
        setCockroaches([]);
      }

      return nextScore;
    });
  };

  const startGame = () => {
    setScore(0);
    setCockroaches([]);
    setTimeLeft(60);
    setGameState('playing');
  };
  return (
    <div className={`game-container ${gameState === 'playing' ? 'game-floor' : ''}`}>

      {/* 🔐 1. ログイン / ユーザー登録 画面 */}
      {gameState === 'auth' && (
        <div className="start-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
          </div>
          <h1>ロン君のゴキ退治 v2</h1>
          <h3>{authMode === 'login' ? 'ログイン' : '新規ユーザー登録'}</h3>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="ユーザー名 (半角英数字)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', color: '#000', background: '#fff' }}
              required
            />
            <input
              type="password"
              placeholder="パスワード"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', color: '#000', background: '#fff' }}
              required
            />
            {authError && <p style={{ color: 'red', margin: 0 }}>{authError}</p>}
            <button type="submit" className="start-button">
              {authMode === 'login' ? 'ログインして開始' : '登録する'}
            </button>
          </form>

          <p style={{ marginTop: '20px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? '新規アカウントを作成する' : '既にアカウントをお持ちの方はこちら'}
          </p>
        </div>
      )}

      {/* 🏠 2. タイトル画面（グローバルランキング表示） */}
      {gameState === 'start' && (
        <div className="start-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
          </div>
          <h1>ロン君のゴキ退治 v2</h1>
          <p>ようこそ、<strong>{user?.username}</strong> さん！</p>
          <p className="instruction-text">1分以内で10匹退治せよ！<br/>【得点 ＝ スコア ＋ 残り秒数】のガチバトル！</p>
          <p style={{ color: 'orange', fontWeight: 'bold' }}>⚠️ 30秒を過ぎるとゴキブリが凶暴化（高速・折り返し移動）します！</p>

          <button className="start-button" onClick={startGame}>ゲームスタート</button>

          <div className="history-section" style={{ marginTop: '30px' }}>
            <h3>総合トップ10 ランキング</h3>
            {rankings.length === 0 ? (
              <p>まだ記録がありません。最初の勝者になろう！</p>
            ) : (
              <ol style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                {rankings.map((r, i) => (
                  <li key={i} style={{ marginBottom: '5px', padding: '5px', borderBottom: '1px solid #ddd' }}>
                    <strong>{i + 1}位: {r.username}</strong> - <span style={{ color: 'gold', fontWeight: 'bold' }}>{r.total_point}点</span>
                    <br/>
                    <small style={{ color: '#666' }}>(退治: {r.score}匹 / 残り: {r.time_left}秒)</small>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {/* 🎮 3. メインプレイ画面 */}
      {gameState === 'playing' && (
        <div className="game-field-wrapper">
          <div className="game-hud">
            <p className="game-hud-score">
              退治数: <strong>{score}</strong> / 10
            </p>
            <p className="game-hud-timer">
              残り時間: <strong>{timeLeft}</strong> 秒
            </p>
            {timeLeft <= 30 && (
              <p className="game-hud-alert">🔥 HARD MODE：高速 ＆ 折り返し発生中！</p>
            )}
          </div>

          <div className="game-content">
            <div className="cat-header">
              <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
            </div>
            <div className="garbage-display">
              <img src={trashPileImage} alt="Trash Pile" className="garbage-image" />
            </div>
          </div>

          <div className="cockroach-layer">
            {cockroaches.map((roach) => (
              <Cockroach
                key={roach.id}
                id={roach.id}
                direction={roach.direction}
                type={roach.type}
                position={roach.position}
                duration={roach.duration}
                className={roach.isReverse ? 'roach-reverse' : ''}
                onClick={handleCockroachClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🎉 4. クリア画面 */}
      {gameState === 'clear' && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
          </div>
          <h1>🎉 任務完了（クリア）！！ 🎉</h1>
          <p style={{ fontSize: '24px' }}>獲得ポイント: <strong style={{ color: 'orange', fontSize: '32px' }}>{finalScore}</strong> 点</p>
          <p>(スコア + 残り秒数の合算値)</p>
          <button className="start-button" onClick={startGame}>もう一度競う</button>
          <button className="start-button" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={() => setGameState('start')}>ランキングを見る</button>
        </div>
      )}

      {/* 💀 5. ゲームオーバー画面 */}
      {gameState === 'gameover' && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
          </div>
          <h1 style={{ color: 'red' }}>⏰ タイムアップ</h1>
          <p>1分が経過しました。しかしスコアは保存されました！</p>
          <p style={{ fontSize: '22px' }}>獲得ポイント: <strong>{finalScore}</strong> 点</p>
          <button className="start-button" onClick={startGame}>リベンジする</button>
          <button className="start-button" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={() => setGameState('start')}>ランキングを見る</button>
        </div>
      )}
    </div>
  );
}

export default App;
