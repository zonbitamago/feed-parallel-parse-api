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
    })

    driverObj.drive()
  }

  return {
    shouldShowTutorial: !hasSeenTutorial,
    startTutorial,
    resetTutorial: () => setHasSeenTutorial(false),
  }
}
