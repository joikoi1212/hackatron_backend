import pool from "../../lib/db";  // Database connection
import { allowCors } from "../../lib/cors_api_expogo";  // CORS middleware

// API handler to get the list of countries
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

    // Fetch distinct countries from the database
    const countries = await getCountries(connection);

    if (countries.length === 0) {
      return res.status(404).json({ error: "No countries found" });
    }

    // Respond with the list of countries
    return res.status(200).json({ countries });

  } catch (error) {
    console.error("Error while fetching countries:", error);
    return res.status(500).json({ error: "Error processing request" });
  } finally {
    if (connection) connection.release();
  }
}

// Fetches distinct countries from the 'mytable' database
async function getCountries(connection) {
  try {
    const [rows] = await connection.execute("SELECT DISTINCT country FROM mytable");
    return rows.map(row => row.country);
  } catch (error) {
    console.error("Error while fetching countries from the database:", error);
    return [];
  }
}

export default allowCors(handler);  // Use CORS middleware
