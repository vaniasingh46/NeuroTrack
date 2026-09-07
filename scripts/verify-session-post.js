const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const USER_ID = 'post-verify-20260907-001';

const PAYLOAD_1 = {
  userId: USER_ID,
  tremor: {
    amplitude: 0.2,
    dominantFreqHz: 4.5,
    durationSec: 10
  },
  spiral: {
    deviationScore: 25,
    completionTimeSec: 9,
    pointCount: 150
  },
  tapping: {
    tapCount: 60,
    durationSec: 10,
    interTapIntervalVarianceMs: 18
  },
  notes: 'Disposable POST verification calibration 1'
};

const PAYLOAD_2 = {
  userId: USER_ID,
  tremor: {
    amplitude: 0.22,
    dominantFreqHz: 4.7,
    durationSec: 10
  },
  spiral: {
    deviationScore: 27,
    completionTimeSec: 9.5,
    pointCount: 155
  },
  tapping: {
    tapCount: 58,
    durationSec: 10,
    interTapIntervalVarianceMs: 20
  },
  notes: 'Disposable POST verification calibration 2'
};

const PAYLOAD_3 = {
  userId: USER_ID,
  tremor: {
    amplitude: 0.35,
    dominantFreqHz: 5.1,
    durationSec: 10
  },
  spiral: {
    deviationScore: 35,
    completionTimeSec: 10,
    pointCount: 160
  },
  tapping: {
    tapCount: 50,
    durationSec: 10,
    interTapIntervalVarianceMs: 28
  },
  notes: 'Disposable POST verification calibration 3 / scoring'
};

async function postSession(payload, index) {
  console.log('\n========================================');
  console.log(`[STEP ${index}] POST /api/sessions`);
  console.log('Payload:');
  console.log(JSON.stringify(payload, null, 2));

  let res;
  try {
    res = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (networkErr) {
    console.error(`\nFailed to connect to server at ${BASE_URL}:`, networkErr.message);
    console.error('Make sure the server is running on port 4000 before running verification.');
    process.exit(1);
  }

  const status = res.status;
  let body;
  const rawText = await res.text();
  try {
    body = JSON.parse(rawText);
  } catch {
    body = rawText;
  }

  console.log(`Status: ${status} ${res.statusText}`);
  console.log('Response:');
  console.log(typeof body === 'object' ? JSON.stringify(body, null, 2) : body);

  if (!res.ok) {
    console.error(`\nRequest failed with status ${status}. Stopping immediately.`);
    process.exit(1);
  }

  return body;
}

async function getEndpoint(path, label) {
  console.log('\n========================================');
  console.log(`[GET] ${label}: ${path}`);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch (networkErr) {
    console.error(`\nFailed to connect to server at ${BASE_URL}:`, networkErr.message);
    process.exit(1);
  }

  const status = res.status;
  let body;
  const rawText = await res.text();
  try {
    body = JSON.parse(rawText);
  } catch {
    body = rawText;
  }

  console.log(`Status: ${status} ${res.statusText}`);
  console.log('Response:');
  console.log(typeof body === 'object' ? JSON.stringify(body, null, 2) : body);

  if (!res.ok) {
    console.error(`\nGET request to ${path} failed with status ${status}. Stopping immediately.`);
    process.exit(1);
  }

  return body;
}

async function main() {
  console.log(`Starting NeuroTrack session POST verification against ${BASE_URL}...`);
  console.log(`Target User ID: ${USER_ID}`);

  // 1. Post Payload 1
  await postSession(PAYLOAD_1, 1);

  // 2. Post Payload 2
  await postSession(PAYLOAD_2, 2);

  // 3. Post Payload 3
  await postSession(PAYLOAD_3, 3);

  // 4. GET user profile
  await getEndpoint(`/api/users/${USER_ID}`, 'User Profile');

  // 5. GET session history
  await getEndpoint(`/api/sessions/${USER_ID}`, 'Session History');

  // 6. GET latest session
  await getEndpoint(`/api/sessions/${USER_ID}/latest`, 'Latest Valid Session');

  console.log('\n========================================');
  console.log('Verification completed successfully! All requests succeeded.');
}

main().catch((err) => {
  console.error('Unexpected error during verification:', err);
  process.exit(1);
});

