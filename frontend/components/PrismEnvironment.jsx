import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import AuroraBackdrop from '../backgrounds/AuroraBackdrop.jsx'

function buildStatusId(mode) {
  return `prism-menu-${mode}`
}

export default function PrismEnvironment({
  mode = 'public',
  navItems = [],
  statusLines = [],
  tickerItems = []
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const audioContextRef = useRef(null)
  const location = useLocation()
  const marqueeItems = useMemo(() => [...tickerItems, ...tickerItems], [tickerItems])
  const menuId = buildStatusId(mode)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function getAudioContext() {
    if (typeof window === 'undefined') {
      return null
    }

    const AudioContextApi = window.AudioContext || window.webkitAudioContext

    if (!AudioContextApi) {
      return null
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextApi()
    }

    return audioContextRef.current
  }

  async function primeAudio() {
    const audioContext = getAudioContext()

    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    return audioContext
  }

  function playSound(type) {
    const audioContext = type === 'click' ? getAudioContext() : audioContextRef.current

    if (!audioContext || audioContext.state !== 'running') {
      return
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    if (type === 'hover') {
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(420, audioContext.currentTime + 0.08)
      gainNode.gain.setValueAtTime(0.025, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.08)
      return
    }

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(132, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(42, audioContext.currentTime + 0.18)
    gainNode.gain.setValueAtTime(0.04, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.18)
  }

  async function toggleMenu() {
    await primeAudio()
    playSound('click')
    setMenuOpen((currentValue) => !currentValue)
  }

  return (
    <>
      <AuroraBackdrop variant={mode} />

      <aside className={`system-widget system-widget--${mode}`}>
        {statusLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </aside>

      {navItems.length ? (
        <nav className="prism-nav">
          <button
            className={`menu-trigger${menuOpen ? ' menu-trigger--active' : ''}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={toggleMenu}
          >
            <span />
            <span />
          </button>
          <div className={`menu-overlay${menuOpen ? ' active' : ''}`} id={menuId}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className="menu-link"
                to={item.to}
                onMouseEnter={() => playSound('hover')}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-move">
          {marqueeItems.map((item, index) => (
            <div key={`${item}-${index}`} className="ticker-item">
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
