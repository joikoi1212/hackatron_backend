export function allowCors(handler) {
  return async (req, res) => {
    // ✅ Garantir que `CORS_ALLOWED_ORIGINS_REMOTE` não seja `undefined` ou vazio
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS_REMOTE
      ? process.env.CORS_ALLOWED_ORIGINS_REMOTE.split(",")
      : ["https://login-frontend-five-kappa.vercel.app", "https://backoffice-login-com-blockchain.vercel.app"];

    const origin = req.headers.origin || "";

    // ✅ Bloquear origem caso não seja permitida
    if (!allowedOrigins.includes(origin)) {
      console.warn(`🚨 Origem bloqueada: ${origin}`);
      return res.status(403).json({ error: "Acesso negado: Origem não autorizada" });
    }

    // ✅ Definir corretamente os headers CORS
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");

    // ✅ Responder corretamente a requisições `OPTIONS`
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    return handler(req, res);
  };
}