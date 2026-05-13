export const fadeUp = {
hidden: { opacity: 0, y: 24 },
visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

export const fadeIn = {
hidden: { opacity: 0 },
visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
}

export const slideInLeft = {
hidden: { opacity: 0, x: -32 },
visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

export const slideInRight = {
hidden: { opacity: 0, x: 32 },
visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

export const scaleIn = {
hidden: { opacity: 0, scale: 0.92 },
visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } }
}

export const staggerParent = {
hidden: {},
visible: {
  transition: {
    staggerChildren: 0.12,
    delayChildren: 0.05
  }
}
}

export const staggerFast = {
hidden: {},
visible: {
  transition: {
    staggerChildren: 0.07,
    delayChildren: 0
  }
}
}

export const cardHover = {
rest: { y: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
hover: { y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
}