// Este ficheiro limita o número de tentativas de login, impedindo ataques de força bruta.
import rateLimit from "express-rate-limit";

// Criar um middleware para aplicar limites de requisições
const getRateLimitMiddleware = (options) => {
  const limiter = rateLimit(options);

  return async (req, res) =>
    new Promise((resolve, reject) => {
      limiter(req, res, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });
};

// Aplica limite de 100 tentativas de login a cada 15 minutos por IP
export const loginLimiter = getRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // Janela de tempo de 15 minutos
  max: 100, // Máximo de 100 tentativas por IP
  message: { error: "Muitas tentativas de login. Tente novamente mais tarde." }, // Mensagem de erro
  standardHeaders: true, // Adiciona headers informativos ao cliente
  legacyHeaders: false, // Remove headers antigos
  trustProxy: true, // Permite que funcione corretamente atrás de um proxy reverso
  keyGenerator: (req) => {
    // Obtém o IP do utilizador de forma segura, evitando falsificações
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    console.log("IP detectado:", ip);
    return ip;
  },
});