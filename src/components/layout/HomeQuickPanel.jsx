// Shared right column; home content is supplied by the page.
export function HomeQuickPanel({ children }) {
  return (
    <aside className="home-quick-panel" aria-label="빠른 확인">
      {children || (
        <>
          <section
            className="home-quick-panel__section"
            aria-labelledby="home-continue-title"
          >
            <h2 id="home-continue-title">이어서 할 일</h2>
            <p className="home-quick-panel__placeholder">
              이어서 할 작업이 이곳에 표시될 예정이에요.
            </p>
          </section>
          <section
            className="home-quick-panel__section"
            aria-labelledby="home-cards-title"
          >
            <h2 id="home-cards-title">개인 업무 카드</h2>
            <p className="home-quick-panel__placeholder">
              저장한 처리 절차가 이곳에 표시될 예정이에요.
            </p>
          </section>
          <section
            className="home-quick-panel__assistant"
            aria-labelledby="home-assistant-title"
          >
            <h3 id="home-assistant-title">업무 도우미</h3>
            <p>
              업무를 선택하고 등록된 자료를 바탕으로 질문할 수 있도록 준비하고
              있어요.
            </p>
          </section>
        </>
      )}
    </aside>
  )
}
