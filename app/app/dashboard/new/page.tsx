import { Suspense } from 'react'
import { NewRunWizard } from '@/components/dashboard/new-run-wizard'

export default function NewRunPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-24 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <NewRunWizard />
    </Suspense>
  )
}