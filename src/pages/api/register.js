import pool from "../../lib/db"; // Assuming pool is your database connection module
import crypto from "crypto"; // For generating a secure API key

// Handle user registration and API key creation
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  // Validate if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Step 1: Check if the username already exists
    const [existingUser] = await connection.execute("SELECT id FROM users WHERE username = ?", [username]);

    if (existingUser.length > 0) {
      connection.release(); // Release the connection
      return res.status(400).json({ error: "Usuário já existe" });
    }

    // Step 2: Insert the user into the 'users' table
    const [result] = await connection.execute("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);

    // Step 3: Generate an API key for the new user
    const apiKey = crypto.randomBytes(32).toString("hex");

    // Step 4: Insert the API key into the 'api_keys' table
    await connection.execute("INSERT INTO api_keys (user_id, api_key) VALUES (?, ?)", [result.insertId, apiKey]);

    // Release the connection
    connection.release();

    // Step 5: Return the API key to the user
    return res.status(201).json({
      message: "Usuário registrado com sucesso!",
      apiKey: apiKey, // Return the generated API key to the user
    });

  } catch (error) {
    if (connection) connection.release(); // Ensure the connection is released
    console.error("Erro ao registrar o usuário e gerar a chave API:", error);
    return res.status(500).json({ error: "Erro ao registrar o usuário e gerar a chave API" });
  }
}

export default handler;
