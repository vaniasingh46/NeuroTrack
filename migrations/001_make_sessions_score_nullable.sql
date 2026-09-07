-- Migration: Allow public.sessions.score to be nullable during baseline calibration
-- In NeuroTrack, calibration sessions (e.g. sessions 1 & 2 before the baseline locks)
-- do not yet have an established baseline, so score / composite.value is null.

ALTER TABLE public.sessions
ALTER COLUMN score DROP NOT NULL;

