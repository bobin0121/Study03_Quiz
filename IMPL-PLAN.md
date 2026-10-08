<!-- 생성: 2026-10-08 12:31 KST -->

# 상식 퀴즈 웹 앱 구현 계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PRD.md의 4지선다 상식 퀴즈 웹 앱(연습, 스피드, 힌트 모드와 순위표)을 3단계로 나눠 만든다.

**Architecture:** 서버 없이 `index.html`을 더블클릭해 여는 정적 앱이다. 화면은 `index.html`에 `<section>`으로 미리 두고 `hidden`으로 전환한다. `script.js`는 DOM을 건드리지 않는 순수 로직, 상태 객체 하나, 화면 조작, 자체 점검, 시작 코드의 다섯 덩어리로 나눈다.

**Tech Stack:** HTML, CSS, 바닐라 자바스크립트(ES 모듈 없음, 외부 라이브러리 없음), `localStorage`, 점검용 Node.js

**Spec:** `PRD.md` (실행자는 이 계획과 PRD를 함께 읽는다.)

## 진행 규칙

- **단계가 끝날 때마다 멈춘다.** 각 단계의 마지막 태스크를 마치면 작업을 멈추고, 그 단계의 "브라우저에서 직접 확인할 항목"을 사람에게 알린다. 사람이 확인하고 다음 단계를 지시하기 전에는 다음 단계를 시작하지 않는다.
- **계획과 다르게 정할 일이 생기면** 정한 내용과 이유를 단계 완료 보고에 적는다.
- **태스크 마무리:** 태스크 끝에 점검 명령을 실행하고, 통과하면 그 태스크에서 바꾼 파일을 커밋한다. 커밋 메시지는 `Task N: 태스크 이름` 형식이다.
- **점검 명령** (프로젝트 폴더에서 실행, 마지막 줄이 `실패 0`이어야 통과):

  ```bash
  node -e "const fs=require('fs');eval(fs.readFileSync('questions.js','utf8')+'\n'+fs.readFileSync('script.js','utf8'))"
  ```

  `questions.js`와 `script.js`를 한 덩어리로 실행한다. `script.js`는 브라우저가 아니면(`document`가 없으면) 자체 점검만 돌리고 결과를 출력한다. 실패가 있으면 종료 코드가 1이다.

## Global Constraints

- 앱 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개뿐이다. 테스트 폴더, 점검 스크립트 파일, 빌드 도구, 외부 라이브러리를 더하지 않는다.
- `file://`로 열어도 동작해야 한다. `import`, `fetch()`, JSON 파일을 쓰지 않는다. `index.html`은 `questions.js`를 `script.js`보다 먼저 일반 `<script>`로 불러온다.
- 휴대폰 폭(360px)부터 PC까지 가로 스크롤 없이 보여야 한다.
- 화면 문구는 PRD의 문구를 그대로 쓴다: "순위표에 기록되지 않음", "정답!", "오답", "시간 초과", "문항 데이터 오류", "기록을 저장할 수 없음", "기록 없음", "다시 풀기", 버튼 [다음], [결과 보기], [같은 모드 다시], [처음으로], [뒤로], [힌트 (오답 2개 지우기)], [힌트 사용함], [틀린 문제 다시 풀기], [기록 저장], [순위표 보기].
- 한국어 문구 규칙: 단순 열거에 가운뎃점(·)을 쓰지 않고 쉼표를 쓴다. 완결된 문장인 안내와 오류 문구는 마침표로 끝내고, 버튼과 제목 같은 짧은 라벨에는 붙이지 않는다. 보조용언은 띄어 쓴다.
- 새로 만드는 파일 첫머리에 생성 일시를 주석으로 남긴다. 일시는 `date "+%Y-%m-%d %H:%M"`로 확인하고 `2026-10-08 12:31 KST` 형식으로 쓴다. HTML은 `<!doctype html>` 다음 줄에 `<!-- -->`, CSS는 `/* */`, JS는 `//`.
- 사람이 입력한 이름과 문항 문장은 화면에 `textContent`로만 넣는다(`innerHTML` 금지).

## Review Focus

자동 점검(순수 로직)으로 잡히지 않는 실패 가운데, 쓰는 사람이 가장 먼저 겪을 만한 다섯 가지다. 각 줄의 확인은 해당 태스크의 브라우저 확인 항목이나 자체 점검에 넣어 두었다.

1. **스피드 모드에서 0초 직전에 답을 고름**: 답 처리와 시간 초과 처리가 둘 다 일어나면 안 된다. 답을 고르면 먼저 타이머를 멈춘다(Task 10, 2단계 확인 6, 7).
2. **스피드 판 도중이나 끝난 뒤 새 판을 시작함**: 타이머가 겹쳐 1초에 2씩 줄면 안 된다. 화면을 바꿀 때마다 `stopTimer()`를 부른다(Task 10, 2단계 확인 8).
3. **이름에 `<b>홍</b>` 같은 태그를 입력함**: 태그가 해석되지 않고 글자 그대로 보여야 한다(Task 15, 3단계 확인 4).
4. **`localStorage`에 깨진 값이 들어 있음**: 앱이 멈추지 않고 빈 순위표로 시작해야 한다(Task 14 자체 점검 19번).
5. **힌트를 여러 번 쓰고 맞힘**: 점수가 7.5처럼 0.5 단위로 정확히 보여야 하고, 0.49999 같은 값이 나오면 안 된다. 0.5는 이진수로 정확히 표현되므로 더하기만 쓴다(Task 11 자체 점검 13번, 2단계 확인 13).

---

## 파일 구조

| 파일 | 맡는 일 |
|---|---|
| `index.html` | 화면 `<section>` 5개: 시작(`screen-start`), 모드 선택(`screen-mode`, 2단계), 문제(`screen-quiz`), 결과(`screen-result`), 순위표(`screen-board`, 3단계) |
| `style.css` | 레이아웃, 정답과 오답 색, 흐리게 표시한 보기, 순위표 표, 360px 대응 |
| `questions.js` | 전역 상수 `QUESTIONS` 하나(40문항) |
| `script.js` | 1. 순수 로직, 2. 상태, 3. 화면 조작, 4. 자체 점검, 5. 시작 |

`script.js`의 다섯 덩어리는 `// ===== 1. 순수 로직 =====` 같은 구분 주석으로 나눈다. 태스크마다 "어느 덩어리의 끝에 넣는지"를 적는다.

## 자체 점검 번호표

| 번호 | 점검 | 태스크 |
|---|---|---|
| 1~3 | `shuffle` 길이 유지, 원소 유지, 원본 불변 | 2 |
| 4~7 | `validateQuestions` 정상 데이터 통과, 카테고리 개수 오류, 보기 중복, https 아닌 URL | 3 |
| 8~10 | `buildRound` 카테고리 10문항, 정답 위치, 보기 집합 유지 | 4 |
| 11 | `scoreAnswer` 맞힘 1, 틀림 0 | 4 |
| 12 | 실제 `QUESTIONS`가 `validateQuestions` 통과 | 6 |
| 13 | `scoreAnswer` 힌트 쓰고 맞힘 0.5, 힌트 쓰고 틀림 0 | 11 |
| 14~15 | `pickHintRemovals` 서로 다른 2개, 정답은 고르지 않음 | 11 |
| 16~18 | `insertRecord` 점수 내림차순, 동점이면 먼저 세운 기록 위, 5건만 남김 | 14 |
| 19 | `parseLeaderboard` 깨진 값이면 빈 객체 | 14 |

1단계를 마치면 `통과 12, 실패 0`, 2단계는 `통과 15, 실패 0`, 3단계는 `통과 19, 실패 0`이다.

---

# 1단계: 연습 모드와 점수 (Task 1~8)

**만들 것:** 시작 화면(카테고리 버튼 4개), 연습 모드 문제 화면, 결과 화면, 문항 40개, 자체 점검. 모드 선택 화면과 틀린 문제 다시 풀기는 아직 만들지 않는다.

**완료 기준 (클로드가 점검):**
- 점검 명령의 결과가 `자체 점검 결과: 통과 12, 실패 0`이다.
- `validateQuestions(QUESTIONS)`가 빈 배열을 돌려준다(40문항, 카테고리마다 10개, 보기 4개 중복 없음, `answer` 0~3, 필수 항목, https 출처, id 중복 없음).
- 40문항 모두 PRD 4.3의 검수 체크리스트를 통과하고, 문항 검수표를 완료 보고에 붙인다.
- 해설이 모두 60자 이내다.

### Task 1: 파일 뼈대와 자체 점검 틀

**Files:**
- Create: `index.html`, `style.css`, `questions.js`, `script.js`

**Interfaces:**
- Produces: `CATEGORIES`, `QUESTIONS_PER_CATEGORY`, `$`, `showScreen(id)`, `init()`, `check(name, fn)`, `runSelfTests()`

- [ ] **Step 1: 생성 일시 확인**

Run: `date "+%Y-%m-%d %H:%M"`
아래 파일들의 `<생성 일시>` 자리에 이 값을 넣는다.

- [ ] **Step 2: `index.html` 작성**

```html
<!doctype html>
<!-- 생성: <생성 일시> KST -->
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="app">
    <section id="screen-start" class="screen">
      <h1>상식 퀴즈</h1>
      <p class="notice" id="start-notice">연습 모드 (순위표에 기록되지 않음)</p>
      <p class="error" id="data-error" hidden>문항 데이터 오류</p>
      <div class="category-list" id="category-list"></div>
    </section>

    <section id="screen-quiz" class="screen" hidden>
      <header class="quiz-head">
        <span class="badge" id="quiz-category"></span>
        <span class="badge" id="quiz-mode"></span>
        <span id="quiz-progress"></span>
        <span id="quiz-score"></span>
      </header>
      <p class="question" id="quiz-question"></p>
      <div class="choices" id="quiz-choices"></div>
      <div class="feedback" id="quiz-feedback" hidden>
        <p class="verdict" id="feedback-verdict"></p>
        <p class="explanation" id="feedback-explanation"></p>
        <p class="source">출처: <a id="feedback-source" target="_blank" rel="noopener noreferrer"></a></p>
        <button type="button" class="primary" id="next-button">다음</button>
      </div>
    </section>

    <section id="screen-result" class="screen" hidden>
      <h2 id="result-title">결과</h2>
      <p class="final-score" id="result-score"></p>
      <p class="notice" id="result-notice">순위표에 기록되지 않음</p>
      <ol class="result-list" id="result-list"></ol>
      <div class="actions">
        <button type="button" class="primary" id="again-button">같은 모드 다시</button>
        <button type="button" id="home-button">처음으로</button>
      </div>
    </section>
  </main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

상단의 카테고리와 모드는 "한국사 · 연습"처럼 가운뎃점으로 잇지 않고, 배지 두 개로 나눠 보여 준다(Global Constraints의 문구 규칙).

- [ ] **Step 3: `style.css` 작성**

```css
/* 생성: <생성 일시> KST */
:root {
  --bg: #f6f7fb;
  --card: #ffffff;
  --text: #1f2430;
  --muted: #5d6475;
  --line: #d9dde7;
  --primary: #2f5bd3;
  --correct: #1f8a4c;
  --correct-bg: #e3f5ea;
  --wrong: #c62f3a;
  --wrong-bg: #fbe5e7;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, "Malgun Gothic", sans-serif;
  line-height: 1.5;
}

.app { max-width: 640px; margin: 0 auto; padding: 16px; }
.screen { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 20px 16px; }
h1, h2 { margin: 0 0 12px; }

button {
  font: inherit;
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--text);
  cursor: pointer;
}
button:disabled { cursor: default; }
button.primary { background: var(--primary); border-color: var(--primary); color: #fff; }

.notice { color: var(--muted); }
.error { color: var(--wrong); font-weight: 600; }

.category-list, .choices { display: grid; gap: 8px; }

.quiz-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; color: var(--muted); margin-bottom: 12px; }
.badge { padding: 2px 8px; border-radius: 999px; background: var(--bg); border: 1px solid var(--line); }
.question { font-size: 1.15rem; font-weight: 600; overflow-wrap: anywhere; }

.choice { display: flex; justify-content: space-between; gap: 8px; text-align: left; overflow-wrap: anywhere; }
.choice.correct { background: var(--correct-bg); border-color: var(--correct); color: var(--correct); }
.choice.wrong { background: var(--wrong-bg); border-color: var(--wrong); color: var(--wrong); }
.mark { font-weight: 700; white-space: nowrap; }

.feedback { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 12px; }
.verdict { font-weight: 700; margin: 0 0 4px; }
.verdict.correct { color: var(--correct); }
.verdict.wrong { color: var(--wrong); }
.explanation, .source { margin: 4px 0; overflow-wrap: anywhere; }

.final-score { font-size: 2rem; font-weight: 700; margin: 8px 0; }
.result-list { padding-left: 20px; }
.result-list li { margin: 6px 0; overflow-wrap: anywhere; }
.result-list li.correct::marker { color: var(--correct); }
.result-list li.wrong::marker { color: var(--wrong); }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
```

- [ ] **Step 4: `questions.js` 작성 (빈 배열)**

```js
// 생성: <생성 일시> KST
// 문항 형식은 PRD 4.1, 규칙은 PRD 4.2를 따른다. 작성할 때 정답은 항상 choices[0], answer는 0이다.
const QUESTIONS = [
];
```

- [ ] **Step 5: `script.js` 작성 (뼈대와 자체 점검 틀)**

```js
// 생성: <생성 일시> KST
"use strict";

// ===== 1. 순수 로직 =====
const CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"];
const QUESTIONS_PER_CATEGORY = 10;

// ===== 2. 상태 =====

// ===== 3. 화면 조작 =====
const $ = (id) => document.getElementById(id);

function showScreen(id) {
  for (const section of document.querySelectorAll(".screen")) {
    section.hidden = section.id !== id;
  }
  window.scrollTo(0, 0);
}

function init() {
  showScreen("screen-start");
}

// ===== 4. 자체 점검 =====
const SELF_TESTS = [];

function check(name, fn) {
  SELF_TESTS.push({ name, fn });
}

function runSelfTests() {
  let passed = 0;
  let failed = 0;
  SELF_TESTS.forEach((test, i) => {
    const label = `${i + 1}. ${test.name}`;
    try {
      if (test.fn() === true) {
        passed += 1;
        console.log(`통과: ${label}`);
      } else {
        failed += 1;
        console.error(`실패: ${label}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`실패: ${label} (${error.message})`);
    }
  });
  console.log(`자체 점검 결과: 통과 ${passed}, 실패 ${failed}`);
  return failed;
}

// (자체 점검 항목은 이 아래에 check(...)로 추가한다.)

// ===== 5. 시작 =====
if (typeof document === "undefined") {
  // 점검 명령(Node)으로 실행한 경우: 자체 점검만 돌린다.
  process.exitCode = runSelfTests() === 0 ? 0 : 1;
} else {
  if (new URLSearchParams(location.search).has("test")) runSelfTests();
  init();
}
```

- [ ] **Step 6: 점검 명령 실행**

Run: 점검 명령
Expected: 마지막 줄 `자체 점검 결과: 통과 0, 실패 0`

### Task 2: `shuffle`

**Files:**
- Modify: `script.js` (1. 순수 로직 끝, 4. 자체 점검의 항목 자리)

**Interfaces:**
- Produces: `shuffle(array) → 새 배열` (원본은 바꾸지 않음)

- [ ] **Step 1: 자체 점검 1~3 추가 (실패 확인용)**

4. 자체 점검의 `// (자체 점검 항목은 ...)` 줄 아래에 넣는다.

```js
check("shuffle: 길이를 유지한다", () => shuffle([1, 2, 3, 4, 5]).length === 5);
check("shuffle: 원소를 그대로 가진다", () => shuffle([1, 2, 3, 4, 5]).slice().sort().join(",") === "1,2,3,4,5");
check("shuffle: 원본을 바꾸지 않는다", () => {
  const original = [1, 2, 3, 4, 5];
  shuffle(original);
  return original.join(",") === "1,2,3,4,5";
});
```

- [ ] **Step 2: 점검 명령 실행, 실패 확인**

Expected: `실패: 1. shuffle: ... (shuffle is not defined)` 등 3개 실패, 종료 코드 1

- [ ] **Step 3: `shuffle` 구현 (1. 순수 로직 끝)**

```js
function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
```

- [ ] **Step 4: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 3, 실패 0`

### Task 3: `validateQuestions`

**Files:**
- Modify: `script.js` (1. 순수 로직 끝, 4. 자체 점검)

**Interfaces:**
- Consumes: `CATEGORIES`, `QUESTIONS_PER_CATEGORY`
- Produces: `ID_PREFIX`, `validateQuestions(questions) → 문제 문장 배열(문제가 없으면 [])`, 점검용 `makeValidQuestions() → 올바른 40문항`

- [ ] **Step 1: 점검용 데이터와 자체 점검 4~7 추가 (4. 자체 점검, 3번 항목 아래)**

```js
// 점검용: 규칙에 맞는 가짜 40문항
function makeValidQuestions() {
  const list = [];
  for (const category of CATEGORIES) {
    for (let n = 1; n <= QUESTIONS_PER_CATEGORY; n++) {
      const id = `${ID_PREFIX[category]}-${String(n).padStart(2, "0")}`;
      list.push({
        id,
        category,
        question: `${id} 문제`,
        choices: [`${id} 정답`, `${id} 오답1`, `${id} 오답2`, `${id} 오답3`],
        answer: 0,
        explanation: "해설",
        source: { name: "출처", url: "https://example.com" },
      });
    }
  }
  return list;
}

check("validateQuestions: 규칙에 맞는 데이터는 문제가 없다", () => validateQuestions(makeValidQuestions()).length === 0);
check("validateQuestions: 한 카테고리가 11개면 잡는다", () => {
  const list = makeValidQuestions();
  list.push({ ...list[0], id: "kh-11" });
  return validateQuestions(list).length > 0;
});
check("validateQuestions: 보기가 중복되면 잡는다", () => {
  const list = makeValidQuestions();
  list[0].choices = ["가", "가", "나", "다"];
  return validateQuestions(list).length > 0;
});
check("validateQuestions: 출처 URL이 https가 아니면 잡는다", () => {
  const list = makeValidQuestions();
  list[0].source = { name: "출처", url: "http://example.com" };
  return validateQuestions(list).length > 0;
});
```

- [ ] **Step 2: 점검 명령 실행, 실패 확인**

Expected: 4~7번 실패(`ID_PREFIX is not defined` 또는 `validateQuestions is not defined`)

- [ ] **Step 3: 구현 (1. 순수 로직 끝)**

```js
const ID_PREFIX = { "한국사": "kh", "세계지리": "wg", "과학": "sc", "예술과 문화": "ac" };

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return ["QUESTIONS가 배열이 아닙니다."];
  const problems = [];
  const ids = new Set();
  questions.forEach((q, i) => {
    if (!q || typeof q !== "object") {
      problems.push(`${i + 1}번째 문항이 객체가 아닙니다.`);
      return;
    }
    const label = typeof q.id === "string" && q.id ? q.id : `${i + 1}번째 문항`;
    for (const key of ["id", "category", "question", "explanation"]) {
      if (typeof q[key] !== "string" || q[key].trim() === "") problems.push(`${label}: ${key} 값이 비어 있습니다.`);
    }
    if (!CATEGORIES.includes(q.category)) problems.push(`${label}: 알 수 없는 카테고리입니다.`);
    if (ids.has(q.id)) problems.push(`${label}: id가 중복됩니다.`);
    ids.add(q.id);
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      problems.push(`${label}: 보기가 4개가 아닙니다.`);
    } else if (new Set(q.choices).size !== 4) {
      problems.push(`${label}: 보기가 중복됩니다.`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) problems.push(`${label}: answer가 0~3이 아닙니다.`);
    if (!q.source || typeof q.source.name !== "string" || q.source.name.trim() === "") problems.push(`${label}: 출처 이름이 없습니다.`);
    if (!q.source || typeof q.source.url !== "string" || !q.source.url.startsWith("https://")) problems.push(`${label}: 출처 URL이 https://로 시작하지 않습니다.`);
  });
  for (const category of CATEGORIES) {
    const count = questions.filter((q) => q && q.category === category).length;
    if (count !== QUESTIONS_PER_CATEGORY) problems.push(`${category}: 문항이 ${count}개입니다(${QUESTIONS_PER_CATEGORY}개여야 함).`);
  }
  return problems;
}
```

- [ ] **Step 4: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 7, 실패 0`

### Task 4: `buildRound`와 `scoreAnswer`

**Files:**
- Modify: `script.js` (1. 순수 로직 끝, 4. 자체 점검)

**Interfaces:**
- Consumes: `shuffle`, `makeValidQuestions`
- Produces:
  - `buildRound(questions, category) → [{ original, choices, answer }]`: `original`은 원래 문항 객체, `choices`는 섞은 보기 4개, `answer`는 섞은 뒤의 정답 위치
  - `scoreAnswer(isCorrect, usedHint) → 1 | 0.5 | 0`

- [ ] **Step 1: 자체 점검 8~11 추가 (7번 항목 아래)**

```js
check("buildRound: 해당 카테고리 10문항만 낸다", () => {
  const round = buildRound(makeValidQuestions(), "과학");
  return round.length === 10 && round.every((item) => item.original.category === "과학");
});
check("buildRound: 섞은 뒤에도 answer가 원래 정답을 가리킨다", () =>
  buildRound(makeValidQuestions(), "한국사").every(
    (item) => item.choices[item.answer] === item.original.choices[item.original.answer]
  ));
check("buildRound: 보기 4개는 원래 보기와 같은 집합이다", () =>
  buildRound(makeValidQuestions(), "세계지리").every(
    (item) => item.choices.slice().sort().join("|") === item.original.choices.slice().sort().join("|")
  ));
check("scoreAnswer: 맞히면 1점, 틀리면 0점", () => scoreAnswer(true, false) === 1 && scoreAnswer(false, false) === 0);
```

- [ ] **Step 2: 점검 명령 실행, 실패 확인**

Expected: 8~11번 실패

- [ ] **Step 3: 구현 (1. 순수 로직 끝)**

```js
function buildRound(questions, category) {
  return shuffle(questions.filter((q) => q.category === category)).map((q) => {
    const order = shuffle([0, 1, 2, 3]);
    return {
      original: q,
      choices: order.map((i) => q.choices[i]),
      answer: order.indexOf(q.answer),
    };
  });
}

function scoreAnswer(isCorrect, usedHint) {
  if (!isCorrect) return 0;
  return usedHint ? 0.5 : 1;
}
```

- [ ] **Step 4: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 11, 실패 0`

### Task 5: 문항 작성 1 (한국사, 세계지리 20문항)

**Files:**
- Modify: `questions.js`

**작성 규칙** (PRD 4.2, 4.3과 이 계획에서 더한 규칙):
1. 정답은 하나뿐이어야 한다. 다른 보기가 기준에 따라 정답이 될 여지가 없어야 한다.
2. 출처 페이지를 실제로 열어 정답과 해설의 내용이 그 페이지에 있는지 대조한 뒤, 그 페이지의 기관, 문서 이름(`source.name`)과 URL(`source.url`, https)을 적는다.
3. 출처는 공공기관, 국제기구, 박물관, 백과사전(한국민족문화대백과사전, 우리역사넷, 브리태니커 등)으로 한다. **위키백과, 나무위키, 블로그는 출처로 쓰지 않는다.** (계획에서 더한 규칙)
4. 출처 페이지가 막혀 열 수 없거나 자료끼리 내용이 갈리는 주제는 열어서 확인할 수 있는 다른 주제로 바꾼다.
5. "가장 ~한", "최초" 같은 최상급 표현을 쓰면 기준과 시점을 문제 문장에 밝힌다. 예: "2024년 유엔 통계 기준, 면적이 가장 넓은 나라는?"
6. **문제 문장을 "아닌 것은?" 같은 부정형으로 쓰지 않는다.** (계획에서 더한 규칙)
7. 보기 4개는 서로 달라야 한다. 정답은 `choices[0]`에 두고 `answer: 0`으로 적는다(화면에서 섞는다).
8. 해설은 한 줄, 60자 이내다.
9. id는 `kh-01`~`kh-10`, `wg-01`~`wg-10`이다.

- [ ] **Step 1: 한국사 10문항 작성**

주제를 고르고, 문항마다 출처 페이지를 열어 확인하면서 `QUESTIONS` 배열에 넣는다. 형식:

```js
  {
    id: "kh-01",
    category: "한국사",
    question: "문제 문장",
    choices: ["정답", "오답1", "오답2", "오답3"],
    answer: 0,
    explanation: "60자 이내의 한 줄 해설",
    source: { name: "기관, 문서 이름", url: "https://..." },
  },
```

문항마다 검수표에 한 줄을 적어 둔다(완료 보고에 붙임).

| id | 정답 | 출처에서 확인한 내용 | 정답 하나 | 출처 열람 | 최상급 기준과 시점 |
|---|---|---|---|---|---|
| kh-01 | (정답) | (출처 페이지의 해당 문장 요약) | 확인 | 확인 | 해당 없음 또는 확인 |

- [ ] **Step 2: 세계지리 10문항 작성**

Step 1과 같은 방법으로 `wg-01`~`wg-10`을 넣는다.

- [ ] **Step 3: 해설 길이 점검**

Run:
```bash
node -e "const fs=require('fs');eval(fs.readFileSync('questions.js','utf8')+';const long=QUESTIONS.filter(q=>q.explanation.length>60);console.log(QUESTIONS.length+\"문항, 60자 초과 \"+long.length+\"개\");long.forEach(q=>console.log(q.id,q.explanation.length))')"
```
Expected: `20문항, 60자 초과 0개`

- [ ] **Step 4: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 11, 실패 0` (실제 데이터 점검은 Task 6에서 추가)

### Task 6: 문항 작성 2 (과학, 예술과 문화 20문항)와 실제 데이터 점검

**Files:**
- Modify: `questions.js`, `script.js` (4. 자체 점검)

**Interfaces:**
- Consumes: `validateQuestions`, `QUESTIONS`

- [ ] **Step 1: 자체 점검 12 추가 (11번 항목 아래)**

```js
check("QUESTIONS: 실제 문항 데이터가 validateQuestions를 통과한다", () => {
  const problems = validateQuestions(QUESTIONS);
  problems.forEach((p) => console.error(`  ${p}`));
  return problems.length === 0;
});
```

- [ ] **Step 2: 점검 명령 실행, 실패 확인**

Expected: 12번 실패, `과학: 문항이 0개입니다(10개여야 함).`, `예술과 문화: 문항이 0개입니다(10개여야 함).`

- [ ] **Step 3: 과학 10문항(`sc-01`~`sc-10`), 예술과 문화 10문항(`ac-01`~`ac-10`) 작성**

Task 5의 작성 규칙과 형식, 검수표를 그대로 따른다.

- [ ] **Step 4: 해설 길이 점검**

Task 5 Step 3의 명령을 다시 실행한다.
Expected: `40문항, 60자 초과 0개`

- [ ] **Step 5: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 12, 실패 0`

### Task 7: 시작 화면과 문제 화면 (연습 모드)

**Files:**
- Modify: `script.js` (2. 상태, 3. 화면 조작)

**Interfaces:**
- Consumes: `buildRound`, `scoreAnswer`, `CATEGORIES`, `QUESTIONS`
- Produces: `state`, `MODE_LABEL`, `startRound(category, mode)`, `renderQuestion()`, `handleAnswer(choiceIndex)` (`choiceIndex`가 `null`이면 시간 초과), `markChoice(button, kind, label)`, `nextQuestion()`

- [ ] **Step 1: 상태 추가 (2. 상태)**

```js
const state = {
  category: null,
  mode: "practice",
  round: [],
  index: 0,
  score: 0,
  results: [],
  usedHint: false,
  timerId: null,
  secondsLeft: 0,
  isRetry: false,
};

const MODE_LABEL = { practice: "연습", speed: "스피드", hint: "힌트" };
```

- [ ] **Step 2: `init` 교체와 문제 화면 함수 추가 (3. 화면 조작)**

Task 1의 `init()`를 아래로 바꾸고, 나머지 함수를 3. 화면 조작 끝에 넣는다.

```js
function init() {
  const list = $("category-list");
  for (const category of CATEGORIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category";
    button.textContent = category;
    button.addEventListener("click", () => startRound(category, "practice"));
    list.appendChild(button);
  }
  $("next-button").addEventListener("click", nextQuestion);
  showScreen("screen-start");
}

function startRound(category, mode) {
  state.category = category;
  state.mode = mode;
  state.isRetry = false;
  state.round = buildRound(QUESTIONS, category);
  state.index = 0;
  state.score = 0;
  state.results = [];
  showScreen("screen-quiz");
  renderQuestion();
}

function renderQuestion() {
  const item = state.round[state.index];
  state.usedHint = false;
  $("quiz-category").textContent = state.category;
  $("quiz-mode").textContent = state.isRetry ? "다시 풀기" : MODE_LABEL[state.mode];
  $("quiz-progress").textContent = `${state.index + 1} / ${state.round.length}`;
  $("quiz-score").textContent = state.isRetry ? "" : `점수 ${state.score}`;
  $("quiz-question").textContent = item.original.question;
  const box = $("quiz-choices");
  box.textContent = "";
  item.choices.forEach((text, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = text;
    button.addEventListener("click", () => handleAnswer(i));
    box.appendChild(button);
  });
  $("quiz-feedback").hidden = true;
}

// choiceIndex가 null이면 스피드 모드의 시간 초과다.
function handleAnswer(choiceIndex) {
  const item = state.round[state.index];
  const isCorrect = choiceIndex === item.answer;
  if (!state.isRetry) state.score += scoreAnswer(isCorrect, state.usedHint);
  state.results.push({ item, choiceIndex, isCorrect });

  $("quiz-choices").querySelectorAll("button").forEach((button, i) => {
    button.disabled = true;
    if (i === item.answer) markChoice(button, "correct", "정답");
    else if (i === choiceIndex) markChoice(button, "wrong", "오답");
  });
  if (!state.isRetry) $("quiz-score").textContent = `점수 ${state.score}`;

  const verdict = $("feedback-verdict");
  verdict.textContent = isCorrect ? "정답!" : choiceIndex === null ? "시간 초과" : "오답";
  verdict.className = `verdict ${isCorrect ? "correct" : "wrong"}`;
  $("feedback-explanation").textContent = item.original.explanation;
  const link = $("feedback-source");
  link.textContent = item.original.source.name;
  link.href = item.original.source.url;
  $("next-button").textContent = state.index === state.round.length - 1 ? "결과 보기" : "다음";
  $("quiz-feedback").hidden = false;
}

function markChoice(button, kind, label) {
  button.classList.add(kind);
  const mark = document.createElement("span");
  mark.className = "mark";
  mark.textContent = label;
  button.appendChild(mark);
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= state.round.length) {
    renderResult();
    return;
  }
  renderQuestion();
}
```

`renderResult`는 Task 8에서 만든다. Task 7만 마친 상태에서는 10번째 문항의 [결과 보기]를 누르지 않는다.

- [ ] **Step 3: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 12, 실패 0`

- [ ] **Step 4: 화면 확인**

`index.html`을 브라우저로 열어 [한국사]를 누르고, 상단에 "한국사", "연습", "1 / 10", "점수 0"이 보이는지, 답을 고르면 색과 해설과 출처가 나오는지 확인한다.

### Task 8: 결과 화면, 문항 데이터 오류 처리, 1단계 마무리

**Files:**
- Modify: `script.js` (3. 화면 조작)

**Interfaces:**
- Consumes: `state`, `startRound`, `validateQuestions`
- Produces: `renderResult()`

- [ ] **Step 1: `renderResult` 추가 (3. 화면 조작 끝)**

```js
function renderResult() {
  showScreen("screen-result");
  $("result-title").textContent = "결과";
  $("result-score").textContent = `${state.score} / ${state.round.length}`;
  $("result-notice").hidden = state.mode !== "practice";
  const list = $("result-list");
  list.textContent = "";
  for (const r of state.results) {
    const li = document.createElement("li");
    li.className = r.isCorrect ? "correct" : "wrong";
    li.textContent = `[${r.isCorrect ? "정답" : "오답"}] ${r.item.original.question} / 정답: ${r.item.choices[r.item.answer]}`;
    list.appendChild(li);
  }
}
```

- [ ] **Step 2: `init`에 결과 화면 버튼과 데이터 오류 처리 추가**

`init()`의 `$("next-button")...` 줄 아래, `showScreen("screen-start");` 위에 넣는다.

```js
  $("again-button").addEventListener("click", () => startRound(state.category, state.mode));
  $("home-button").addEventListener("click", () => showScreen("screen-start"));

  const problems = validateQuestions(QUESTIONS);
  if (problems.length > 0) {
    console.error("문항 데이터 오류:", problems);
    $("data-error").hidden = false;
    for (const button of list.querySelectorAll("button")) button.disabled = true;
  }
```

- [ ] **Step 3: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 12, 실패 0`

- [ ] **Step 4: 데이터 오류 처리 확인**

`questions.js`에서 `kh-01`의 `answer`를 잠시 `7`로 바꿔 브라우저로 열고, "문항 데이터 오류"가 보이며 카테고리 버튼 4개가 눌리지 않는지 확인한 뒤 `0`으로 되돌린다.

- [ ] **Step 5: 1단계 완료 보고 후 멈춤**

완료 기준을 모두 확인하고, 문항 검수표(40줄)와 계획과 다르게 정한 것을 보고에 적는다. 아래 "1단계 브라우저 확인 항목"을 사람에게 알리고 **멈춘다.** 2단계는 사람이 지시할 때 시작한다.

## 1단계 브라우저 확인 항목 (사람이 직접 확인, 13개)

탐색기에서 `index.html`을 더블클릭해 연다.

1. 시작 화면에 카테고리 버튼 4개와 "연습 모드 (순위표에 기록되지 않음)"이 보인다.
2. [한국사]를 누르면 상단에 "한국사", "연습", "1 / 10", "점수 0"이 보인다.
3. 정답을 고르면 그 보기가 초록색이 되고 "정답" 글자가 붙으며, "정답!", 한 줄 해설, 출처 링크가 나온다.
4. 오답을 고르면 고른 보기는 빨간색("오답"), 정답 보기는 초록색("정답")으로 표시되고 "오답"이 나온다.
5. 답을 고른 뒤에는 다른 보기를 눌러도 변화가 없다.
6. 출처 링크를 누르면 새 탭에서 출처 페이지가 열린다.
7. 10번째 문항에서는 [다음] 대신 [결과 보기]가 나온다.
8. 결과 화면의 "n / 10"이 맞힌 개수와 같고, 문항별 정답과 오답 목록이 보인다.
9. 결과 화면에 "순위표에 기록되지 않음"이 보인다.
10. [같은 모드 다시]를 누르면 문항 순서와 보기 순서가 앞 판과 달라진다.
11. [처음으로]를 누르면 시작 화면으로 돌아간다.
12. F12 개발자 도구에서 폭 360px로 바꿔도 가로 스크롤이 생기지 않고, 주소 끝에 `?test`를 붙여 열면 콘솔에 `자체 점검 결과: 통과 12, 실패 0`이 나온다.
13. 문항 40개의 내용이 맞는지 검수표와 출처로 확인한다(노트 5.4절에서 따로 진행).

---

# 2단계: 스피드 모드, 힌트 모드, 모드 선택, 틀린 문제 다시 풀기 (Task 9~13)

**만들 것:** 모드 선택 화면, 스피드 모드 타이머, 힌트 모드, 연습 모드의 틀린 문제 다시 풀기.

**완료 기준 (클로드가 점검):**
- 점검 명령의 결과가 `자체 점검 결과: 통과 15, 실패 0`이다.
- 화면을 바꾸거나 새 판을 시작할 때 타이머가 항상 멈춘다(`showScreen`과 `handleAnswer`에서 `stopTimer()`).
- 1단계의 동작이 그대로 유지된다(1단계 확인 항목 2~11).

### Task 9: 모드 선택 화면

**Files:**
- Modify: `index.html`, `style.css`, `script.js` (3. 화면 조작)

**Interfaces:**
- Consumes: `startRound(category, mode)`, `state`
- Produces: `screen-mode` 화면, 카테고리 버튼의 새 동작(모드 선택 화면으로 이동)

- [ ] **Step 1: `index.html` 수정**

시작 화면의 `<p class="notice" id="start-notice">...</p>` 줄을 지운다(PRD 2.1: 2단계부터 안내는 모드 선택 화면에 있음). 시작 화면 `</section>` 다음에 넣는다.

```html
    <section id="screen-mode" class="screen" hidden>
      <h2 id="mode-title"></h2>
      <div class="mode-list">
        <button type="button" class="mode" data-mode="practice">
          <strong>연습</strong>
          <span>시간 제한과 힌트 없음, 맞히면 1점</span>
          <span class="notice">순위표에 기록되지 않음</span>
        </button>
        <button type="button" class="mode" data-mode="speed">
          <strong>스피드</strong>
          <span>문항마다 15초, 시간이 지나면 오답</span>
        </button>
        <button type="button" class="mode" data-mode="hint">
          <strong>힌트</strong>
          <span>문항마다 힌트 1번, 오답 2개를 흐리게 함, 힌트를 쓰고 맞히면 0.5점</span>
        </button>
      </div>
      <div class="actions">
        <button type="button" id="back-button">뒤로</button>
      </div>
    </section>
```

- [ ] **Step 2: `style.css` 끝에 추가**

```css
.mode-list { display: grid; gap: 8px; }
.mode { display: grid; gap: 2px; text-align: left; }
.mode .notice { font-size: 0.9rem; }
```

- [ ] **Step 3: `init()` 수정**

카테고리 버튼의 클릭 처리 줄을 바꾼다.

```js
    button.addEventListener("click", () => chooseCategory(category));
```

`$("next-button")...` 줄 아래에 넣는다.

```js
  for (const button of document.querySelectorAll(".mode")) {
    button.addEventListener("click", () => startRound(state.category, button.dataset.mode));
  }
  $("back-button").addEventListener("click", () => showScreen("screen-start"));
```

3. 화면 조작 끝에 넣는다.

```js
function chooseCategory(category) {
  state.category = category;
  $("mode-title").textContent = category;
  showScreen("screen-mode");
}
```

- [ ] **Step 4: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 12, 실패 0`

### Task 10: 스피드 모드 타이머

**Files:**
- Modify: `index.html`, `script.js` (3. 화면 조작)

**Interfaces:**
- Consumes: `handleAnswer(null)`, `state.timerId`, `state.secondsLeft`
- Produces: `SPEED_SECONDS`, `startTimer()`, `stopTimer()`, `renderTimer()`, `handleTimeout()`

- [ ] **Step 1: `index.html`의 문제 화면 상단에 남은 시간 칸 추가**

`<span id="quiz-score"></span>` 다음 줄에 넣는다.

```html
        <span id="quiz-timer" hidden></span>
```

- [ ] **Step 2: 타이머 함수 추가 (3. 화면 조작 끝)**

```js
const SPEED_SECONDS = 15;

function startTimer() {
  stopTimer();
  state.secondsLeft = SPEED_SECONDS;
  renderTimer();
  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    renderTimer();
    if (state.secondsLeft <= 0) handleTimeout();
  }, 1000);
}

function stopTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function renderTimer() {
  $("quiz-timer").textContent = `남은 시간 ${state.secondsLeft}초`;
}

function handleTimeout() {
  stopTimer();
  handleAnswer(null);
}
```

- [ ] **Step 3: 기존 함수에 타이머 연결**

`showScreen(id)`의 첫 줄에 넣는다(화면을 떠나거나 새 판을 시작할 때 타이머가 겹치지 않게 함).

```js
  stopTimer();
```

`handleAnswer(choiceIndex)`의 첫 줄에 넣는다(0초 직전에 답을 고르면 시간 초과가 따로 일어나지 않게 함).

```js
  stopTimer();
```

`renderQuestion()`의 끝(`$("quiz-feedback").hidden = true;` 다음)에 넣는다.

```js
  const timed = state.mode === "speed";
  $("quiz-timer").hidden = !timed;
  if (timed) startTimer();
```

- [ ] **Step 4: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 12, 실패 0`

### Task 11: 힌트 모드

**Files:**
- Modify: `index.html`, `style.css`, `script.js` (1. 순수 로직, 3. 화면 조작, 4. 자체 점검)

**Interfaces:**
- Consumes: `shuffle`, `scoreAnswer`, `state.usedHint`
- Produces: `pickHintRemovals(question) → 오답 보기 번호 2개` (`question`은 `buildRound`의 원소 `{ choices, answer }`), `useHint()`

- [ ] **Step 1: 자체 점검 13~15 추가 (12번 항목 아래)**

```js
check("scoreAnswer: 힌트를 쓰고 맞히면 0.5점, 틀리면 0점", () => scoreAnswer(true, true) === 0.5 && scoreAnswer(false, true) === 0);
check("pickHintRemovals: 서로 다른 보기 번호 2개를 고른다", () => {
  const picked = pickHintRemovals({ choices: ["가", "나", "다", "라"], answer: 2 });
  return picked.length === 2 && picked[0] !== picked[1] && picked.every((i) => i >= 0 && i <= 3);
});
check("pickHintRemovals: 정답은 고르지 않는다", () => {
  for (let answer = 0; answer < 4; answer++) {
    for (let n = 0; n < 50; n++) {
      if (pickHintRemovals({ choices: ["가", "나", "다", "라"], answer }).includes(answer)) return false;
    }
  }
  return true;
});
```

- [ ] **Step 2: 점검 명령 실행, 실패 확인**

Expected: 14, 15번 실패(`pickHintRemovals is not defined`). 13번은 Task 4의 `scoreAnswer`로 이미 통과한다.

- [ ] **Step 3: `pickHintRemovals` 구현 (1. 순수 로직 끝)**

```js
function pickHintRemovals(question) {
  const wrong = [0, 1, 2, 3].filter((i) => i !== question.answer);
  return shuffle(wrong).slice(0, 2);
}
```

- [ ] **Step 4: `index.html`에 [힌트] 버튼 추가**

문제 화면의 `<div class="choices" id="quiz-choices"></div>` 바로 위에 넣는다.

```html
      <div class="actions hint-row">
        <button type="button" id="hint-button" hidden>힌트</button>
      </div>
```

- [ ] **Step 5: `style.css` 끝에 추가**

```css
.hint-row { margin: 0 0 8px; }
.choice.removed { opacity: 0.35; text-decoration: line-through; }
```

- [ ] **Step 6: 화면 연결 (3. 화면 조작)**

3. 화면 조작 끝에 넣는다.

```js
function useHint() {
  if (state.usedHint) return;
  state.usedHint = true;
  const item = state.round[state.index];
  const buttons = $("quiz-choices").querySelectorAll("button");
  for (const i of pickHintRemovals(item)) {
    buttons[i].disabled = true;
    buttons[i].classList.add("removed");
  }
  $("hint-button").disabled = true;
}
```

`init()`의 `$("next-button")...` 줄 아래에 넣는다.

```js
  $("hint-button").addEventListener("click", useHint);
```

`renderQuestion()`의 끝에 넣는다.

```js
  $("hint-button").hidden = state.mode !== "hint" || state.isRetry;
  $("hint-button").disabled = false;
```

`handleAnswer(choiceIndex)`에서 `stopTimer();` 다음 줄에 넣는다.

```js
  $("hint-button").disabled = true;
```

- [ ] **Step 7: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 15, 실패 0`

### Task 12: 틀린 문제 다시 풀기 (연습 모드)

**Files:**
- Modify: `index.html`, `script.js` (3. 화면 조작)

**Interfaces:**
- Consumes: `buildRound(questions, category)`, `state.results`, `state.isRetry`
- Produces: `startRetry()`

- [ ] **Step 1: `index.html`의 결과 화면에 버튼 추가**

결과 화면 `<div class="actions">` 안의 맨 앞에 넣는다.

```html
        <button type="button" class="primary" id="retry-button" hidden>틀린 문제 다시 풀기</button>
```

- [ ] **Step 2: `startRetry` 추가 (3. 화면 조작 끝)**

```js
// 틀린 문항만 순서와 보기를 다시 섞어 낸다. 다시 풀기는 채점하지 않으므로 state.score는 그대로 둔다.
function startRetry() {
  const wrong = state.results.filter((r) => !r.isCorrect).map((r) => r.item.original);
  state.isRetry = true;
  state.round = buildRound(wrong, state.category);
  state.index = 0;
  state.results = [];
  showScreen("screen-quiz");
  renderQuestion();
}
```

- [ ] **Step 3: `renderResult()` 수정**

`renderResult()`의 처음 네 줄(`showScreen`부터 `result-notice`까지)을 아래로 바꾼다.

```js
  showScreen("screen-result");
  $("result-title").textContent = state.isRetry ? "다시 풀기 결과" : "결과";
  $("result-score").hidden = state.isRetry;
  $("result-score").textContent = `${state.score} / ${state.round.length}`;
  $("result-notice").hidden = state.mode !== "practice";
  $("retry-button").hidden = state.mode !== "practice" || state.results.every((r) => r.isCorrect);
```

- [ ] **Step 4: `init()`에 버튼 연결**

`$("again-button")...` 줄 위에 넣는다.

```js
  $("retry-button").addEventListener("click", startRetry);
```

- [ ] **Step 5: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 15, 실패 0`

### Task 13: 2단계 마무리

**Files:**
- (수정 없음, 확인만)

- [ ] **Step 1: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 15, 실패 0`

- [ ] **Step 2: 타이머 겹침 확인**

스피드 모드로 한 판을 시작해 3문항쯤 풀다가 새로 고침하지 말고 결과까지 진행한 뒤 [같은 모드 다시]를 누른다. 남은 시간이 1초에 1씩만 줄어드는지 확인한다.

- [ ] **Step 3: 2단계 완료 보고 후 멈춤**

완료 기준과 계획과 다르게 정한 것을 보고하고, 아래 "2단계 브라우저 확인 항목"을 사람에게 알린 뒤 **멈춘다.**

## 2단계 보완 (노트 5.5.2의 확인 항목에 맞춤)

2단계를 배포한 뒤, 노트 5.5.2의 확인 항목 17개와 비교해 없던 동작 네 가지를 `stage-2-fix` 브랜치에서 더했다. 자체 점검 개수(15개)는 바꾸지 않았다.

- 모드 선택 화면의 제목을 "과학, 모드를 고르세요"처럼 보여 준다(`chooseCategory`).
- 스피드 모드의 남은 시간이 5초 이하이면 빨간색으로 보여 준다(`renderTimer`, `#quiz-timer.urgent`).
- 힌트 버튼은 처음에 [힌트 (오답 2개 지우기)], 쓰고 나면 [힌트 사용함]으로 바뀐다(`renderQuestion`, `useHint`).
- 결과 목록에 "정답", "정답 (힌트 0.5점)", "오답", "시간 초과"를 구별해 보여 준다(`resultLabel`, 결과에 `usedHint` 저장).

## 2단계 브라우저 확인 항목 (사람이 직접 확인, 17개)

1. 시작 화면에서 카테고리를 누르면 모드 선택 화면이 나오고, 제목에 "과학, 모드를 고르세요"처럼 그 카테고리 이름이 보인다.
2. 모드 선택 화면에 [연습], [스피드], [힌트]가 규칙 한 줄과 함께 보이고, 연습에만 "순위표에 기록되지 않음"이 붙어 있다.
3. [뒤로]를 누르면 시작 화면으로 돌아간다. 시작 화면에는 이제 연습 모드 안내가 없다.
4. 연습 모드는 1단계와 똑같이 동작한다(상단 배지 "연습").
5. 스피드 모드를 고르면 "남은 시간 15초"가 보이고 1초마다 1씩 줄어들며, 5초 이하에서 빨간색이 된다.
6. 스피드 모드에서 답을 고르면 남은 시간이 그 자리에서 멈춘다.
7. 답을 고르지 않고 기다리면 0초에 "시간 초과"가 나오고, 정답 보기가 초록색으로 표시되며 해설이 나온다.
8. [다음]을 누르면 다음 문항이 다시 15초부터 센다. [같은 모드 다시]로 새 판을 시작해도 1초에 1씩만 줄어든다.
9. 스피드 모드 결과 화면에는 "순위표에 기록되지 않음"과 [틀린 문제 다시 풀기]가 없다.
10. 힌트 모드에서만 [힌트 (오답 2개 지우기)] 버튼이 보인다(연습, 스피드에는 없음).
11. [힌트]를 누르면 오답 보기 2개가 흐려지고 눌리지 않으며, 정답 보기는 그대로다.
12. 힌트를 쓰면 버튼이 [힌트 사용함]으로 바뀌고 다시 눌리지 않는다. 다음 문항에서는 다시 쓸 수 있다.
13. 힌트를 쓰고 맞히면 점수가 0.5 오르고, 결과 화면에 7.5 / 10처럼 소수점 점수와 "정답 (힌트 0.5점)" 표시가 나온다. 스피드 모드에서 시간이 다 된 문항은 결과 목록에 "시간 초과"로 나온다.
14. 연습 모드 결과에 틀린 문항이 있으면 [틀린 문제 다시 풀기]가 보이고, 모두 맞혔으면 보이지 않는다.
15. [틀린 문제 다시 풀기]를 누르면 틀린 문항만 나오고, 상단에 "다시 풀기"가 보이며 점수 칸이 없다.
16. 다시 풀기에서 또 틀리면 결과 화면("다시 풀기 결과")에 [틀린 문제 다시 풀기]가 다시 나오고, 다 맞히면 사라진다.
17. 폭 360px에서 가로 스크롤이 없고, `?test`로 열면 콘솔에 `자체 점검 결과: 통과 15, 실패 0`이 나온다.

---

# 3단계: 점수 저장과 순위표 (Task 14~15)

**만들 것:** 스피드, 힌트 모드 결과의 이름 입력과 기록 저장, 순위표 화면(표 8개), 시작 화면의 [순위표 보기].

**완료 기준 (클로드가 점검):**
- 점검 명령의 결과가 `자체 점검 결과: 통과 19, 실패 0`이다.
- `localStorage` 읽기와 쓰기가 모두 `try/catch` 안에 있다.
- 이름과 기록은 화면에 `textContent`로만 넣는다.
- 1, 2단계의 동작이 그대로 유지된다.

### Task 14: 순위표 저장 로직

**Files:**
- Modify: `script.js` (1. 순수 로직, 3. 화면 조작, 4. 자체 점검)

**Interfaces:**
- Produces:
  - `LEADERBOARD_KEY = "quiz.leaderboard"`, `LEADERBOARD_SIZE = 5`
  - `boardKey(mode, category) → "speed|한국사"` 형식 문자열
  - `insertRecord(list, record) → 정렬 후 5건 이하 배열` (`record`: `{ name, score, date }`, `date`는 ISO 문자열)
  - `parseLeaderboard(text) → 객체` (깨진 값이나 `null`이면 `{}`)
  - `formatDate(iso) → "YYYY-MM-DD"` (컴퓨터의 현지 날짜)
  - `loadLeaderboard() → { board, ok }`, `saveLeaderboard(board) → true | false`

- [ ] **Step 1: 자체 점검 16~19 추가 (15번 항목 아래)**

```js
function makeRecord(name, score, date) {
  return { name, score, date };
}

check("insertRecord: 점수가 높은 순으로 줄을 세운다", () => {
  const list = insertRecord([makeRecord("가", 5, "2026-10-01T00:00:00.000Z")], makeRecord("나", 8, "2026-10-02T00:00:00.000Z"));
  return list.map((r) => r.name).join(",") === "나,가";
});
check("insertRecord: 점수가 같으면 먼저 세운 기록이 위다", () => {
  const list = insertRecord([makeRecord("늦음", 7, "2026-10-03T00:00:00.000Z")], makeRecord("이름", 7, "2026-10-01T00:00:00.000Z"));
  return list.map((r) => r.name).join(",") === "이름,늦음";
});
check("insertRecord: 상위 5건만 남긴다", () => {
  let list = [];
  for (let n = 1; n <= 6; n++) list = insertRecord(list, makeRecord(`r${n}`, n, `2026-10-0${n}T00:00:00.000Z`));
  return list.length === 5 && list[0].score === 6 && list[4].score === 2;
});
check("parseLeaderboard: 깨진 값이면 빈 순위표로 다룬다", () =>
  Object.keys(parseLeaderboard("{깨진")).length === 0 &&
  Object.keys(parseLeaderboard(null)).length === 0 &&
  Object.keys(parseLeaderboard("[1,2]")).length === 0);
```

- [ ] **Step 2: 점검 명령 실행, 실패 확인**

Expected: 16~19번 실패

- [ ] **Step 3: 순수 로직 구현 (1. 순수 로직 끝)**

```js
const LEADERBOARD_KEY = "quiz.leaderboard";
const LEADERBOARD_SIZE = 5;

function boardKey(mode, category) {
  return `${mode}|${category}`;
}

function insertRecord(list, record) {
  return list
    .concat([record])
    .sort((a, b) => b.score - a.score || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, LEADERBOARD_SIZE);
}

function parseLeaderboard(text) {
  if (text === null) return {};
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
```

- [ ] **Step 4: 저장소 읽기와 쓰기 (3. 화면 조작 끝)**

```js
// 저장소를 쓸 수 없으면 ok가 false다. 저장된 값이 깨져 있으면 안내 없이 빈 순위표로 시작하고 다음 저장 때 덮어쓴다.
function loadLeaderboard() {
  try {
    return { board: parseLeaderboard(localStorage.getItem(LEADERBOARD_KEY)), ok: true };
  } catch {
    return { board: {}, ok: false };
  }
}

function saveLeaderboard(board) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 19, 실패 0`

### Task 15: 기록 저장 화면과 순위표 화면, 3단계 마무리

**Files:**
- Modify: `index.html`, `style.css`, `script.js` (3. 화면 조작)

**Interfaces:**
- Consumes: `loadLeaderboard`, `saveLeaderboard`, `insertRecord`, `boardKey`, `formatDate`, `MODE_LABEL`, `state`
- Produces: `saveRecord(event)`, `renderLeaderboard()`, `updateSaveButton()`

- [ ] **Step 1: `index.html` 수정**

시작 화면의 `<div class="category-list" id="category-list"></div>` 다음 줄에 넣는다.

```html
      <div class="actions">
        <button type="button" id="board-button">순위표 보기</button>
      </div>
```

결과 화면의 `<ol class="result-list" id="result-list"></ol>` 다음 줄에 넣는다.

```html
      <form class="record-form" id="record-form" hidden>
        <label for="record-name">이름</label>
        <input id="record-name" maxlength="10" autocomplete="off">
        <button type="submit" class="primary" id="record-save" disabled>기록 저장</button>
      </form>
      <p class="error" id="storage-error" hidden>기록을 저장할 수 없음</p>
```

결과 화면 `</section>` 다음에 넣는다.

```html
    <section id="screen-board" class="screen" hidden>
      <h2>순위표</h2>
      <p class="error" id="board-error" hidden>기록을 저장할 수 없음</p>
      <div class="board-list" id="board-list"></div>
      <div class="actions">
        <button type="button" id="board-home-button">처음으로</button>
      </div>
    </section>
```

- [ ] **Step 2: `style.css` 끝에 추가**

```css
.record-form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 16px; }
.record-form input { font: inherit; min-height: 44px; padding: 8px; border: 1px solid var(--line); border-radius: 8px; flex: 1 1 140px; min-width: 0; }
.board-list { display: grid; gap: 16px; }
.board-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.board-table caption { text-align: left; font-weight: 700; margin-bottom: 4px; }
.board-table th, .board-table td { border-bottom: 1px solid var(--line); padding: 6px 4px; text-align: left; overflow-wrap: anywhere; }
.board-table th:first-child, .board-table td:first-child { width: 3em; }
.board-empty { color: var(--muted); }
```

- [ ] **Step 3: 화면 함수 추가 (3. 화면 조작 끝)**

```js
function updateSaveButton() {
  const name = $("record-name").value.trim();
  $("record-save").disabled = name.length < 1 || name.length > 10;
}

function saveRecord(event) {
  event.preventDefault();
  const name = $("record-name").value.trim();
  if (name.length < 1 || name.length > 10) return;
  const { board, ok } = loadLeaderboard();
  const key = boardKey(state.mode, state.category);
  const list = Array.isArray(board[key]) ? board[key] : [];
  board[key] = insertRecord(list, { name, score: state.score, date: new Date().toISOString() });
  if (!ok || !saveLeaderboard(board)) {
    $("storage-error").hidden = false;
    return;
  }
  renderLeaderboard();
  showScreen("screen-board");
}

function renderLeaderboard() {
  const { board, ok } = loadLeaderboard();
  $("board-error").hidden = ok;
  const container = $("board-list");
  container.textContent = "";
  for (const mode of ["speed", "hint"]) {
    for (const category of CATEGORIES) {
      const table = document.createElement("table");
      table.className = "board-table";
      const caption = document.createElement("caption");
      caption.textContent = `${category} (${MODE_LABEL[mode]})`;
      table.appendChild(caption);
      const records = Array.isArray(board[boardKey(mode, category)]) ? board[boardKey(mode, category)] : [];
      if (records.length === 0) {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.className = "board-empty";
        cell.textContent = "기록 없음";
      } else {
        const head = table.createTHead().insertRow();
        for (const title of ["순위", "이름", "점수", "날짜"]) {
          const th = document.createElement("th");
          th.textContent = title;
          head.appendChild(th);
        }
        const body = table.createTBody();
        records.forEach((r, i) => {
          const row = body.insertRow();
          for (const value of [i + 1, r.name, r.score, formatDate(r.date)]) {
            row.insertCell().textContent = String(value);
          }
        });
      }
      container.appendChild(table);
    }
  }
}
```

- [ ] **Step 4: 기존 함수 연결**

`init()`의 `$("again-button")...` 줄 위에 넣는다.

```js
  $("record-name").addEventListener("input", updateSaveButton);
  $("record-form").addEventListener("submit", saveRecord);
  $("board-button").addEventListener("click", () => {
    renderLeaderboard();
    showScreen("screen-board");
  });
  $("board-home-button").addEventListener("click", () => showScreen("screen-start"));
```

`renderResult()`의 `$("retry-button")...` 줄 다음에 넣는다.

```js
  $("record-form").hidden = state.isRetry || state.mode === "practice";
  $("record-name").value = "";
  $("record-save").disabled = true;
  $("storage-error").hidden = true;
```

- [ ] **Step 5: 점검 명령 실행**

Expected: `자체 점검 결과: 통과 19, 실패 0`

- [ ] **Step 6: 3단계 완료 보고 후 멈춤**

완료 기준과 계획과 다르게 정한 것을 보고하고, 아래 "3단계 브라우저 확인 항목"을 사람에게 알린 뒤 **멈춘다.**

## 3단계 브라우저 확인 항목 (사람이 직접 확인, 11개)

1. 시작 화면의 [순위표 보기]를 누르면 표 8개(스피드 4개, 힌트 4개)가 보이고, 기록이 없는 표에는 "기록 없음"이 보인다.
2. 스피드 모드 결과 화면에 이름 칸과 [기록 저장]이 있고, 이름이 비어 있으면 [기록 저장]이 눌리지 않는다.
3. 공백만 입력하면 [기록 저장]이 눌리지 않고, 이름 칸에는 10자까지만 들어간다.
4. 이름을 입력해 저장하면 순위표 화면으로 가고, 해당 표에 순위, 이름, 점수, 오늘 날짜(YYYY-MM-DD)가 보인다. 이름에 `<b>홍</b>`을 넣으면 태그가 글자 그대로 보인다.
5. 힌트 모드 결과도 같은 방법으로 저장되고, 힌트 표에 7.5 같은 점수가 그대로 보인다.
6. 연습 모드 결과 화면과 다시 풀기 결과 화면에는 이름 칸이 없다.
7. 같은 표에 6번 저장하면 5건만 남고, 점수가 높은 순으로 보인다.
8. 점수가 같으면 먼저 저장한 기록이 위에 있다.
9. 새로 고침하거나 브라우저를 닫았다가 다시 열어도 기록이 남아 있다.
10. 개발자 도구 콘솔에서 `Storage.prototype.setItem = () => { throw new Error("막힘"); }`을 실행한 뒤 저장하면 "기록을 저장할 수 없음"이 나오고, [처음으로]로 돌아가 게임을 계속할 수 있다(확인 뒤 새로 고침하면 원래대로 돌아감).
11. 폭 360px에서 순위표와 결과 화면에 가로 스크롤이 없고, `?test`로 열면 콘솔에 `자체 점검 결과: 통과 19, 실패 0`이 나온다.

---

## PRD와 다르게 정한 것

| PRD | 이 계획 | 이유 |
|---|---|---|
| 4.4: 저장소를 쓸 수 없거나 **값이 깨져 있으면** "기록을 저장할 수 없음" 표시 | 값이 깨져 있으면 안내 없이 빈 순위표로 시작하고 다음 저장 때 덮어쓴다. 저장소 자체를 쓸 수 없을 때만 안내한다. | 저장이 실제로 되는데 "저장할 수 없음"을 띄우면 맞지 않는다. |
| 4.2, 4.3에 없음 | 위키백과, 나무위키, 블로그를 출처로 쓰지 않는다. 문제를 부정형으로 쓰지 않는다. | 출처의 신뢰도를 높이고, 부정형 문제가 아는 사람도 틀리게 만드는 것을 막는다. |
| 3.3: 상단에 카테고리, 모드 표시 | "한국사", "연습"을 가운뎃점으로 잇지 않고 배지 두 개로 보여 준다. 시작 화면 안내는 "연습 모드 (순위표에 기록되지 않음)"이다. | 문구에 가운뎃점을 쓰지 않는 규칙 |
| 2.1: 다시 풀기는 채점하지 않음 | 다시 풀기 결과 화면에서는 점수 줄을 숨기고 문항별 목록만 보여 준다. | 채점하지 않는 판에 점수를 보여 주면 헷갈린다. |

## PRD 대응표

| PRD | 태스크 |
|---|---|
| 1.5 파일 4개, `file://`, 360px | 1, 8, 13, 15 |
| 2 게임 모드 표, 2.4 공통(0점, 섞기, 판 버리기) | 4, 7, 10, 11 |
| 2.1 연습, 틀린 문제 다시 풀기 | 7, 8, 12 |
| 2.2 스피드 | 10 |
| 2.3 힌트, 0.5 단위 점수 | 4, 11 |
| 3.1 시작 | 1, 7, 9, 15 |
| 3.2 모드 선택 | 9 |
| 3.3 문제 | 7, 10, 11 |
| 3.4 결과 | 8, 12, 15 |
| 3.5 순위표 | 15 |
| 4.1 `questions.js` 형식, id 접두어 | 3, 5, 6 |
| 4.2 문항 규칙 5개 | 3, 5, 6 |
| 4.3 문항 작성과 검수 | 5, 6, 8 |
| 4.4 순위표 저장 | 14, 15 |
| 5.1 순수 로직 6개 함수 | 2, 3, 4, 11, 14 |
| 5.2 상태 | 7 |
| 5.3 화면 조작, `stopTimer()` | 7, 8, 10, 11, 15 |
| 5.4 오류 처리 | 8 |
| 6 구현 단계와 완료 기준 | 각 단계 머리말, 8, 13, 15 |
| 7 검증 방법(`?test`, `file://`, 360px, 검수 체크리스트) | 1, 각 단계 브라우저 확인 항목 |
| 8 범위 밖 | 만들지 않음 |
