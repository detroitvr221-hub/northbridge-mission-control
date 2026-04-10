// Auto-extract functions from index.html
require('../helpers/setup');
const { renderMarkdown } = require('../helpers/extracted-functions');

describe('renderMarkdown', () => {
  // --- XSS Prevention (Security - Priority 1) ---
  describe('XSS prevention', () => {
    test('escapes HTML tags', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    test('escapes angle brackets in user input', () => {
      const result = renderMarkdown('<img src=x onerror=alert(1)>');
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    test('escapes ampersands', () => {
      const result = renderMarkdown('A & B');
      expect(result).toContain('&amp;');
    });
  });

  // --- Markdown Formatting ---
  describe('bold', () => {
    test('converts **text** to <strong>', () => {
      const result = renderMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    test('converts __text__ to <strong>', () => {
      const result = renderMarkdown('This is __bold__ text');
      expect(result).toContain('<strong>bold</strong>');
    });
  });

  describe('italic', () => {
    test('converts *text* to <em>', () => {
      const result = renderMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('inline code', () => {
    test('converts `code` to <code>', () => {
      const result = renderMarkdown('Use `npm install` here');
      expect(result).toContain('<code');
      expect(result).toContain('npm install');
    });
  });

  describe('links', () => {
    test('converts [text](url) to anchor tag', () => {
      const result = renderMarkdown('Visit [GitHub](https://github.com)');
      expect(result).toContain('href="https://github.com"');
      expect(result).toContain('GitHub');
    });

    test('auto-links bare URLs', () => {
      const result = renderMarkdown('See https://example.com for details');
      expect(result).toContain('href="https://example.com"');
    });
  });

  describe('tables', () => {
    test('converts pipe-delimited tables to HTML table', () => {
      const input = '| Name | Value |\n|---|---|\n| A | 1 |\n| B | 2 |';
      const result = renderMarkdown(input);
      expect(result).toContain('<table');
      expect(result).toContain('<th');
      expect(result).toContain('<td');
    });
  });

  describe('edge cases', () => {
    test('returns empty string for null input', () => {
      expect(renderMarkdown(null)).toBe('');
    });

    test('returns empty string for undefined input', () => {
      expect(renderMarkdown(undefined)).toBe('');
    });

    test('returns empty string for empty string input', () => {
      expect(renderMarkdown('')).toBe('');
    });

    test('converts newlines to <br>', () => {
      const result = renderMarkdown('Line 1\nLine 2');
      expect(result).toContain('<br>');
    });
  });
});
