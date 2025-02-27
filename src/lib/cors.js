export function allowCors(handler) {
  return async (req, res) => {
    // ✅ Garante que as origens permitidas vêm do `.env`
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS_REMOTE
      ? process.env.CORS_ALLOWED_ORIGINS_REMOTE.split(",")
      : [];

    const origin = req.headers.origin || "";
    const userAgent = req.headers["user-agent"] || "";

    // ✅ Verifica se o Postman está permitido via .env
    const isPostmanAllowed = process.env.POSTMAN_ALLOWED === "true";
    const isPostmanRequest = userAgent.includes("Postman");

    // ✅ Bloqueia a origem se não estiver na lista permitida e o Postman não estiver autorizado
    if (!allowedOrigins.includes(origin) && !(isPostmanAllowed && isPostmanRequest)) {
      console.warn(`🚨 Origem bloqueada: ${origin} | User-Agent: ${userAgent}`);
      return res.status(403).json({ error: "Acesso negado: Origem ou ferramenta não autorizada" });
    }

    // ✅ Definir corretamente os headers CORS
    res.setHeader("Access-Control-Allow-Origin", origin); // 🔹 Permite apenas origens definidas no `.env`
    res.setHeader("Access-Control-Allow-Credentials", "true"); // 🔹 Permite cookies e sessões autenticadas
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type, Authorization, Cookie, Set-Cookie" // 🔹 Garante que "Set-Cookie" pode ser lido
    );

    // ✅ Responde imediatamente a requisições OPTIONS (Preflight)
    if (req.method === "OPTIONS") {
      console.log(`🟢 OPTIONS permitido para: ${origin}`);
      return res.status(204).end();
    }

    return handler(req, res);
  };
}