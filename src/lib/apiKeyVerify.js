import pool from "../../lib/db";  // Adjust the import based on your project structure

// Middleware to verify the API key from the api_keys table
async function verifyApiKey(req, res, next) {
  // Extract the API key from the Authorization header (Bearer <api-key>)
  const apiKey = req.headers["authorization"]?.split(" ")[1];

  // If the API key is not provided, return an error
  if (!apiKey) {
    return res.status(401).json({ error: "API Key is required" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Query the api_keys table to verify if the API key exists
    const [rows] = await connection.execute(
      "SELECT api_keys.id, api_keys.user_id, users.username FROM api_keys INNER JOIN users ON api_keys.user_id = users.id WHERE api_keys.api_key = ?",
      [apiKey]
    );

    // If no valid API key is found, return an error
    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Invalid API Key" });
    }

    // Attach user information to the request (optional, for use in route handlers)
    req.user = {
      id: rows[0].user_id,
      username: rows[0].username,
    };

    // Release the connection
    connection.release();

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    if (connection) connection.release();
    console.error("Error verifying API Key:", error);
    return res.status(500).json({ error: "Error verifying API Key" });
  }
}

export default verifyApiKey;
