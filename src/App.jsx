import React, { useState, useEffect } from 'react';
import './App.css';
import Cockroach from './Cockroach';
import trashPileImage from './images/trash_pile.png';
import blackCatImage from './images/black_cat.png';

const cockroachTypes = ['normal', 'bad', 'special'];

function App() {
  const [gameState, setGameState] = useState('auth'); 
  const [authMode, setAuthMode] = useState('login'); 
  const [score, setScore] = useState(0);
  const [cockroaches, setCockroaches] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [user, setUser] = useState(null); 
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [rankings, setRankings] = useState([]);
  const [finalScore, setFinalScore] = useState(0);

  // D1データベースからリアルタイムランキングを取得する関数
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

  // ユーザー登録 ＆ ログイン処理の関数
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

  // ゲームプレイ中のタイマー・ゴキブリ出現処理
  useEffect(() => {
    if (gameState !== 'playing') return;

    // 残り秒数のカウントダウン
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 60秒が経過したときのゲームオーバー処理
    const timer = setTimeout(async () => {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, score: score, timeLeft: 0 })
      });
      setFinalScore(score + 0);
      setGameState('gameover');
      setCockroaches([]);
    }, 60000);

    // ゴキブリの自動生成ロジック
    const spawnInterval = setInterval(() => {
      const id = Date.now();
      const directions = ['top', 'bottom', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const type = cockroachTypes[Math.floor(Math.random() * cockroachTypes.length)];

      // 30秒経過（残り30秒以下）で難しくなる判定
      const isHardMode = timeLeft <= 30;
      const baseDuration = isHardMode ? (Math.random() * 3.0 + 3.0) : (Math.random() * 6.0 + 10.0);

      const newCockroach = {
        id,
        direction,
        type,
        position: Math.random() * 80 + 10,
        duration: baseDuration,
        isReverse: isHardMode && Math.random() > 0.5 // ハードモードは50%で折り返す
      };

      setCockroaches((prev) => [...prev, newCockroach]);

      setTimeout(() => {
        setCockroaches((prev) => prev.filter((c) => c.id !== id));
      }, (newCockroach.duration + 2.0) * 1000);

    }, timeLeft <= 30 ? 1000 : 2000); // 30秒後は2倍出現する

    return () => {
      clearTimeout(timer);
      clearInterval(spawnInterval);
      clearInterval(countdown);
    };
  }, [gameState, timeLeft, score]);

  // ゴキブリをクリック（叩いた）ときの処理
  const handleCockroachClick = async (id, type) => {
    if (gameState !== 'playing') return;

    let points = 1;
    if (type === 'bad') points = -3;
    if (type === 'special') points = 2;

    const nextScore = Math.max(0, score + points);
    setScore(nextScore);
    setCockroaches((prev) => prev.filter((c) => c.id !== id));

    // 10匹退治したら即座にクリア
    if (nextScore >= 10) {
      const currentLeftTime = timeLeft;
      
      // スコアデータを送信
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, score: nextScore, timeLeft: currentLeftTime })
      });
      const data = await res.json();

      setFinalScore(data.totalPoint);
      setGameState('clear');
      setCockroaches([]);
    }
  };

  const startGame = () => {
    setScore(0);
    setCockroaches([]);
    setTimeLeft(60);
    setGameState('playing');
  };
  return (
    <div className={`game-container ${gameState === 'playing' ? 'game-floor' : ''}`}>

      {/* 🔐 ログイン / ユーザー登録 画面 */}
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

      {/* 🏠 タイトル・待機画面（ランキング表示） */}
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

      {/* 🎮 プレイ画面 */}
      {gameState === 'playing' && (
        <>
          <div className="score-display">
            退治数: {score} / 10
            <span className={`countdown-display ${timeLeft <= 30 ? 'countdown-danger' : ''}`}>
              残り: {timeLeft} 秒 {timeLeft <= 30 ? '🔥HARD MODE' : ''}
            </span>
          </div>

          {timeLeft <= 30 && (
            <div style={{ position: 'absolute', top: '70px', left: '20px', color: 'red', fontWeight: 'bold', fontSize: '22px', textShadow: '1px 1px 3px black' }}>
              🚨 警告：動きが速くなり、折り返す奴も出現中！
            </div>
          )}

          <div className="game-content">
            <div className="cat-header">
              <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
            </div>
            <div className="garbage-display">
              <img src={trashPileImage} alt="Trash Pile" className="garbage-image" />
            </div>
          </div>

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
        </>
      )}

      {/* 🎉 クリア画面 */}
      {gameState === 'clear' && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
          </div>
          <h1 style={{ color: 'gold' }}>🎉 任務完了（クリア）！！ 🎉</h1>
          <p style={{ fontSize: '24px' }}>獲得ポイント: <strong style={{ color: 'orange', fontSize: '32px' }}>{finalScore}</strong> 点</p>
          <p>(スコア + 残り秒数の合算値)</p>
          <button className="start-button" onClick={startGame}>もう一度競う</button>
          <button className="start-button" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={() => setGameState('start')}>ランキングを見る</button>
        </div>
      )}

      {/* 💀 ゲームオーバー画面 */}
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
