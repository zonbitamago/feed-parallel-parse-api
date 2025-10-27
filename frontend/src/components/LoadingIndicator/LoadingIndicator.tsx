/**
 * ローディングインジケーターコンポーネント
 */

export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">読み込み中...</span>
    </div>
  );
}
