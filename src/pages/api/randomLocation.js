import pool from "../../lib/db";  // Database connection
import { allowCors } from "../../lib/cors_api_expogo";  // CORS middleware

// API handler to get a random location based on a country
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the API key from the Authorization header
  const apiKey = req.headers.authorization?.split(" ")[1];

  if (!apiKey) {
    return res.status(401).json({ error: "API Key not found" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if the API key is valid
    const [rows] = await connection.execute("SELECT user_id FROM api_keys WHERE api_key = ?", [apiKey]);
    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Invalid API Key" });
    }

    // Check if the country is provided in the query parameters
    const { country } = req.query;

    // Fetch a random location based on the country or a random location overall
    const randomLocation = await getRandomLocation(connection, country);

    if (!randomLocation) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Respond with the random location data
    return res.status(200).json({ location: randomLocation });

  } catch (error) {
    console.error("Error while fetching random location:", error);
    return res.status(500).json({ error: "Error processing request" });
  } finally {
    if (connection) connection.release();
  }
}

// Fetches a random location from the database based on the country
async function getRandomLocation(connection, country) {
  try {
    let query = "SELECT lat, lng FROM mytable ORDER BY RAND() LIMIT 1";
    let queryParams = [];

    // If a country is provided and it's not an empty string
    if (country && country.trim() !== "") {
      query = "SELECT lat, lng FROM mytable WHERE country = ? ORDER BY RAND() LIMIT 1";
      queryParams = [country];  // Country should be passed as a parameter
    }

    // Execute the query with the appropriate parameters
    const [rows] = await connection.execute(query, queryParams);

    return rows.length > 0 ? { latitude: rows[0].lat, longitude: rows[0].lng } : null;
  } catch (error) {
    console.error("Error while fetching random location from the database:", error);
    return null;
  }
}

export default allowCors(handler);  // Use CORS middleware
