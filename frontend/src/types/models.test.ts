import { describe, test, expect } from 'vitest';
import type { Subscription } from './models';
import { getDisplayTitle, hasCustomTitle, validateCustomTitle } from './models';

describe('models', () => {
  describe('getDisplayTitle', () => {
    test('customTitleが設定されている場合はcustomTitleを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: 'My Custom Name',
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(getDisplayTitle(subscription)).toBe('My Custom Name');
    });

    test('customTitleがnullでtitleがある場合はtitleを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: null,
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(getDisplayTitle(subscription)).toBe('Example Blog');
    });

    test('customTitleとtitleがnullの場合はurlを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: null,
        customTitle: null,
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(getDisplayTitle(subscription)).toBe('https://example.com/feed');
    });

    test('customTitleが空文字の場合はtitleを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: '',
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      // 空文字はfalsy値なのでtitleが返される
      expect(getDisplayTitle(subscription)).toBe('Example Blog');
    });
  });

  describe('hasCustomTitle', () => {
    test('customTitleが設定されている場合はtrueを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: 'My Custom Name',
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(hasCustomTitle(subscription)).toBe(true);
    });

    test('customTitleがnullの場合はfalseを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: null,
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(hasCustomTitle(subscription)).toBe(false);
    });

    test('customTitleが空文字の場合はfalseを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: '',
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(hasCustomTitle(subscription)).toBe(false);
    });

    test('customTitleが空白のみの場合はfalseを返す', () => {
      const subscription: Subscription = {
        id: '1',
        url: 'https://example.com/feed',
        title: 'Example Blog',
        customTitle: '   ',
        subscribedAt: '2025-01-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'active',
      };
      expect(hasCustomTitle(subscription)).toBe(false);
    });
  });

  describe('validateCustomTitle', () => {
    test('有効なタイトルの場合はvalid: trueを返す', () => {
      const result = validateCustomTitle('Valid Title');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('空文字の場合はエラーメッセージを返す', () => {
      const result = validateCustomTitle('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('フィード名を入力してください');
    });

    test('空白のみの場合はエラーメッセージを返す', () => {
      const result = validateCustomTitle('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('フィード名を入力してください');
    });

    test('200文字を超える場合はエラーメッセージを返す', () => {
      const longTitle = 'A'.repeat(201);
      const result = validateCustomTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('フィード名は200文字以内で入力してください');
    });

    test('200文字ちょうどの場合はvalid: trueを返す', () => {
      const exactTitle = 'A'.repeat(200);
      const result = validateCustomTitle(exactTitle);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('前後の空白は除去される', () => {
      const result = validateCustomTitle('  Valid Title  ');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});