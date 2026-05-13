import React, { useEffect, useRef } from 'react'

export default function PrismCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')

    if (!cursor || !mediaQuery.matches) {
      return undefined
    }

    function updatePosition(event) {
      cursor.classList.add('cursor-blob--visible')
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
    }

    const handleMouseDown = () => cursor.classList.add('cursor-blob--pressed')
    const handleMouseUp = () => cursor.classList.remove('cursor-blob--pressed')

    function updateInteractiveState(event) {
      const target = event.target instanceof Element ? event.target : null
      cursor.classList.toggle(
        'cursor-blob--interactive',
        Boolean(target?.closest('a, button, input, textarea, select, label, [role="button"]'))
      )
    }

    document.addEventListener('mousemove', updatePosition)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseover', updateInteractiveState)

    return () => {
      document.removeEventListener('mousemove', updatePosition)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseover', updateInteractiveState)
    }
  }, [])

  return (
    <div ref={cursorRef} className="cursor-blob" aria-hidden="true">
      <span className="cursor-blob__ring" />
      <span className="cursor-blob__core" />
    </div>
  )
}
