// Maps each experiment slug to its interactive tool.
// Tools are added here as they are built (Experiment 001 first).
import type { ComponentType } from 'react'

export interface ExperimentToolProps {
  experimentId: string
  userId: string
}

export const experimentTools: Record<string, ComponentType<ExperimentToolProps>> = {}
