const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

const buildPath = path.join(__dirname, '..');
app.use(express.static(buildPath));

app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});