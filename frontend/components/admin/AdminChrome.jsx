import React from 'react'
import AuroraBackdrop from '../../backgrounds/AuroraBackdrop.jsx'
import StarClusterSynth from '../../backgrounds/StarClusterSynth.jsx'
import SynthWaveWallpaper from '../../backgrounds/SynthWaveWallpaper.jsx'

export default function AdminChrome() {
  return (
    <>
      <AuroraBackdrop variant="public" />
      <SynthWaveWallpaper opacity={0.5} />
      <StarClusterSynth density={0.7} />
    </>
  )
}
