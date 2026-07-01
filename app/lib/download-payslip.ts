export async function downloadPayslip(
  employee: import('./payroll-store').PayrollEmployee,
  run: import('./payroll-store').PayrollRun,
  companyName?: string
) {
  // Dynamically import to avoid SSR issues
  const { pdf } = await import('@react-pdf/renderer')
  const { createElement } = await import('react')
  const { PayslipDocument } = await import('./payslip-pdf')

  const doc = PayslipDocument({ employee, run, companyName })
  const blob = await pdf(doc).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zerowage-payslip-${employee.name.replace(/\s+/g, '-').toLowerCase()}-${run.cycleId.replace(/\s+/g, '-').toLowerCase()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadAllPayslips(
  run: import('./payroll-store').PayrollRun,
  companyName?: string
) {
  for (const emp of run.employees) {
    await downloadPayslip(emp, run, companyName)
    // Small delay between downloads
    await new Promise((r) => setTimeout(r, 300))
  }
}