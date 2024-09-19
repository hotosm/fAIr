import {
  CoreFeatures,
  KPI, TheFAIRProcess, WhatIsFAIR,
} from '@/components/landing'

import { Header } from '@/components/ui/header'


export const LandingPageRoute = () => {
  return (
    <div>
      <Header />
      <KPI />
      <div className='grid gap-y-[125px] mt-[133.22px] mb-[152px]'>
        <WhatIsFAIR />
        <TheFAIRProcess />
      </div>
      <CoreFeatures />
    </div>
  )
}
