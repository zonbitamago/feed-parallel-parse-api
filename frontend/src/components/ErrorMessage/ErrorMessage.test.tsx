/**
 * ErrorMessage component tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';
import type { FeedError } from '../../types/models';

describe('ErrorMessage', () => {
  describe('基本的な表示', () => {
    it('エラーメッセージを表示する', () => {
      render(<ErrorMessage message="エラーが発生しました" />);
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    it('閉じるボタンがonDismiss関数が提供された場合のみ表示される', () => {
      const { rerender } = render(<ErrorMessage message="エラー" />);
      expect(screen.queryByRole('button', { name: '閉じる' })).not.toBeInTheDocument();

      rerender(<ErrorMessage message="エラー" onDismiss={() => {}} />);
      expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });

    it('閉じるボタンをクリックするとonDismissが呼ばれる', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(<ErrorMessage message="エラー" onDismiss={onDismiss} />);

      await user.click(screen.getByRole('button', { name: '閉じる' }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('FeedError表示', () => {
    it('FeedErrorオブジェクトを表示する', () => {
      const feedError: FeedError = {
        url: 'https://example.com/feed',
        message: 'フィードの取得に失敗しました',
        timestamp: new Date().toISOString(),
      };

      render(
        <ErrorMessage
          message={`${feedError.url}: ${feedError.message}`}
        />
      );

      expect(screen.getByText(/https:\/\/example\.com\/feed/)).toBeInTheDocument();
      expect(screen.getByText(/フィードの取得に失敗しました/)).toBeInTheDocument();
    });

    it('複数のFeedErrorを表示できる', () => {
      const errors: FeedError[] = [
        {
          url: 'https://example1.com/feed',
          message: 'エラー1',
          timestamp: new Date().toISOString(),
        },
        {
          url: 'https://example2.com/feed',
          message: 'エラー2',
          timestamp: new Date().toISOString(),
        },
      ];

      render(
        <>
          {errors.map((error, index) => (
            <ErrorMessage
              key={index}
              message={`${error.url}: ${error.message}`}
            />
          ))}
        </>
      );

      expect(screen.getByText(/example1\.com/)).toBeInTheDocument();
      expect(screen.getByText(/example2\.com/)).toBeInTheDocument();
      expect(screen.getByText(/エラー1/)).toBeInTheDocument();
      expect(screen.getByText(/エラー2/)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('エラーメッセージにrole="alert"が設定されている', () => {
      const { container } = render(<ErrorMessage message="エラー" />);
      const errorDiv = container.querySelector('[role="alert"]');
      expect(errorDiv).toBeInTheDocument();
    });

    it('閉じるボタンにaria-labelが設定されている', () => {
      render(<ErrorMessage message="エラー" onDismiss={() => {}} />);
      const closeButton = screen.getByRole('button', { name: '閉じる' });
      expect(closeButton).toHaveAttribute('aria-label', '閉じる');
    });
  });

  describe('トースト通知との統合', () => {
    it('トーストライブラリ用のpropsを受け取れる', () => {
      const toastId = 'toast-123';
      render(
        <ErrorMessage
          message="エラー"
          onDismiss={() => {}}
          data-toast-id={toastId}
        />
      );

      const errorDiv = document.querySelector('[role="alert"]');
      expect(errorDiv).toHaveAttribute('data-toast-id', toastId);
    });
  });
});