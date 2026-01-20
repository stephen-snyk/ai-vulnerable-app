// Copy the contents of this code block and save it to a file named "app.js" in your project directory
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const xssRouter = require('./xss');
const pathRouter = require('./path');
const commentsRouter = require('./comments');

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/xss', xssRouter);
app.use('/path', pathRouter);
app.use('/comments', commentsRouter);

// Connect to SQLite database
const db = new sqlite3.Database('./database.db');

// Create a table for storing user data
db.serialize(function () {
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT
    );
  `);
    
    // Create a table for user accounts (for XSRF demo)
    db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      balance INTEGER DEFAULT 1000
    );
  `);
    
    // Insert demo accounts
    db.run(`INSERT OR IGNORE INTO accounts (username, balance) VALUES ('alice', 1000)`);
    db.run(`INSERT OR IGNORE INTO accounts (username, balance) VALUES ('bob', 500)`);
});

// Route for index page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Route for searching users
app.get('/search', (req, res) => {
    const query = req.query.q;
    const sql = `SELECT * FROM users WHERE name LIKE '%${query}%'`;
    db.all(sql, (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error searching users');
        } else {
            res.render('users', { users: rows });
        }
    });
});

// Route for creating a new user
app.post('/create', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const sql = `INSERT INTO users (name, email) VALUES ('${name}', '${email}')`;
    db.run(sql, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error creating user');
        } else {
            res.redirect('/');
        }
    });
});

// XSRF Vulnerable Routes
// Route to display XSRF demo page
app.get('/xsrf', (req, res) => {
    res.sendFile(__dirname + '/public/xsrf.html');
});

// Vulnerable money transfer endpoint (no CSRF protection)
app.post('/transfer', (req, res) => {
    const { from, to, amount } = req.body;
    
    // Simulate a simple money transfer without any CSRF protection
    const transferAmount = parseInt(amount);
    
    if (!from || !to || !transferAmount || transferAmount <= 0) {
        return res.status(400).send('Invalid transfer parameters');
    }
    
    // Update balances (vulnerable to CSRF attacks)
    db.serialize(() => {
        db.run(`UPDATE accounts SET balance = balance - ? WHERE username = ?`, [transferAmount, from], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Transfer failed');
            }
            
            db.run(`UPDATE accounts SET balance = balance + ? WHERE username = ?`, [transferAmount, to], function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Transfer failed');
                }
                
                res.send(`Successfully transferred $${transferAmount} from ${from} to ${to}`);
            });
        });
    });
});

// Route to view account balances
app.get('/balances', (req, res) => {
    db.all('SELECT username, balance FROM accounts', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching balances');
        } else {
            let html = '<h2>Account Balances</h2><ul>';
            rows.forEach(row => {
                html += `<li>${row.username}: $${row.balance}</li>`;
            });
            html += '</ul><a href="/xsrf">Back to XSRF Demo</a>';
            res.send(html);
        }
    });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});