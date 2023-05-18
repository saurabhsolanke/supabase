import Image from 'next/image'
import clsx from 'clsx'
import { useParams } from 'common'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useStore } from 'hooks'
import { BASE_PATH, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Alert, Button, IconExternalLink, Radio, SidePanel } from 'ui'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

const PITR_CATEGORY_OPTIONS: { id: 'off' | 'on'; name: string; imageUrl: string }[] = [
  { id: 'off', name: 'No point in time recovery', imageUrl: `${BASE_PATH}/img/pitr-off.svg` },
  { id: 'on', name: 'Enable point in time recovery', imageUrl: `${BASE_PATH}/img/pitr-on.svg` },
]

const PITRSidePanel = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'on' | 'off'>('off')
  const [selectedOption, setSelectedOption] = useState<string>('pitr_0')

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'pitr'
  const onClose = () => snap.setPanelKey(undefined)

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const { mutateAsync: updateAddon } = useProjectAddonUpdateMutation()
  const { mutateAsync: removeAddon } = useProjectAddonRemoveMutation()

  const selectedAddons = addons?.selected_addons ?? []
  const availableAddons = addons?.available_addons ?? []

  const subscriptionCompute = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const subscriptionPitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const availableOptions = availableAddons.find((addon) => addon.type === 'pitr')?.variants ?? []

  const hasChanges = selectedOption !== (subscriptionPitr?.variant.identifier ?? 'pitr_0')
  const selectedPitr = availableOptions.find((option) => option.identifier === selectedOption)
  const isFreePlan = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.FREE

  useEffect(() => {
    if (visible) {
      if (subscriptionPitr !== undefined) {
        setSelectedCategory('on')
        setSelectedOption(subscriptionPitr.variant.identifier)
      } else {
        setSelectedCategory('off')
        setSelectedOption('pitr_0')
      }
    }
  }, [visible, isLoading])

  const onConfirm = async () => {
    if (!projectRef) return console.error('Project ref is required')

    try {
      setIsSubmitting(true)

      if (selectedOption === 'pitr_0' && subscriptionPitr !== undefined) {
        await removeAddon({ projectRef, variant: subscriptionPitr.variant.identifier })
      } else {
        await updateAddon({ projectRef, type: 'pitr', variant: selectedOption })
      }

      ui.setNotification({
        category: 'success',
        message: `Successfully ${
          selectedOption === 'pitr_0' ? 'disabled' : 'updated'
        } point in time recovery duration`,
      })
      onClose()
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update PITR: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidePanel
      size="xxlarge"
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={isLoading || isSubmitting}
      disabled={isFreePlan || isLoading || !hasChanges || isSubmitting}
      header={
        <div className="flex items-center justify-between">
          <h4>Point in Time Recovery</h4>
          <Link href="https://supabase.com/docs/guides/platform/backups#point-in-time-recovery">
            <a target="_blank" rel="noreferrer">
              <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                About point in time recovery
              </Button>
            </a>
          </Link>
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Point-in-Time Recovery (PITR) allows a project to be backed up at much shorter
            intervals. This provides users an option to restore to any chosen point of up to seconds
            in granularity.
          </p>

          {isFreePlan ? (
            <Alert
              withIcon
              variant="info"
              title="Changing your compute size is only available on the Pro plan"
              actions={
                <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
                  View available plans
                </Button>
              }
            >
              Upgrade your project's plan to change the compute size of your project
            </Alert>
          ) : subscriptionCompute === undefined ? (
            <Alert
              withIcon
              variant="warning"
              title="Your project is required to minimally be on a Small Add-on to enable PITR"
            >
              This is to ensure that your project has enough resources to execute PITR successfully
            </Alert>
          ) : null}

          <div className="!mt-8 pb-4">
            <div className="grid grid-cols-12 gap-3">
              {PITR_CATEGORY_OPTIONS.map((option) => {
                const isSelected = selectedCategory === option.id
                return (
                  <div
                    key={option.id}
                    className={clsx('col-span-3 group space-y-1', isFreePlan && 'opacity-75')}
                    onClick={() => {
                      setSelectedCategory(option.id)
                      if (option.id === 'off') setSelectedOption('pitr_0')
                    }}
                  >
                    <div
                      className={clsx(
                        'relative rounded-xl transition border bg-no-repeat bg-center bg-cover',
                        isSelected ? 'border-brand-900' : 'border-scale-900 opacity-50',
                        !isFreePlan && 'cursor-pointer',
                        !isFreePlan &&
                          !isSelected &&
                          'group-hover:border-scale-1100 group-hover:opacity-100'
                      )}
                      style={{
                        aspectRatio: ' 160/96',
                        backgroundImage: `url(${option.imageUrl})`,
                      }}
                    />
                    <p
                      className={clsx(
                        'text-sm transition',
                        isSelected ? 'text-scale-1200' : 'text-scale-1000'
                      )}
                    >
                      {option.name}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedCategory === 'on' && (
            <div className="!mt-8 pb-4">
              <Radio.Group
                type="large-cards"
                size="tiny"
                id="pitr"
                label={<p className="text-sm">Choose the duration of recovery</p>}
                onChange={(event: any) => setSelectedOption(event.target.value)}
              >
                {availableOptions.map((option) => (
                  <Radio
                    name="pitr"
                    disabled={isFreePlan || subscriptionCompute === undefined}
                    className="col-span-3 !p-0"
                    key={option.identifier}
                    checked={selectedOption === option.identifier}
                    label={<span className="text-sm">{option.name}</span>}
                    value={option.identifier}
                  >
                    <div className="w-full group">
                      <div className="border-b border-scale-500 px-4 py-2 group-hover:border-scale-600">
                        <p className="text-sm">{option.name}</p>
                      </div>
                      <div className="px-4 py-2">
                        <p className="text-scale-1000">
                          Allow database restorations to any time up to{' '}
                          {option.identifier.split('_')[1]} days ago
                        </p>
                        <div className="flex items-center space-x-1 mt-2">
                          <p className="text-scale-1200 text-sm">
                            ${option.price.toLocaleString()}
                          </p>
                          <p className="text-scale-1000 translate-y-[1px]"> / month</p>
                        </div>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          )}

          {hasChanges && (
            <>
              {selectedOption === 'pitr_0' ||
              (selectedPitr?.price ?? 0) < (subscriptionPitr?.variant.price ?? 0) ? (
                <p className="text-sm text-scale-1100">
                  Upon clicking confirm, the amount of that's unused during the current billing
                  cycle will be returned as credits that can be used for subsequent billing cycles
                </p>
              ) : (
                <p className="text-sm text-scale-1100">
                  Upon clicking confirm, the amount of{' '}
                  <span className="text-scale-1200">${selectedPitr?.price.toLocaleString()}</span>{' '}
                  will be added to your invoice and your credit card will be charged immediately
                </p>
              )}
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default PITRSidePanel
