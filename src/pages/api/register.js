import pool from "../../lib/db";
import bcrypt from "bcrypt";
import { allowCors } from "../../lib/cors";

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
    //Valida se o utlizador já existe
    const [existingUser] = await connection.execute("SELECT id FROM users WHERE username = ?", [username]);

    // Se o utilizador já existir, retorna um erro
    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ error: "Utilizador já existe" });
    }

    // Encripto a password com bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere o utilizador na base de dados
    await connection.execute("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);

    // Liberta a conexão
    connection.release();
    return res.status(201).json({ message: "Utilizador registado com sucesso!" });
  } catch (error) {
    if (connection) connection.release();
    console.error("Erro ao registar utilizador");
    return res.status(500).json({ error: "Erro ao registar utilizador" });
  }
}

// Garante o bloqueio de CORS - Cross-Origin Resource Sharing.
export default allowCors(handler);