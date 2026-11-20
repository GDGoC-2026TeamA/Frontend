import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Modal } from './ui'
import { expireAccount, useAccount } from '../services/accountService'

export function AccountSession() {
  const [expired, setExpired] = useState(false)
  const account = useAccount()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const handler = () => {
      expireAccount()
      setExpired(true)
    }
    window.addEventListener('workbridge:session-expired', handler)
    return () =>
      window.removeEventListener('workbridge:session-expired', handler)
  }, [])
  useEffect(() => {
    if (
      account.signedOut &&
      !/^\/(login|signup|forgot-password|reset|verify-email|auth)/.test(
        location.pathname,
      )
    )
      navigate('/login', { replace: true })
  }, [account.signedOut, location.pathname, navigate])
  return (
    <Modal
      open={expired}
      title="다시 로그인해 주세요"
      onClose={() => {
        setExpired(false)
        navigate('/login', { state: { returnTo: location.pathname } })
      }}
      footer={
        <Button
          onClick={() => {
            setExpired(false)
            navigate('/login', { state: { returnTo: location.pathname } })
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
