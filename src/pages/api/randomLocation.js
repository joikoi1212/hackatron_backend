import pool from "../../lib/db";  // Database connection
import { allowCors } from "../../lib/cors_api_expogo";  // CORS middleware

// Verifies if the user has a valid API key
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });  // Only GET method is allowed
  }

  // Get the API key from the Authorization header
  const apiKey = req.headers.authorization?.split(" ")[1]; // Assumes the token is in the "Authorization" header

  if (!apiKey) {
    return res.status(401).json({ error: "API Key não encontrada" });  // If no API key is provided, return 401 Unauthorized
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Step 1: Check if the API key is valid by looking it up in the 'api_keys' table
    const [rows] = await connection.execute("SELECT user_id FROM api_keys WHERE api_key = ?", [apiKey]);

    // If no valid API key is found
    if (rows.length === 0) {
      connection.release();  // Release the connection
      return res.status(401).json({ error: "API Key inválida" });  // Return error if the API key is invalid
    }

    // If the API key is valid, we can proceed to fetch the random location
    const userId = rows[0].user_id;  // Extract the user ID (if needed)

    // Step 2: Fetch a random location from the database
    const randomLocation = await getRandomLocation();

    if (!randomLocation) {
      return res.status(404).json({ error: "Localização não encontrada" });  // If no location is found, return 404
    }

    // Respond with the random location data
    return res.status(200).json({ location: randomLocation });

  } catch (error) {
    console.error("Erro ao validar a API Key e buscar localização:", error);
    return res.status(500).json({ error: "Erro ao processar a requisição" });
  } finally {
    if (connection) connection.release();  // Ensure the database connection is always released
  }
}

// Fetches random location coordinates from the database
async function getRandomLocation() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT lat, lng FROM mytable ORDER BY RAND() LIMIT 1");  // Query to get a random location

    if (rows.length === 0) {
      return null;
    }

    const location = rows[0];
    return {
      latitude: location.lat,
      longitude: location.lng
    };

  } catch (error) {
    console.error("Erro ao buscar a localização aleatória:", error);
    return null;
  } finally {
    if (connection) connection.release();  // Always release the connection after the operation
  }
}

export default allowCors(handler);  // Use the allowCors middleware to handle CORS
