// Wait for one or more TCP ports to accept connections, then exit 0.
// Usage: node scripts/waitForPorts.js 7071,7072,8080 [timeoutMs]
// Default timeout: 120000 ms

const net = require('net');

const listArg = process.argv[2] || '';
const timeoutMs = Number(process.argv[3] || 120000);

if (!listArg) {
  console.error('Usage: node scripts/waitForPorts.js <port1,port2,...> [timeoutMs]');
  process.exit(1);
}

const targets = listArg.split(',').map((s) => s.trim()).filter(Boolean).map((entry) => {
  // support host:port or port
  if (entry.includes(':')) {
    const [host, portStr] = entry.split(':');
    return { host, port: Number(portStr) };
  }
  return { host: '127.0.0.1', port: Number(entry) };
});

const deadline = Date.now() + timeoutMs;

function checkPort({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const onDone = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.once('connect', () => onDone(true));
    socket.once('error', () => onDone(false));
    socket.setTimeout(1500, () => onDone(false));
  });
}

async function waitAll() {
  process.stdout.write(`Waiting for: ${targets.map(t => `${t.host}:${t.port}`).join(', ')}\n`);
  while (Date.now() < deadline) {
    const results = await Promise.all(targets.map(checkPort));
    const allReady = results.every(Boolean);
    if (allReady) {
      process.stdout.write('All ports are ready.\n');
      return 0;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  console.error('Timed out waiting for ports.');
  return 1;
}

waitAll().then((code) => process.exit(code));
