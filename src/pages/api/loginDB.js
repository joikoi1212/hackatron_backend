import pool from "../../lib/db";  // Database connection
import { allowCors } from "../../lib/cors_api_expogo";  // CORS middleware

// API handler to get the best and last scores of a user
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

    // Check if the API key is valid and fetch the associated user_id
    const [rows] = await connection.execute("SELECT user_id FROM api_keys WHERE api_key = ?", [apiKey]);
    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Invalid API Key" });
    }

    const userId = rows[0].user_id;

    // Fetch the best_score and last_score for the user
    const scores = await getUserScores(connection, userId);

    if (!scores) {
      return res.status(404).json({ error: "Scores not found" });
    }

    // Respond with the user's best_score and last_score
    return res.status(200).json({
      best_score: scores.best_score,
      last_score: scores.last_score
    });

  } catch (error) {
    console.error("Error while fetching scores:", error);
    return res.status(500).json({ error: "Error processing request" });
  } finally {
    if (connection) connection.release();
  }
}

// Fetches the best_score and last_score for the user
async function getUserScores(connection, userId) {
  try {
    const query = "SELECT best_score, last_score FROM user_points WHERE user_id = ?";
    const [rows] = await connection.execute(query, [userId]);

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error while fetching user scores:", error);
    return null;
  }
}

export default allowCors(handler);  // Use CORS middleware
