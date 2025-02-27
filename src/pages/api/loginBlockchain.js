import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { allowCors } from "../../lib/cors";

// Configuração correta do cookie para produção
const cookieOptions = "HttpOnly; Secure; SameSite=None; Path=/; Domain=.nstech.pt";

// Valida se o método que está a ser chamado é o correto: "POST"
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Valida se os parâmetros estão preenchidos
  const { walletAddress, message, signature } = req.body;

  if (!walletAddress || !message || !signature) {
    return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  try {
    // Verifica a assinatura do utilizador através da mensagem e da assinatura
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      console.warn("❌ Assinatura inválida para Wallet:", walletAddress);
      return res.status(401).json({ error: "Assinatura inválida" });
    }

    // Garante que o `ADMIN_WALLET` existe antes da comparação (.env secure environment)
    if (!process.env.ADMIN_WALLET || walletAddress.toLowerCase() !== process.env.ADMIN_WALLET.toLowerCase()) {
      console.warn("process.env.ADMIN_WALLET", process.env.ADMIN_WALLET);
      console.warn("process.env.ADMIN_WALLET.toLowerCase():", process.env.ADMIN_WALLET.toLowerCase());
      console.warn("❌ Acesso negado para Wallet:", walletAddress);
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Cria um token de autenticação JWT com a chave secreta
    const token = jwt.sign({ walletAddress }, process.env.JWT_SECRET, { expiresIn: "2h" });

    // Define corretamente o Cookie para produção
    res.setHeader("Set-Cookie", `token=${token}; ${cookieOptions}; Max-Age=7200`);

    console.log("✅ Login efetuado com sucesso para:", walletAddress);
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("❌ Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro ao autenticar" });
  }
}

// Garante o bloqueio de CORS - Cross-Origin Resource Sharing.
export default allowCors(handler);