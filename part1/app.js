const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
};

async function startServer() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    app.get('/api/dogs', async (req, res) => {
        try {
            const [rows] = await connection.query(`
                SELECT d.name AS dog_name, d.size, u.username AS owner_username
                FROM Dogs d
                JOIN Users u ON d.owner_id = u.user_id
            `);
            res.json(rows);
        } catch (err) {
            console.error('Error fetching dogs:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/walkrequests/open', async (req, res) => {
        try {
            const [rows] = await connection.query(`
                SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
                FROM WalkRequests wr
                JOIN Dogs d ON wr.dog_id = d.dog_id
                JOIN Users u ON d.owner_id = u.user_id
                WHERE wr.status = 'open'
            `);
            res.json(rows);
        } catch (err) {
            console.error('Error fetching open walk requests:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/walkers/summary', async (req, res) => {
        try {
            const [rows] = await connection.query(`
                SELECT u.username AS walker_username,
                COUNT(r.rating_id) AS total_ratings,
                AVG(r.rating) AS average_rating,
                COUNT(CASE WHEN wr.status = 'completed' THEN 1 END) AS completed_walks
                FROM Users u
                LEFT JOIN WalkRequests wr ON wr.accepted_walker_id = u.user_id
                LEFT JOIN WalkRatings r ON r.walker_id = u.user_id
                WHERE u.role = 'walker'
                GROUP BY u.username
            `);
            res.json(rows);
        } catch (err) {
            console.error('Error fetching accepted walk requests:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();