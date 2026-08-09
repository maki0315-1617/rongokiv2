import React, { useState, useEffect } from 'react';
import './App.css';
import Cockroach from './Cockroach';
import trashPileImage from './images/trash_pile.png';
import blackCatImage from './images/black_cat.png';

const cockroachTypes = ['normal', 'bad', 'special'];

function App() {
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [cockroaches, setCockroaches] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [clearTime, setClearTime] = useState(null);
  const [history, setHistory] = useState([]);

  // カウントダウン
  const [timeLeft, setTimeLeft] = useState(60);

  // ⭐ 星システム
  const [stars, setStars] = useState(0);
  const [finalCelebration, setFinalCelebration] = useState(false);

  // 🎁 ギフト画面
  const [giftScreen, setGiftScreen] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('gameHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    // カウントダウン
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 60秒でゲームオーバー
    const timer = setTimeout(() => {
      const now = new Date();
      const dateTimeString =
        `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ` +
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const record = {
        dateTime: dateTimeString,
        seconds: 0,
        isGameOver: true
      };

      const updatedHistory = [record, ...history].slice(0, 3);
      setHistory(updatedHistory);
      localStorage.setItem('gameHistory', JSON.stringify(updatedHistory));

      setGameState('gameover');
      setCockroaches([]);
    }, 60000);

    // ゴキブリ生成
    const spawnInterval = setInterval(() => {
      const id = Date.now();
      const directions = ['top', 'bottom', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const type = cockroachTypes[Math.floor(Math.random() * cockroachTypes.length)];

      const newCockroach = {
        id,
        direction,
        type,
        position: Math.random() * 80 + 10,
        duration: Math.random() * 6.0 + 10.0,
      };

      setCockroaches((prev) => [...prev, newCockroach]);

      setTimeout(() => {
        setCockroaches((prev) => prev.filter((c) => c.id !== id));
      }, (newCockroach.duration + 2.0) * 1000);

    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(spawnInterval);
      clearInterval(countdown);
    };
  }, [gameState, history]);

  // ゴキクリック処理
  const handleCockroachClick = (id, type) => {
    if (gameState !== 'playing') return;

    setScore((prevScore) => {
      let points = 1;
      if (type === 'bad') points = -3;
      if (type === 'special') points = 2;

      const nextScore = Math.max(0, prevScore + points);

      if (nextScore >= 10) {
        const endTime = Date.now();
        const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

        const now = new Date();
        const dateTimeString =
          `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ` +
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const record = {
          dateTime: dateTimeString,
          seconds: durationSeconds,
          isGameOver: false
        };

        const updatedHistory = [record, ...history].slice(0, 3);
        setHistory(updatedHistory);
        localStorage.setItem('gameHistory', JSON.stringify(updatedHistory));

        // ⭐ 星付与ロジック
        if (durationSeconds < 60) {
          const recent = updatedHistory.slice(0, 3);
          const allClear = recent.length === 3 && recent.every(r => !r.isGameOver);

          if (allClear) {
            setStars(prev => {
              const newStars = prev + 1;

              if (newStars >= 3) {
                setFinalCelebration(true);
              }

              return newStars;
            });
          }
        }

        setClearTime(durationSeconds);
        setGameState('clear');
        setCockroaches([]);
      }

      return nextScore;
    });

    setCockroaches((prev) => prev.filter((c) => c.id !== id));
  };

  const startGame = () => {
    setScore(0);
    setCockroaches([]);
    setStartTime(Date.now());
    setClearTime(null);
    setTimeLeft(60);
    setGameState('playing');
  };

  const backToTitle = () => {
    setGameState('start');
  };

  return (
    <div className={`game-container ${gameState === 'playing' ? 'game-floor' : ''}`}>

      {/* 🎁 ギフト受け取り画面 */}
      {giftScreen && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun the Black Cat" className="cat-image" />
          </div>

          <h1 style={{ color: 'gold' }}>🎁 ギフトを受け取りました！</h1>
          <p>ロン君からのスペシャルギフトです！</p>

          <button
            className="start-button"
            onClick={() => {
              setGiftScreen(false);
              setGameState('start');
            }}
          >
            トップ画面へ戻る
          </button>

          <button
            className="start-button"
            style={{ marginTop: '10px', backgroundColor: '#555' }}
            onClick={() => {
              setGiftScreen(false);
              setGameState('gameover');
            }}
          >
            ゲーム終了画面へ
          </button>
        </div>
      )}

      {/* ⭐ 最終お祝い画面 */}
      {finalCelebration && !giftScreen && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun the Black Cat" className="cat-image" />
          </div>

          <h1 style={{ color: 'gold' }}>🎉 おめでとう！ 🎉</h1>
          <p>3回連続で1分以内クリアしました！</p>
          <p style={{ fontSize: '40px' }}>⭐ ⭐ ⭐</p>
          <p>スペシャルギフトをプレゼント！</p>

          <button
            className="start-button"
            onClick={() => {
              setGiftScreen(true);
              setFinalCelebration(false);
            }}
          >
            ギフトを受け取る
          </button>

          <button
            className="start-button"
            style={{ marginTop: '10px' }}
            onClick={() => {
              setStars(0);
              setFinalCelebration(false);
              setGameState('start');
            }}
          >
            タイトルへ戻る
          </button>
        </div>
      )}

      {/* タイトル画面 */}
      {gameState === 'start' && !finalCelebration && !giftScreen && (
        <div className="start-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun the Black Cat" className="cat-image" />
          </div>

          <h1>ロン君のゴキ退治</h1>
          <p className="instruction-text">1分以内でゴキを10匹退治してね</p>

          {/* ⭐ 星表示 */}
          {stars > 0 && (
            <p style={{ fontSize: '24px', color: 'gold' }}>
              現在の星：{'⭐'.repeat(stars)}
            </p>
          )}

          {/* ⭐ ギフト案内 */}
          <p style={{ fontSize: '20px', marginTop: '10px', color: 'gold' }}>
            星を3個獲得してギフトをもらおう！
          </p>

          <button className="start-button" onClick={startGame}>ゲームスタート</button>

          <div className="history-section">
            <h3>過去のクリア記録 (直近3回)</h3>
            {history.length === 0 ? (
              <p>まだ記録はありません</p>
            ) : (
              <ul>
                {history.map((item, index) => (
                  <li key={index} style={{ color: item.isGameOver ? 'red' : 'inherit' }}>
                    {item.dateTime} - {item.isGameOver ? 'ゲームオーバー' : `タイム: ${item.seconds}秒`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* プレイ画面 */}
      {gameState === 'playing' && (
        <>
          <div className="score-display">
            スコア: {score} / 10
            <span
              className={
                timeLeft <= 5
                  ? 'countdown-display countdown-danger'
                  : timeLeft <= 10
                  ? 'countdown-display countdown-warning'
                  : 'countdown-display'
              }
            >
              残り: {timeLeft} 秒
            </span>
          </div>

          {timeLeft <= 10 && (
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '20px',
              color: 'red',
              fontWeight: 'bold',
              fontSize: '20px',
              textShadow: '1px 1px 3px black'
            }}>
              急いで！あと {timeLeft} 秒！
            </div>
          )}

          <div className="game-content">
            <p className="warning-text">注意：バットゴキブリはマイナスになるから気を付けて！</p>
            <div className="cat-header">
              <img src={blackCatImage} alt="Ron-kun the Black Cat" className="cat-image" />
            </div>

            <div className="garbage-display">
              <img
                src={trashPileImage}
                alt="Trash Pile"
                className="garbage-image"
              />
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
              onClick={handleCockroachClick}
            />
          ))}
        </>
      )}

      {/* クリア画面 */}
      {gameState === 'clear' && !finalCelebration && !giftScreen && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun the Black Cat" className="cat-image" />
          </div>
          <h1>ゲームクリア！！</h1>
          <p>クリアタイム: <strong>{clearTime}</strong> 秒</p>
          <button className="start-button" onClick={startGame}>もう一度プレイ</button>
          <button className="start-button" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={backToTitle}>タイトルに戻る</button>
        </div>
      )}

      {/* ゲームオーバー画面 */}
      {gameState === 'gameover' && !giftScreen && (
        <div className="clear-screen">
          <div className="cat-header">
            <img src={blackCatImage} alt="Ron-kun the Black Cat" className="cat-image" />
          </div>
          <h1 style={{ color: 'red' }}>ゲームオーバー</h1>
          <p>1分が経過しました...</p>
          <button className="start-button" onClick={startGame}>もう一度プレイ</button>
          <button className="start-button" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={backToTitle}>タイトルに戻る</button>
        </div>
      )}
    </div>
  );
}

export default App;
