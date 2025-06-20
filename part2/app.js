const express = require('express');
const path = require('path');
const session = require('express-session'); //13
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// 13: Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

// 13: Database connection
const db = require('./models/db');

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// 13: Identify the user;s role and return it
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query(
            'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
            [username, password]
        );

        if (rows.length > 0) {
            req.session.user = rows[0];
            res.json({ role : rows[0].role });
        } else {
            res.status(401).json({ message: 'Invalid username or password_hash' });
        }
    } catch (err) {
        console.error('Log in error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 14: log out
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: 'Logged out successfully' });
    });
});

// 15: Choose your dog
app.get('/api/mydogs', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must logged in' });
    }

    const ownerId = req.session.user.user.id;
    const [rows] = await db.query('SELECT * FROM Dogs WHERE owner_id = ?', [ownerId]);
    db.query('SELECT * FROM Dogs WHERE owner_id = ?', [userId])
        .then(([rows]) => {
            res.json(rows);
        })
        .catch(err => {
            console.error('Error fetching dogs:', err);
            res.status(500).json({ message: 'Internal server error' });
        });
});

// Export the app instead of listening here
module.exports = app;