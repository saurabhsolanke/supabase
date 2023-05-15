import { useParams } from 'common'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { SidePanel } from 'ui'

export interface ComputeInstanceSidePanelProps {
  visible: boolean
  onClose: () => void
}

const ComputeInstanceSidePanel = ({ visible, onClose }: ComputeInstanceSidePanelProps) => {
  const { ref: projectRef } = useParams()
  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })

  return (
    <SidePanel size="xlarge" visible={visible} onCancel={onClose}>
      Compute Instance
    </SidePanel>
  )
}

export default ComputeInstanceSidePanel
