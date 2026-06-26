import { ExplorerHeader } from '@/components/explorer/explorer-header'

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <ExplorerHeader />
      <main>{children}</main>
    </div>
  )
}
