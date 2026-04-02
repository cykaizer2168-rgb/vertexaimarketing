import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { computeFinancials, formatPHP, formatPct, marginColor } from '../utils/compute'

export default function CostControl() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [edited, setEdited] = useState({}) // id → { cost_price, markup_pct, qty }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('category')
    setProducts(data || [])
    setEdited({})
    setLoading(false)
  }

  const getItem = (p) => {
    const e = edited[p.id] || {}
    const cost = e.cost_price !== undefined ? e.cost_price : p.cost_price
    const markup = e.markup_pct !== undefined ? e.markup_pct : p.markup_pct
    const qty = e.qty !== undefined ? e.qty : (p.default_qty || 1)
    const sell_price = Math.round(cost * (1 + markup / 100))
    return { ...p, cost_price: cost, markup_pct: markup, qty, sell_price }
  }

  const update = (id, key, value) => {
    setEdited(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: value }
    }))
  }

  const bom = products.map(getItem)
  const categories = ['All', ...new Set(products.map(p => p.category))]

  const filteredBom = activeCategory === 'All'
    ? bom
    : bom.filter(i => i.category === activeCategory)

  const fin = computeFinancials(bom)
  const mc = marginColor(fin.netMargin)

  const matCost = bom.filter(i => i.category !== 'Labor').reduce((s, i) => s + i.cost_price * i.qty, 0)
  const laborCost = bom.filter(i => i.category === 'Labor').reduce((s, i) => s + i.cost_price * i.qty, 0)
  const matRev = bom.filter(i => i.category !== 'Labor').reduce((s, i) => s + i.sell_price * i.qty, 0)
  const laborRev = bom.filter(i => i.category === 'Labor').reduce((s, i) => s + i.sell_price * i.qty, 0)

  const saveTemplate = async () => {
    if (role !== 'master_admin') return
    setSaving(true)
    setSaveMsg('')
    try {
      for (const p of bom) {
        if (edited[p.id]) {
          await supabase.from('products').update({
            cost_price: p.cost_price,
            markup_pct: p.markup_pct,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          }).eq('id', p.id)
        }
      }
      setSaveMsg('Template saved successfully!')
      setEdited({})
      await fetchProducts()
    } catch {
      setSaveMsg('Error saving template.')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const inputStyle = {
    padding: '6px 8px', borderRadius: 6,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 13, textAlign: 'right',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800 }}>Cost Control Center</h1>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: 'rgba(239,68,68,0.1)', color: 'var(--red)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>INTERNAL</span>
        </div>

        {/* Summary metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Your Cost', value: formatPHP(fin.totalCost), color: 'var(--red)' },
            { label: 'Client Price', value: formatPHP(fin.totalRevenue), color: 'var(--blue)' },
            { label: 'Gross Profit', value: formatPHP(fin.grossProfit), color: 'var(--green)' },
            { label: 'Net Margin', value: formatPct(fin.netMargin), color: mc },
          ].map(m => (
            <div key={m.label} style={{
              background: 'var(--surface)', borderRadius: 12, padding: '14px 16px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Margin health bar */}
        <div style={{
          background: 'var(--surface)', borderRadius: 12, padding: '14px 16px',
          border: '1px solid var(--border)', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Margin Health</span>
            <span style={{ fontSize: 13, color: mc, fontWeight: 700 }}>
              {fin.netMargin < 15 ? '⚠️ Below minimum' :
               fin.netMargin < 20 ? '⚡ Acceptable' :
               fin.netMargin < 30 ? '✅ Healthy' : '🚀 Excellent'}
            </span>
          </div>
          <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${Math.min(100, fin.netMargin / 40 * 100)}%`,
              background: `linear-gradient(90deg, var(--red), var(--amber) 40%, var(--green) 70%, var(--teal))`,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>0%</span><span>15%</span><span>20%</span><span>30%+</span>
          </div>
        </div>

        {/* Category filters */}
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '7px 14px', borderRadius: 20, border: 'none',
                background: activeCategory === cat ? 'var(--amber)' : 'var(--surface2)',
                color: activeCategory === cat ? '#000' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'all 0.15s',
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* BOM Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)', borderRadius: 12,
            border: '1px solid var(--border)', overflowX: 'auto', marginBottom: 20,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Item', 'Qty', 'Supplier Cost', 'Markup %', 'Sell Price', 'Profit', 'Margin'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 14px', textAlign: i > 0 ? 'right' : 'left',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBom.map(item => {
                  const profit = (item.sell_price - item.cost_price) * item.qty
                  const margin = item.sell_price > 0
                    ? ((item.sell_price - item.cost_price) / item.sell_price * 100) : 0
                  const mc2 = marginColor(margin)

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {item.brand && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.brand}</div>}
                        {item.category && <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 2 }}>{item.category}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button onClick={() => update(item.id, 'qty', Math.max(0, item.qty - 1))}
                            style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}>−</button>
                          <span style={{ minWidth: 24, textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => update(item.id, 'qty', item.qty + 1)}
                            style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <input type="number" value={item.cost_price}
                          onChange={e => update(item.id, 'cost_price', Number(e.target.value))}
                          style={{ ...inputStyle, width: 100 }} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <input type="number" value={item.markup_pct}
                            onChange={e => update(item.id, 'markup_pct', Number(e.target.value))}
                            style={{ ...inputStyle, width: 60 }} />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                        {formatPHP(item.sell_price)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--green)' }}>
                        {formatPHP(profit)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{
                              height: '100%', width: `${Math.min(100, margin)}%`,
                              background: mc2, borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: mc2, minWidth: 38, textAlign: 'right' }}>
                            {margin.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial summary */}
        <div style={{
          background: 'var(--surface)', borderRadius: 12,
          padding: '16px', border: '1px solid var(--border)', marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase' }}>
            Project Financial Summary
          </div>
          {[
            { label: 'Total material cost', value: formatPHP(matCost), color: 'var(--red)' },
            { label: 'Total labor cost', value: formatPHP(laborCost), color: 'var(--red)' },
            { label: 'Total project cost — your expense', value: formatPHP(fin.totalCost), color: 'var(--red)', bold: true },
          ].map(r => <FinRow key={r.label} {...r} />)}
          <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
          {[
            { label: 'Total material revenue', value: formatPHP(matRev), color: 'var(--blue)' },
            { label: 'Total labor revenue', value: formatPHP(laborRev), color: 'var(--blue)' },
            { label: 'Total client billing', value: formatPHP(fin.totalRevenue), color: 'var(--blue)', bold: true },
          ].map(r => <FinRow key={r.label} {...r} />)}
          <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
          {[
            { label: 'Gross profit', value: formatPHP(fin.grossProfit), color: 'var(--green)' },
            { label: 'Net margin', value: formatPct(fin.netMargin), color: mc, bold: true },
          ].map(r => <FinRow key={r.label} {...r} />)}
        </div>

        {/* Action buttons */}
        {saveMsg && (
          <div style={{
            background: saveMsg.includes('Error') ? 'var(--red-bg)' : 'var(--green-bg)',
            border: `1px solid ${saveMsg.includes('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius: 8, padding: '10px 14px', fontSize: 13,
            color: saveMsg.includes('Error') ? 'var(--red)' : 'var(--green)',
            marginBottom: 12,
          }}>{saveMsg}</div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '12px 20px', borderRadius: 10, border: 'none',
            background: 'var(--amber)', color: '#000', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}>Generate Client Quote</button>

          {role === 'master_admin' && (
            <button onClick={saveTemplate} disabled={saving} style={{
              padding: '12px 20px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: saving ? 'var(--surface2)' : 'var(--surface2)',
              color: saving ? 'var(--text-muted)' : 'var(--text)',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save Template'}
            </button>
          )}

          <button onClick={fetchProducts} style={{
            padding: '12px 20px', borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}>↺ Reset</button>
        </div>
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
