import { describe, it, expect } from 'vitest';

/**
 * CI Branch Protection検証用の失敗テスト
 * このテストは意図的に失敗し、Branch Protection Rulesが正常に動作することを確認するためのものです。
 * 検証後は、このファイルを削除してください。
 */
describe('CI Branch Protection Verification', () => {
  it('should fail to verify branch protection rules', () => {
    // 意図的な失敗: Branch Protectionがマージをブロックすることを確認
    expect(true).toBe(false);
  });
});