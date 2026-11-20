import {
  learningQuestions,
  learningTopics,
  learningEvidence,
} from '../data/learning.js'
import { registrationExample } from '../data/registration.js'

// The snapshot belongs to the learning attempt, not the mutable current task.
export function createLearningSnapshot(task) {
  if (!task) return null
  const publicBaseline = task.publishedSnapshot
  const comparison = publicBaseline?.comparison || task.comparison
  if (!comparison) return null
  // Fixtures can only grade the matching, documented inventory example.
  if (
    JSON.stringify(comparison.rows) !==
      JSON.stringify(registrationExample.rows) ||
    JSON.stringify(comparison.materials) !==
      JSON.stringify(registrationExample.materials)
  )
    return null
  const procedure =
    publicBaseline?.procedure || task.saved?.procedure || comparison.procedure
  const exceptionConfirmed = procedure === registrationExample.procedure
  return structuredClone({
    mode: 'demo',
    taskId: task.id || `preview-${crypto.randomUUID()}`,
    taskName: task.name,
    scope: task.scope === 'shared' ? 'shared' : 'personal',
    owner: task.owner || '이서연',
    version: publicBaseline?.version || task.version || 1,
    analysisId: publicBaseline?.analysisId || task.analysisId || '예시 분석',
    comparison,
    procedure,
    pendingQuestion:
      publicBaseline?.question ||
      task.saved?.question ||
      registrationExample.question,
    confirmedTopicIds: exceptionConfirmed ? ['entry', 'exception'] : ['entry'],
  })
}

export function questionsForTopics(snapshot, topicIds) {
  const allowed = new Set(snapshot.confirmedTopicIds)
  const selected = new Set(topicIds.filter((id) => allowed.has(id)))
  return structuredClone(
    learningQuestions.filter((question) => selected.has(question.topicId)),
  )
}

export function gradeLearning(questions, answers) {
  return questions.map((question) => {
    const chosen = [...new Set(answers[question.id]?.values || [])].sort()
    const expected = [...question.correct].sort()
    return {
      questionId: question.id,
      correct: JSON.stringify(chosen) === JSON.stringify(expected),
      values: chosen,
      reason: answers[question.id]?.reason || '',
      explanation: question.explanation,
      evidenceId: question.evidenceId,
    }
  })
}

export function demoLearningAnswer(snapshot, question) {
  const normalized = question.trim().replace(/[?？\s]/g, '')
  if (
    ['전표와실제수량이다르면', '수량이다를때어떻게처리할까요'].includes(
      normalized,
    ) &&
    snapshot.confirmedTopicIds.includes('exception')
  ) {
    return {
      answer:
        '실제 입고 수량을 입력해요. 전표와 차이가 나면 차이 사유를 남겨요. 승인 담당자는 올린 자료에서 확인되지 않아요.',
      sources: [learningEvidence.exception],
      needsReview: true,
    }
  }
  if (
    ['입고시무엇을먼저확인해', '입고등록은어떤순서로하나요'].includes(
      normalized,
    )
  ) {
    return {
      answer:
        '품목 코드로 품목을 찾고 실제 입고 수량을 입력한 뒤 전표와 대조해요.',
      sources: [learningEvidence.entry],
      needsReview: false,
    }
  }
  return {
    answer:
      '등록한 예시 근거만으로 이 질문에 답할 수 없어요. 승인 담당자와 별도 승인 절차는 확인이 필요해요.',
    sources: [],
    needsReview: true,
  }
}

export { learningTopics, learningEvidence }
