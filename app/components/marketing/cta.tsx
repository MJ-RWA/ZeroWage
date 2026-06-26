import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-16 text-center md:px-16 md:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(79,142,247,0.18), transparent 70%)',
          }}
        />
        <h2 className="mx-auto max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Run your next payroll with a proof attached
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Join the teams paying their people with cryptographic certainty. Set up
          your first verifiable run in minutes.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-[15px]">
            <Link href="/dashboard">
              Launch App
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 border-border bg-background px-6 text-[15px] hover:bg-accent"
          >
            <Link href="/explorer">Explore proofs</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
