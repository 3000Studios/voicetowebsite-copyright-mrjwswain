import React from 'react'
import PrismHeadline from '../../components/PrismHeadline.jsx'
import CommandConsole from '../../components/admin/CommandConsole.jsx'
import { useAdminDashboard } from '../../context/AdminDashboardContext.jsx'

export default function AdminConsolePage() {
  const { commandText, setCommandText, handleRunCommand, commandBusy, lastResult } = useAdminDashboard()

  return (
    <div className="admin-section stack-lg">
      <div className="admin-section__intro">
        <span className="eyebrow">AI console</span>
        <PrismHeadline text="Command router" />
        <p className="section-intro">
          Run JSON actions against the platform: content generation, images, deploys, and automation.
        </p>
      </div>
      <CommandConsole
        commandText={commandText}
        onCommandTextChange={setCommandText}
        onRunCommand={handleRunCommand}
        busy={commandBusy}
        lastResult={lastResult}
      />
    </div>
  )
}
