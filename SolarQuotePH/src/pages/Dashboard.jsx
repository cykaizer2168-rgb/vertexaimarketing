import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import RoofVisualizer from '../components/RoofVisualizer'
import LoadCalculator from '../components/LoadCalculator'
import BOMTable from '../components/BOMTable'
import PDFExportButton, { generatePDF } from '../components/PDFExport'
import {
  computeSystem, computeFinancials, buildBOM,
  formatPHP, formatPct, formatDate, marginColor,
  monthlySavings, roiMonths, callGPT4V, BILL_PROMPT, ROOF_PROMPT, toBase64
} from '../utils/compute'

const DRAFT_KEY = 'solarquote_draft'

const TOOLTIPS = {
  kwh: 'Kilowatt-hour — sukatan ng kuryente. Makikita sa Meralco bill mo.',
  mppt: 'Maximum Power Point Tracking — nino-optimize ang solar charging efficiency.',
  dod: 'Depth of Discharge — 80% DoD = mas matagal ang buhay ng battery.',
  lifepo4: 'Lithium Iron Phosphate — uri ng battery. Mas ligtas, mas matagal.',
  kwp: 'Kilowatt-peak — maximum power ng solar panels sa ideal conditions.',
  netmetering: 'RA 9513 — pwedeng ibenta ang sobrang solar sa Meralco.',
}

function Tooltip({ term }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setShow(p => !p)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--amber)', fontSize: 12, padding: '0 4px',
        verticalAlign: 'middle',
      }}>ⓘ</button>
      {show && (
        <>
          <div onClick={() => setShow(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)', zIndex: 20,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13,
            maxWidth: 240, lineHeight: 1.5, boxShadow: 'var(--shadow)',
            color: 'var(--text)',
          }}>{TOOLTIPS[term]}</div>
        </>
      )}
    </span>
  )
}

function StepPill({ num, label, active, done, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 20, border: 'none',
      background: active ? 'var(--amber)' : done ? 'var(--surface2)' : 'var(--surface2)',
      color: active ? '#000' : done ? 'var(--amber)' : 'var(--text-muted)',
      cursor: 'pointer', fontSize: 13, fontWeight: 600,
      transition: 'all 0.2s',
      flexShrink: 0,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        background: active ? 'rgba(0,0,0,0.2)' : done ? 'var(--amber-bg)' : 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
        color: active ? '#000' : done ? 'var(--amber)' : 'var(--text-muted)',
      }}>
        {done ? '✓' : num}
      </span>
      {label}
    </button>
  )
}

function ImageUploader({ onFile, preview, label1, label2, capture = 'environment' }) {
  const ref1 = useRef(null)
  const ref2 = useRef(null)

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button onClick={() => ref1.current?.click()} style={{
          flex: 1, minHeight: 48, padding: '12px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--text)', cursor: 'pointer',
          fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          {label1}
        </button>
        <input ref={ref1} type="file" accept="image/*" capture={capture} style={{ display: 'none' }}
          onChange={e => e.target.files[0] && onFile(e.target.files[0])} />

        <button onClick={() => ref2.current?.click()} style={{
          flex: 1, minHeight: 48, padding: '12px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--text)', cursor: 'pointer',
          fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {label2}
        </button>
        <input ref={ref2} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
          onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      </div>
      {preview && (
        <img src={preview} alt="Preview"
          style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover', marginBottom: 12 }} />
      )}
    </div>
  )
}

function SkeletonLoader({ lines = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 16, width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, profile, role } = useAuth()
  const [step, setStep] = useState(0)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Step 1
  const [billMode, setBillMode] = useState('upload') // 'upload' | 'appliance'
  const [billFile, setBillFile] = useState(null)
  const [billPreview, setBillPreview] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState('')
  const [monthlyKwh, setMonthlyKwh] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billingDays, setBillingDays] = useState('30')
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [billRate, setBillRate] = useState('12')
  const [step1Errors, setStep1Errors] = useState({})

  // Step 2
  const [roofFile, setRoofFile] = useState(null)
  const [roofPreview, setRoofPreview] = useState('')
  const [analyzingRoof, setAnalyzingRoof] = useState(false)
  const [roofResult, setRoofResult] = useState(null)
  const [roofArea, setRoofArea] = useState('')
  const [roofType, setRoofType] = useState('metal')
  const [roofPitch, setRoofPitch] = useState('low_pitch')

  // Step 3
  const [backupHours, setBackupHours] = useState(4)
  const [systemType, setSystemType] = useState('hybrid')

  // Step 4
  const [quoteView, setQuoteView] = useState('client')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedQuoteId, setSavedQuoteId] = useState(null)

  // Draft banner
  const [draft, setDraft] = useState(null)
  const [showDraft, setShowDraft] = useState(false)

  // Touch swipe
  const touchStartX = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const d = JSON.parse(saved)
        setDraft(d)
        setShowDraft(true)
      } catch {}
    }
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    const { data } = await supabase.from('products').select('*').order('category')
    setProducts(data || [])
    setLoadingProducts(false)
  }

  // Auto-save draft
  useEffect(() => {
    if (!monthlyKwh && !clientName) return
    const d = {
      step, billMode, monthlyKwh, billAmount, billingDays, clientName, clientAddress, billRate,
      roofArea, roofType, roofPitch, roofResult, backupHours, systemType,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  }, [step, monthlyKwh, billAmount, billingDays, clientName, clientAddress, billRate,
    roofArea, roofType, roofPitch, roofResult, backupHours, systemType])

  const restoreDraft = () => {
    if (!draft) return
    setMonthlyKwh(draft.monthlyKwh || '')
    setBillAmount(draft.billAmount || '')
    setBillingDays(draft.billingDays || '30')
    setClientName(draft.clientName || '')
    setClientAddress(draft.clientAddress || '')
    setBillRate(draft.billRate || '12')
    setRoofArea(draft.roofArea || '')
    setRoofType(draft.roofType || 'metal')
    setRoofPitch(draft.roofPitch || 'low_pitch')
    setRoofResult(draft.roofResult || null)
    setBackupHours(draft.backupHours || 4)
    setSystemType(draft.systemType || 'hybrid')
    setStep(draft.step || 0)
    setShowDraft(false)
  }

  // Swipe
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0 && step < 3) setStep(s => s + 1)
      else if (delta < 0 && step > 0) setStep(s => s - 1)
    }
    touchStartX.current = null
  }

  // Bill image handler
  const handleBillFile = (file) => {
    setBillFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setBillPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const extractBill = async () => {
    if (!billFile) return
    setExtracting(true)
    setExtractStatus('Reading bill...')
    try {
      const { base64, mediaType } = await toBase64(billFile)
      setExtractStatus('Extracting data...')
      const result = await callGPT4V(base64, mediaType, BILL_PROMPT)
      setExtractStatus('Done!')
      if (result.kwh) setMonthlyKwh(String(result.kwh))
      if (result.amount) setBillAmount(String(result.amount))
      if (result.days) setBillingDays(String(result.days))
      if (result.rate) setBillRate(String(result.rate))
      if (result.customer_name) setClientName(result.customer_name)
      if (result.address) setClientAddress(result.address)
      setTimeout(() => setExtractStatus(''), 2000)
    } catch (e) {
      setExtractStatus('')
      setStep1Errors(prev => ({ ...prev, ai: e.message.includes('sk-') ? 'Invalid OpenAI key. Dapat nagsisimula sa sk-.' : 'Hindi ma-basahin ang bill. Subukan ulit o manual na i-enter ang datos.' }))
    }
    setExtracting(false)
  }

  // Roof image handler
  const handleRoofFile = (file) => {
    setRoofFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setRoofPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const analyzeRoof = async () => {
    if (!roofFile) return
    setAnalyzingRoof(true)
    try {
      const { base64, mediaType } = await toBase64(roofFile)
      const result = await callGPT4V(base64, mediaType, ROOF_PROMPT)
      setRoofResult(result)
      if (result.usable_area_sqm) setRoofArea(String(result.usable_area_sqm))
      if (result.roof_type) setRoofType(result.roof_type)
      if (result.roof_angle) setRoofPitch(result.roof_angle)
    } catch (e) {
      setRoofResult({ error: 'Hindi ma-analyze ang roof. Manual na lang i-input ang sukat.' })
    }
    setAnalyzingRoof(false)
  }

  const validateStep1 = () => {
    const errs = {}
    if (!monthlyKwh || Number(monthlyKwh) <= 0) errs.kwh = 'Required: kWh consumed'
    if (!clientName) errs.clientName = 'Required: Client name'
    setStep1Errors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (step === 0 && !validateStep1()) return
    if (step < 3) setStep(s => s + 1)
  }

  // Compute system
  const sys = computeSystem(Number(monthlyKwh) || 0, Number(billingDays) || 30, backupHours, systemType)
  const bom = loadingProducts ? [] : buildBOM(products, sys.panelQty, sys.batQty, systemType)

  // Apply sell_price = cost_price * (1 + markup_pct/100)
  const bomWithPrices = bom.map(item => ({
    ...item,
    sell_price: item.sell_price || Math.round(item.cost_price * (1 + item.markup_pct / 100)),
  }))

  const fin = computeFinancials(bomWithPrices)
  const savings = monthlySavings(sys.dailyGen, Number(billRate) || 12)
  const roiMo = roiMonths(fin.totalRevenue, savings)
  const quoteNumber = `SQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  const quoteData = {
    quote_number: quoteNumber,
    client_name: clientName,
    client_address: clientAddress,
    monthly_kwh: Number(monthlyKwh),
    billing_days: Number(billingDays),
    bill_amount: Number(billAmount),
    backup_hours: backupHours,
    system_type: systemType,
    roof_area: Number(roofArea),
    roof_type: roofType,
    roof_notes: roofResult?.notes || '',
    bom: bomWithPrices,
    total_cost: fin.totalCost,
    total_revenue: fin.totalRevenue,
    gross_profit: fin.grossProfit,
    net_margin: fin.netMargin,
    monthly_savings: savings,
    roi_months: roiMo,
    status: 'draft',
  }

  const saveQuote = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const { data, error } = await supabase.from('quotes').upsert({
        ...quoteData,
        created_by: user.id,
        quote_number: undefined,
      }).select().single()
      if (error) throw error
      setSavedQuoteId(data.id)
      localStorage.removeItem(DRAFT_KEY)
      setShowDraft(false)
    } catch (e) {
      setSaveError('May error sa pag-save. Subukan ulit.')
    }
    setSaving(false)
  }

  const cardStyle = (selected) => ({
    flex: 1, padding: '14px 16px',
    background: selected ? 'var(--amber-bg)' : 'var(--surface2)',
    border: `2px solid ${selected ? 'var(--amber)' : 'var(--border)'}`,
    borderRadius: 12, cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center',
  })

  const inputStyle = (hasError) => ({
    width: '100%', padding: '12px 14px',
    background: 'var(--surface2)',
    border: `1px solid ${hasError ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 10, color: 'var(--text)', fontSize: 16,
    boxSizing: 'border-box',
  })

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'var(--text-muted)', marginBottom: 6,
  }

  const fieldStyle = { marginBottom: 16 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Draft banner */}
      {showDraft && draft && (
        <div style={{
          background: 'var(--amber-bg)', borderBottom: '1px solid var(--amber-border)',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span style={{ fontSize: 13, color: 'var(--amber)', flex: 1 }}>
            Draft restored — {draft.clientName || 'No client'} — {formatDate(draft.savedAt)}
          </span>
          <button onClick={restoreDraft} style={{
            padding: '5px 12px', borderRadius: 8, background: 'var(--amber)',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#000',
          }}>Continue</button>
          <button onClick={() => setShowDraft(false)} style={{
            padding: '5px 12px', borderRadius: 8, background: 'transparent',
            border: '1px solid var(--amber-border)', cursor: 'pointer', fontSize: 13, color: 'var(--amber)',
          }}>Dismiss</button>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        {/* Step indicator */}
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            {['Bill', 'Roof', 'Setup', 'Quote'].map((label, i) => (
              <StepPill key={i} num={i + 1} label={label}
                active={step === i} done={step > i}
                onClick={() => { if (i < step || (i === 0) || step > 0) setStep(i) }} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          key={step}
          className="fade-slide-in"
        >
          {/* ── STEP 1: Bill ── */}
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                Electric Bill
              </h2>

              {/* Mode toggle */}
              <div style={{
                display: 'flex', gap: 4,
                background: 'var(--surface2)', borderRadius: 10,
                padding: 4, marginBottom: 20,
              }}>
                {['upload', 'appliance'].map(mode => (
                  <button key={mode} onClick={() => setBillMode(mode)} style={{
                    flex: 1, padding: '9px',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontSize: 14, fontWeight: 500,
                    background: billMode === mode ? 'var(--amber)' : 'transparent',
                    color: billMode === mode ? '#000' : 'var(--text-muted)',
                  }}>
                    {mode === 'upload' ? 'Upload Bill' : 'By Appliance'}
                  </button>
                ))}
              </div>

              {billMode === 'upload' ? (
                <>
                  <ImageUploader
                    onFile={handleBillFile}
                    preview={billPreview}
                    label1="Shoot Bill"
                    label2="Upload File"
                  />

                  {billPreview && (
                    <button onClick={extractBill} disabled={extracting} style={{
                      width: '100%', padding: '12px',
                      background: extracting ? 'var(--surface2)' : 'var(--amber)',
                      color: extracting ? 'var(--text-muted)' : '#000',
                      border: 'none', borderRadius: 10, cursor: extracting ? 'not-allowed' : 'pointer',
                      fontSize: 14, fontWeight: 600, marginBottom: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      {extracting ? (
                        <><div className="spinner" style={{ width: 14, height: 14 }} /> {extractStatus}</>
                      ) : '✨ Extract with AI'}
                    </button>
                  )}

                  {extractStatus === 'Done!' && (
                    <div style={{
                      background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--green)',
                      marginBottom: 12,
                    }}>✓ Bill extracted successfully</div>
                  )}

                  {step1Errors.ai && (
                    <div style={{
                      background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--red)',
                      marginBottom: 12,
                    }}>{step1Errors.ai}</div>
                  )}
                </>
              ) : (
                <LoadCalculator onUseLoad={(monthly) => {
                  setMonthlyKwh(String(Math.round(monthly)))
                  setBillMode('upload')
                }} />
              )}

              {billMode === 'upload' && (
                <>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>
                      kWh consumed * <Tooltip term="kwh" />
                    </label>
                    <input style={inputStyle(step1Errors.kwh)} type="number"
                      value={monthlyKwh} onChange={e => setMonthlyKwh(e.target.value)}
                      placeholder="e.g. 350" />
                    {step1Errors.kwh && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.kwh}</div>}
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Total bill amount (PHP)</label>
                    <input style={inputStyle()} type="number"
                      value={billAmount} onChange={e => setBillAmount(e.target.value)}
                      placeholder="e.g. 4200" />
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Billing days</label>
                      <input style={inputStyle()} type="number"
                        value={billingDays} onChange={e => setBillingDays(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Rate PHP/kWh</label>
                      <input style={inputStyle()} type="number" step="0.01"
                        value={billRate} onChange={e => setBillRate(e.target.value)} />
                    </div>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Client name *</label>
                    <input style={inputStyle(step1Errors.clientName)}
                      value={clientName} onChange={e => setClientName(e.target.value)}
                      placeholder="e.g. Juan dela Cruz" />
                    {step1Errors.clientName && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.clientName}</div>}
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Client address</label>
                    <input style={inputStyle()}
                      value={clientAddress} onChange={e => setClientAddress(e.target.value)}
                      placeholder="e.g. 123 Rizal St, Quezon City" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: Roof ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                Roof Analysis
              </h2>

              <ImageUploader
                onFile={handleRoofFile}
                preview={roofPreview}
                label1="Shoot Roof"
                label2="Upload File"
              />

              {roofPreview && (
                <button onClick={analyzeRoof} disabled={analyzingRoof} style={{
                  width: '100%', padding: '12px',
                  background: analyzingRoof ? 'var(--surface2)' : 'var(--amber)',
                  color: analyzingRoof ? 'var(--text-muted)' : '#000',
                  border: 'none', borderRadius: 10, cursor: analyzingRoof ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600, marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {analyzingRoof ? (
                    <><div className="spinner" style={{ width: 14, height: 14 }} /> Analyzing roof...</>
                  ) : '🏠 Analyze with AI'}
                </button>
              )}

              {roofResult && !roofResult.error && (
                <div style={{
                  background: 'var(--amber-bg)', border: '1px solid var(--amber-border)',
                  borderRadius: 12, padding: '14px 16px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 10, textTransform: 'uppercase' }}>
                    AI Roof Analysis
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    {[
                      ['Roof Type', roofResult.roof_type],
                      ['Orientation', roofResult.orientation],
                      ['Total Area', `${roofResult.estimated_area_sqm} sqm`],
                      ['Usable Area', `${roofResult.usable_area_sqm} sqm`],
                      ['Max Panels', `${roofResult.max_panels_550w} panels`],
                      ['Shading Risk', roofResult.shading_risk],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{k}</div>
                        <div style={{ fontWeight: 600 }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                  {roofResult.notes && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--amber-border)', paddingTop: 10 }}>
                      {roofResult.notes}
                    </div>
                  )}
                </div>
              )}

              {roofResult?.error && (
                <div style={{
                  background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 12,
                }}>{roofResult.error}</div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Area (sqm)</label>
                  <input style={inputStyle()} type="number"
                    value={roofArea} onChange={e => setRoofArea(e.target.value)} placeholder="60" />
                </div>
                <div>
                  <label style={labelStyle}>Roof type</label>
                  <select style={inputStyle()} value={roofType} onChange={e => setRoofType(e.target.value)}>
                    {['metal', 'concrete', 'tile', 'asphalt'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Pitch</label>
                  <select style={inputStyle()} value={roofPitch} onChange={e => setRoofPitch(e.target.value)}>
                    {[
                      ['flat', 'Flat'],
                      ['low_pitch', 'Low'],
                      ['medium_pitch', 'Medium'],
                      ['steep', 'Steep'],
                    ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Panel visualizer */}
              {sys.panelQty > 0 && (
                <div style={{
                  background: 'var(--surface2)', borderRadius: 12,
                  padding: '16px', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Panel Layout</div>
                  <RoofVisualizer
                    usableArea={Number(roofArea) || 0}
                    totalArea={Number(roofArea) * 1.2 || 0}
                    recommendedPanels={sys.panelQty}
                    maxPanels={roofResult?.max_panels_550w || Math.floor((Number(roofArea) || 60) / 3.5)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: System Setup ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                System Setup
              </h2>

              {/* Backup hours */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ ...labelStyle, marginBottom: 12 }}>
                  Backup hours: <strong style={{ color: 'var(--amber)' }}>{backupHours}h</strong>
                  <Tooltip term="dod" />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={1} max={24} value={backupHours}
                    onChange={e => setBackupHours(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--amber)' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setBackupHours(h => Math.max(1, h - 1))} style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text)', cursor: 'pointer', fontSize: 16,
                    }}>−</button>
                    <button onClick={() => setBackupHours(h => Math.min(24, h + 1))} style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text)', cursor: 'pointer', fontSize: 16,
                    }}>+</button>
                  </div>
                </div>
              </div>

              {/* System type */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ ...labelStyle, marginBottom: 12 }}>System type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { id: 'offgrid', label: 'Off-Grid', icon: '🔋', desc: 'Full independence' },
                    { id: 'gridtied', label: 'Grid-Tied', icon: '⚡', desc: 'No battery' },
                    { id: 'hybrid', label: 'Hybrid', icon: '☀️', desc: 'Best of both' },
                  ].map(s => (
                    <button key={s.id} onClick={() => setSystemType(s.id)} style={{
                      ...cardStyle(systemType === s.id),
                      padding: '16px 10px', cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div style={{
                background: 'var(--surface2)', borderRadius: 12,
                padding: '16px', border: '1px solid var(--border)', marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 12, textTransform: 'uppercase' }}>
                  System Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Panels', `${sys.panelQty} × 550W`],
                    ['Total kWp', `${sys.totalKwp.toFixed(2)} kWp`],
                    ['Batteries', systemType === 'gridtied' ? 'None' : `${sys.batQty} × 200Ah`],
                    ['Daily Gen.', `${sys.dailyGen.toFixed(1)} kWh`],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      background: 'var(--surface)', borderRadius: 8,
                      padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System comparison */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
                  SYSTEM COMPARISON
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      id: 'offgrid',
                      label: 'Off-Grid',
                      desc: `${computeSystem(Number(monthlyKwh) || 0, Number(billingDays) || 30, backupHours, 'offgrid').panelQty} panels + inverter + batteries`,
                    },
                    {
                      id: 'gridtied',
                      label: 'Grid-Tied',
                      desc: `${computeSystem(Number(monthlyKwh) || 0, Number(billingDays) || 30, backupHours, 'gridtied').panelQty} panels + grid inverter`,
                      badge: 'Meralco Net Metering eligible (RA 9513)',
                    },
                    {
                      id: 'hybrid',
                      label: 'Hybrid',
                      desc: `${computeSystem(Number(monthlyKwh) || 0, Number(billingDays) || 30, backupHours, 'hybrid').panelQty} panels + hybrid inverter + 1 battery`,
                      recommended: true,
                    },
                  ].map(opt => {
                    const optSys = computeSystem(Number(monthlyKwh) || 0, Number(billingDays) || 30, backupHours, opt.id)
                    const optBom = loadingProducts ? [] : buildBOM(products, optSys.panelQty, optSys.batQty, opt.id)
                    const optBomPriced = optBom.map(item => ({
                      ...item,
                      sell_price: item.sell_price || Math.round(item.cost_price * (1 + item.markup_pct / 100)),
                    }))
                    const optFin = computeFinancials(optBomPriced)
                    const optSavings = monthlySavings(optSys.dailyGen, Number(billRate) || 12)
                    const optRoi = roiMonths(optFin.totalRevenue, optSavings)

                    return (
                      <div key={opt.id} onClick={() => setSystemType(opt.id)} style={{
                        ...cardStyle(systemType === opt.id),
                        padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                        position: 'relative',
                      }}>
                        {opt.recommended && (
                          <div style={{
                            position: 'absolute', top: -1, right: 12,
                            background: 'var(--amber)', color: '#000',
                            fontSize: 10, fontWeight: 700, padding: '3px 10px',
                            borderRadius: '0 0 8px 8px',
                          }}>★ RECOMMENDED</div>
                        )}
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{opt.desc}</div>
                        {opt.badge && (
                          <div style={{
                            display: 'inline-block', fontSize: 10, padding: '2px 8px',
                            background: 'var(--green-bg)', color: 'var(--green)',
                            border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, marginBottom: 8,
                          }}>{opt.badge}</div>
                        )}
                        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total cost</div>
                            <div style={{ fontWeight: 700 }}>{formatPHP(optFin.totalRevenue)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Monthly savings</div>
                            <div style={{ fontWeight: 700, color: 'var(--green)' }}>{formatPHP(optSavings)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Payback</div>
                            <div style={{ fontWeight: 700 }}>{optRoi} mo</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Quote ── */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>
                  Quote Result
                </h2>
                {(role === 'master_admin' || role === 'estimator') && (
                  <div style={{
                    display: 'flex', gap: 4,
                    background: 'var(--surface2)', borderRadius: 10, padding: 4,
                  }}>
                    {['internal', 'client'].map(v => (
                      <button key={v} onClick={() => setQuoteView(v)} style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: quoteView === v ? 'var(--amber)' : 'transparent',
                        color: quoteView === v ? '#000' : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        textTransform: 'capitalize',
                      }}>{v}</button>
                    ))}
                  </div>
                )}
              </div>

              {quoteView === 'internal' && (role === 'master_admin' || role === 'estimator') ? (
                <InternalView bom={bomWithPrices} fin={fin} savings={savings} roiMo={roiMo} />
              ) : (
                <ClientView
                  quoteData={quoteData}
                  bom={bomWithPrices}
                  fin={fin}
                  savings={savings}
                  roiMo={roiMo}
                  sys={sys}
                  roofResult={roofResult}
                />
              )}

              {saveError && (
                <div style={{
                  background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
                  marginBottom: 12,
                }}>{saveError}</div>
              )}

              {savedQuoteId && (
                <div style={{
                  background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--green)',
                  marginBottom: 12,
                }}>✓ Quote saved successfully!</div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 28,
          position: 'sticky', bottom: 0,
          background: 'var(--bg)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
        }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button onClick={goNext} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: 'var(--amber)', color: '#000', cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
            }}>
              {step === 2 ? 'View Quote →' : 'Next →'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, flex: 1 }}>
              <button onClick={saveQuote} disabled={saving} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: 'var(--surface2)',
                color: saving ? 'var(--text-muted)' : 'var(--text)',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600,
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save'}
              </button>
              <PDFExportButton
                quote={quoteData}
                profile={profile}
                onError={msg => setSaveError(msg)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InternalView({ bom, fin, savings, roiMo }) {
  const mc = marginColor(fin.netMargin)
  const matCost = bom.filter(i => i.category !== 'Labor').reduce((s, i) => s + i.cost_price * i.qty, 0)
  const laborCost = bom.filter(i => i.category === 'Labor').reduce((s, i) => s + i.cost_price * i.qty, 0)
  const matRev = bom.filter(i => i.category !== 'Labor').reduce((s, i) => s + i.sell_price * i.qty, 0)
  const laborRev = bom.filter(i => i.category === 'Labor').reduce((s, i) => s + i.sell_price * i.qty, 0)

  return (
    <div>
      <div style={{
        background: 'var(--surface2)', borderRadius: 12,
        padding: '14px 16px', marginBottom: 16, border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Margin Health</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: mc }}>{formatPct(fin.netMargin)}</span>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, fin.netMargin)}%`,
            background: mc, borderRadius: 4, transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {fin.netMargin < 15 ? 'Below minimum — review pricing' :
           fin.netMargin < 20 ? 'Acceptable — consider increasing' :
           fin.netMargin < 30 ? 'Healthy margin' : 'Excellent margin'}
        </div>
      </div>

      <div style={{ marginBottom: 20, overflowX: 'auto' }}>
        <BOMTable bom={bom} showCost={true} />
      </div>

      <div style={{
        background: 'var(--surface2)', borderRadius: 12,
        padding: '16px', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase' }}>
          Project Financial Summary
        </div>
        <FinRow label="Total material cost" value={formatPHP(matCost)} color="var(--red)" />
        <FinRow label="Total labor cost" value={formatPHP(laborCost)} color="var(--red)" />
        <FinRow label="Total project cost — your expense" value={formatPHP(fin.totalCost)} color="var(--red)" bold />
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
        <FinRow label="Total material revenue" value={formatPHP(matRev)} color="var(--blue)" />
        <FinRow label="Total labor revenue" value={formatPHP(laborRev)} color="var(--blue)" />
        <FinRow label="Total client billing" value={formatPHP(fin.totalRevenue)} color="var(--blue)" bold />
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
        <FinRow label="Gross profit" value={formatPHP(fin.grossProfit)} color="var(--green)" />
        <FinRow label="Net margin" value={formatPct(fin.netMargin)} color={mc} bold />
      </div>
    </div>
  )
}

function ClientView({ quoteData, bom, fin, savings, roiMo, sys, roofResult }) {
  const categories = [...new Set(bom.map(i => i.category))]
  const matRev = bom.filter(i => i.category !== 'Labor').reduce((s, i) => s + i.sell_price * i.qty, 0)
  const laborRev = bom.filter(i => i.category === 'Labor').reduce((s, i) => s + i.sell_price * i.qty, 0)

  return (
    <div>
      {/* Quote header */}
      <div style={{
        background: 'linear-gradient(135deg, #080e1a 0%, #0f1829 100%)',
        borderRadius: 16, padding: '20px', marginBottom: 16,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>QUOTE NUMBER</div>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
              {quoteData.quote_number}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Date: {formatDate(new Date())}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Valid 30 days</div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{quoteData.client_name || 'Client'}</div>
        {quoteData.client_address && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{quoteData.client_address}</div>
        )}
      </div>

      {/* System specs grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16,
      }}>
        {[
          { icon: '☀️', label: 'Solar Panels', value: `${sys.panelQty} × 550W` },
          { icon: '⚡', label: 'System Type', value: quoteData.system_type?.toUpperCase() },
          { icon: '🔋', label: 'Batteries', value: quoteData.system_type === 'gridtied' ? 'N/A' : `${sys.batQty} × 200Ah` },
          { icon: '📊', label: 'Total Capacity', value: `${sys.totalKwp.toFixed(2)} kWp` },
        ].map(spec => (
          <div key={spec.label} style={{
            background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{spec.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{spec.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{spec.value}</div>
          </div>
        ))}
      </div>

      {/* BOM client view */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Bill of Materials
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Item', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '8px 10px', textAlign: i > 1 ? 'right' : i === 1 ? 'center' : 'left',
                    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const items = bom.filter(i => i.category === cat)
                const catTotal = items.reduce((s, i) => s + i.sell_price * i.qty, 0)
                return (
                  <>
                    <tr key={`cat-${cat}`} style={{ background: 'var(--surface2)' }}>
                      <td colSpan={4} style={{
                        padding: '6px 10px', fontSize: 11, fontWeight: 700,
                        color: 'var(--amber)', textTransform: 'uppercase',
                      }}>{cat}</td>
                    </tr>
                    {items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ fontWeight: 500 }}>{item.name}</div>
                          {item.brand && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.brand}</div>}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>{formatPHP(item.sell_price)}</td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600 }}>{formatPHP(item.sell_price * item.qty)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--amber-bg)' }}>
                      <td colSpan={3} style={{ padding: '8px 10px', fontWeight: 600, fontSize: 13 }}>{cat} Subtotal</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--amber)' }}>
                        {formatPHP(catTotal)}
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost summary */}
      <div style={{
        background: 'var(--surface2)', borderRadius: 12,
        padding: '16px', border: '1px solid var(--border)', marginBottom: 16,
      }}>
        <FinRow label="Materials" value={formatPHP(matRev)} />
        <FinRow label="Labor & Installation" value={formatPHP(laborRev)} />
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 800 }}>TOTAL</span>
          <span style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--amber)' }}>
            {formatPHP(fin.totalRevenue)}
          </span>
        </div>
      </div>

      {/* ROI */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16,
      }}>
        {[
          { label: 'Monthly Savings', value: formatPHP(savings), color: 'var(--green)' },
          { label: 'Payback Period', value: `${roiMo} months`, color: 'var(--amber)' },
          { label: '10-Year Savings', value: formatPHP(savings * 120), color: 'var(--blue)' },
        ].map(r => (
          <div key={r.label} style={{
            background: 'var(--surface2)', borderRadius: 10, padding: '12px',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: r.color }}>{r.value}</div>
          </div>
        ))}
      </div>

      {/* Roof assessment */}
      {roofResult && !roofResult.error && (
        <div style={{
          background: 'var(--amber-bg)', border: '1px solid var(--amber-border)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 8 }}>ROOF ASSESSMENT</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {roofResult.notes || `${roofResult.roof_type} roof, ${roofResult.orientation} facing, ${roofResult.shading_risk} shading risk`}
          </div>
        </div>
      )}

      {/* T&C */}
      <div style={{
        background: 'var(--surface2)', borderRadius: 12,
        padding: '14px 16px', border: '1px solid var(--border)', fontSize: 12,
        color: 'var(--text-muted)', lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text)', fontSize: 13 }}>Terms & Conditions</div>
        {[
          'Prices valid for 30 days from date of issue.',
          '50% downpayment required upon confirmation.',
          'Installation: 5-10 business days after full payment.',
          'Solar panels: 25-year performance warranty.',
          'Inverter: 5-10 year warranty (brand dependent).',
          'Battery: 5-10 year warranty (brand dependent).',
          'Workmanship: 1-year warranty.',
          'Subject to site inspection confirmation.',
        ].map((t, i) => <div key={i}>{i + 1}. {t}</div>)}
      </div>
    </div>
  )
}

function FinRow({ label, value, color, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '5px 0', fontSize: 14,
      fontWeight: bold ? 700 : 400,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: color || 'var(--text)', fontFamily: bold ? 'Syne' : 'inherit' }}>{value}</span>
    </div>
  )
}
