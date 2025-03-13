import pool from "../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { allowCors } from "../../lib/cors_api_expogo";

// Valida se o metodo que está a ser chamado é o correto : "POST"
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Valida se o username e a password estão preenchidas
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Valida se o utilizador existe
    const [rows] = await connection.execute("SELECT id, username, password FROM users WHERE username = ?", [username]);

    // Se o utilizador não existir, retorna um erro
    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = rows[0];

    // Valida se a password é válida
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Se a password não for válida, retorna um erro
    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gera um token JWT com a chave secreta
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Fetch the apiKey from the database (if it exists)
    const [apiKeyRows] = await connection.execute("SELECT api_key FROM api_keys WHERE user_id = ?", [user.id]);

    let apiKey = null;
    if (apiKeyRows.length > 0) {
      apiKey = apiKeyRows[0].api_key;
    }

    // Fetch the best_score and last_score for the user
    const [scoreRows] = await connection.execute(
      "SELECT best_score, last_score FROM user_points WHERE user_id = ?",
      [user.id]
    );

    let bestScore = 0;
    let lastScore = 0;
    if (scoreRows.length > 0) {
      bestScore = scoreRows[0].best_score;
      lastScore = scoreRows[0].last_score;
    }

    // Adiciona o token ao cookie de forma segura
    res.setHeader(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Domain=.nstech.pt; Max-Age=7200`
    );
    
    // Liberta a conexão
    connection.release();
    
    // Return both token, apiKey, best_score, and last_score in the response
    return res.status(200).json({
      success: true,
      token: token,      // JWT token
      apiKey: apiKey,    // apiKey fetched from the database (may be null)
      best_score: bestScore,
      last_score: lastScore
    });

  } catch (error) {
    if (connection) connection.release();
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro ao autenticar utilizador" });
  }
}

// Garante o bloqueio de CORS - Cross-Origin Resource Sharing.
export default allowCors(handler);
