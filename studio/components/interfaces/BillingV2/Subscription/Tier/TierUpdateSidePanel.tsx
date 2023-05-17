import clsx from 'clsx'
import { useParams } from 'common'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useProjectSubscriptionUpdateMutation } from 'data/subscriptions/project-subscription-update-mutation'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useFlag, useStore } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { useEffect, useState } from 'react'
import { Alert, Button, IconCheck, Modal, SidePanel } from 'ui'
import EnterpriseCard from './EnterpriseCard'
import { PRICING_META } from './Tier.constants'
import PaymentMethodSelection from './PaymentMethodSelection'

export interface TierUpdateSidePanelProps {
  visible: boolean
  onClose: () => void
}

// [JOSHEN TODO] Pull plans from RQ with new endpoint instead of hardcoding

const TierUpdateSidePanel = ({ visible, onClose }: TierUpdateSidePanelProps) => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'tier_free' | 'tier_pro' | 'tier_team'>()
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { data: subscription, isLoading } = useProjectSubscriptionV2Query({ projectRef })
  const { mutateAsync: updateSubscriptionTier } = useProjectSubscriptionUpdateMutation()

  const subscriptionAddons = addons?.selected_addons ?? []
  const selectedTierMeta = PRICING_META.find((tier) => tier.id === selectedTier)
  const userIsOnTeamTier = subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM
  const teamTierEnabled = useFlag('teamTier') || userIsOnTeamTier

  useEffect(() => {
    if (visible) {
      setSelectedTier(undefined)
    }
  }, [visible])

  const onUpdateSubscription = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedTier) return console.error('Selected tier is required')

    try {
      setIsSubmitting(true)
      await updateSubscriptionTier({ projectRef, tier: selectedTier })
      ui.setNotification({
        category: 'success',
        message: `Successfully updated subscription to ${selectedTierMeta?.name}!`,
      })
      onClose()
    } catch (error: any) {
      setIsSubmitting(false)
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update subscription: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
      setSelectedTier(undefined)
      onClose()
    }
  }

  return (
    <>
      <SidePanel
        hideFooter
        size="xxlarge"
        visible={visible}
        onCancel={onClose}
        header="Change subscription plan"
      >
        <SidePanel.Content>
          <div className="py-6 grid grid-cols-12 gap-3">
            {PRICING_META.map((plan) => {
              const isCurrentPlan =
                subscription?.tier.supabase_prod_id === plan.id ||
                (subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PAYG &&
                  plan.id === PRICING_TIER_PRODUCT_IDS.PRO)

              if (plan.id === 'tier_team' && !teamTierEnabled) return null
              if (plan.id === 'tier_enterprise') {
                return (
                  <EnterpriseCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={isCurrentPlan}
                    isTeamTierEnabled={teamTierEnabled}
                  />
                )
              }

              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'border rounded-md px-4 py-4 flex flex-col items-start justify-between',
                    teamTierEnabled && plan.id === 'tier_enterprise' ? 'col-span-12' : 'col-span-4',
                    plan.id === 'tier_enterprise' ? 'bg-scale-200' : 'bg-scale-300'
                  )}
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-2">
                      <p className={clsx('text-brand-900 text-sm uppercase')}>{plan.name}</p>
                      {isCurrentPlan ? (
                        <div className="text-xs bg-scale-500 text-scale-1000 rounded px-2 py-0.5">
                          Current plan
                        </div>
                      ) : plan.new ? (
                        <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5">
                          New
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="mt-4 flex items-center space-x-1">
                      {(plan.price ?? 0) > 0 && <p className="text-scale-1000 text-sm">From</p>}
                      <p className="text-scale-1200 text-lg">${plan.price}</p>
                      <p className="text-scale-1000 text-sm">per month</p>
                    </div>
                    <div
                      className={clsx(
                        'flex mt-1 mb-4',
                        plan.id !== PRICING_TIER_PRODUCT_IDS.TEAM && 'opacity-0'
                      )}
                    >
                      <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5">
                        Usage based plan
                      </div>
                    </div>
                    {isCurrentPlan ? (
                      <Button block disabled type="default">
                        Current plan
                      </Button>
                    ) : (
                      <Button
                        block
                        type="primary"
                        loading={isLoading}
                        disabled={isLoading}
                        onClick={() => setSelectedTier(plan.id as any)}
                      >
                        {subscription?.tier.supabase_prod_id !== PRICING_TIER_PRODUCT_IDS.FREE &&
                        plan.id === PRICING_TIER_PRODUCT_IDS.FREE
                          ? 'Downgrade'
                          : 'Upgrade'}{' '}
                        to {plan.name}
                      </Button>
                    )}

                    <div className="border-t my-6" />

                    <ul role="list">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex py-2">
                          <div className="w-[12px]">
                            <IconCheck
                              className="h-3 w-3 text-brand-900 translate-y-[2.5px]"
                              aria-hidden="true"
                              strokeWidth={3}
                            />
                          </div>
                          <p className="ml-3 text-xs text-scale-1100">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.footer && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-scale-1000 text-xs">{plan.footer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SidePanel.Content>
      </SidePanel>

      <Modal
        size="medium"
        alignFooter="right"
        visible={selectedTier === 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        header={`Confirm to downgrade to ${selectedTierMeta?.name}`}
      >
        {/* [JOSHEN] We could make this better by only showing a danger warning if the project is already above the free tier limits */}
        <Modal.Content>
          <div className="py-6">
            <Alert
              withIcon
              variant="warning"
              title="Downgrading to the free tier will lead to reductions in your project's capacity"
            >
              <p>
                If you're already past the limits of the free tier, your project could become
                unresponsive, enter read only mode, or be paused.
              </p>
              {subscriptionAddons.length > 0 && (
                <>
                  <p className="mt-2">
                    Your project's add ons will also be removed, which includes:
                  </p>
                  <ul className="list-disc pl-6">
                    {subscriptionAddons.map((addon) => (
                      <li key={addon.type} className="mt-0.5">
                        {addon.variant.name}{' '}
                        {addon.type === 'compute_instance' && 'compute instance'}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Alert>
          </div>
        </Modal.Content>
      </Modal>

      <Modal
        loading={isSubmitting}
        alignFooter="right"
        className="!w-[450px]"
        visible={selectedTier !== undefined && selectedTier !== 'tier_free'}
        onCancel={() => setSelectedTier(undefined)}
        onConfirm={onUpdateSubscription}
        header={`Confirm to upgrade to ${selectedTierMeta?.name}`}
      >
        <Modal.Content>
          <div className="py-6 space-y-2">
            <p className="text-sm">
              Upon clicking confirm, the amount of ${selectedTierMeta?.price ?? 'Unknown'} will be
              added to your invoice and your credit card will be charged immediately.
            </p>
            <p className="text-sm text-scale-1000">
              You will also be able to change your project's add-ons after upgrading your project's
              tier.
            </p>
            <div className="!mt-6">
              <PaymentMethodSelection selectedPaymentMethod="" onSelectPaymentMethod={() => {}} />
            </div>
          </div>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default TierUpdateSidePanel
