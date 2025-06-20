const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'dogwalks'
}

async function insertTestData(connection) {
    const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM walks');
    if (rows[0].count === 0) {
        await connection.execute(`
            INSERT INTO walks (name, distance, duration) VALUES
            ('Morning Walk', 5, 30),
            ('Evening Walk', 3, 20),
            ('Night Walk', 2, 15)
        `);
    }
}