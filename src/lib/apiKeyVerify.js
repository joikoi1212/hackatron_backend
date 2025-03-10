// lib/verifyApiKey.js
import pool from "../../lib/db"; // Import the database connection

// Middleware to verify API key
async function verifyApiKey(req, res, next) {
  const apiKey = req.headers["authorization"]?.split(" ")[1]; // Get the API key from the Authorization header

  if (!apiKey) {
    return res.status(401).json({ error: "Token de acesso não fornecido" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if the API key is valid by looking it up in the database
    const [rows] = await connection.execute("SELECT user_id FROM api_keys WHERE api_key = ?", [apiKey]);

    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Chave de API inválida" });
    }

    // Attach user information to the request object (optional)
    req.user = {
      id: rows[0].user_id,
    };

    connection.release();
    next(); // Proceed to the next middleware or the API endpoint

  } catch (error) {
    if (connection) connection.release();
    console.error("Erro ao verificar a chave de API", error);
    return res.status(500).json({ error: "Erro ao verificar a chave de API" });
  }
}

export default verifyApiKey;
