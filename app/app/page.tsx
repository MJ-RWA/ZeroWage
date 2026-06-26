import { SiteHeader } from '@/components/marketing/site-header'
import { Hero } from '@/components/marketing/hero'
import { TrustBar } from '@/components/marketing/trust-bar'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { ProductPreview } from '@/components/marketing/product-preview'
import { Features } from '@/components/marketing/features'
import { Security } from '@/components/marketing/security'
import { CTA } from '@/components/marketing/cta'
import { SiteFooter } from '@/components/marketing/site-footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <ProductPreview />
        <Features />
        <Security />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  )
}
