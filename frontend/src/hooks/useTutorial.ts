import { driver } from 'driver.js'
import { useLocalStorage } from './useLocalStorage'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'
import 'driver.js/dist/driver.css'

/**
 * チュートリアル管理カスタムフック
 */
export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage('rss_reader_tutorial_seen', false)

  const startTutorial = () => {
    const driverObj = driver({
      steps: TUTORIAL_STEPS,
      showProgress: true,
      allowClose: true,
      onDestroyed: () => setHasSeenTutorial(true),
      progressText: 'ステップ {{current}} / {{total}}',
      // レスポンシブ対応とスタイルカスタマイズ
      popoverClass: 'tutorial-popover',
      nextBtnText: '次へ',
      prevBtnText: '戻る',
      doneBtnText: '完了',
      // モバイル対応: 小画面では自動的にポップアップ位置を調整
      animate: true,
    })

    driverObj.drive()
  }

  return {
    shouldShowTutorial: !hasSeenTutorial,
    startTutorial,
    resetTutorial: () => setHasSeenTutorial(false),
  }
}
