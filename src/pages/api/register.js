import pool from "../../lib/db"; // Assuming pool is your database connection module
import crypto from "crypto"; // For generating a secure API key
import bcrypt from "bcrypt"; // Import bcrypt for password hashing

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

    // Step 2: Encrypt the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with a salt round of 10

    // Step 3: Insert the user into the 'users' table with the hashed password
    const [result] = await connection.execute("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);

    // Step 4: Generate an API key for the new user
    const apiKey = crypto.randomBytes(32).toString("hex");

    // Step 5: Insert the API key into the 'api_keys' table
    await connection.execute("INSERT INTO api_keys (user_id, api_key) VALUES (?, ?)", [result.insertId, apiKey]);

    await connection.execute(
      "INSERT INTO user_points (user_id, best_score, last_score) VALUES (?, ?, ?)",
      [result.insertId, 0, 0]  // Initialize best_score and last_score to 0
    );

    if(!username.includes('@')) {
      connection.release();
      return res.status(1002).json({ error: "Formanto do e-mail inválido" });
    }


    // Release the connection
    connection.release();

    // Step 6: Return the API key to the user
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
