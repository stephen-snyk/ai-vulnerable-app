const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Vulnerable file viewer endpoint - demonstrates path traversal
router.get('/view', (req, res) => {
    const filename = req.query.file;
    
    if (!filename) {
        return res.status(400).send('Please provide a filename using ?file=<filename>');
    }
    
    // VULNERABLE: Directly concatenating user input without validation
    // This allows attackers to use "../" to traverse directories
    const filePath = path.join(__dirname, 'public/files', filename);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(404).send('File not found or cannot be read');
        }
        
        res.send(`
            <html>
            <head>
                <title>File Viewer</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
                    .header { background: #333; color: white; padding: 10px; margin: -20px -20px 20px -20px; }
                    .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📁 File Viewer</h1>
                </div>
                <h2>Viewing: ${filename}</h2>
                <pre>${data}</pre>
                <hr>
                <a href="/path">Back to File List</a>
            </body>
            </html>
        `);
    });
});

// Simple file listing page
router.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Path Traversal Demo</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #333; color: white; padding: 10px; margin: -20px -20px 20px -20px; }
                .file-list { list-style: none; padding: 0; }
                .file-list li { padding: 10px; margin: 5px 0; background: #f4f4f4; border-radius: 5px; }
                .file-list a { text-decoration: none; color: #007bff; }
                .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
                .attack-examples { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📁 Path Traversal Vulnerability Demo</h1>
            </div>
            
            <div class="warning">
                <strong>⚠️ Educational Demo:</strong> This page contains a path traversal vulnerability for learning purposes.
            </div>
            
            <h2>Available Files</h2>
            <ul class="file-list">
                <li><a href="/path/view?file=document1.txt">📄 document1.txt</a></li>
                <li><a href="/path/view?file=document2.txt">📄 document2.txt</a></li>
                <li><a href="/path/view?file=readme.txt">📄 readme.txt</a></li>
            </ul>
            
            <div class="attack-examples">
                <h3>🔴 Example Attack Vectors (for educational purposes):</h3>
                <p>Students can try these to demonstrate the vulnerability:</p>
                <ul>
                    <li><code>/path/view?file=../../../etc/passwd</code> - Try to read system files (Unix/Linux)</li>
                    <li><code>/path/view?file=../../app.js</code> - Read application source code</li>
                    <li><code>/path/view?file=../../package.json</code> - Read package configuration</li>
                    <li><code>/path/view?file=..\\..\\..\\windows\\system32\\drivers\\etc\\hosts</code> - Windows variant</li>
                </ul>
            </div>
            
            <h3>🛡️ How to Fix:</h3>
            <ol>
                <li>Validate and sanitize the filename input</li>
                <li>Use a whitelist of allowed files</li>
                <li>Resolve the path and check it stays within the allowed directory</li>
                <li>Remove or block ".." sequences</li>
                <li>Use path.basename() to strip directory components</li>
            </ol>
            
            <hr>
            <a href="/">← Back to Home</a>
        </body>
        </html>
    `);
});

module.exports = router;
