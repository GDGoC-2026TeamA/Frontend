import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Modal } from './ui'
import {
  demoAccounts,
  expireAccount,
  restoreServerSession,
  useAccount,
} from '../services/accountService'
import { readExampleSession } from '../services/demoSession'

export function AccountSession() {
  const [expired, setExpired] = useState(false)
  const account = useAccount()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = useRef('/')
  useEffect(() => {
    const handler = () => {
      returnTo.current = location.pathname + location.search
      expireAccount()
      setExpired(true)
    }
    window.addEventListener('workbridge:session-expired', handler)
    return () =>
      window.removeEventListener('workbridge:session-expired', handler)
  }, [location.pathname, location.search])
  useEffect(() => {
    if (!account.expiresAt || !account.user) return
    const expire = () =>
      window.dispatchEvent(new Event('workbridge:session-expired'))
    const remaining = account.expiresAt - Date.now()
    if (remaining <= 0) {
      expire()
      return
    }
    const timer = setTimeout(expire, remaining)
    const check = () => {
      let stored = null
      try {
        stored = readExampleSession(sessionStorage)
      } catch {
        /* inaccessible storage expires the example session */
      }
      if (
        Date.now() >= account.expiresAt ||
        stored?.user.id !== account.user.id
      )
        expire()
    }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('pageshow', check)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('pageshow', check)
    }
  }, [account.expiresAt, account.user])
  useEffect(() => {
    if (demoAccounts) return
    const recheck = (event) => {
      if (event.persisted) restoreServerSession()
    }
    window.addEventListener('pageshow', recheck)
    return () => window.removeEventListener('pageshow', recheck)
  }, [])
  return (
    <Modal
      open={expired}
      title="다시 로그인해 주세요"
      onClose={() => {
        setExpired(false)
        navigate('/login', { state: { returnTo: returnTo.current } })
      }}
      footer={
        <Button
          onClick={() => {
            setExpired(false)
            navigate('/login', { state: { returnTo: returnTo.current } })
          }}
        >
          다시 로그인
        </Button>
      }
    >
      <p>
        로그인 시간이 지나 연결이 끊겼어요. 로그인하면 내 작업 공간을 다시 열 수
        있어요.
      </p>
    </Modal>
  )
}
