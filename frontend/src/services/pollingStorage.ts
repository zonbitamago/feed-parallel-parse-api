/**
 * ポーリング設定の永続化（localStorage）
 */

export interface PollingConfig {
  lastPolledAt: number | null
  pollingInterval: number
  enabled: boolean
}

export const STORAGE_KEY = 'rss_reader_polling_config'

const DEFAULT_POLLING_CONFIG: PollingConfig = {
  lastPolledAt: null,
  pollingInterval: 600000, // 10分
  enabled: true,
}

/**
 * localStorageからポーリング設定を読み込む
 *
 * @returns ポーリング設定（存在しない場合はデフォルト設定）
 */
export function loadPollingConfig(): PollingConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    // localStorageにデータがない場合はデフォルト設定を返す
    if (!stored) {
      return DEFAULT_POLLING_CONFIG
    }

    // JSONパース
    const parsed = JSON.parse(stored)

    // バリデーション: 各フィールドの型チェックと不正値の処理
    const config: PollingConfig = {
      lastPolledAt:
        typeof parsed.lastPolledAt === 'number' ? parsed.lastPolledAt : null,
      pollingInterval:
        typeof parsed.pollingInterval === 'number' && parsed.pollingInterval > 0
          ? parsed.pollingInterval
          : DEFAULT_POLLING_CONFIG.pollingInterval,
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_POLLING_CONFIG.enabled,
    }

    return config
  } catch {
    // JSONパースエラーや予期しないエラーの場合はデフォルト設定を返す
    return DEFAULT_POLLING_CONFIG
  }
}

/**
 * ポーリング設定をlocalStorageに保存
 *
 * localStorageへの書き込みエラー（QuotaExceededErrorなど）が発生しても
 * 例外をスローせず、サイレントに失敗します。
 *
 * @param config 保存するポーリング設定
 */
export function savePollingConfig(config: PollingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorageエラー（容量超過など）が発生してもエラーをスローしない
    // ポーリング設定の保存失敗はユーザー体験に致命的ではないため、
    // サイレントに失敗させる
  }
}
