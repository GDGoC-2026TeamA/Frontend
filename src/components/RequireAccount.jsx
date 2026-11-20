import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { StatePanel } from './ui'
import { restoreServerSession, useAccount } from '../services/accountService'

export function RequireAccount() {
  const account = useAccount()
  const location = useLocation()
  useEffect(() => {
    if (account.status === 'unchecked') restoreServerSession()
  }, [account.status])
  if (account.status === 'unchecked' || account.status === 'checking')
    return (
      <main className="auth-page">
        <StatePanel
          type="loading"
          title="로그인 상태를 확인하고 있어요"
          description="작업 공간을 열기 전에 계정을 확인해요."
        />
      </main>
    )
  if (account.status === 'error')
    return (
      <main className="auth-page">
        <StatePanel
          type="error"
          title="계정을 불러오지 못했어요"
          description={account.error}
          actionLabel="다시 시도"
          onAction={restoreServerSession}
        />
      </main>
    )
  if (!account.user)
    return (
      <Navigate
        to={account.signedOut ? '/login' : '/signup'}
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    )
  return <Outlet />
}
