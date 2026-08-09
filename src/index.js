export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const method = request.method;
  
      // CORSヘッダーの設定
      const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };
  
      if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }
  
      // 1. ユーザー登録 API
      if (url.pathname === "/api/register" && method === "POST") {
        try {
          const { username, password } = await request.json();
          
          const regex = /^[a-zA-Z0-9]+$/;
          if (!regex.test(username)) {
            return new Response(JSON.stringify({ error: "ユーザー名は半角英数字のみ有効です" }), { status: 400, headers: corsHeaders });
          }
  
          if (!username || !password) {
            return new Response(JSON.stringify({ error: "ユーザー名とパスワードを入力してください" }), { status: 400, headers: corsHeaders });
          }
  
          await env.DB.prepare(
            "INSERT INTO users (username, password) VALUES (?, ?)"
          ).bind(username, password).run();
  
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (error) {
          if (error.message.includes("UNIQUE")) {
            return new Response(JSON.stringify({ error: "このユーザー名は既に使われています" }), { status: 400, headers: corsHeaders });
          }
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
      }
  
      // 2. ログイン API
      if (url.pathname === "/api/login" && method === "POST") {
        try {
          const { username, password } = await request.json();
          const user = await env.DB.prepare(
            "SELECT * FROM users WHERE username = ? AND password = ?"
          ).bind(username, password).first();
  
          if (!user) {
            return new Response(JSON.stringify({ error: "ユーザー名またはパスワードが間違っています" }), { status: 400, headers: corsHeaders });
          }
  
          return new Response(JSON.stringify({ success: true, userId: user.id, username: user.username }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
      }
  
      // 3. スコア送信 API
      if (url.pathname === "/api/score" && method === "POST") {
        try {
          const { userId, score, timeLeft } = await request.json();
          const totalPoint = score + timeLeft;
  
          await env.DB.prepare(
            "INSERT INTO rankings (user_id, score, time_left, total_point) VALUES (?, ?, ?, ?)"
          ).bind(userId, score, timeLeft, totalPoint).run();
  
          return new Response(JSON.stringify({ success: true, totalPoint }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
      }
  
      // 4. ランキング取得 API
      if (url.pathname === "/api/ranking" && method === "GET") {
        try {
          const { results } = await env.DB.prepare(
            `SELECT r.total_point, r.score, r.time_left, u.username, r.created_at 
             FROM rankings r 
             JOIN users u ON r.user_id = u.id 
             ORDER BY r.total_point DESC, r.time_left DESC 
             LIMIT 10`
          ).all();
  
          return new Response(JSON.stringify(results), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
      }

      // 管理用: データクリア（データのみ削除）
      // 必ずヘッダー `x-admin-token` に env.ADMIN_TOKEN の値を付与して実行してください。
      if (url.pathname === "/api/clear-data" && method === "POST") {
        try {
          const token = request.headers.get('x-admin-token') || '';
          if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
          }

          await env.DB.prepare('DELETE FROM rankings').run();
          await env.DB.prepare('DELETE FROM users').run();

          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
      }
  
      // 通常のファイル配信（Reactの画面）
      return env.ASSETS.fetch(request);
    }
  };
  