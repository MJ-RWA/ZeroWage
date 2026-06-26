'use client'

import { useState, useEffect } from 'react'

export function CompanyName() {
  const [name, setName] = useState('ZeroWage')
  useEffect(() => {
    try {
      const s = localStorage.getItem('zerowage_settings')
      if (s) {
        const parsed = JSON.parse(s)
        if (parsed.companyName) setName(parsed.companyName)
      }
    } catch {}
  }, [])
  return <span>{name}</span>
}