// Maps each experiment slug to its interactive tool.
// Tools are added here as they are built.
import RoomTest from './room-test/RoomTest'

export interface ExperimentToolProps {
  experimentId: string
  userId: string
}

type ExperimentTool = (props: ExperimentToolProps) => Promise<JSX.Element> | JSX.Element

export const experimentTools: Record<string, ExperimentTool> = {
  'the-room-test': RoomTest,
}
