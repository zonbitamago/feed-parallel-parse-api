import { describe, test, expect } from 'vitest';
import { decodeHTMLEntities, stripHTMLTags, sanitizeFeedTitle, truncateTitle } from './titleUtils';

describe('titleUtils', () => {
  describe('decodeHTMLEntities', () => {
    test('HTMLエンティティをデコード', () => {
      expect(decodeHTMLEntities('Tech &amp; Design')).toBe('Tech & Design');
      expect(decodeHTMLEntities('&lt;React&gt;')).toBe('<React>');
      expect(decodeHTMLEntities('&quot;Hello&quot;')).toBe('"Hello"');
    });

    test('エンティティがない場合はそのまま返す', () => {
      expect(decodeHTMLEntities('Plain Text')).toBe('Plain Text');
    });
  });

  describe('stripHTMLTags', () => {
    test('HTMLタグを除去', () => {
      expect(stripHTMLTags('<b>Bold</b> Text')).toBe('Bold Text');
      expect(stripHTMLTags('<span class="test">Content</span>')).toBe('Content');
    });

    test('複数のタグを除去', () => {
      expect(stripHTMLTags('<div><p>Hello</p><p>World</p></div>')).toBe('HelloWorld');
    });

    test('タグがない場合はそのまま返す', () => {
      expect(stripHTMLTags('No Tags Here')).toBe('No Tags Here');
    });
  });

  describe('sanitizeFeedTitle', () => {
    test('複合的なサニタイゼーション', () => {
      const input = '<span>News &amp; Updates</span>';
      expect(sanitizeFeedTitle(input)).toBe('News & Updates');
    });

    test('前後の空白を削除', () => {
      expect(sanitizeFeedTitle('  Trimmed  ')).toBe('Trimmed');
    });

    test('HTMLタグとエンティティの両方を処理', () => {
      const input = '<b>Bold &amp; Italic</b>';
      expect(sanitizeFeedTitle(input)).toBe('Bold & Italic');
    });
  });

  describe('truncateTitle', () => {
    test('長いタイトルを切り詰め', () => {
      const longTitle = 'A'.repeat(150);
      expect(truncateTitle(longTitle, 100)).toBe('A'.repeat(100) + '...');
    });

    test('短いタイトルはそのまま', () => {
      expect(truncateTitle('Short Title', 100)).toBe('Short Title');
    });

    test('ちょうど最大長の場合はそのまま', () => {
      const exactTitle = 'A'.repeat(100);
      expect(truncateTitle(exactTitle, 100)).toBe(exactTitle);
    });

    test('デフォルトの最大長は100', () => {
      const longTitle = 'A'.repeat(150);
      expect(truncateTitle(longTitle)).toBe('A'.repeat(100) + '...');
    });
  });
});