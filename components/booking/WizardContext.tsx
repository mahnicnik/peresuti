'use client'

import { createContext, useContext } from 'react'
import type { useWizardState } from './useWizardState'

export type WizardValue = ReturnType<typeof useWizardState>

const WizardContext = createContext<WizardValue | null>(null)

export const WizardProvider = WizardContext.Provider

export function useWizard(): WizardValue {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}
