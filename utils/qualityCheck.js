/**
 * Server-side sanity checks on incoming test data.
 * This is a *second* line of defense — the phone should already flag
 * low-confidence tests on-device, but we re-validate here so a buggy
 * or malicious client can't pollute trend data / baselines.
 *
 * Each check returns { isValid, reason, confidence }.
 */

const THRESHOLDS = {
  tremor: {
    minDurationSec: 3,
    minAmplitude: 0.01, // near-zero amplitude => phone probably wasn't held/moving
    maxAmplitude: 50, // absurdly high => clipped/dropped sensor
  },
  spiral: {
    minPointCount: 20, // too few points => test cut short
    minCompletionTimeSec: 1,
    maxDeviationScore: 1000, // sanity ceiling, tune against real data
  },
  tapping: {
    minDurationSec: 3,
    minTapCount: 3, // fewer than this in a real tapping test suggests it didn't run
  },
};

function hasFiniteNumbers(test, fields) {
  return fields.every((field) => Number.isFinite(test[field]));
}

function checkTremor(test) {
  if (!test) return null;
  const t = THRESHOLDS.tremor;
  if (!hasFiniteNumbers(test, ['durationSec', 'amplitude', 'dominantFreqHz']) || test.dominantFreqHz < 0) {
    return { isValid: false, reason: 'invalid_measurement', confidence: 0 };
  }
  if (test.durationSec < t.minDurationSec) {
    return { isValid: false, reason: 'test_cut_short', confidence: 0.2 };
  }
  if (test.amplitude < t.minAmplitude) {
    return { isValid: false, reason: 'low_motion', confidence: 0.3 };
  }
  if (test.amplitude > t.maxAmplitude) {
    return { isValid: false, reason: 'clipped', confidence: 0.1 };
  }
  return { isValid: true, reason: null, confidence: 1 };
}

function checkSpiral(test) {
  if (!test) return null;
  const t = THRESHOLDS.spiral;
  if (!hasFiniteNumbers(test, ['pointCount', 'completionTimeSec', 'deviationScore']) || test.deviationScore < 0) {
    return { isValid: false, reason: 'invalid_measurement', confidence: 0 };
  }
  if (test.pointCount < t.minPointCount || test.completionTimeSec < t.minCompletionTimeSec) {
    return { isValid: false, reason: 'test_cut_short', confidence: 0.2 };
  }
  if (test.deviationScore > t.maxDeviationScore) {
    return { isValid: false, reason: 'implausible_deviation', confidence: 0.2 };
  }
  return { isValid: true, reason: null, confidence: 1 };
}

function checkTapping(test) {
  if (!test) return null;
  const t = THRESHOLDS.tapping;
  if (!hasFiniteNumbers(test, ['durationSec', 'tapCount', 'interTapIntervalVarianceMs']) || test.interTapIntervalVarianceMs < 0) {
    return { isValid: false, reason: 'invalid_measurement', confidence: 0 };
  }
  if (test.durationSec < t.minDurationSec) {
    return { isValid: false, reason: 'test_cut_short', confidence: 0.2 };
  }
  if (test.tapCount < t.minTapCount) {
    return { isValid: false, reason: 'low_motion', confidence: 0.3 };
  }
  return { isValid: true, reason: null, confidence: 1 };
}

/**
 * Runs quality checks across whatever tests are present on the payload
 * and attaches a `quality` object to each. Returns the mutated payload
 * plus an overall `isValid` flag for the session.
 */
function annotateQuality(payload) {
  const result = { ...payload };
  let anyValid = false;

  if (result.tremor) {
    const q = checkTremor(result.tremor);
    result.tremor.quality = q;
    if (q.isValid) anyValid = true;
  }
  if (result.spiral) {
    const q = checkSpiral(result.spiral);
    result.spiral.quality = q;
    if (q.isValid) anyValid = true;
  }
  if (result.tapping) {
    const q = checkTapping(result.tapping);
    result.tapping.quality = q;
    if (q.isValid) anyValid = true;
  }

  // A session is only fully invalid if none of the submitted tests passed.
  result.isValid = anyValid;
  return result;
}

module.exports = { annotateQuality, checkTremor, checkSpiral, checkTapping };
