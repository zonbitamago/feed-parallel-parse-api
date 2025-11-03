import type { DriveStep } from 'driver.js'

export const TUTORIAL_STEPS: DriveStep[] = [
  {
    element: 'input[aria-label="フィードURL"]',
    popover: {
      title: 'ステップ1: RSSフィードを追加',
      description:
        'RSSフィードのURLをここに入力して、記事を購読しましょう。例: https://example.com/feed.xml',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: 'button[aria-label="フィードを追加"]',
    popover: {
      title: 'ステップ2: フィードを購読',
      description: 'URLを入力したら、このボタンをクリックして購読リストに追加します。',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#subscription-list',
    popover: {
      title: 'ステップ3: 購読リスト',
      description: '購読中のフィードがここに表示されます。タイトルの編集や削除も可能です。',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tutorial="import-export-buttons"]',
    popover: {
      title: 'ステップ4: インポート/エクスポート',
      description:
        'フィードリストをJSONファイルでバックアップしたり、他のデバイスに移行できます。',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: 'input[role="searchbox"]',
    popover: {
      title: 'ステップ5: 記事を検索',
      description: 'キーワードを入力して、記事のタイトルや要約を絞り込んで検索できます。',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tutorial="polling-status"]',
    popover: {
      title: 'ステップ6: 自動更新',
      description:
        '10分ごとに自動でフィードを取得します。最終取得時刻と次回取得までの時間がここに表示されます。',
      side: 'left',
      align: 'center',
    },
  },
  {
    element: 'article:first-child',
    popover: {
      title: 'ステップ7: 記事を読む',
      description:
        '記事タイトルをクリックすると、元のサイトで記事全文を読むことができます。お疲れ様でした！',
      side: 'top',
      align: 'start',
    },
  },
]
