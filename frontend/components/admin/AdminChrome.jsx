import React from 'react'
import AuroraBackdrop from '../../backgrounds/AuroraBackdrop.jsx'
import StarClusterSynth from '../../backgrounds/StarClusterSynth.jsx'

export default function AdminChrome() {
  return (
    <>
      <AuroraBackdrop variant="public" />
      <StarClusterSynth density={0.7} />
    </>
  )
}
