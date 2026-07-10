import { useEffect, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface GoogleId {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}
const getGoogle = () => (window as unknown as { google?: GoogleId }).google

let scriptPromise: Promise<void> | null = null
function loadGis(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (getGoogle()?.accounts?.id) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Không tải được Google script'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export default function GoogleLoginButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const cbRef = useRef(onCredential)
  cbRef.current = onCredential

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    void loadGis().then(() => {
      const google = getGoogle()
      if (cancelled || !ref.current || !google) return
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => cbRef.current(resp.credential),
      })
      google.accounts.id.renderButton(ref.current, {
        theme: 'outline', size: 'large', width: 360, text: 'continue_with', shape: 'pill',
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!CLIENT_ID) {
    return (
      <div className="google-hint">
        Chưa cấu hình <code>VITE_GOOGLE_CLIENT_ID</code> — đăng nhập Google tạm ẩn.
      </div>
    )
  }
  return <div className="google-btn" ref={ref} />
}
