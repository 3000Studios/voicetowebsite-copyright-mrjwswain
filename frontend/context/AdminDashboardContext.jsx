import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnalytics, getContent, getDeployments, sendCommand } from '../src/adminApi.js'
import { clearAdminSession, getAdminSession } from '../src/adminSession.js'

const defaultCommand = JSON.stringify(
  {
    action: 'create_blog_post',
    topic: 'AI automation',
    length: 'medium',
    autoDeploy: false
  },
  null,
  2
)

const AdminDashboardContext = createContext(null)

export function AdminDashboardProvider({ children }) {
  const navigate = useNavigate()
  const [adminSession] = useState(() => getAdminSession())
  const [commandText, setCommandText] = useState(defaultCommand)
  const [analytics, setAnalytics] = useState(null)
  const [deployments, setDeployments] = useState(null)
  const [contentBundle, setContentBundle] = useState(null)
  const [commandBusy, setCommandBusy] = useState(false)
  const [editorBusy, setEditorBusy] = useState(false)
  const [deployBusy, setDeployBusy] = useState(false)
  const [trafficBusy, setTrafficBusy] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const refreshDashboard = useCallback(
    async (activeSession = adminSession) => {
      if (!activeSession?.adminEmail || !activeSession?.adminCode) {
        return
      }
      const [nextAnalytics, nextDeployments, nextContent] = await Promise.all([
        getAnalytics(activeSession),
        getDeployments(activeSession),
        getContent(activeSession)
      ])
      setAnalytics(nextAnalytics)
      setDeployments(nextDeployments)
      setContentBundle(nextContent)
    },
    [adminSession]
  )

  useEffect(() => {
    if (!adminSession?.adminEmail || !adminSession?.adminCode) {
      return
    }
    refreshDashboard(adminSession)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setInitialLoadDone(true))
  }, [adminSession, refreshDashboard])

  const handleRunCommand = useCallback(async () => {
    try {
      setError('')
      setCommandBusy(true)
      const result = await sendCommand(adminSession, JSON.parse(commandText))
      setLastResult(result)
      await refreshDashboard(adminSession)
    } catch (runError) {
      setError(runError.message)
    } finally {
      setCommandBusy(false)
    }
  }, [adminSession, commandText, refreshDashboard])

  const handleSaveFile = useCallback(
    async (targetPath, contents) => {
      try {
        setError('')
        setEditorBusy(true)
        const result = await sendCommand(adminSession, {
          action: 'edit_workspace_file',
          targetPath,
          contents,
          autoDeploy: false
        })
        setLastResult(result)
        await refreshDashboard(adminSession)
      } catch (saveError) {
        setError(saveError.message)
      } finally {
        setEditorBusy(false)
      }
    },
    [adminSession, refreshDashboard]
  )

  const handleDeploy = useCallback(async () => {
    try {
      setError('')
      setDeployBusy(true)
      const result = await sendCommand(adminSession, {
        action: 'deploy_site',
        message: 'Admin-triggered deploy'
      })
      setLastResult(result)
      await refreshDashboard(adminSession)
    } catch (deployError) {
      setError(deployError.message)
    } finally {
      setDeployBusy(false)
    }
  }, [adminSession, refreshDashboard])

  const handleRefresh = useCallback(async () => {
    try {
      setError('')
      await refreshDashboard(adminSession)
    } catch (connectError) {
      setError(connectError.message)
    }
  }, [adminSession, refreshDashboard])

  const handleDiscoverTopics = useCallback(async () => {
    try {
      setError('')
      setTrafficBusy(true)
      const result = await sendCommand(adminSession, {
        action: 'discover_topics',
        limit: 6
      })
      setLastResult(result)
      await refreshDashboard(adminSession)
    } catch (trafficError) {
      setError(trafficError.message)
    } finally {
      setTrafficBusy(false)
    }
  }, [adminSession, refreshDashboard])

  const handleRunTrafficCycle = useCallback(async () => {
    try {
      setError('')
      setTrafficBusy(true)
      const result = await sendCommand(adminSession, {
        action: 'run_traffic_cycle',
        count: 2,
        includeImages: true,
        autoDeploy: false
      })
      setLastResult(result)
      await refreshDashboard(adminSession)
    } catch (trafficError) {
      setError(trafficError.message)
    } finally {
      setTrafficBusy(false)
    }
  }, [adminSession, refreshDashboard])

  const handleSignOut = useCallback(() => {
    clearAdminSession()
    navigate('/admin/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      adminSession,
      initialLoadDone,
      commandText,
      setCommandText,
      analytics,
      deployments,
      contentBundle,
      commandBusy,
      editorBusy,
      deployBusy,
      trafficBusy,
      lastResult,
      error,
      setError,
      refreshDashboard: handleRefresh,
      handleRunCommand,
      handleSaveFile,
      handleDeploy,
      handleDiscoverTopics,
      handleRunTrafficCycle,
      handleSignOut
    }),
    [
      adminSession,
      initialLoadDone,
      commandText,
      analytics,
      deployments,
      contentBundle,
      commandBusy,
      editorBusy,
      deployBusy,
      trafficBusy,
      lastResult,
      error,
      handleRefresh,
      handleRunCommand,
      handleSaveFile,
      handleDeploy,
      handleDiscoverTopics,
      handleRunTrafficCycle,
      handleSignOut
    ]
  )

  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>
}

export function useAdminDashboard() {
  const ctx = useContext(AdminDashboardContext)
  if (!ctx) {
    throw new Error('useAdminDashboard must be used inside AdminDashboardProvider')
  }
  return ctx
}
