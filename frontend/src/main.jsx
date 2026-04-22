import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

const DEFAULT_ADSENSE_PUBLISHER = 'ca-pub-5800977493749262'
const adsensePublisher = import.meta.env.VITE_ADSENSE_PUBLISHER || DEFAULT_ADSENSE_PUBLISHER
const adsEnabled = (() => {
  const raw = String(import.meta.env.VITE_ENABLE_ADS ?? '').toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  return Boolean(import.meta.env.PROD)
})()

if (adsEnabled && adsensePublisher && adsensePublisher.startsWith('ca-pub-')) {
  const adSenseScript = document.createElement('script')
  adSenseScript.async = true
  adSenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}`
  adSenseScript.crossOrigin = 'anonymous'
  document.head.appendChild(adSenseScript)
}

window.sendCommand = async function sendCommand(command) {
  const used = Number(window.localStorage.getItem('cmdCount') || 0)
  const plan = window.localStorage.getItem('plan') || 'free'

  const res = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command,
      mode: 'apply',
      commandsUsed: used,
      plan
    })
  })

  const data = await res.json()

  if (data?.error === 'PAYWALL_TRIGGERED' || data?.blocked) {
    const paywall = document.getElementById('paywall')
    if (paywall) {
      paywall.style.display = 'flex'
    }
    return data
  }

  window.localStorage.setItem('cmdCount', String(data.commandsUsed ?? used + 1))

  if (data?.productSectionHtml) {
    document.body.insertAdjacentHTML('beforeend', data.productSectionHtml)
  }

  return data
}

ReactDOM.createRoot(document.getElementById('root')).render(
<BrowserRouter>
  <App />
</BrowserRouter>
)
