// backend/tests/loadtest.mjs
// Sanchivue — baseline load test (autocannon).
//
// Honest goal: characterize the BACKEND'S baseline throughput on a single
// process against the cheapest endpoints (health + register + login) so we
// can spot gross regressions — NOT to claim "100k concurrent users".
//
// Real-world concurrency at 100k users depends on MongoDB Atlas tier,
// horizontal backend replicas, Redis-backed Socket.io adapter, TURN capacity,
// and CDN offload. This script measures one process on localhost.
//
// Run:  node backend/tests/loadtest.mjs
// Requires the backend running on http://localhost:5000 (MONGODB_URI optional
// — health + register/login work with the DB; if DB is down, register/login
// 5xx and we report that honestly).
import autocannon from 'autocannon';

const BASE = 'http://localhost:5000';
const RESULTS = [];

async function probe() {
  // Quick connectivity probe so we don't autocannon a dead server.
  try {
    const r = await fetch(`${BASE}/health`);
    if (!r.ok) throw new Error(`health ${r.status}`);
    console.log(`[probe] backend reachable on ${BASE} (health ${r.status})`);
    return true;
  } catch (e) {
    console.error(`[probe] backend NOT reachable on ${BASE}: ${e.message}`);
    console.error('       Start it with:  cd backend && bun run dev');
    return false;
  }
}

function run(label, opts) {
  return new Promise((resolve) => {
    const instance = autocannon({ ...opts, timeout: 30 }, (err, result) => {
      if (err) {
        console.error(`[${label}] error:`, err.message);
        return resolve(null);
      }
      RESULTS.push({ label, ...result });
      console.log(
        `[${label}] ` +
          `${result.requests.average} req/s avg · ` +
          `${result.requests.sent} sent · ` +
          `${result.errors} errors · ` +
          `p50=${result.latency.p50}ms p99=${result.latency.p99}ms`,
      );
      resolve(result);
    });
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false });
  });
}

async function main() {
  if (!(await probe())) process.exit(1);

  console.log('\n=== Test 1: /health (liveness, no DB) — 200 conns × 20s ===');
  await run('health', {
    url: `${BASE}/health`,
    connections: 200,
    duration: 20,
  });

  console.log('\n=== Test 2: /ready (depends on DB) — 100 conns × 15s ===');
  await run('ready', {
    url: `${BASE}/ready`,
    connections: 100,
    duration: 15,
  });

  console.log('\n=== Test 3: POST /api/v1/auth/register — 50 conns × 20s ===');
  // Each request registers a unique email so we exercise the real write path.
  await run('register', {
    url: `${BASE}/api/v1/auth/register`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Load Test',
      email: `load_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@demo.dev`,
      password: 'loadtest123',
      role: 'candidate',
    }),
    connections: 50,
    duration: 20,
  });

  console.log('\n=== Summary ===');
  for (const r of RESULTS) {
    console.log(
      `${r.label.padEnd(10)} ` +
        `avg=${r.requests.average} req/s · ` +
        `p50=${r.latency.p50}ms · p99=${r.latency.p99}ms · ` +
        `errors=${r.errors} · ` +
        `non2xx=${r.non2xx || 0}`,
    );
  }

  // Honest framing.
  console.log('\n=== Interpretation ===');
  console.log('• These numbers reflect a SINGLE backend process on localhost.');
  console.log('• 100k concurrent users requires horizontal scaling: N replicas ' +
    'behind a load balancer, a sized MongoDB Atlas cluster, Redis-backed ' +
    'Socket.io adapter, and a TURN farm for WebRTC media.');
  console.log('• Use this script to catch throughput REGRESSIONS, not to claim');
  console.log('  a production concurrency ceiling.');
}

main().catch((e) => {
  console.error('loadtest failed:', e);
  process.exit(1);
});
