import { GuideDialog } from '../ui/GuideDialog'

const targets = ['home-registered', 'home-continue', 'home-saved']

export function HomeOnboarding({ open, onClose }) {
  return <GuideDialog open={open} onClose={onClose} targets={targets} />
}
