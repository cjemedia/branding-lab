export type Role = 'student' | 'admin'
export type Tier = 'branding_lab' | 'agency_lab'
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired'
export type ProgressStatus = 'unlocked' | 'in_progress' | 'completed'

export type AccessReason =
  | 'ok'
  | 'not_signed_in'
  | 'no_profile'
  | 'inactive_membership'
  | 'not_published'
  | 'tier'
  | 'prerequisite'
  | 'ready_to_unlock'
  | 'not_open'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  brand_name: string | null
  role: Role
}

export interface Membership {
  id: string
  user_id: string
  tier: Tier
  status: MembershipStatus
  source: 'zapier' | 'admin'
  activated_at: string | null
  ended_at: string | null
  notes: string | null
}

export interface Experiment {
  id: string
  number: number
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  estimated_time: string | null
  lesson_url: string | null
  tier_required: Tier
  sort_order: number
  prerequisite_id: string | null
  requires_knowledge_check: boolean
  brand_profile_section: string | null
  is_published: boolean
  is_open: boolean
}

export interface ExperimentProgress {
  id: string
  user_id: string
  experiment_id: string
  status: ProgressStatus
  current_step: number
  answers: Record<string, unknown>
  needs_refresh: boolean
  unlocked_at: string
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

export type CardStatus = 'locked' | 'ready_to_unlock' | 'available' | 'in_progress' | 'completed'

export const TIER_LABEL: Record<Tier, string> = {
  branding_lab: 'The Branding Lab',
  agency_lab: 'The Agency Lab',
}

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  pending: 'Pending Verification',
  active: 'Active',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

export function experimentCode(n: number) {
  return String(n).padStart(3, '0')
}
