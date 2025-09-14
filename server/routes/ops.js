const express = require('express');
const { list, sessionId } = require('../utils/opLog');

const router = express.Router();

router.get('/', (req, res) => {
  const { type, status, limit, since, session } = req.query;
  const parsedLimit = limit ? Math.max(1, Math.min(1000, Number(limit))) : 200;
  const filterSession = session === 'current' || session === 'true' ? sessionId : undefined;
  res.json({ ok: true, currentSessionId: sessionId, events: list({ type, status, limit: parsedLimit, since, sessionId: filterSession }) });
});

module.exports = router;
