import { allowCors } from "../../lib/cors";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  console.log("🔹 Processando pedido de logout...");

  // 🔹 Permite que o navegador veja o `Set-Cookie`
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");

  // 🔹 Substitui o valor do cookie antes de apagá-lo para garantir a remoção
  res.setHeader(
    "Set-Cookie",
    "token=; Path=/; HttpOnly; Secure; Domain=.nstech.pt; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  console.log("✅ Logout efetuado com sucesso: Cookie removido");

  return res.status(200).json({ message: "Logout efetuado com sucesso!" });
}

export default allowCors(handler);