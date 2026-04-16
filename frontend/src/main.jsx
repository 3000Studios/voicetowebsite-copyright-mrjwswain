import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

const adsensePublisher = import.meta.env.VITE_ADSENSE_PUBLISHER
const adsEnabled = String(import.meta.env.VITE_ENABLE_ADS ?? '').toLowerCase() === 'true'

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
