import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const DEFAULT_QUESTIONS = [
  'What is the last letter of the alphabet?',
  'Type the secret operator glyph.',
  'What variable comes after y?',
  'Enter the access rune used by 3000Studios.',
  'What letter is always the answer?'
]

function pickRandomQuestion(questions) {
  const list = Array.isArray(questions) && questions.length ? questions : DEFAULT_QUESTIONS
  return list[Math.floor(Math.random() * list.length)]
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

export default function SecretAdminGateModal({ open, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('pin') // 'pin' | 'question'
  const [pin, setPin] = useState('')
  const [question, setQuestion] = useState(() => pickRandomQuestion())
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const pinFieldRef = useRef(null)
  const answerRef = useRef(null)

  const canSubmitPin = pin.length === 4
  const canSubmitAnswer = normalize(answer).length > 0

  useEffect(() => {
    if (!open) {
      return
    }

    setStep('pin')
    setPin('')
    setAnswer('')
    setError('')
    setQuestion(pickRandomQuestion())

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (step === 'pin') {
      window.setTimeout(() => pinFieldRef.current?.focus?.(), 50)
      return
    }
    window.setTimeout(() => answerRef.current?.focus?.(), 50)
  }, [open, step])

  const digits = useMemo(() => ['1','2','3','4','5','6','7','8','9','0'], [])

  function handleDigit(value) {
    setError('')
    if (step === 'pin') {
      setPin((current) => {
        if (current.length >= 4) return current
        return `${current}${value}`
      })
      return
    }
    setAnswer((current) => `${current}${value}`)
  }

  function handleBackspace() {
    setError('')
    if (step === 'pin') {
      setPin((current) => current.slice(0, -1))
      return
    }
    setAnswer((current) => current.slice(0, -1))
  }

  function handleClear() {
    setError('')
    if (step === 'pin') {
      setPin('')
      return
    }
    setAnswer('')
  }

  function submitPin() {
    if (!canSubmitPin) return
    if (pin !== '5555') {
      setError('Incorrect pin.')
      setPin('')
      return
    }
    setError('')
    setStep('question')
    setAnswer('')
  }

  function submitAnswer() {
    if (!canSubmitAnswer) return
    if (normalize(answer) !== 'z') {
      setError('Incorrect answer.')
      setAnswer('')
      return
    }
    setError('')
    onClose?.()
    navigate('/admin/login')
  }

  if (!open) return null

  return createPortal(
    <div className="secret-gate" role="dialog" aria-modal="true" aria-label="Admin access gate">
      <button
        type="button"
        className="secret-gate__backdrop"
        aria-label="Close"
        onClick={() => onClose?.()}
      />
      <section className="secret-gate__card">
        <div className="secret-gate__lock">
          <div className="secret-gate__coil" aria-hidden="true" />
          <div className="secret-gate__lock-body" aria-hidden="true">
            <div className="secret-gate__lock-shackle" />
            <div className="secret-gate__lock-face" />
            <div className="secret-gate__lock-core" />
          </div>
        </div>

        <header className="secret-gate__header">
          <span className="eyebrow">3000Studios · Admin</span>
          <h2 className="secret-gate__title">
            {step === 'pin' ? 'Enter access pin' : 'Answer the challenge'}
          </h2>
          <p className="section-intro">
            {step === 'pin'
              ? 'Keypad required. Operator-only access.'
              : question}
          </p>
        </header>

        <div className="secret-gate__display">
          <input
            ref={step === 'pin' ? pinFieldRef : answerRef}
            className="secret-gate__display-input"
            value={step === 'pin' ? pin.replace(/\d/g, '•') : answer}
            onChange={() => {}}
            inputMode="none"
            aria-label={step === 'pin' ? 'Pin display' : 'Answer display'}
            readOnly
          />
          {error ? <div className="error-banner secret-gate__error">{error}</div> : null}
        </div>

        <div className="secret-gate__pad" aria-label="Keypad">
          {digits.map((digit) => (
            <button
              key={digit}
              type="button"
              className="secret-gate__key"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <button type="button" className="secret-gate__key secret-gate__key--muted" onClick={handleBackspace}>
            ⟵
          </button>
          <button type="button" className="secret-gate__key secret-gate__key--muted" onClick={handleClear}>
            CLR
          </button>
          <button
            type="button"
            className="secret-gate__key secret-gate__key--submit"
            disabled={step === 'pin' ? !canSubmitPin : !canSubmitAnswer}
            onClick={step === 'pin' ? submitPin : submitAnswer}
          >
            OK
          </button>
        </div>

        <div className="secret-gate__actions">
          <button className="button button--ghost" type="button" onClick={() => onClose?.()}>
            Close
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={step === 'pin' ? submitPin : submitAnswer}
            disabled={step === 'pin' ? !canSubmitPin : !canSubmitAnswer}
          >
            {step === 'pin' ? 'Verify pin' : 'Enter admin'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
