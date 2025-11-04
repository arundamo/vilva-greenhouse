// Shared currency formatter for the client app
// Usage: import { formatCAD } from '../utils/currency'
export const formatCAD = (amount) => {
  const n = Number(amount)
  const safe = Number.isFinite(n) ? n : 0
  try {
    return safe.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
  } catch (e) {
    return `$${safe.toFixed(2)}`
  }
}
