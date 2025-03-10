import pool from "../../lib/db";
import { allowCors } from "../../lib/cors_api_expogo";
import jwt from "jsonwebtoken";

// Verifies if the user has a valid API key (JWT token)
async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Assumes the token is in the "Authorization" header

    if (!token) {
        return res.status(401).json({ error: "Token não encontrado" });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Now we can use the decoded information to access the database or other logic
        const userId = decoded.id;
        console.log("User ID from token:", userId);

        // Fetch random coordinates from the database
        const randomLocation = await getRandomLocation();

        if (!randomLocation) {
            return res.status(404).json({ error: "Localização não encontrada" });
        }

        // Respond with the random location
        return res.status(200).json({ location: randomLocation });

    } catch (error) {
        console.error("Token validation failed:", error);
        return res.status(401).json({ error: "Token inválido" });
    }
}

// Fetches random location coordinates from the database
async function getRandomLocation() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute("SELECT lat, lng FROM mytable ORDER BY RAND() LIMIT 1");

        if (rows.length === 0) {
            return null;
        }

        const location = rows[0];
        console.log(location)
        return {
            latitude: location.lat,  // Corrected property name
            longitude: location.lng  // Corrected property name
        };

    } catch (error) {
        console.error("Error fetching random location:", error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

export default allowCors(handler);
