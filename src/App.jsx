import React, { useState, useEffect } from 'react';
import './App.css';
import Cockroach from './Cockroach';

// 画像ファイルのインポート（背景や猫の表示用）
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

  // ゲームプレイ中のタイマー管理 ＆ ターゲット自動生成
  useEffect(() => {
    if (gameState !== 'playing') return;

    // 1秒ごとのカウントダウン
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 60秒経過時のタイムアップ処理
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

    // ★ターゲット（ゴキブリ）の出現ループ処理
    const spawnInterval = setInterval(() => {
      const id = Date.now() + Math.random(); // 重複を防ぐ固有ID
      const directions = ['top', 'bottom', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const type = cockroachTypes[Math.floor(Math.random() * cockroachTypes.length)];

      const isHardMode = timeLeft <= 30; // 30秒経過判定
      
      // ★【バグ修正】通常時もCSSアニメーションが途切れない適切なスピード（3.5〜5.0秒）に加速修正
      // ハードモード時はさらに超高速（1.5〜2.5秒）に狂暴化
      const baseDuration = isHardMode ? (Math.random() * 1.0 + 1.5) : (Math.random() * 1.5 + 3.5);

      const newCockroach = {
        id,
        direction,
        type,
        position: Math.random() * 60 + 20, // 画面中央寄りに生成
        duration: baseDuration,
        isReverse: isHardMode && Math.random() > 0.5 // ハードモードは50%の確率で折り返す
      };

      setCockroaches((prev) => [...prev, newCockroach]);

      // 画面を通り過ぎたら自動で配列から消去
      setTimeout(() => {
        setCockroaches((prev) => prev.filter((c) => c.id !== id));
      }, (newCockroach.duration + 0.5) * 1000);

    // ★【バランス調整】通常時は1.2秒に1匹、30秒以降のハードモードは0.6秒に1匹のハイペースで出現
    }, isHardMode ? 600 : 1200); 

    return () => {
      clearTimeout(timer);
      clearInterval(spawnInterval);
      clearInterval(countdown);
    };
  }, [gameState, timeLeft, score]);

  // 的をクリックしたときのスコア加減算
  const handleCockroachClick = async (id, type) => {
    if (gameState !== 'playing') return;

    let points = 1;
    if (type === 'bad') points = -3;
    if (type === 'special') points = 2;

    const nextScore = Math.max(0, score + points);
    setScore(nextScore);
    
    // クリックしたターゲットを画面から消す
    setCockroaches((prev) => prev.filter((c) => c.id !== id));

    // 10匹退治でゲームクリア！
    if (nextScore >= 10) {
      const currentLeftTime = timeLeft;
      
      // スコアデータを本番D1へ送信して保存
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
    <div className={`game-container ${gameState === 'playing' ? 'game-floor' : ''}`} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

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
        <div className="game-field-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
          
          {/* スコア・タイマー表示 */}
          <div className="score-display" style={{ zIndex: 200, position: 'relative' }}>
            退治数: {score} / 10
            <span className={`countdown-display ${timeLeft <= 30 ? 'countdown-danger' : ''}`}>
              残り: {timeLeft} 秒 {timeLeft <= 30 ? '🔥HARD MODE' : ''}
            </span>
          </div>

          {timeLeft <= 30 && (
            <div style={{ position: 'absolute', top: '70px', left: '20px', color: 'red', fontWeight: 'bold', fontSize: '22px', textShadow: '1px 1px 3px black', zIndex: 200 }}>
              🚨 警告：動きが速くなり、折り返す奴も出現中！
            </div>
          )}

          {/* 背景のゴミ山と黒猫ロン君の配置 */}
          <div className="game-content">
            <div className="cat-header">
              <img src={blackCatImage} alt="Ron-kun" className="cat-image" />
            </div>
            <div className="garbage-display">
              <img src={trashPileImage} alt="Trash Pile" className="garbage-image" />
            </div>
          </div>

          {/* ★ターゲットのレンダリング（基準点となる箱の直下に配置） */}
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
      )}

      {/* 🎉 4. クリア画面 */}
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
