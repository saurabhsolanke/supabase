import { useParams } from 'common'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, IconExternalLink, Radio, SidePanel } from 'ui'

export interface ComputeInstanceSidePanelProps {
  visible: boolean
  onClose: () => void
}

const ComputeInstanceSidePanel = ({ visible, onClose }: ComputeInstanceSidePanelProps) => {
  const { ref: projectRef } = useParams()
  const [selectedOption, setSelectedOption] = useState()
  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })

  const availableOptions =
    (addons?.available_addons ?? []).find((addon) => addon.type === 'compute_instance')?.variants ??
    []

  return (
    <SidePanel
      size="xxlarge"
      visible={visible}
      onCancel={onClose}
      header={
        <div className="flex items-center justify-between">
          <h4>Change project compute size</h4>
          <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
            <a target="_blank" rel="noreferrer">
              <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                Documentation
              </Button>
            </a>
          </Link>
        </div>
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm">
            Your project can be upgraded to use the following different compute sizes
          </p>

          <Radio.Group
            type="large-cards"
            size="tiny"
            id="compute-instance"
            label="Choose the compute size you want to use"
          >
            <Radio
              className="col-span-3"
              label="Micro Compute Instance"
              value="ci_micro"
              afterLabel={
                <div>
                  <p className="text-scale-1000">2 GB</p>
                  <p className="text-scale-1000">1-core ARM (Shared)</p>
                </div>
              }
              description={
                <div className="flex items-center space-x-1">
                  <p className="text-scale-1200 text-sm">$0</p>
                  <p className="text-scale-1000 translate-y-[1px]">/ month</p>
                </div>
              }
            />
            {availableOptions.map((option) => (
              <Radio
                className="col-span-3"
                name="compute-instance"
                key={option.identifier}
                label={option.name}
                value={option.identifier}
                afterLabel={
                  <div>
                    <p className="text-scale-1000">{option.meta?.memory_gb ?? 0} GB</p>
                    <p className="text-scale-1000">
                      {option.meta?.cpu_cores ?? 0}-core ARM (
                      {option.meta?.cpu_dedicated ? 'Dedicated' : 'Shared'})
                    </p>
                  </div>
                }
                description={
                  <div className="flex items-center space-x-1">
                    <p className="text-scale-1200 text-sm">${option.price}</p>
                    <p className="text-scale-1000 translate-y-[1px]"> / month</p>
                  </div>
                }
              />
            ))}
          </Radio.Group>

          <p className="text-sm">
            Upon clicking confirm, the amount of $XX will be added to your invoice and your credit
            card will be charged immediately.
          </p>

          <Alert
            withIcon
            variant="info"
            title="Your project will need to be restarted when changing it's compute size"
          >
            It will take up to 2 minutes for changes to take place, in which your project will be
            unavailable during that time.
          </Alert>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ComputeInstanceSidePanel
