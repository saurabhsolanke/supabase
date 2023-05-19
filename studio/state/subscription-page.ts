import { proxy, snapshot, useSnapshot } from 'valtio'

export type SUBSCRIPTION_PANEL_KEYS =
  | undefined
  | 'subscriptionPlan'
  | 'costControl'
  | 'computeInstance'
  | 'pitr'
  | 'customDomain'

export const subscriptionPageState = proxy({
  panelKey: undefined as SUBSCRIPTION_PANEL_KEYS,
  isCaptchaChallengeOpen: false as boolean,

  setPanelKey: (key: SUBSCRIPTION_PANEL_KEYS) => {
    subscriptionPageState.panelKey = key
  },
  setIsCaptchaChallengeOpen: (value: boolean) => {
    subscriptionPageState.isCaptchaChallengeOpen = value
  },
})

export const getSubscriptionPageStateSnapshot = () => snapshot(subscriptionPageState)

export const useSubscriptionPageStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(subscriptionPageState, options)
