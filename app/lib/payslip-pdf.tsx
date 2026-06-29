'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { type PayrollRun, type PayrollEmployee } from './payroll-store'

// Register monospace font
Font.register({
  family: 'Courier',
  src: 'https://fonts.gstatic.com/s/courierprime/v8/u-450q2lgwslOqpF_6gQ8kELaw9pWt_-.ttf',
})

const colors = {
  bg: '#0A0B0D',
  surface: '#111318',
  border: '#1E2330',
  primary: '#4F8EF7',
  success: '#22C55E',
  text: '#F1F5F9',
  muted: '#64748B',
  white: '#FFFFFF',
}

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  brandSub: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#0F3D1F',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 8,
    color: colors.success,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  // Title section
  titleSection: {
    marginBottom: 24,
  },
  payslipTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  payslipSub: {
    fontSize: 10,
    color: colors.muted,
  },
  // Employee card
  employeeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A6E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 3,
  },
  employeeWallet: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: 'Courier',
  },
  employeeRight: {
    alignItems: 'flex-end',
  },
  employeeLabel: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 3,
  },
  employeeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  employeeAsset: {
    fontSize: 9,
    color: colors.primary,
    marginTop: 2,
  },
  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 7,
    color: colors.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Courier',
  },
  summaryValueSuccess: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.success,
    fontFamily: 'Courier',
  },
  // Proof section
  proofSection: {
    backgroundColor: '#0A1F0A',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#166534',
  },
  proofTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.success,
    textTransform: 'uppercase',
  },
  proofBadge: {
    fontSize: 7,
    color: colors.success,
    fontFamily: 'Courier',
  },
  proofRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  proofLabel: {
    fontSize: 8,
    color: '#4ADE80',
  },
  proofValue: {
    fontSize: 8,
    color: colors.text,
    fontFamily: 'Courier',
    maxWidth: 280,
  },
  proofValueSmall: {
    fontSize: 7,
    color: colors.muted,
    fontFamily: 'Courier',
    maxWidth: 280,
  },
  // Privacy notice
  privacyBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 8,
  },
  privacyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  privacyText: {
    fontSize: 8,
    color: colors.muted,
    flex: 1,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {},
  footerLabel: {
    fontSize: 7,
    color: colors.muted,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 8,
    color: colors.text,
    fontFamily: 'Courier',
  },
  footerBrand: {
    alignItems: 'flex-end',
  },
  footerBrandName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footerBrandSub: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 1,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
})

interface PayslipProps {
  employee: PayrollEmployee
  run: PayrollRun
  companyName?: string
}

export function PayslipDocument({ employee, run, companyName }: PayslipProps) {
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const date = new Date(run.date)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Document
      title={`ZeroWage Payslip — ${employee.name} — ${run.cycleId}`}
      author="ZeroWage"
      subject="ZK-Verified Payslip"
    >
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>ZeroWage</Text>
            <Text style={s.brandSub}>
              {companyName || 'Your Company'} · Zero-Knowledge Payroll
            </Text>
          </View>
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedText}>✓ ZK VERIFIED ON STELLAR</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleSection}>
          <Text style={s.payslipTitle}>Payslip</Text>
          <Text style={s.payslipSub}>
            {run.cycleId} · Issued {formattedDate}
          </Text>
        </View>

        {/* Employee card */}
        <View style={s.employeeCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={s.employeeAvatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.employeeInfo}>
              <Text style={s.employeeName}>{employee.name}</Text>
              <Text style={s.employeeWallet}>
                {employee.wallet.slice(0, 12)}...{employee.wallet.slice(-8)}
              </Text>
            </View>
          </View>
          <View style={s.employeeRight}>
            <Text style={s.employeeLabel}>Net salary</Text>
            <Text style={s.employeeAmount}>
              {employee.amount.toLocaleString()}
            </Text>
            <Text style={s.employeeAsset}>USDC</Text>
          </View>
        </View>

        {/* Summary grid */}
        <View style={s.summaryGrid}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Gross Pay</Text>
            <Text style={s.summaryValue}>
              {employee.amount.toLocaleString()} USDC
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Deductions</Text>
            <Text style={s.summaryValue}>0.00 USDC</Text>
          </View>
          <View style={[s.summaryCard, { borderColor: '#166534' }]}>
            <Text style={s.summaryLabel}>Net Pay</Text>
            <Text style={s.summaryValueSuccess}>
              {employee.amount.toLocaleString()} USDC
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Payment Date</Text>
            <Text style={s.summaryValue}>{formattedDate}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ZK Proof section */}
        <View style={s.proofSection}>
          <View style={s.proofHeader}>
            <Text style={s.proofTitle}>
              Zero-Knowledge Proof Attestation
            </Text>
            <Text style={s.proofBadge}>Groth16 · BN254 · 660 constraints</Text>
          </View>

          <View style={s.proofRow}>
            <Text style={s.proofLabel}>Protocol</Text>
            <Text style={s.proofValue}>Groth16 (BN254 elliptic curve)</Text>
          </View>
          <View style={s.proofRow}>
            <Text style={s.proofLabel}>Circuit</Text>
            <Text style={s.proofValue}>payroll.circom · 660 constraints</Text>
          </View>
          <View style={s.proofRow}>
            <Text style={s.proofLabel}>Network</Text>
            <Text style={s.proofValue}>Stellar Testnet</Text>
          </View>
          <View style={s.proofRow}>
            <Text style={s.proofLabel}>Contract</Text>
            <Text style={s.proofValueSmall}>
              CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD
            </Text>
          </View>
          <View style={s.proofRow}>
            <Text style={s.proofLabel}>Proof Tx</Text>
            <Text style={s.proofValueSmall}>{run.proofTxHash}</Text>
          </View>
          {run.paymentTxHash && (
            <View style={s.proofRow}>
              <Text style={s.proofLabel}>Payment Tx</Text>
              <Text style={s.proofValueSmall}>{run.paymentTxHash}</Text>
            </View>
          )}
          <View style={[s.proofRow, { marginTop: 8 }]}>
            <Text style={s.proofLabel}>Public attestation</Text>
            <Text style={s.proofValue}>
              zerowage.xyz/verify/{run.proofTxHash.slice(0, 20)}...
            </Text>
          </View>
        </View>

        {/* Privacy notice */}
        <View style={s.privacyBox}>
          <View style={s.privacyDot} />
          <Text style={s.privacyText}>
            This payslip was generated by a zero-knowledge proof system. Your
            salary amount ({employee.amount.toLocaleString()} USDC) is known
            only to you and your employer. It does not appear on the Stellar
            blockchain — only the total payroll amount and proof of correct
            disbursement are recorded on-chain.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLeft}>
            <Text style={s.footerLabel}>Generated</Text>
            <Text style={s.footerValue}>{new Date().toUTCString()}</Text>
            <Text style={[s.footerLabel, { marginTop: 6 }]}>
              Verify this payslip
            </Text>
            <Text style={s.footerValue}>
              stellar.expert/explorer/testnet/tx/{run.proofTxHash.slice(0, 16)}...
            </Text>
          </View>
          <View style={s.footerBrand}>
            <Text style={s.footerBrandName}>ZeroWage</Text>
            <Text style={s.footerBrandSub}>
              Zero-knowledge payroll on Stellar
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}