import { ethers } from "ethers";
import { allowCors } from "../../lib/cors";

// Valida se o metodo que está a ser chamado é o correto : "GET"
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Ligação ao nó de Blockchain (ETH) RPC-Remote Procedure Call
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

    // Efectua o fetch do último bloco para verificar se a blockchain ETH responde
    const blockNumber = await provider.getBlockNumber();

    return res.status(200).json({ status: "online", blockNumber });
  } catch (error) {
    console.error("Erro ao conectar à blockchain:", error);
    return res.status(500).json({ status: "offline", error: "A blockchain não está acessível." });
  }
}

// Garante o bloqueio de CORS - Cross-Origin Resource Sharing.
export default allowCors(handler);