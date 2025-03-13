import pool from "../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { allowCors } from "../../lib/cors_api_expogo";

// Handle user login
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if user exists
    const [rows] = await connection.execute("SELECT id, username, password FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = rows[0];

    // Check password validity
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Fetch the API Key from the database (if it exists)
    const [apiKeyRows] = await connection.execute("SELECT api_key FROM api_keys WHERE user_id = ?", [user.id]);

    let apiKey = null;
    if (apiKeyRows.length > 0) {
      apiKey = apiKeyRows[0].api_key;
    }

    // Set token to the cookie securely
    res.setHeader(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Domain=.nstech.pt; Max-Age=7200`
    );

    connection.release();

    return res.status(200).json({
      success: true,
      token: token,      // JWT token
      apiKey: apiKey     // API key fetched from the database (may be null)
    });

  } catch (error) {
    if (connection) connection.release();
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro ao autenticar utilizador" });
  }
}

// Enable CORS
export default allowCors(handler);
