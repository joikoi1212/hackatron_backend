import pool from "../../lib/db";  // Database connection
import { allowCors } from "../../lib/cors_api_expogo";  // CORS middleware

// API handler to get the best and last scores of a user
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the user_id from query parameters
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "User ID not found" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Debug: Log the received user_id
    console.log("Received user_id:", user_id);

    // Fetch the best_score and last_score for the user
    const scores = await getUserScores(connection, user_id);

    if (!scores) {
      console.log("Scores not found for user ID:", user_id);  // Debug: Log if no scores found
      return res.status(404).json({ error: "Scores not found" });
    }

    // Debug: Log the scores fetched
    console.log("Fetched Scores for user:", scores);

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
