const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await debug.quiry(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
    );
    if (rows.length > 0) {
        req.session.user = rows[0];
        res.json({ message: 'Login successful', user: rows[0] });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
}