import pool from "../../lib/db";  // Database connection
import { allowCors } from "../../lib/cors_api_expogo";  // CORS middleware

// API handler for submitting and getting scores
async function handler(req, res) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Handle GET request to fetch best_score and last_score
    if (req.method === "GET") {
      const apiKey = req.headers.authorization?.split(" ")[1];
      
      if (!apiKey) {
        return res.status(401).json({ error: "API Key not found" });
      }

      // Validate API key
      const [userRows] = await connection.execute("SELECT user_id FROM api_keys WHERE api_key = ?", [apiKey]);
      if (userRows.length === 0) {
        connection.release();
        return res.status(401).json({ error: "Invalid API Key" });
      }

      const userId = userRows[0].user_id;

      // Fetch best_score and last_score from user_points table
      const [scoreRows] = await connection.execute("SELECT best_score, last_score FROM user_points WHERE user_id = ?", [userId]);
      if (scoreRows.length === 0) {
        connection.release();
        return res.status(404).json({ error: "User scores not found" });
      }

      const { best_score, last_score } = scoreRows[0];
      return res.status(200).json({ best_score, last_score });
    }

    // Handle POST request to submit a new score
    if (req.method === "POST") {
      const { score, userId } = req.body;

      // Validate input parameters
      if (score === undefined || userId === undefined) {
        return res.status(400).json({ error: "Score and userId are required" });
      }

      // Fetch the current best_score and last_score from user_points table
      const [scoreRows] = await connection.execute("SELECT best_score, last_score FROM user_points WHERE user_id = ?", [userId]);

      let bestScore = 0;
      let lastScore = 0;

      if (scoreRows.length > 0) {
        bestScore = scoreRows[0].best_score;
        lastScore = scoreRows[0].last_score;
      }

      // Check if the new score is higher than the best_score
      if (score > bestScore) {
        bestScore = score;  // Update best_score
      }

      // Update last_score to the new score
      lastScore = score;

      // Update the scores in the user_points table
      await connection.execute(
        "UPDATE user_points SET best_score = ?, last_score = ? WHERE user_id = ?",
        [bestScore, lastScore, userId]
      );

      // Release the connection
      connection.release();

      return res.status(200).json({
        message: "Scores updated successfully",
        best_score: bestScore,
        last_score: lastScore,
      });
    }

    // If method is not GET or POST
    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Error processing request:", error);
    if (connection) connection.release();
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default allowCors(handler);  // Use CORS middleware
