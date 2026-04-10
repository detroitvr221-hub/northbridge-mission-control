require('../helpers/setup');
const { extractInvokeData } = require('../helpers/extracted-functions');

describe('extractInvokeData', () => {
  test('returns result.details when present', () => {
    const result = { details: { jobs: [1, 2, 3] } };
    expect(extractInvokeData(result)).toEqual({ jobs: [1, 2, 3] });
  });

  test('parses JSON from content[0].text', () => {
    const result = {
      content: [{ text: '{"status":"ok","count":5}' }]
    };
    expect(extractInvokeData(result)).toEqual({ status: 'ok', count: 5 });
  });

  test('returns raw result when content[0].text is not valid JSON', () => {
    const result = {
      content: [{ text: 'not json' }]
    };
    expect(extractInvokeData(result)).toBe(result);
  });

  test('returns raw result when no details or content', () => {
    const result = { foo: 'bar' };
    expect(extractInvokeData(result)).toBe(result);
  });

  test('prefers details over content', () => {
    const result = {
      details: { source: 'details' },
      content: [{ text: '{"source":"content"}' }]
    };
    expect(extractInvokeData(result)).toEqual({ source: 'details' });
  });

  test('handles empty content array', () => {
    const result = { content: [] };
    expect(extractInvokeData(result)).toBe(result);
  });
});
