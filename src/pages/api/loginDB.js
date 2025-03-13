import pool from "../../lib/db"; // Assuming pool is your database connection module
import bcrypt from "bcrypt"; // Import bcrypt for password comparison

async function loginHandler(req, res) {
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

    // Step 1: Check if the user exists in the database
    const [user] = await connection.execute("SELECT id, password FROM users WHERE username = ?", [username]);

    if (user.length === 0) {
      connection.release(); // Release the connection
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    // Step 2: Use bcrypt.compare to compare the plain text password with the hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user[0].password);

    if (!isPasswordCorrect) {
      connection.release(); // Release the connection
      return res.status(400).json({ error: "Senha incorreta" });
    }

    // Step 3: Generate an API key for the user (if necessary)
    const apiKey = crypto.randomBytes(32).toString("hex");

    // Step 4: Return the API key (or some other user info as needed)
    connection.release();
    return res.status(200).json({
      message: "Login bem-sucedido",
      apiKey: apiKey, // Return the generated API key to the user
    });

  } catch (error) {
    if (connection) connection.release(); // Ensure the connection is released
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
}

export default loginHandler;
