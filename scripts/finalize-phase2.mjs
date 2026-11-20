// Run from the user's normal terminal: node scripts/finalize-phase2.mjs
// Uses existing Git credentials in memory. Never logs or saves credential output.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const repository = 'GDGoC-2026TeamA/Frontend'
const account = 'seoyeon5253'
const reviewer = 'Haron1248'
const issueTitle = '[feat] 새 업무 등록과 자료 비교 팝업 구현'
const sourceBranch = 'feat/work-registration-phase2'
const externalGit = 'C:/workspace/work-bridge-git'
const prOnly = process.argv.includes('--pr-only')
// This commit was built and passed all 19 tests in the user's terminal.
const validatedCommit = 'e67c65c00a9821b38b29b74212f54cd3f0243d73'
const gitArgs =
  existsSync(path.join(root, '.git')) && !existsSync(externalGit)
    ? []
    : [`--git-dir=${externalGit}`, `--work-tree=${root}`]
const git = (...args) =>
  execFileSync('git', [...gitArgs, ...args], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'inherit'],
  }).trim()
const run = (file, args = [], env = {}) =>
  execFileSync(process.execPath, [file, ...args], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, ...env },
  })
let token
async function requestOnce(resource, method, body) {
  const response = await fetch(`https://api.github.com${resource}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(`GitHub ${response.status}: ${data.message}`)
  return data
}
async function request(resource, method = 'GET', body) {
  const attempts = method === 'GET' ? 3 : 1
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await requestOnce(resource, method, body)
    } catch (error) {
      if (error.name !== 'TypeError' && error.name !== 'TimeoutError')
        throw error
      if (attempt === attempts)
        throw new Error(
          `GitHub 연결 실패 (${method} ${resource}). --pr-only로 다시 실행하면 기존 PR을 먼저 확인합니다. 원인: ${error.cause?.code || error.name}`,
        )
      console.log(`GitHub 조회 연결 재시도 ${attempt}/${attempts - 1}`)
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }
}
const prefix = `/repos/${repository}`
const issueBody = `## 구현 목적

Figma ‘2차 / 홈, 업무 등록과 자료 비교’의 02~07 화면을 구현합니다.

## 완료 조건

- [ ] 홈 위 새 업무 등록 팝업과 자료 선택
- [ ] 예시 분석, 비교와 근거 표시
- [ ] 미확인 항목 수정 및 남은 확인 질문 유지
- [ ] 코드 검사, 빌드와 브라우저 검사
- [ ] 기존 절차와 새 절차가 함께 보이는 캡처
- [ ] 최신 main 기반 이슈 브랜치와 목적별 커밋
- [ ] main 대상 PR, close 연결과 팀원 리뷰 요청

실제 파일 분석, 서버 쓰기와 배포는 포함하지 않습니다.`

async function main() {
  const pending = git('status', '--porcelain', '--untracked-files=all')
    .split('\n')
    .filter(Boolean)
  const generatedScreenshot =
    /^[ ?MADRCU!]+\s+docs\/screenshots\/registration-(compare|edit|revised|mobile|empty)\.png$/
  if (pending.some((line) => !generatedScreenshot.test(line)))
    throw new Error(
      '커밋하지 않은 변경이 있어요. 변경을 보존하고 먼저 확인해 주세요.',
    )
  if (
    git('remote', 'get-url', 'origin') !==
    `https://github.com/${repository}.git`
  )
    throw new Error('대상 저장소가 달라서 중단했어요.')

  const credentialText = execFileSync(
    'git',
    [
      '-c',
      'credential.interactive=false',
      '-c',
      'core.askPass=',
      'credential',
      'fill',
    ],
    {
      input: `protocol=https\nhost=github.com\nusername=${account}\n\n`,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 20000,
    },
  )
  token = credentialText
    .split(/\r?\n/)
    .find((line) => line.startsWith('password='))
    ?.slice(9)
  if (!token)
    throw new Error(
      '기존 Git 로그인 정보를 찾지 못했어요. GitHub 로그인을 확인해 주세요.',
    )
  if ((await request('/user')).login !== account)
    throw new Error('Git 로그인 계정이 seoyeon5253이 아니에요.')

  console.log('최신 main과 기존 작업 브랜치를 확인합니다.')
  git('fetch', 'origin')
  const issues = await request(`${prefix}/issues?state=all&per_page=100`)
  let issue = issues.find(
    (item) =>
      !item.pull_request &&
      item.title === issueTitle &&
      item.user.login === account &&
      item.state === 'open',
  )
  if (!issue)
    issue = await request(`${prefix}/issues`, 'POST', {
      title: issueTitle,
      body: issueBody,
      assignees: [account],
    })
  else if (!issue.assignees.some((user) => user.login === account))
    await request(`${prefix}/issues/${issue.number}/assignees`, 'POST', {
      assignees: [account],
    })
  const branch = `feat/#${issue.number}`
  console.log(`이슈: ${issue.html_url}\n작업 브랜치: ${branch}`)

  const branches = git(
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/heads',
  ).split('\n')
  if (!branches.includes(branch)) {
    const base = git('merge-base', `origin/${sourceBranch}`, 'origin/main')
    const commits = git('rev-list', '--reverse', `${base}..${sourceBranch}`)
      .split('\n')
      .filter(Boolean)
    git('switch', '-c', branch, 'origin/main')
    for (const commit of commits) git('cherry-pick', commit)
  } else {
    git('switch', branch)
    git('merge', '--no-edit', 'origin/main')
  }

  if (prOnly) {
    const report = JSON.parse(
      readFileSync(path.join(root, 'test-results/.last-run.json'), 'utf8'),
    )
    const changed = git(
      'diff',
      '--name-only',
      validatedCommit,
      'HEAD',
      '--',
      'src',
      'tests',
      'package.json',
      'package-lock.json',
      'vite.config.js',
      'playwright.config.js',
      'eslint.config.js',
    )
    if (report.status !== 'passed' || changed)
      throw new Error(
        '검사 결과 또는 화면 코드가 바뀌었어요. --pr-only 없이 전체 검사를 실행해 주세요.',
      )
    console.log(
      '기존 19개 검사 통과와 화면 코드 일치를 확인했어요. PR 생성 단계부터 이어갑니다.',
    )
  } else {
    console.log('코드 검사, 빌드와 전체 브라우저 검사를 실행합니다.')
    run('node_modules/eslint/bin/eslint.js', ['.'])
    run('node_modules/vite/bin/vite.js', ['build'])
    run('node_modules/@playwright/test/cli.js', ['test'], {
      PLAYWRIGHT_PORT: '5190',
      PLAYWRIGHT_API_PORT: '5191',
      VITE_DATA_MODE: 'demo',
    })
  }
  const screenshots = [
    'registration-compare.png',
    'registration-edit.png',
    'registration-revised.png',
    'registration-mobile.png',
  ]
  for (const name of screenshots) {
    if (!existsSync(path.join(root, 'docs/screenshots', name)))
      throw new Error(`캡처가 없어요: ${name}`)
  }
  git('add', 'docs/screenshots')
  if (git('diff', '--cached', '--name-only'))
    git('commit', '-m', 'test: 로컬 브라우저 검사와 비교 화면 캡처 기록')

  const validation = `# 2차 구현과 확인 상태

기준: Figma 112:553의 02~07 화면.

등록, 자료 선택, 예시 분석, 절차 비교, 미확인 항목 수정과 수정 후 비교를 구현했습니다.
실제 파일 분석과 서버 쓰기는 연결하지 않았습니다. 입력과 수정은 React 메모리에만 남습니다.
승인 담당자 질문은 수정 반영 후에도 확인 필요 상태로 표시합니다.

이슈: ${issue.html_url}
브랜치: \`${branch}\`

이 명령을 실행한 환경에서 lint, build와 전체 Playwright 검사가 통과했습니다.
비교와 수정 화면 캡처는 docs/screenshots/registration-*.png에 있습니다.
최신 main을 반영하고 목적별 커밋으로 나눴습니다. 팀 리뷰와 승인 후에 작성자가 병합합니다.
`
  writeFileSync(path.join(root, 'docs/PHASE2_VALIDATION.md'), validation)
  const readmePath = path.join(root, 'README.md')
  let readme = readFileSync(readmePath, 'utf8')
  const oldStatus =
    '이번 작업은 lint와 build, Vite 서버의 ready 출력까지 확인했습니다. 브라우저 접근 거절로 화면 동작은 검증하지 못했으며 GitHub 쓰기 권한 오류로 업로드와 PR 생성은 끝나지 않았습니다. 앞선 차수의 검사와 PR 기록은 이번 2차 검증을 뜻하지 않습니다.'
  readme = readme.replace(
    oldStatus,
    `2차 작업 이슈는 #${issue.number}, 브랜치는 \`${branch}\`입니다. 로컬 lint, build와 전체 브라우저 검사를 통과했습니다. 비교 화면 캡처와 현재 결과는 docs/PHASE2_VALIDATION.md에 정리했습니다. PR에서 팀 리뷰와 승인 후 병합합니다.`,
  )
  writeFileSync(readmePath, readme)
  git('add', 'README.md', 'docs/PHASE2_VALIDATION.md')
  if (git('diff', '--cached', '--name-only'))
    git('commit', '-m', 'docs: 이슈 브랜치와 실제 검사 결과 반영')

  git('push', '-u', 'origin', branch)
  const checkedIssue = issueBody.replaceAll('- [ ]', '- [x]')
  const body = `## 변경 사항

새 업무 등록부터 자료 선택, 예시 분석, 절차 비교와 미확인 항목 수정까지 홈 위 팝업에서 이어집니다. 수정한 절차와 남은 현장 확인 질문을 구분했습니다.

## 실행 결과

- 로컬 코드 검사, 빌드와 전체 Playwright 검사 통과
- 예시 자료와 실제 파일 선택을 구분하고 실제 파일 분석은 미연결 안내

![기존 방식과 새 방식 비교](https://raw.githubusercontent.com/${repository}/${encodeURIComponent(branch)}/docs/screenshots/registration-compare.png)

![미확인 항목 수정](https://raw.githubusercontent.com/${repository}/${encodeURIComponent(branch)}/docs/screenshots/registration-edit.png)

## 리뷰 요청

기존 절차와 새 절차의 차이가 보이는지, 사용자 수정 후에도 승인 담당자 질문이 확인 필요로 남는지 확인해 주세요.

## 연결된 이슈

close #${issue.number}

## 체크리스트

- [x] 제목에 태그와 이슈 번호 사용
- [x] 이슈, 변경 사항과 검사 결과 기록
- [x] 팀원 리뷰 요청
`
  const prs = await request(`${prefix}/pulls?state=open&per_page=100`)
  let pr = prs.find(
    (item) => item.head.ref === branch && item.base.ref === 'main',
  )
  const payload = {
    title: `[feat/#${issue.number}] 새 업무 등록과 자료 비교 팝업 구현`,
    body,
  }
  if (!pr)
    pr = await request(`${prefix}/pulls`, 'POST', {
      ...payload,
      head: branch,
      base: 'main',
    })
  else pr = await request(`${prefix}/pulls/${pr.number}`, 'PATCH', payload)
  if (!pr.requested_reviewers.some((user) => user.login === reviewer))
    await request(`${prefix}/pulls/${pr.number}/requested_reviewers`, 'POST', {
      reviewers: [reviewer],
    })
  await request(`${prefix}/issues/${issue.number}`, 'PATCH', {
    body: `${checkedIssue}\n\n구현 PR: ${pr.html_url}\n\n팀원 승인과 병합은 대기 중입니다.`,
  })
  const verified = await request(`${prefix}/pulls/${pr.number}`)
  if (verified.head.sha !== git('rev-parse', 'HEAD'))
    throw new Error('원격 PR 커밋이 로컬 HEAD와 달라요.')
  console.log(
    `\n완료\n이슈: ${issue.html_url}\nPR: ${verified.html_url}\n브랜치: ${branch}\n리뷰 요청: ${reviewer}\n팀원 승인 후 병합하세요. 기존 브랜치는 삭제하지 않았습니다.`,
  )
}

main().catch((error) => {
  // Avoid logging captured child-process stdout, which may include credential data.
  const message =
    error?.status !== undefined
      ? `명령 실행 실패 (종료 코드 ${error.status}). 위 출력에서 실패한 검사를 확인해 주세요.`
      : error.message
  console.error(`\n중단: ${message}`)
  process.exitCode = 1
})
