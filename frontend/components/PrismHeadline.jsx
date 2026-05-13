import React from 'react'

export default function PrismHeadline({ as: Tag = 'h1', text = '', className = '' }) {
  return (
    <Tag className={['prism-headline', className].filter(Boolean).join(' ')}>
      {Array.from(text).map((character, index) => (
        <span
          key={`${character}-${index}`}
          className={`prism-headline__char${character.trim() ? '' : ' prism-headline__char--space'}`}
        >
          {character === ' ' ? '\u00A0' : character}
        </span>
      ))}
    </Tag>
  )
}
