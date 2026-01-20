const express = require('express');
const router = express.Router();

// GET /xss - Display an intentionally vulnerable form
router.get('/', (req, res) => {
    const html = `
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Reflected XSS Demo</title>
        <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 40px; }
            form { display: grid; gap: 12px; max-width: 560px; }
            input[type="text"] { padding: 8px 10px; font-size: 16px; }
            button { padding: 8px 12px; font-size: 16px; cursor: pointer; }
            .hint { color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <h2>Reflected XSS Demonstration</h2>
        <p class="hint">This page is intentionally vulnerable. Try submitting a payload like:
            <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
        </p>
        <form action="/xss/reflect" method="POST">
            <label for="message">Message</label>
            <input id="message" name="message" type="text" placeholder="Type anything..." />
            <button type="submit">Submit</button>
        </form>
    </body>
    </html>`;
    res.send(html);
});

// POST /xss/reflect - Reflect back user input without sanitization (intentionally vulnerable)
router.post('/reflect', (req, res) => {
    const message = req.body && req.body.message ? req.body.message : '';
    const html = `
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Reflected XSS Result</title>
        <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 40px; }
            .result { margin-top: 16px; padding: 12px; border: 1px solid #ddd; }
            a { display: inline-block; margin-top: 16px; }
        </style>
    </head>
    <body>
        <h2>Reflected XSS Result</h2>
        <p>Your message was:</p>
        <div class="result">${message}</div>
        <a href="/xss">Back</a>
    </body>
    </html>`;
    // Intentionally using res.send with unsanitized user input to demonstrate XSS
    res.send(html);
});

module.exports = router;

