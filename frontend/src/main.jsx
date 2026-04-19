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

ReactDOM.createRoot(document.getElementById('root')).render(
<BrowserRouter>
  <App />
</BrowserRouter>
)
