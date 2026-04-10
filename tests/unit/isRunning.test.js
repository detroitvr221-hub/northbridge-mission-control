require('../helpers/setup');
const { isRunning } = require('../helpers/extracted-functions');

describe('isRunning', () => {
  test('returns false when nextRunAt is not set', () => {
    expect(isRunning({})).toBe(false);
    expect(isRunning({ nextRunAt: null })).toBe(false);
  });

  test('returns false when nextRunAt is in the future', () => {
    const cron = { nextRunAt: new Date(Date.now() + 60000).toISOString() };
    expect(isRunning(cron)).toBe(false);
  });

  test('returns true when nextRunAt is in the past within default duration window', () => {
    const cron = { nextRunAt: new Date(Date.now() - 30000).toISOString() };
    expect(isRunning(cron)).toBe(true);
  });

  test('returns false when nextRunAt is past and beyond default duration window', () => {
    const cron = { nextRunAt: new Date(Date.now() - 360000).toISOString() };
    expect(isRunning(cron)).toBe(false);
  });

  test('respects avgDurationMs for the running window', () => {
    const cron = {
      nextRunAt: new Date(Date.now() - 8 * 60000).toISOString(),
      avgDurationMs: 10 * 60000
    };
    expect(isRunning(cron)).toBe(true);
  });

  test('returns false when past avgDurationMs window', () => {
    const cron = {
      nextRunAt: new Date(Date.now() - 3 * 60000).toISOString(),
      avgDurationMs: 2 * 60000
    };
    expect(isRunning(cron)).toBe(false);
  });

  test('uses minimum 1 minute window even with small avgDurationMs', () => {
    const cron = {
      nextRunAt: new Date(Date.now() - 30000).toISOString(),
      avgDurationMs: 10000
    };
    expect(isRunning(cron)).toBe(true);
  });
});
