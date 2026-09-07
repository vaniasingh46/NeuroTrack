/**
 * Builds/updates a user's personal baseline from their calibration sessions.
 * We use Welford's online algorithm so we can update mean/std incrementally
 * as each new calibration session comes in, without re-reading full history.
 *
 * A baseline "locks" once each modality has at least MIN_SAMPLES valid
 * calibration sessions - after that, new sessions are scored AGAINST it
 * rather than folded into it (until an explicit recalibration is triggered).
 */

const MIN_SAMPLES_TO_LOCK = 3;

function createEmptyBaseline() {
  return {
    tremor: { sampleCount: 0 },
    spiral: { sampleCount: 0 },
    tapping: { sampleCount: 0 },
    establishedAt: null,
    isLocked: false
  };
}

function welfordUpdate(prevMean, prevM2, prevCount, newValue) {
  const count = prevCount + 1;
  const delta = newValue - prevMean;
  const mean = prevMean + delta / count;
  const delta2 = newValue - mean;
  const m2 = prevM2 + delta * delta2;
  const variance = count > 1 ? m2 / (count - 1) : 0;
  return { mean, m2, count, std: Math.sqrt(variance) };
}

/**
 * Mutates `baseline` (a User.baseline subdocument) in place, folding in
 * any valid tests present on `session`. Returns the updated baseline.
 */
function updateBaselineWithSession(baseline, session) {
  // We store m2 (Welford intermediate) outside the persisted schema by
  // reconstructing it from mean/std/count each time. This keeps the
  // schema simple at the cost of a tiny bit of recomputation - fine at
  // hackathon scale.
  const reconstructM2 = (std, count) => (count > 1 ? std * std * (count - 1) : 0);

  if (session.tremor?.quality?.isValid) {
    const b = baseline.tremor;
    const m2Amp = reconstructM2(b.stdAmplitude || 0, b.sampleCount);
    const ampResult = welfordUpdate(b.meanAmplitude || 0, m2Amp, b.sampleCount, session.tremor.amplitude);

    const m2Freq = reconstructM2(b.stdDominantFreq || 0, b.sampleCount);
    const freqResult = welfordUpdate(
      b.meanDominantFreq || 0,
      m2Freq,
      b.sampleCount,
      session.tremor.dominantFreqHz
    );

    b.meanAmplitude = ampResult.mean;
    b.stdAmplitude = ampResult.std;
    b.meanDominantFreq = freqResult.mean;
    b.stdDominantFreq = freqResult.std;
    b.sampleCount = ampResult.count;
  }

  if (session.spiral?.quality?.isValid) {
    const b = baseline.spiral;
    const m2 = reconstructM2(b.stdDeviationScore || 0, b.sampleCount);
    const result = welfordUpdate(b.meanDeviationScore || 0, m2, b.sampleCount, session.spiral.deviationScore);
    b.meanDeviationScore = result.mean;
    b.stdDeviationScore = result.std;
    b.sampleCount = result.count;
  }

  if (session.tapping?.quality?.isValid) {
    const b = baseline.tapping;
    const m2Count = reconstructM2(b.stdTapCount || 0, b.sampleCount);
    const countResult = welfordUpdate(b.meanTapCount || 0, m2Count, b.sampleCount, session.tapping.tapCount);

    const m2Var = reconstructM2(b.stdIntervalVariance || 0, b.sampleCount);
    const varResult = welfordUpdate(
      b.meanIntervalVariance || 0,
      m2Var,
      b.sampleCount,
      session.tapping.interTapIntervalVarianceMs
    );

    b.meanTapCount = countResult.mean;
    b.stdTapCount = countResult.std;
    b.meanIntervalVariance = varResult.mean;
    b.stdIntervalVariance = varResult.std;
    b.sampleCount = countResult.count;
  }

  const allLocked =
    baseline.tremor.sampleCount >= MIN_SAMPLES_TO_LOCK &&
    baseline.spiral.sampleCount >= MIN_SAMPLES_TO_LOCK &&
    baseline.tapping.sampleCount >= MIN_SAMPLES_TO_LOCK;

  if (allLocked && !baseline.isLocked) {
    baseline.isLocked = true;
    baseline.establishedAt = new Date();
  }

  return baseline;
}

module.exports = {
  createEmptyBaseline,
  updateBaselineWithSession,
  MIN_SAMPLES_TO_LOCK
};
