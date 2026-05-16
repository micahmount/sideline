import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  const handleBeforeInstall = useCallback((e: Event) => {
    e.preventDefault()
    setDeferredPrompt(e as BeforeInstallPromptEvent)
  }, [])

  const handleAppInstalled = useCallback(() => {
    setDeferredPrompt(null)
    setInstalled(true)
  }, [])

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [handleBeforeInstall, handleAppInstalled])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }, [deferredPrompt])

  if (!deferredPrompt || installed) return null

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 active:scale-95"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2a8 8 0 0 0-8 8v4.67l-1.4 1.4A1.5 1.5 0 0 0 3.5 18h17a1.5 1.5 0 0 0 1.07-2.57l-1.4-1.4V10a8 8 0 0 0-8-8z" />
        <path d="M9 18a3 3 0 0 0 6 0H9z" />
      </svg>
      Install App
    </button>
  )
}
