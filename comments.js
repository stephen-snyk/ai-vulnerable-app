const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Create comments table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Display comments page
router.get('/', (req, res) => {
    db.all('SELECT * FROM comments ORDER BY created_at DESC', [], (err, comments) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching comments');
        }

        const commentsHtml = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <strong>${escapeHtml(comment.author)}</strong>
                    <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
            </div>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comments</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .header {
                        background: #333;
                        color: white;
                        padding: 20px;
                        margin: -20px -20px 20px -20px;
                        border-radius: 5px 5px 0 0;
                    }
                    .comment-form {
                        background: white;
                        padding: 20px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                        color: #333;
                    }
                    input[type="text"],
                    textarea {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                        font-family: Arial, sans-serif;
                    }
                    textarea {
                        resize: vertical;
                        min-height: 100px;
                    }
                    button {
                        background: #007bff;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover {
                        background: #0056b3;
                    }
                    .comments-list {
                        margin-top: 20px;
                    }
                    .comment {
                        background: white;
                        padding: 15px;
                        margin-bottom: 15px;
                        border-radius: 5px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .comment-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .comment-date {
                        color: #666;
                        font-size: 14px;
                    }
                    .comment-content {
                        color: #333;
                        line-height: 1.6;
                        white-space: pre-wrap;
                    }
                    .back-link {
                        display: inline-block;
                        margin-top: 20px;
                        color: #007bff;
                        text-decoration: none;
                    }
                    .back-link:hover {
                        text-decoration: underline;
                    }
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #666;
                        background: white;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>💬 Comments</h1>
                    <p>Share your thoughts and feedback</p>
                </div>

                <div class="comment-form">
                    <h2>Add a Comment</h2>
                    <form method="POST" action="/comments/add">
                        <div class="form-group">
                            <label for="author">Your Name:</label>
                            <input type="text" id="author" name="author" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="content">Comment:</label>
                            <textarea id="content" name="content" required maxlength="1000"></textarea>
                        </div>
                        <button type="submit">Post Comment</button>
                    </form>
                </div>

                <div class="comments-list">
                    <h2>All Comments (${comments.length})</h2>
                    ${comments.length > 0 ? commentsHtml : '<div class="empty-state">No comments yet. Be the first to comment!</div>'}
                </div>

                <a href="/" class="back-link">← Back to Home</a>
            </body>
            </html>
        `);
    });
});

// Add new comment
router.post('/add', (req, res) => {
    const { author, content } = req.body;

    // Validate input exists and is a string
    if (!author || !content || typeof author !== 'string' || typeof content !== 'string') {
        return res.status(400).send('Author and content are required and must be strings');
    }

    // Validate input length
    if (author.length > 100 || content.length > 1000) {
        return res.status(400).send('Input exceeds maximum length');
    }

    const stmt = db.prepare('INSERT INTO comments (author, content) VALUES (?, ?)');
    stmt.run([author, content], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error adding comment');
        }
        res.redirect('/comments');
    });
    stmt.finalize();
});

// Delete comment (for demonstration)
router.post('/delete/:id', (req, res) => {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
        return res.status(400).send('Invalid comment ID');
    }

    db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error deleting comment');
        }
        res.redirect('/comments');
    });
});

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = router;
