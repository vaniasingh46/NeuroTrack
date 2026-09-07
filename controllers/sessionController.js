const supabase = require('../config/supabase');

const {
  annotateQuality
} = require('../utils/qualityCheck');

const {
  computeComposite
} = require('../utils/scoring');

const {
  createEmptyBaseline,
  updateBaselineWithSession,
  MIN_SAMPLES_TO_LOCK
} = require('../utils/baseline');


function userRowToUser(row) {
  if (!row) return null;

  const empty = createEmptyBaseline();
  const rawBaseline = row.baseline || {};

  return {
    id: row.id,
    userId: row.id,
    displayName: row.name,
    baseline: {
      ...empty,
      ...rawBaseline,
      tremor: { ...empty.tremor, ...(rawBaseline.tremor || {}) },
      spiral: { ...empty.spiral, ...(rawBaseline.spiral || {}) },
      tapping: { ...empty.tapping, ...(rawBaseline.tapping || {}) }
    }
  };
}


// POST /api/sessions
async function createSession(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Request body must be a JSON object'
      });
    }

    const {
      userId,
      tremor,
      spiral,
      tapping,
      isCalibrationSession,
      notes
    } = req.body;

    if (typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    if (!tremor && !spiral && !tapping) {
      return res.status(400).json({
        error:
          'At least one of tremor, spiral, tapping is required'
      });
    }

    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({
        error: 'notes must be a string'
      });
    }

    if (isCalibrationSession !== undefined && typeof isCalibrationSession !== 'boolean') {
      return res.status(400).json({
        error: 'isCalibrationSession must be a boolean'
      });
    }

    // Find user
    let {
      data: userRow,
      error: userError
    } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error(
        'Supabase user lookup error:',
        userError
      );

      return res.status(500).json({
        error: 'Failed to load user',
        details: userError.message
      });
    }

    // Create user if needed
    if (!userRow) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          baseline: createEmptyBaseline(),
          baseline_score: 80,
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error(
          'Supabase user creation error:',
          error
        );

        return res.status(500).json({
          error: 'Failed to create user',
          details: error.message
        });
      }

      userRow = data;
    }

    const user = userRowToUser(userRow);

    // Quality checks
    const annotated = annotateQuality({
      tremor,
      spiral,
      tapping
    });

    // Determine calibration
    const treatAsCalibration =
      Boolean(isCalibrationSession) ||
      !user.baseline.isLocked;

    let composite = {
      value: null,
      subScores: {},
      contributingTests: [],
      method: 'z-score-weighted-v1'
    };

    // Calibration
    if (treatAsCalibration) {
      updateBaselineWithSession(
        user.baseline,
        annotated
      );

      if (user.baseline.isLocked) {
        composite = computeComposite(
          annotated,
          user.baseline
        );
      }
    } else {
      composite = computeComposite(
        annotated,
        user.baseline
      );
    }

    // Save session
    const {
      data: session,
      error: sessionError
    } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        tremor: annotated.tremor || null,
        spiral: annotated.spiral || null,
        tapping: annotated.tapping || null,
        composite,
        score: composite.value,
        is_calibration_session: treatAsCalibration,
        is_valid: annotated.isValid,
        notes: notes || ''
      })
      .select('*')
      .single();

    if (sessionError) {
      console.error(
        'Supabase session creation error:',
        sessionError
      );

      return res.status(500).json({
        error: 'Failed to save session',
        details: sessionError.message
      });
    }

    // Save updated baseline
    const {
      data: updatedUserRow,
      error: updateUserError
    } = await supabase
      .from('users')
      .update({
        baseline: user.baseline,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateUserError) {
      console.error(
        'Supabase baseline update error:',
        updateUserError
      );

      return res.status(500).json({
        error:
          'Session saved but baseline update failed',
        details: updateUserError.message
      });
    }

    const updatedUser =
      userRowToUser(updatedUserRow);

    return res.status(201).json({
      session,
      baseline: updatedUser.baseline,
      baselineLocked:
        updatedUser.baseline.isLocked,
      calibrationProgress: {
        tremor:
          `${updatedUser.baseline.tremor?.sampleCount || 0}/${MIN_SAMPLES_TO_LOCK}`,

        spiral:
          `${updatedUser.baseline.spiral?.sampleCount || 0}/${MIN_SAMPLES_TO_LOCK}`,

        tapping:
          `${updatedUser.baseline.tapping?.sampleCount || 0}/${MIN_SAMPLES_TO_LOCK}`
      }
    });

  } catch (err) {
    console.error(
      'createSession error:',
      err
    );

    return res.status(500).json({
      error: 'Failed to create session'
    });
  }
}


// GET /api/sessions/:userId
async function getHistory(req, res) {
  try {
    const { userId } = req.params;

    const requestedLimit = req.query.limit === undefined
      ? 50
      : Number(req.query.limit);

    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return res.status(400).json({
        error: 'limit must be a positive integer'
      });
    }

    const limit = Math.min(requestedLimit, 500);

    const validOnly =
      req.query.validOnly !== 'false';

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', {
        ascending: false
      })
      .limit(limit);

    if (validOnly) {
      query = query.eq(
        'is_valid',
        true
      );
    }

    if (req.query.since) {
      const since = new Date(req.query.since);
      if (Number.isNaN(since.getTime())) {
        return res.status(400).json({
          error: 'since must be a valid date/time'
        });
      }

      query = query.gte(
        'recorded_at',
        since.toISOString()
      );
    }

    const {
      data: sessions,
      error
    } = await query;

    if (error) {
      console.error(
        'Supabase history error:',
        error
      );

      return res.status(500).json({
        error: 'Failed to fetch history'
      });
    }

    return res.json({
      userId,
      count: sessions.length,
      sessions
    });

  } catch (err) {
    console.error(
      'getHistory error:',
      err
    );

    return res.status(500).json({
      error: 'Failed to fetch history'
    });
  }
}


// GET /api/sessions/:userId/latest
async function getLatest(req, res) {
  try {
    const { userId } = req.params;

    const {
      data: session,
      error
    } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('recorded_at', {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'Supabase latest session error:',
        error
      );

      return res.status(500).json({
        error: 'Failed to fetch latest session'
      });
    }

    if (!session) {
      return res.status(404).json({
        error: 'No sessions found for user'
      });
    }

    return res.json({
      session
    });

  } catch (err) {
    console.error(
      'getLatest error:',
      err
    );

    return res.status(500).json({
      error: 'Failed to fetch latest session'
    });
  }
}


module.exports = {
  createSession,
  getHistory,
  getLatest
};
