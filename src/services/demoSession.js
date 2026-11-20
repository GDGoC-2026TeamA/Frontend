// This is a frontend example session, never proof of server authentication.
export const DEMO_SESSION_KEY = 'workbridge.demo.session.v1'
export const DEMO_SESSION_TTL = 8 * 60 * 60 * 1000
export function readExampleSession(storage, now = Date.now()) {
  try {
    const session = JSON.parse(storage.getItem(DEMO_SESSION_KEY))
    if (
      session?.version !== 1 ||
      typeof session.user?.id !== 'string' ||
      !session.user.id ||
      typeof session.user.name !== 'string' ||
      typeof session.user.email !== 'string' ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= now ||
      session.expiresAt > now + DEMO_SESSION_TTL
    ) {
      storage.removeItem(DEMO_SESSION_KEY)
      return null
    }
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      expiresAt: session.expiresAt,
      exampleWorkspace: session.exampleWorkspace === true,
    }
  } catch {
    try {
      storage.removeItem(DEMO_SESSION_KEY)
    } catch {
      /* storage unavailable */
    }
    return null
  }
}
export function writeExampleSession(storage, user, expiresAt) {
  storage.setItem(
    DEMO_SESSION_KEY,
    JSON.stringify({
      version: 1,
      user: { id: user.id, name: user.name, email: user.email },
      expiresAt,
    }),
  )
}
