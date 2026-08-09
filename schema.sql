DROP TABLE IF EXISTS rankings;
DROP TABLE IF EXISTS users;

-- 1. ユーザー管理テーブル
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- 簡易的なパスワード保持
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. ランキング・スコア記録テーブル
CREATE TABLE rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_left INTEGER NOT NULL,
  total_point INTEGER NOT NULL, -- スコア + 残り秒数の合計値
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
