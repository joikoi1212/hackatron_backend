import pool from "../../lib/db";
import { allowCors } from "../../lib/cors";

// Valida se o metodo que está a ser chamado é o correto : "GET"
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Executa um SELECT 1 à base de dados para analisar se está "ALIVE"
  try {
    const [result] = await pool.execute("SELECT 1");
    return res.status(200).json({ status: "online", message: "Base de dados está online!" });
  } catch (error) {
    console.error("Erro ao conectar à base de dados:", error);
    return res.status(500).json({ status: "offline", error: "Erro ao conectar à base de dados" });
  }
}

// Garante o bloqueio de CORS - Cross-Origin Resource Sharing.
export default allowCors(handler);