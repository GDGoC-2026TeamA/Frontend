import { test as base, expect } from '@playwright/test'

// Workspace regression tests start with an explicitly authenticated example.
// Production code has no test flag or bypass. New entry/session tests use base test.
export const test = base.extend({
  page: async ({ page }, providePage) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('workbridge.demo.session.v1'))
        sessionStorage.setItem(
          'workbridge.demo.session.v1',
          JSON.stringify({
            version: 1,
            user: {
              id: 'workspace-fixture',
              name: '이서연',
              email: 'name@example.com',
            },
            expiresAt: Date.now() + 60 * 60 * 1000,
            exampleWorkspace: true,
          }),
        )
    })
    await page.route('**/__test/session', (route) =>
      route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin':
            route.request().headers().origin || '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'server-fixture',
            name: '서버 사용자',
            email: 'server@example.com',
          },
        }),
      }),
    )
    await providePage(page)
  },
})
export { expect }
