const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// When running locally index.js lives in the `server` folder and the built
// client files are one level up. However after deployment the build script
// copies `index.js` to the site root alongside the compiled client assets.
// Using `__dirname` directly works for both cases.
const buildPath = path.join(__dirname, 'static'); // or 'client/dist'

// basic request logging
app.use(morgan('dev'));

// serve the built React files
app.use(express.static(buildPath));

// simple liveness probe
app.get('/health', (_req, res) => {
    res.sendStatus(200);
});

// example Server-Sent Events endpoint emitting fake progress
app.get('/process', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        res.write(`data: ${JSON.stringify({ progress })}\n\n`);
        if (progress >= 100) {
            res.write('event: done\n');
            res.write('data: {}\n\n');
            clearInterval(interval);
            res.end();
        }
    }, 500);

    req.on('close', () => clearInterval(interval));
});

// fallback to index.html for client-side routes
app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
