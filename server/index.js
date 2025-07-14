const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: false });
const express = require('express');
const morgan = require('morgan');
const keysRouter = require('./routes/keys');
const refreshRouter = require('./routes/refresh');
const matterRequestsRouter = require('./routes/matterRequests');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/keys', keysRouter);
app.use('/api/refresh', refreshRouter);
app.use('/api/matter-requests', matterRequestsRouter);

const buildPath = path.join(__dirname, 'static');
app.use(express.static(buildPath));

app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});