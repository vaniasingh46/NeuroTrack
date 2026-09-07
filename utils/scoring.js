/**
 * Composite scoring: z-scores each modality's features against the user's
 * OWN baseline (not a population norm), then combines into a 0-100 index.
 *
 * Higher composite score = further from the patient's personal healthy
 * baseline (i.e. worse symptoms), which maps naturally onto a "trend
 * going up = concerning" dashboard narrative.
 *
 * This is intentionally a transparent, rules-based weighted index —
 * not a trained model — so it can be explained in a "why this score"
 * breakdown in the UI (radar/bar chart of sub-scores).
 */

const WEIGHTS = { tremor: 0.4, spiral: 0.3, tapping: 0.3 };

// Guard against divide-by-zero when std is 0 or baseline not yet established.
// If calibration sessions happen to be near-identical (small sample, steady
// hand that day), std can be ~0 - which would otherwise make z-scoring
// either undefined or wildly unstable for tiny deviations. We floor std to
// a small fraction of the mean (or an absolute epsilon) instead of bailing.
function safeZ(value, mean, std) {
  if (![value, mean, std].every(Number.isFinite)) {
    return null;
  }
  const floor = Math.max(Math.abs(mean) * 0.05, 1e-3);
  const effectiveStd = std < floor ? floor : std;
  return (value - mean) / effectiveStd;
}

// Squash a z-score into a bounded 0-100 sub-score.
// z=0 (exactly at baseline) -> 0 (no deviation)
// larger |z| -> higher score, saturating via a simple clamp so one wild
// session can't blow out the whole composite.
function zToSubScore(z) {
  if (!Number.isFinite(z)) return null;
  const clamped = Math.max(-4, Math.min(4, z));
  return Math.round((Math.abs(clamped) / 4) * 100);
}

function scoreTremor(test, baseline) {
  if (!test || !test.quality?.isValid) return null;
  const zAmp = safeZ(test.amplitude, baseline?.meanAmplitude, baseline?.stdAmplitude);
  const zFreq = safeZ(test.dominantFreqHz, baseline?.meanDominantFreq, baseline?.stdDominantFreq);
  const zs = [zAmp, zFreq].filter((z) => z !== null);
  if (zs.length === 0) return null;
  const avgZ = zs.reduce((a, b) => a + b, 0) / zs.length;
  return zToSubScore(avgZ);
}

function scoreSpiral(test, baseline) {
  if (!test || !test.quality?.isValid) return null;
  const z = safeZ(test.deviationScore, baseline?.meanDeviationScore, baseline?.stdDeviationScore);
  return zToSubScore(z);
}

function scoreTapping(test, baseline) {
  if (!test || !test.quality?.isValid) return null;
  const zVar = safeZ(
    test.interTapIntervalVarianceMs,
    baseline?.meanIntervalVariance,
    baseline?.stdIntervalVariance
  );
  const zCount = safeZ(test.tapCount, baseline?.meanTapCount, baseline?.stdTapCount);
  // Fewer taps than baseline and/or more irregular intervals both indicate bradykinesia,
  // so we flip the sign on tap-count deviation (fewer taps = worse = positive contribution).
  const zs = [];
  if (zVar !== null) zs.push(zVar);
  if (zCount !== null) zs.push(-zCount);
  if (zs.length === 0) return null;
  const avgZ = zs.reduce((a, b) => a + b, 0) / zs.length;
  return zToSubScore(avgZ);
}

/**
 * Computes sub-scores + composite for a session against a user's baseline.
 * Only modalities present AND baseline-established contribute; weights are
 * renormalized across whatever actually contributed so a missing test
 * doesn't silently drag the composite toward zero.
 */
function computeComposite(session, baseline) {
  const subScores = {
    tremor: scoreTremor(session.tremor, baseline?.tremor),
    spiral: scoreSpiral(session.spiral, baseline?.spiral),
    tapping: scoreTapping(session.tapping, baseline?.tapping),
  };

  const contributing = Object.keys(subScores).filter((k) => subScores[k] !== null);

  if (contributing.length === 0) {
    return { value: null, subScores, contributingTests: [], method: 'z-score-weighted-v1' };
  }

  const totalWeight = contributing.reduce((sum, k) => sum + WEIGHTS[k], 0);
  const value = Math.round(
    contributing.reduce((sum, k) => sum + subScores[k] * (WEIGHTS[k] / totalWeight), 0)
  );

  return { value, subScores, contributingTests: contributing, method: 'z-score-weighted-v1' };
}

module.exports = { computeComposite, safeZ, zToSubScore };
