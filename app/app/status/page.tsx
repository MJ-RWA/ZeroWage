import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

const systems = [
  { name: 'Proof generation', status: 'operational', latency: '2.1s avg' },
  { name: 'Soroban contract', status: 'operational', latency: '12ms avg' },
  { name: 'Stellar testnet RPC', status: 'operational', latency: '180ms avg' },
  { name: 'Proof Explorer', status: 'operational', latency: null },
  { name: 'Dashboard', status: 'operational', latency: null },
  { name: 'Freighter integration', status: 'operational', latency: null },
]

const incidents = [
  {
    date: 'Jun 21, 2026',
    title: 'Initial deployment',
    desc: 'ZeroWage deployed to Stellar testnet. Soroban verifier contract live at CB2JUH7W...SMRDUD.',
    status: 'resolved',
  },
]

const statusConfig = {
  operational: { label: 'Operational', color: 'text-success', bg: 'bg-success/10', dot: 'bg-success' },
  degraded: { label: 'Degraded', color: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' },
  outage: { label: 'Outage', color: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive' },
}

export default function StatusPage() {
  const allOperational = systems.every((s) => s.status === 'operational')

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">

        <div className="mb-10">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">System Status</div>
          <h1 className="text-3xl font-bold text-foreground mb-6">ZeroWage Status</h1>

          {/* Overall status */}
          <div className={`rounded-xl border p-5 flex items-center gap-4 ${allOperational ? 'border-success/20 bg-success/5' : 'border-warning/20 bg-warning/5'}`}>
            {allOperational
              ? <CheckCircle size={20} className="text-success shrink-0" />
              : <AlertCircle size={20} className="text-warning shrink-0" />
            }
            <div>
              <div className={`font-semibold ${allOperational ? 'text-success' : 'text-warning'}`}>
                {allOperational ? 'All systems operational' : 'Some systems degraded'}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Last updated: {new Date().toUTCString()}
              </div>
            </div>
          </div>
        </div>

        {/* Systems */}
        <div className="mb-12">
          <h2 className="text-sm font-medium text-foreground mb-4">Components</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {systems.map((sys) => {
              const cfg = statusConfig[sys.status as keyof typeof statusConfig]
              return (
                <div key={sys.name} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm text-foreground">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {sys.latency && (
                      <span className="font-mono text-xs text-muted-foreground">{sys.latency}</span>
                    )}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Incident history */}
        <div>
          <h2 className="text-sm font-medium text-foreground mb-4">Incident History</h2>
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.title} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-sm font-medium text-foreground">{inc.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{inc.date}</span>
                    <span className="text-xs text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full font-mono">
                      {inc.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{inc.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <SiteFooter />
    </div>
  )
}