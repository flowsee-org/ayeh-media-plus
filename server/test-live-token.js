import http from 'http';
import assert from 'node:assert';
import express from 'express';
import liveRoutes from './routes/live.js';

const app = express();
app.use(express.json());
app.use('/api/live', liveRoutes);

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    console.log('Testing /api/live/token ...');

    // 1. Missing room param -> 400
    const res1 = await fetch(`${baseUrl}/api/live/token`);
    assert.strictEqual(res1.status, 400, 'Must return 400 for missing room parameter');
    const data1 = await res1.json();
    assert.match(data1.error, /room query parameter is required/);
    console.log('✔ Missing room parameter rejected with 400');

    // 2. Anonymous subscriber token
    const res2 = await fetch(`${baseUrl}/api/live/token?room=room-abc`);
    assert.strictEqual(res2.status, 200, 'Must return 200 for valid room query');
    const data2 = await res2.json();
    assert.ok(data2.token, 'token must be present');
    assert.ok(data2.url, 'url must be present');
    assert.strictEqual(data2.canPublish, false, 'Guest viewer cannot publish by default');
    assert.match(data2.identity, /^guest_/);
    console.log('✔ Guest viewer granted subscriber token successfully');

    console.log('\n✔ LiveKit token API tests passed!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
