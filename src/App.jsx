<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ロン君のゴキ退治 v2</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #112211;
            color: #ffffff;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }
        .container {
            width: 100%;
            max-width: 480px;
            background: #1a2e1a;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
        }
        .profile-img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #4CAF50;
            margin-bottom: 10px;
        }
        h1 { font-size: 24px; margin: 10px 0 20px 0; }
        h3 { margin: 10px 0; }
        .hidden { display: none !important; }
        input, select {
            width: 100%; padding: 12px; margin: 8px 0 16px 0;
            border: 1px solid #444; border-radius: 6px;
            background: #2a3e2a; color: white; box-sizing: border-box; font-size: 16px;
        }
        button {
            width: 100%; padding: 12px; background-color: #4CAF50;
            color: white; border: none; border-radius: 6px;
            font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;
            transition: background 0.2s;
        }
        button:hover { background-color: #45a049; }
        button.danger { background-color: #d32f2f; }
        button.danger:hover { background-color: #b71c1c; }
        .link-text {
            color: #81C784; cursor: pointer; margin-top: 15px;
            display: inline-block; font-size: 14px; text-decoration: underline;
        }
        /* スコアとタイムの重なりを解消するためのフレキシブルヘッダー */
        .game-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #112211;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-weight: bold;
            font-size: 15px;
        }
        .game-header div {
            flex: 1;
            text-align: center;
        }
        .game-header div:first-child { text-align: left; }
        .game-header div:last-child { text-align: right; }

        .game-area {
            position: relative;
            width: 100%;
            height: 360px;
            background: #0d1a0d;
            border: 2px solid #335533;
            border-radius: 8px;
            overflow: hidden;
            touch-action: manipulation;
        }
        .roach {
            position: absolute;
            width: 50px; height: 50px; cursor: pointer;
            background-image: url('https://em-content.zobj.net/source/fluent/170/cockroach_1fab3.png');
            background-size: contain; background-repeat: no-repeat; background-position: center;
            transform: translate(-50%, -50%); user-select: none;
            transition: transform 0.1s;
        }
        .roach:active { transform: translate(-50%, -50%) scale(1.2); }
    </style>
</head>
<body>

<div class="container">
    <!-- ログイン画面 -->
    <div id="login-screen">
        <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150&auto=format&fit=crop&q=80" alt="ロンくん" class="profile-img">
        <h1>ロン君のゴキ退治 v2</h1>
        <h3>ログイン</h3>
        <input type="text" id="username-input" placeholder="ユーザー名 (半角英数字)">
        <input type="password" id="password-input" placeholder="パスワード">
        <button onclick="handleLogin()">ログインして開始</button>
        <span class="link-text" onclick="showMenuScreen()">新規アカウントを作成する / ゲスト</span>
    </div>

    <!-- メニュー・シーン選択画面 -->
    <div id="menu-screen" class="hidden">
        <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150&auto=format&fit=crop&q=80" alt="ロンくん" class="profile-img">
        <h1>シーン選択</h1>
        <p>プレイヤー: <span id="display-username">ゲスト</span></p>
        <label for="scene-select">挑戦するシーンを選んでください（1〜10）</label>
        <select id="scene-select">
            <!-- シーン1〜10 -->
        </select>
        <button onclick="startGame()">ゲームスタート</button>
        <button class="danger" onclick="logout()">ログアウト</button>
    </div>

    <!-- ゲームプレイ画面 -->
    <div id="game-screen" class="hidden">
        <div class="game-header">
            <div id="stage-label">Stage 1</div>
            <div id="score-label">退治数: 0 / 10</div>
            <div id="time-label">残り: 60秒</div>
        </div>
        <div class="game-area" id="game-area"></div>
        <button class="danger" onclick="returnToMenu()" style="margin-top: 15px;">メニューに戻る</button>
    </div>
</div>

<script>
    // シーン1〜10の設定データ（ステージが進むほど難しくなります）
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

    let currentScene = 1;
    let maxUnlockedScene = 1;
    let score = 0;
    let timeLeft = 60;
    let targetCount = 10;
    let gameTimer = null;
    let spawnTimer = null;
    let activeRoaches = [];

    // 画面切り替え用ヘルパー
    function switchScreen(screenId) {
        ['login-screen', 'menu-screen', 'game-screen'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    function handleLogin() {
        const username = document.getElementById('username-input').value.trim();
        if (username) {
            document.getElementById('display-username').textContent = username;
        }
        showMenuScreen();
    }

    function showMenuScreen() {
        // localStorageからクリア状況を復元
        const savedMax = localStorage.getItem('ron_max_scene');
        if (savedMax) {
            maxUnlockedScene = parseInt(savedMax);
        }

        // シーンセレクトボックスを生成
        const select = document.getElementById('scene-select');
        select.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const config = sceneConfigs[i];
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `シーン ${i} (制限 ${config.time}秒 / 目標 ${config.target}匹)`;
            if (i > maxUnlockedScene) {
                opt.disabled = true;
                opt.textContent += " 【未解放】";
            }
            select.appendChild(opt);
        }
        select.value = maxUnlockedScene;
        switchScreen('menu-screen');
    }

    function logout() {
        switchScreen('login-screen');
    }

    function returnToMenu() {
        clearInterval(gameTimer);
        clearInterval(spawnTimer);
        showMenuScreen();
    }

    function startGame() {
        const select = document.getElementById('scene-select');
        currentScene = parseInt(select.value);
        const config = sceneConfigs[currentScene];

        score = 0;
        timeLeft = config.time;
        targetCount = config.target;
        activeRoaches = [];

        document.getElementById('stage-label').textContent = `Stage ${currentScene}`;
        document.getElementById('score-label').textContent = `退治数: ${score} / ${targetCount}`;
        document.getElementById('time-label').textContent = `残り: ${timeLeft}秒`;
        document.getElementById('game-area').innerHTML = '';

        switchScreen('game-screen');

        // 制限時間タイマー
        gameTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('time-label').textContent = `残り: ${timeLeft}秒`;
            if (timeLeft <= 0) {
                endGame(false);
            }
        }, 1000);

        // ゴキブリ発生タイマー
        spawnRoach(config.speed);
        spawnTimer = setInterval(() => {
            spawnRoach(config.speed);
        }, config.interval);
    }

    function spawnRoach(speedMultiplier) {
        const area = document.getElementById('game-area');
        if (!area || document.getElementById('game-screen').classList.contains('hidden')) return;

        const roach = document.createElement('div');
        roach.className = 'roach';

        const maxX = area.clientWidth - 50;
        const maxY = area.clientHeight - 50;
        let posX = Math.random() * maxX;
        let posY = Math.random() * maxY;

        roach.style.left = `${posX}px`;
        roach.style.top = `${posY}px`;

        // ランダム移動ベクトル
        let vx = (Math.random() - 0.5) * 4 * speedMultiplier;
        let vy = (Math.random() - 0.5) * 4 * speedMultiplier;

        const roachObj = {
            element: roach,
            x: posX,
            y: posY,
            vx: vx,
            vy: vy
        };

        // タップ/クリック時の処理
        roach.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            score++;
            document.getElementById('score-label').textContent = `退治数: ${score} / ${targetCount}`;
            roach.remove();
            activeRoaches = activeRoaches.filter(r => r !== roachObj);

            if (score >= targetCount) {
                endGame(true);
            }
        });

        area.appendChild(roach);
        activeRoaches.push(roachObj);
    }

    // ゴキブリ自動移動フレーム処理
    function updateGameLoop() {
        if (!document.getElementById('game-screen').classList.contains('hidden')) {
            const area = document.getElementById('game-area');
            const maxX = area.clientWidth - 50;
            const maxY = area.clientHeight - 50;

            activeRoaches.forEach(r => {
                r.x += r.vx;
                r.y += r.vy;

                // 壁で跳ね返る
                if (r.x <= 0 || r.x >= maxX) r.vx *= -1;
                if (r.y <= 0 || r.y >= maxY) r.vy *= -1;

                // ランダムに方向転換
                if (Math.random() < 0.04) {
                    r.vx += (Math.random() - 0.5) * 2;
                    r.vy += (Math.random() - 0.5) * 2;
                }

                r.element.style.left = `${r.x}px`;
                r.element.style.top = `${r.y}px`;
            });
        }
        requestAnimationFrame(updateGameLoop);
    }
    requestAnimationFrame(updateGameLoop);

    function endGame(isClear) {
        clearInterval(gameTimer);
        clearInterval(spawnTimer);
        document.getElementById('game-area').innerHTML = '';

        if (isClear) {
            alert(`おめでとうございます！シーン ${currentScene} クリア！`);
            // 次のシーンを解放
            if (currentScene >= maxUnlockedScene && currentScene < 10) {
                maxUnlockedScene = currentScene + 1;
                localStorage.setItem('ron_max_scene', maxUnlockedScene);
            }
        } else {
            alert("時間切れです…！もう一度挑戦してください。");
        }
        showMenuScreen();
    }
</script>

</body>
</html>