const supabase = require('../config/supabase');
const { createEmptyBaseline } = require('../utils/baseline');

const DEFAULT_BASELINE_SCORE = 80;


// GET /api/users/:userId
async function getUser(req, res) {
  try {
    const { userId } = req.params;

    const {
      data: user,
      error
    } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(
        'getUser lookup error:',
        error
      );

      return res.status(500).json({
        error: 'Failed to fetch user'
      });
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.json({
      user
    });

  } catch (err) {
    console.error(
      'getUser error:',
      err
    );

    return res.status(500).json({
      error: 'Failed to fetch user'
    });
  }
}


// POST /api/users
async function createUser(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Request body must be a JSON object'
      });
    }

    const {
      userId,
      displayName,
      email,
      condition
    } = req.body;

    if (typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    // Check whether user already exists
    const {
      data: existing,
      error: lookupError
    } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (lookupError) {
      console.error(
        'createUser lookup error:',
        lookupError
      );

      return res.status(500).json({
        error: 'Failed to check user'
      });
    }

    if (existing) {
      return res.status(409).json({
        error: 'User already exists',
        user: existing
      });
    }

    // Create user in the actual users table
    const {
      data: user,
      error
    } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: displayName || null,
        email: email || null,
        baseline_score: DEFAULT_BASELINE_SCORE,
        baseline: createEmptyBaseline(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'createUser error:',
        error
      );

      return res.status(500).json({
        error: 'Failed to create user'
      });
    }

    return res.status(201).json({
      user
    });

  } catch (err) {
    console.error(
      'createUser error:',
      err
    );

    return res.status(500).json({
      error: 'Failed to create user'
    });
  }
}


// POST /api/users/:userId/recalibrate
async function recalibrate(req, res) {
  try {
    const { userId } = req.params;

    // Check user exists
    const {
      data: existing,
      error: lookupError
    } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (lookupError) {
      console.error(
        'recalibrate lookup error:',
        lookupError
      );

      return res.status(500).json({
        error: 'Failed to find user'
      });
    }

    if (!existing) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Reset the persisted baseline so subsequent sessions calibrate again.
    const {
      data: user,
      error
    } = await supabase
      .from('users')
      .update({
        baseline_score: DEFAULT_BASELINE_SCORE,
        baseline: createEmptyBaseline(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error(
        'recalibrate update error:',
        error
      );

      return res.status(500).json({
        error: 'Failed to recalibrate'
      });
    }

    return res.json({
      message:
        'Baseline reset. Next sessions will be treated as calibration.',
      user
    });

  } catch (err) {
    console.error(
      'recalibrate error:',
      err
    );

    return res.status(500).json({
      error: 'Failed to recalibrate'
    });
  }
}


module.exports = {
  getUser,
  createUser,
  recalibrate
};
