export function allowCors(handler) {
  return async (req, res) => {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS_REMOTE?.split(",").filter(Boolean) || [];
    const origin = req.headers.origin || "";
    const userAgent = req.headers["user-agent"] || "";

    const isPostmanAllowed = process.env.POSTMAN_ALLOWED === "true";
    const isPostmanRequest = userAgent.includes("Postman");

    const isPublicAPI = process.env.PUBLIC_API === "true";

    // ✅ Allow requests from Expo Go (Android and iOS)
    const isExpoGoAndroid = userAgent.includes("okhttp"); // Expo Go on Android
    const isExpoGoIOS = /Expo\/\d+ CFNetwork\/\d+\.\d+\.\d+ Darwin\/\d+\.\d+\.\d+/.test(userAgent); // Expo Go on iOS

    const isExpoGo = isExpoGoAndroid || isExpoGoIOS;

    // 🔹 If it's not a public API, check allowed origins
    if (!isPublicAPI && !(allowedOrigins.includes(origin) || isExpoGo || (isPostmanAllowed && isPostmanRequest))) {
      console.error(`🚨 CORS Block: ${origin} not allowed. User-Agent: ${userAgent}`);
      return res.status(403).json({ error: "Access denied: Origin or tool not authorized" });
    }

    // 🔹 Define CORS headers correctly
    res.setHeader("Access-Control-Allow-Origin", isPublicAPI ? "*" : origin);
    res.setHeader("Access-Control-Allow-Credentials", isPublicAPI ? "false" : "true"); // ⚠ Cannot be "true" with "*"
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type, Authorization, Cookie, Set-Cookie"
    );

    // 🔹 Respond immediately to OPTIONS requests (Preflight)
    if (req.method === "OPTIONS") {
      console.log(`🟢 OPTIONS request allowed for: ${origin} (Expo Go: ${isExpoGo})`);
      return res.status(204).end();
    }

    return handler(req, res);
  };
}
