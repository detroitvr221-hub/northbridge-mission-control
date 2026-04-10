require('../helpers/setup');
const { formatRelativeTime } = require('../helpers/extracted-functions');

describe('formatRelativeTime', () => {
  test('returns "overdue" for past dates', () => {
    const pastDate = new Date(Date.now() - 60000);
    expect(formatRelativeTime(pastDate)).toBe('overdue');
  });

  test('returns "in Xm" for dates less than 60 minutes away', () => {
    const futureDate = new Date(Date.now() + 30 * 60000);
    const result = formatRelativeTime(futureDate);
    expect(result).toMatch(/^in \d+m$/);
  });

  test('returns "in Xh" for dates between 1 and 24 hours away', () => {
    const futureDate = new Date(Date.now() + 5 * 3600000);
    const result = formatRelativeTime(futureDate);
    expect(result).toMatch(/^in \d+h$/);
  });

  test('returns "in Xd" for dates more than 24 hours away', () => {
    const futureDate = new Date(Date.now() + 3 * 86400000);
    const result = formatRelativeTime(futureDate);
    expect(result).toMatch(/^in \d+d$/);
  });

  test('returns "in 0m" for a date just seconds away', () => {
    const futureDate = new Date(Date.now() + 5000);
    expect(formatRelativeTime(futureDate)).toBe('in 0m');
  });

  test('boundary: exactly 60 minutes returns "in 1h"', () => {
    const futureDate = new Date(Date.now() + 60 * 60000);
    expect(formatRelativeTime(futureDate)).toBe('in 1h');
  });

  test('boundary: exactly 24 hours returns "in 1d"', () => {
    const futureDate = new Date(Date.now() + 24 * 3600000);
    expect(formatRelativeTime(futureDate)).toBe('in 1d');
  });
});
