/**
 * エラーメッセージコンポーネント
 */
import type { HTMLAttributes } from 'react';

interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss, ...rest }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
      {...rest}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-red-800 text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800"
            aria-label="閉じる"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
