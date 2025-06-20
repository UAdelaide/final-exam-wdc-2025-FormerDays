const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'dogwalks'
};

async function insertTestData(connection) {
    await connection.query(`INSERT INTO Users (username, email, password_hash, role)
        VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('puranowner', 'po@example.com', 'hashedpo', 'owner'),
        ('puranwalker', 'pw@example.com', 'hashedpw', 'walker');`);
    await connection.query(`INSERT INTO Dogs (name, size, owner_id)
        VALUES
        ('Max', 'medium', (SELECT id FROM Users WHERE username='alice123')),
        ('Bella', 'small', (SELECT id FROM Users WHERE username='carol123')),
        ('largedog', 'large', (SELECT id FROM Users WHERE username='puranowner')),
        ('mediumdog', 'medium', (SELECT id FROM Users WHERE username='carol123')),
        ('smalldog', 'small', (SELECT id FROM Users WHERE username='alice123'));`);
    await connection.query(`INSERT INTO WalkRequests (dog_id, datetime, duration, location, status)
        VALUES
        ((SELECT id FROM Dogs WHERE name='Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT id FROM Dogs WHERE name='Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT id FROM Dogs WHERE name='largedog'), '2025-06-10 10:00:00', 60, 'LPark', 'pending'),
        ((SELECT id FROM Dogs WHERE name='mediumdog'), '2025-06-11 11:30:00', 40, 'MStreet', 'accepted'),
        ((SELECT id FROM Dogs WHERE name='smalldog'), '2025-06-12 14:00:00', 10, 'SAvenue', 'rejected');`);
}

async function startServer() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    await insertTestData(connection);

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
                COUNT(CASE WHEN wr.status = 'accepted' THEN 1 END) AS accepted_walks,
                COUNT(CASE WHEN wr.status = 'rejected' THEN 1 END) AS rejected_walks
                FROM Users u
                LEFT JOIN WalkRequests wr ON WR.user_id = wr.walker_id
            `);
            res.json(rows);
        } catch (err) {
            console.error('Error fetching accepted walk requests:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
}
