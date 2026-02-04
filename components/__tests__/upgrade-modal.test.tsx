import { render, screen } from '@testing-library/react'
import { UpgradeModal } from '../upgrade-modal'

// Mock i18n
jest.mock('@/lib/i18n', () => ({
  useT: () => ({
    upgrade: {
      title: 'Upgrade to AI Teacher Assistant Premium',
      freeFeatures: ['Feature 1', 'Feature 2'],
      premiumFeatures: ['Premium 1', 'Premium 2'],
      selectPlan: 'Select Plan',
    },
    subscription: {
      monthly: 'Monthly',
      yearly: 'Yearly',
      perMonth: '/month',
      perYear: '/year',
    },
  }),
}))

describe('UpgradeModal', () => {
  it('should not render quarterly plan', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={() => {}}
        onUpgradeSuccess={() => {}}
        currentRole="Free User"
      />
    )

    expect(screen.queryByText(/quarter/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/季度/)).not.toBeInTheDocument()
  })

  it('should not render social proof section', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={() => {}}
        onUpgradeSuccess={() => {}}
        currentRole="Free User"
      />
    )

    expect(screen.queryByText(/94%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/3.2x/)).not.toBeInTheDocument()
    expect(screen.queryByText(/12,000\+/)).not.toBeInTheDocument()
  })

  it('should render only monthly and yearly plans', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={() => {}}
        onUpgradeSuccess={() => {}}
        currentRole="Free User"
      />
    )

    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })
})
