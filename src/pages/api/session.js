import jwt from "jsonwebtoken";
import cookie from "cookie";
import { allowCors } from "../../lib/cors";

// Valida se o método que está a ser chamado é o correto: "GET"
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // 🔹 Garante que o header "cookie" existe antes de tentar analisá-lo
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.token || null;

    // 🔹 Verifica se o token está presente
    if (!token) {
      console.warn("⚠ Nenhum token encontrado nos cookies.");
      return res.status(401).json({ valid: false, error: "Não autenticado" });
    }

    // 🔹 Tenta verificar o token JWT com a chave secreta
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Sessão válida para:", decoded);

      return res.status(200).json({ valid: true, user: decoded, token });
    } catch (error) {
      console.error("❌ Token inválido ou expirado:", error.message);
      return res.status(401).json({ valid: false, error: "Token inválido ou expirado" });
    }

  } catch (error) {
    console.error("❌ Erro inesperado na verificação da sessão:", error.message);
    return res.status(500).json({ valid: false, error: "Erro ao verificar a sessão" });
  }
}

// 🔹 Garante que a API permite cookies no CORS
export default allowCors(handler);