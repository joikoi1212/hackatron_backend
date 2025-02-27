// Este ficheiro configura um pool de conexões para melhorar a eficiência do acesso à base de dados.
import mysql from "mysql2/promise";

// Criar um pool de conexões para evitar abrir e fechar conexões repetidamente
const pool = mysql.createPool({
  host: process.env.DB_HOSTNAME, // Host da base de dados definido nas variáveis de ambiente
  user: process.env.DB_USER, // Utilizador da base de dados
  password: process.env.DB_PASSWORD, // Palavra-passe da base de dados
  database: process.env.DB_NAME, // Nome da base de dados
  waitForConnections: true, // Esperar conexões quando o limite for atingido
  connectionLimit: 10, // Número máximo de conexões simultâneas no pool
  queueLimit: 0, // Sem limite de fila para requisições pendentes
  
});

// Função para obter uma conexão da pool
export async function getConnection() {
  return await pool.getConnection();
}

// Exporta o pool de conexões para ser usado em outras partes do código
export default pool;