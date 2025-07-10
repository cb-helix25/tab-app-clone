const express = require('express');
const morgan = require('morgan');
const path = require('path');
const keysRouter = require('./routes/keys');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/keys', keysRouter);

const buildPath = path.join(__dirname, 'static');
app.use(express.static(buildPath));

app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
