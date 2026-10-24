require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

// Safe Stripe initialization (prevents startup crash if key is missing)
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = require('stripe')(stripeKey);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Connection Setup (Supports Docker service names)
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'coffeeparadise',
    password: process.env.DB_PASSWORD || 'postgrespassword',
    port: process.env.DB_PORT || 5432,
});

// Auto-initialize PostgreSQL Schema Safely with Retries
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                username VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number VARCHAR(50) NOT NULL,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                items JSONB NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                payment_status VARCHAR(50) DEFAULT 'Paid via Stripe',
                fulfillment_status VARCHAR(50) DEFAULT 'Collect item in store',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('PostgreSQL Connected & Tables Initialized!');
    } catch (err) {
        console.error('PostgreSQL Initialization Error (retrying in 3s):', err.message);
        setTimeout(initDB, 3000);
    }
}
initDB();

// ================= AUTHENTICATION ROUTES =================

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const username = email.split('@')[0];
        const result = await pool.query(
            `INSERT INTO users (name, username, email, password) 
             VALUES ($1, $2, $3, $4) RETURNING id, name, username, email`,
            [name || username, username, email, password]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Register Error:', err.message);
        res.status(400).json({ success: false, error: 'User already exists or invalid input' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, name, username, email FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});

// ================= STRIPE & ORDER ROUTES =================

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items, userId } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'myr',
                product_data: { name: item.name },
                unit_amount: Math.round(Number(item.price) * 100),
            },
            quantity: item.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://localhost:3000/orders.html?session_id={CHECKOUT_SESSION_ID}&user_id=${userId || ''}`,
            cancel_url: 'http://localhost:3000/checkout.html',
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET orders scoped strictly by authenticated User ID
app.get('/api/orders', async (req, res) => {
    const userId = req.headers['user-id'];

    // Strict validation to prevent invalid integer errors in PostgreSQL
    if (!userId || userId === 'undefined' || userId === 'null' || isNaN(Number(userId))) {
        return res.status(401).json({ error: 'User not authenticated or invalid user ID' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [parseInt(userId, 10)]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Orders Error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
});

// POST save new order to PostgreSQL
app.post('/api/orders', async (req, res) => {
    const { userId, orderNumber, items, totalAmount } = req.body;

    if (!userId || userId === 'undefined' || isNaN(Number(userId))) {
        return res.status(400).json({ error: 'Missing or invalid user ID' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO orders (order_number, user_id, items, total_amount)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [orderNumber, parseInt(userId, 10), JSON.stringify(items), totalAmount]
        );
        res.json({ success: true, order: result.rows[0] });
    } catch (err) {
        console.error('Save Order Error:', err.message);
        res.status(500).json({ error: 'Failed to save order' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));