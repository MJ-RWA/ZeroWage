import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Startup',
    price: '$5',
    unit: 'per employee / month',
    desc: 'For crypto-native teams and DAOs paying contributors in USDC.',
    limit: 'Up to 50 employees',
    features: [
      'Unlimited payroll runs',
      'Groth16 ZK proofs',
      'Stellar testnet + mainnet',
      'Proof Explorer access',
      'CSV import',
      'Email support',
    ],
    cta: 'Get started',
    href: '/dashboard',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$3',
    unit: 'per employee / month',
    desc: 'For growing companies needing compliance attestations and audit exports.',
    limit: '50–500 employees',
    features: [
      'Everything in Startup',
      'Audit export (encrypted)',
      'Multi-sig payroll approval',
      'Employee self-serve portal',
      'Recurring schedules',
      'Priority support',
    ],
    cta: 'Get started',
    href: '/dashboard',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    unit: 'negotiated annually',
    desc: 'For large organizations needing custom circuits, SLAs, and dedicated support.',
    limit: '500+ employees',
    features: [
      'Everything in Growth',
      'Custom circuit parameters',
      'Dedicated Soroban node',
      'SLA guarantees',
      'On-premise option',
      'Dedicated account manager',
    ],
    cta: 'Contact us',
    href: 'mailto:hello@zerowage.xyz',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-8">

        <div className="text-center mb-14">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Pricing</div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pay per employee. No setup fees. No per-proof costs — ZK computation is near-zero on Stellar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 w-fit mb-4">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-muted-foreground text-sm mb-1">/mo</span>}
                </div>
                <div className="text-xs text-muted-foreground mb-3">{plan.unit}</div>
                <div className="text-xs text-primary font-mono">{plan.limit}</div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{plan.desc}</p>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle size={13} className="text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Frequently asked</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How much does each ZK proof cost?',
                a: 'Near zero. The Stellar transaction fee for submitting a Groth16 proof to the Soroban contract is approximately 0.05 XLM (~$0.005). This is included in your subscription.',
              },
              {
                q: 'Do you store salary data?',
                a: 'No. Salary amounts are private inputs to the ZK circuit and never leave your browser. We store only the encrypted payroll metadata you choose to keep for your own records.',
              },
              {
                q: 'Can I verify a proof without ZeroWage?',
                a: 'Yes. Every proof is verifiable independently using the open-source circuit and the Soroban contract. The verification key is public and the contract is open source.',
              },
              {
                q: 'Is mainnet supported?',
                a: 'Testnet is live now. Mainnet support is coming with our Growth launch. Enterprise customers can request early mainnet access.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-card p-5">
                <div className="font-medium text-foreground mb-2 text-sm">{item.q}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <SiteFooter />
    </div>
  )
}