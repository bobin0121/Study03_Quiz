<!-- 생성: 2026-10-08 11:55 KST -->

# 상식 퀴즈 웹 앱 구현 계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**실행자는 이 계획과 [PRD.md](PRD.md)를 함께 읽는다.** 계획과 PRD가 어긋나 보이면 PRD를 따르고, 어긋난 곳을 사용자에게 알린다. PRD의 항목마다 그것을 구현하는 Task는 맨 끝의 "PRD 대응표"에 있다.

**Goal:** 서버 없이 파일을 더블클릭해 여는 4지선다 상식 퀴즈 웹 앱(연습, 스피드, 힌트 모드와 순위표)을 3단계로 만든다.

**Architecture:** `index.html` 에 화면 4개(시작, 문제, 결과, 순위표)를 미리 만들어 두고 `hidden` 으로 하나만 보여 준다. `questions.js` 가 전역 상수 `QUESTIONS` 를 만들고, `script.js` 는 위에서부터 상수, 순수 로직, 상태, 화면 조작, 자체 점검, 시작 순서로 나뉜다. 완료 기준은 `script.js` 안의 자체 점검 코드를 Node 명령 한 줄(또는 `index.html?test`)로 실행해 클로드가 확인하고, 화면은 단계마다 사람이 브라우저에서 확인한다.

**Tech Stack:** HTML, CSS, 순수 자바스크립트(모듈과 외부 라이브러리 없음), `localStorage`, 자체 점검 실행용 Node.js(LTS)

**Spec:** [PRD.md](PRD.md)

## 시작 전 준비

- [ ] **Node.js 설치(사용자가 직접):** 2026-10-08 확인 결과 이 컴퓨터에는 Node가 없다. https://nodejs.org 에서 LTS 버전을 내려받아 설치한 뒤, 터미널을 새로 열어 아래 명령으로 버전이 나오는지 확인한다. 자체 점검(PRD 7절)에 필요하다.

```bash
node --version
```

- [ ] **git 저장소 만들기:** `Study03_Quiz` 가 아직 git 저장소가 아니면 먼저 만들고, PRD와 계획서를 첫 커밋으로 올린다.

```bash
git init && git add PRD.md IMPL-PLAN.md && git commit -m "PRD와 구현 계획서 추가"
```

모든 명령은 Git Bash에서 `D:\데이터과학\Study03_Quiz` 폴더를 기준으로 실행한다.

## Global Constraints

- 앱 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개다. 외부 라이브러리를 쓰지 않는다.
- ES 모듈(`import`, `export`)을 쓰지 않는다. `questions.js` 를 `script.js` 보다 먼저 일반 `<script>` 로 불러오고, 문항은 전역 상수 `QUESTIONS` 하나로 넘긴다.
- 파일을 더블클릭해 열어도(`file://`) 동작해야 한다.
- 휴대폰 화면 폭에서도 가로 스크롤 없이 보여야 한다.
- 앱 파일 4개 외의 파일(테스트 폴더, 점검 스크립트 파일 등)을 만들지 않는다. 점검 코드는 `script.js` 의 "자체 점검" 구역에 둔다. 문서 파일(`PRD.md`, `IMPL-PLAN.md`, 출처 확인표 `SOURCE-CHECK.md`)은 예외로 본다.
- `script.js` 맨 끝의 "시작" 구역은 브라우저에서는 `init()` 을 부르고(주소에 `?test` 가 있으면 자체 점검도 실행), Node에서는 자체 점검만 실행한다.
- **단계마다 멈춘다.** 한 단계의 Task를 모두 마치면 "단계 마무리"대로 사용자에게 보고하고, 사용자가 브라우저 확인을 마치고 다음 단계를 시작하라고 할 때까지 다음 단계의 Task에 손대지 않는다.
- 화면에 글자를 넣을 때는 `textContent` 만 쓴다. 문항, 이름 같은 값을 `innerHTML` 에 넣지 않는다(목록을 비우는 `innerHTML = ''` 만 허용).
- 새 파일 첫 줄에 생성 일시 주석을 넣는다. 시각은 `date "+%Y-%m-%d %H:%M"` 으로 확인하고 `2026-10-08 18:52 KST` 형식으로 쓴다(HTML `<!-- -->`, CSS `/* */`, JS `//`).
- 한국어 문구: 열거에 가운뎃점 대신 쉼표를 쓴다. 문장으로 된 안내, 오류 메시지는 마침표로 끝내고, 버튼 라벨에는 붙이지 않는다. 보조용언은 띄어 쓴다.
- PRD에 정해진 문구는 그대로 쓴다: "순위표에 기록되지 않음", "정답입니다.", "오답입니다.", "시간 초과", "출처: 기관명", "익명", "기록을 저장할 수 없습니다.", [다음], [결과 보기], [다시 하기], [처음으로], [힌트], [틀린 문제 다시 풀기], [기록하기].

## Review Focus

PRD가 직접 말하지 않지만 실제로 쓰다 보면 부딪히기 쉬운 경우 5가지다. 각 줄의 확인은 괄호 안의 Task에 들어 있다.

1. **스피드 모드 타이머 겹침:** 0초 직전에 보기를 누르거나 [다음]을 빠르게 연달아 눌러도 타이머는 하나만 돌고, 이미 답한 문항이 "시간 초과"로 다시 채점되지 않아야 한다. (Task 2.2, 2단계 브라우저 확인)
2. **[기록하기] 연타:** 버튼을 두 번 누르거나 Enter를 연달아 눌러도 기록은 1건만 들어가야 한다. (Task 3.2, 3단계 브라우저 확인)
3. **깨진 저장 값:** `localStorage` 에 JSON이 아닌 값, 배열, 필드가 빠진 기록이 들어 있어도 순위표는 빈 표나 멀쩡한 기록만 보여 주고, 새 기록도 저장되어야 한다. 이때는 안내 문구 없이 빈 표로 시작하고 다음 저장 때 덮어쓴다. 저장소 자체를 쓸 수 없을 때만 "기록을 저장할 수 없습니다."를 보여 준다. (Task 3.1 자체 점검, 3단계 브라우저 확인)
4. **이상한 이름:** 공백만 넣으면 "익명", 11자 이상은 10자까지, `<b>굵게</b>` 처럼 태그를 넣으면 굵은 글씨가 아니라 글자 그대로 보여야 한다. (Task 3.1 자체 점검, 3단계 브라우저 확인)
5. **이전 판 상태 남음:** 다시 풀기나 힌트를 쓴 판 뒤에 [다시 하기]나 [처음으로]로 새 판을 시작하면 점수, 틀린 문항 목록, 다시 풀기 상태, 힌트 상태가 모두 처음부터 시작해야 한다. (Task 2.4, 2단계 브라우저 확인)

## 파일 구조

| 파일 | 맡는 일 | 만드는 단계 |
|---|---|---|
| `questions.js` | 전역 상수 `QUESTIONS`(40문항) | 1단계 |
| `script.js` | 상수, 순수 로직, 상태, 화면 조작, 자체 점검, 시작 | 1단계에서 만들고 2, 3단계에서 고침 |
| `index.html` | 화면 4개의 뼈대, 스크립트 불러오기 | 1단계에서 만들고 2, 3단계에서 고침 |
| `style.css` | 모양, 휴대폰 폭 대응 | 1단계에서 만들고 2, 3단계에서 고침 |
| `SOURCE-CHECK.md` | 문항별 출처 확인표(사람이 최종 확인) | 1단계 |

`script.js` 의 구역 순서(최종):

```
상수 → ===== 순수 로직 ===== → ===== 상태 ===== → ===== 화면 조작 ===== → ===== 자체 점검 ===== → ===== 시작 =====
```

순수 로직 함수 목록(최종):

| 함수 | 단계 | 하는 일 |
|---|---|---|
| `shuffle(items, random)` | 1 | 원본을 바꾸지 않고 섞은 새 배열을 돌려준다 |
| `shuffleChoices(question, random)` | 1 | 보기를 섞고 `answer` 위치를 새로 맞춘 새 문항을 돌려준다 |
| `prepareRound(questions, category, random)` | 1 | 카테고리 문항 10개를 골라 순서와 보기를 섞는다 |
| `scoreAnswer(question, choiceIndex, usedHint)` | 1, 2 | 1, 0.5, 0점 중 하나를 돌려준다. `choiceIndex` 가 `null` 이면 시간 초과 |
| `pickHintRemovals(question, random)` | 2 | 지울 오답 보기 위치 2개를 돌려준다 |
| `normalizeName(raw)` | 3 | 앞뒤 공백 제거, 10자 자르기, 비면 "익명" |
| `addRecord(table, record)` | 3 | 기록을 넣고 점수 내림차순(동점은 먼저 세운 기록이 위) 정렬 후 5건만 남긴다 |
| `boardKey(mode, category)` | 3 | 표 이름 `"speed:과학"` 형식 |
| `getTable(boards, mode, category)` | 3 | 표 하나를 꺼내고 형식이 맞는 기록만 남긴다 |
| `readBoards(storage)` | 3 | 저장소에서 표 8개 묶음을 읽는다(접근이 막히면 예외, 값이 깨졌으면 `{}`) |
| `storeRecord(mode, category, record, storage)` | 3 | 기록 하나를 저장한다(실패하면 예외) |
| `today()` | 3 | 오늘 날짜 `YYYY-MM-DD` |

`storage` 인자는 기본값이 `localStorage` 다. 자체 점검은 가짜 저장소를 넘겨서 실제 기록을 건드리지 않는다.

## 확인 방법

**자체 점검 명령(클로드가 실행):** `questions.js` 와 `script.js` 를 이어 읽어 Node로 실행한다. `document` 가 없으므로 화면 코드는 돌지 않고 자체 점검만 돈다.

```bash
node -e "const fs=require('fs');require('vm').runInThisContext(fs.readFileSync('questions.js','utf8')+'\n'+fs.readFileSync('script.js','utf8'))"
```

- 통과: `자체 점검: 통과 (N개)`
- 실패: `자체 점검: 실패 n개` 와 실패한 항목 목록, 종료 코드 1
- 최상급 표현에 기준이나 시점이 없어 보이는 문항은 실패가 아니라 경고 줄로 나온다.

이 계획서에서 "자체 점검 명령을 실행한다"는 위 명령을 뜻한다.

**브라우저 자체 점검:** `index.html` 을 더블클릭해 연 뒤 주소 끝에 `?test` 를 붙여 다시 열고 F12 → Console에서 같은 결과를 본다.

**브라우저 확인(사람이 직접):** 단계 끝의 "브라우저에서 직접 확인할 항목"을 크롬이나 엣지에서 `index.html` 을 더블클릭해 연 상태로 해 본다. 콘솔은 F12 → Console 탭, 휴대폰 폭은 F12 → 기기 툴바(Ctrl+Shift+M) → 너비 375로 본다. 클로드의 내장 브라우저는 `file://` 을 열 수 없으므로 화면 확인은 사람이 한다.

---

# 1단계: 연습 모드와 점수

## 만들 것

- `questions.js`: 카테고리 4개 x 10문항, 총 40문항
- `SOURCE-CHECK.md`: 문항마다 출처 페이지를 열어 본 결과표
- `script.js`: 섞기, 보기 섞기, 한 판 준비, 채점(순수 로직), 연습 모드 진행(화면), 자체 점검(로직, 문항)
- `index.html`: 시작(카테고리 4개, "순위표에 기록되지 않음"), 문제, 결과 화면
- `style.css`: 정답 초록, 고른 오답 빨강, 휴대폰 폭 대응

모드 선택 화면과 틀린 문제 다시 풀기는 아직 없다. 시작 화면에서는 카테고리만 고르고, 연습 모드로 시작한다.

## 완료 기준 (PRD 6절)

- [ ] 파일을 더블클릭해 열고, 카테고리 4개 모두 10문제를 끝까지 풀 수 있다.
- [ ] 판마다 문항 순서와 보기 순서가 바뀐다.
- [ ] 답을 고르면 정답/오답 표시, 한 줄 해설, 출처가 바로 나온다. 출처를 누르면 새 탭에서 열린다.
- [ ] 시작 화면과 결과 화면에 "순위표에 기록되지 않음"이 보이고, 결과 화면에 점수(맞힌 수 / 10)가 보인다.
- [ ] 문항 자동 점검을 통과하고, 출처 확인표를 만들어 두었다(최종 확인은 사람).
- [ ] 브라우저 콘솔에 오류가 없다.

### Task 1.1: 순수 로직(섞기, 보기 섞기, 한 판 준비, 채점)과 자체 점검 틀

**Files:**
- Create: `script.js`
- Create: `questions.js` (빈 뼈대, Task 1.2에서 채움)

**Interfaces:**
- Consumes: 없음
- Produces: `ROUND_SIZE = 10`, `CATEGORIES = ['한국사', '세계지리', '과학', '예술과 문화']`, `shuffle(items: any[], random?: () => number): any[]`, `shuffleChoices(question: Question, random?): Question`, `prepareRound(questions: Question[], category: string, random?): Question[]`, `scoreAnswer(question: Question, choiceIndex: number | null): 0 | 1`, `runSelfTest()`, `checkLogic(check, same)`. `check(ok: boolean, message: string)` 는 점검 하나를 기록하고, `same(a, b)` 는 JSON 문자열로 두 값을 비교한다. `Question` 은 PRD 4.1의 객체 모양이다.

- [ ] **Step 1: `questions.js` 빈 뼈대를 만든다** (첫 줄 일시는 `date` 출력으로 쓴다)

```js
// 생성: 2026-10-08 12:00 KST
const QUESTIONS = [];
```

- [ ] **Step 2: `script.js` 를 상수, 자체 점검, 시작 구역만으로 만든다**

```js
// 생성: 2026-10-08 12:00 KST

const ROUND_SIZE = 10;
const CATEGORIES = ['한국사', '세계지리', '과학', '예술과 문화'];

// ===== 자체 점검: 계획서의 자체 점검 명령이나 index.html?test 로 실행한다 =====

function checkLogic(check, same) {
  const input = [1, 2, 3, 4];
  check(same(shuffle(input, () => 0), [2, 3, 4, 1]), '섞기: random이 늘 0이면 [2, 3, 4, 1]');
  check(same(input, [1, 2, 3, 4]), '섞기: 원본 배열을 바꾸면 안 됨');
  const orders = new Set();
  for (let i = 0; i < 50; i++) orders.add(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).join());
  check(orders.size > 1, '섞기: 섞을 때마다 순서가 달라져야 함');

  const q = { id: 'x', category: '과학', choices: ['가', '나', '다', '라'], answer: 2 };
  let keepsAnswer = true;
  for (let i = 0; i < 50; i++) {
    const s = shuffleChoices(q);
    if (s.choices[s.answer] !== '다' || !same([...s.choices].sort(), ['가', '나', '다', '라'])) keepsAnswer = false;
  }
  check(keepsAnswer, '보기 섞기: 정답 글자가 따라가야 함');
  check(same(q.choices, ['가', '나', '다', '라']) && q.answer === 2, '보기 섞기: 원본 문항을 바꾸면 안 됨');

  const fake = [];
  ['한국사', '과학'].forEach(cat => {
    for (let i = 0; i < 12; i++) {
      fake.push({ id: `${cat}-${i}`, category: cat, choices: ['a', 'b', 'c', 'd'], answer: i % 4 });
    }
  });
  const round = prepareRound(fake, '과학');
  check(round.length === ROUND_SIZE, '한 판 준비: 10문항');
  check(round.every(r => r.category === '과학'), '한 판 준비: 고른 카테고리만');
  check(new Set(round.map(r => r.id)).size === ROUND_SIZE, '한 판 준비: 같은 문항이 두 번 나오면 안 됨');
  check(round.every(r => {
    const orig = fake.find(f => f.id === r.id);
    return r.choices[r.answer] === orig.choices[orig.answer];
  }), '한 판 준비: 정답 위치가 맞아야 함');
  const firstOrders = new Set();
  for (let i = 0; i < 20; i++) firstOrders.add(prepareRound(fake, '과학').map(r => r.id).join());
  check(firstOrders.size > 1, '한 판 준비: 판마다 문항 순서가 달라져야 함');

  check(scoreAnswer(q, 2) === 1, '채점: 정답 1점');
  check(scoreAnswer(q, 0) === 0, '채점: 오답 0점');
  check(scoreAnswer(q, null) === 0, '채점: 시간 초과 0점');
}

function runSelfTest() {
  const failures = [];
  let count = 0;
  const check = (ok, message) => {
    count += 1;
    if (!ok) failures.push(message);
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  checkLogic(check, same);

  if (failures.length > 0) {
    console.error(`자체 점검: 실패 ${failures.length}개\n- ${failures.join('\n- ')}`);
    if (typeof process !== 'undefined') process.exitCode = 1;
  } else {
    console.log(`자체 점검: 통과 (${count}개)`);
  }
}

// ===== 시작 =====

if (typeof document !== 'undefined') {
  init();
  if (new URLSearchParams(location.search).has('test')) runSelfTest();
} else {
  runSelfTest();
}
```

- [ ] **Step 3: 자체 점검 명령을 실행해 실패를 본다**

Expected: `ReferenceError: shuffle is not defined`

- [ ] **Step 4: 상수 바로 아래(자체 점검 구역 위)에 순수 로직을 넣는다**

```js

// ===== 순수 로직: DOM에 손대지 않는다 =====

function shuffle(items, random = Math.random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleChoices(question, random = Math.random) {
  const order = shuffle(question.choices.map((_, i) => i), random);
  return {
    ...question,
    choices: order.map(i => question.choices[i]),
    answer: order.indexOf(question.answer)
  };
}

function prepareRound(questions, category, random = Math.random) {
  return shuffle(questions.filter(q => q.category === category), random)
    .slice(0, ROUND_SIZE)
    .map(q => shuffleChoices(q, random));
}

function scoreAnswer(question, choiceIndex) {
  return choiceIndex === question.answer ? 1 : 0;
}
```

- [ ] **Step 5: 자체 점검 명령을 다시 실행한다**

Expected: `자체 점검: 통과 (13개)`

- [ ] **Step 6: 커밋**

```bash
git add script.js questions.js && git commit -m "섞기, 한 판 준비, 채점 로직과 자체 점검 추가"
```

### Task 1.2: 문항 40개, 문항 자동 점검, 출처 확인표

**Files:**
- Modify: `script.js` (자체 점검 구역에 `checkQuestions` 추가)
- Modify: `questions.js` (40문항 채우기)
- Create: `SOURCE-CHECK.md`

**Interfaces:**
- Consumes: `CATEGORIES`, `runSelfTest`(Task 1.1)
- Produces: 전역 상수 `QUESTIONS: Question[]`(40개), `checkQuestions(check)`. `id` 는 `history-01`~`history-10`(한국사), `geography-01`~(세계지리), `science-01`~(과학), `culture-01`~(예술과 문화).

- [ ] **Step 1: 자체 점검 구역의 `checkLogic` 바로 아래에 `checkQuestions` 를 넣는다**

```js

function checkQuestions(check) {
  if (typeof QUESTIONS === 'undefined' || !Array.isArray(QUESTIONS)) {
    check(false, '문항: QUESTIONS가 없음(questions.js를 먼저 불러와야 함)');
    return;
  }
  const PREFIX = { '한국사': 'history', '세계지리': 'geography', '과학': 'science', '예술과 문화': 'culture' };
  check(QUESTIONS.length === 40, `문항: 40개여야 함(지금 ${QUESTIONS.length}개)`);
  CATEGORIES.forEach(cat => {
    const n = QUESTIONS.filter(q => q.category === cat).length;
    check(n === 10, `문항: ${cat} 10개여야 함(지금 ${n}개)`);
  });
  const ids = new Set();
  QUESTIONS.forEach((q, n) => {
    const where = `문항 ${q.id || (n + 1) + '번째'}`;
    check(/^(history|geography|science|culture)-\d{2}$/.test(q.id || '') &&
      PREFIX[q.category] === q.id.split('-')[0], `${where}: id 형식이나 카테고리가 맞지 않음`);
    check(!ids.has(q.id), `${where}: id 중복`);
    ids.add(q.id);
    check(typeof q.question === 'string' && q.question.trim() !== '', `${where}: 문제 없음`);
    const choices = Array.isArray(q.choices) ? q.choices : [];
    check(choices.length === 4 && choices.every(c => typeof c === 'string' && c.trim() !== '') &&
      new Set(choices.map(c => c.trim())).size === 4, `${where}: 보기 4개가 서로 달라야 함`);
    check([0, 1, 2, 3].includes(q.answer), `${where}: 정답 위치가 0~3이 아님`);
    check(typeof q.explanation === 'string' && q.explanation.trim() !== '' && !q.explanation.includes('\n'),
      `${where}: 한 줄 해설이 없음`);
    check(Boolean(q.source) && typeof q.source.name === 'string' && q.source.name.trim() !== '',
      `${where}: 출처 기관명 없음`);
    let url = null;
    try { url = new URL(q.source.url); } catch (e) { url = null; }
    check(url !== null && /^https?:$/.test(url.protocol) && (url.pathname.length > 1 || url.search !== ''),
      `${where}: 출처 주소가 없거나 사이트 첫 화면임`);
    if (/가장|최대|최소|최고|제일/.test(q.question || '') && !/\d{4}년|기준/.test(q.question)) {
      console.warn(`경고 ${where}: 최상급 표현에 기준이나 시점이 없어 보임`);
    }
  });
}
```

`runSelfTest` 의 `checkLogic(check, same);` 바로 아래에 넣는다.

```js
  checkQuestions(check);
```

- [ ] **Step 2: 자체 점검 명령을 실행해 실패를 본다**

Expected: `자체 점검: 실패 5개` 와 `문항: 40개여야 함(지금 0개)`, 카테고리별 `10개여야 함(지금 0개)` 4줄

- [ ] **Step 3: 카테고리마다 10문항을 쓰고, 출처 페이지를 하나씩 열어 확인한다**

`questions.js` 의 빈 배열을 채운다. 문항 하나의 모양은 아래와 같다. `source.url` 은 사이트 첫 화면이 아니라 해설 내용이 실제로 적힌 문서 주소여야 하며, 아래 예시의 `url` 도 실제로 열어 확인한 문서 주소로 바꿔 쓴다.

```js
const QUESTIONS = [
  {
    id: "history-01",
    category: "한국사",
    question: "1443년 훈민정음을 창제한 조선의 왕은?",
    choices: ["세종", "태종", "세조", "성종"],
    answer: 0,
    explanation: "세종은 1443년 훈민정음을 창제하고 1446년 반포했다.",
    source: { name: "한국민족문화대백과사전", url: "(실제로 연 '훈민정음' 문서 주소)" }
  }
  // … 카테고리마다 10개씩, 총 40개
];
```

문항 규칙(PRD 4.2):
1. 문항마다 정답은 하나만이어야 한다. 오답 보기 중에 정답으로 볼 여지가 있는 것이 없는지 본다.
2. 해설은 한 줄이고, 출처(기관명과 주소)를 남긴다.
3. "가장 ~한" 같은 최상급 표현을 쓰면 문제에 기준과 시점을 적는다(예: "2024년 기준 면적이 가장 넓은 나라는?").

출처 고르는 기준: 공공기관, 국립 박물관, 학술 백과사전(한국민족문화대백과사전, 우리역사넷 등), 국제기구, 과학 기관(NASA 등)이 운영하는 페이지를 쓴다. 개인 블로그, 위키 사이트, 커뮤니티 글은 쓰지 않는다.

문항 하나마다 다음 순서로 한다.
1. 내장 브라우저로 출처 페이지를 연다(`get_page_text` 로 본문을 읽는다).
2. 문제, 정답, 해설의 사실이 페이지 내용과 맞는지 본다. 맞지 않으면 문항을 고치거나 출처를 바꾼다.
3. `SOURCE-CHECK.md` 에 한 줄을 남긴다.

- [ ] **Step 4: `SOURCE-CHECK.md` 를 만든다**

```markdown
<!-- 생성: 2026-10-08 12:10 KST -->

# 문항 출처 확인표

클로드가 출처 페이지를 열어 해설과 맞는지 확인한 결과다. 마지막 열은 사람이 최종 확인한 뒤 채운다.

| id | 정답 | 출처 기관 | 주소 | 페이지에서 확인한 내용 | 해설과 일치 | 사람 확인 |
|---|---|---|---|---|---|---|
| history-01 | 세종 | 한국민족문화대백과사전 | https://… | 1443년 창제, 1446년 반포 | O | |
```

40줄을 모두 채운다. 확인하지 못한 문항은 "해설과 일치" 칸에 X를 쓰고 그 문항을 다른 문항으로 바꾼다.

- [ ] **Step 5: 자체 점검 명령을 다시 실행한다**

Expected: `자체 점검: 통과 (N개)`. `경고` 줄이 나오면 해당 문제에 기준과 시점을 넣거나, 최상급이 아닌 표현이면 그대로 두고 확인표 메모에 이유를 적는다.

- [ ] **Step 6: 커밋**

```bash
git add script.js questions.js SOURCE-CHECK.md && git commit -m "문항 40개, 문항 자동 점검, 출처 확인표 추가"
```

### Task 1.3: 연습 모드 화면

**Files:**
- Create: `index.html`, `style.css`
- Modify: `script.js` (순수 로직 구역과 자체 점검 구역 사이에 상태, 화면 조작 구역 추가)

**Interfaces:**
- Consumes: `QUESTIONS`(Task 1.2), `CATEGORIES`, `ROUND_SIZE`, `prepareRound`, `scoreAnswer`(Task 1.1)
- Produces: `state` 객체(`mode`, `category`, `round`, `index`, `score`, `correctCount`, `answered`), `$(id)`, `showScreen(name)`, `renderCategories()`, `startRound(category)`, `showQuestion()`, `renderScore()`, `handleAnswer(choiceIndex)`, `showFeedback(question, choiceIndex)`, `goNext()`, `showResult()`, `init()`. 화면 요소 id는 아래 HTML을 따른다.

- [ ] **Step 1: `index.html` 을 만든다**

```html
<!-- 생성: 2026-10-08 12:30 KST -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="app">
    <section id="screen-start" class="screen">
      <h1>상식 퀴즈</h1>
      <p class="notice">연습 모드: 순위표에 기록되지 않음</p>
      <h2>카테고리</h2>
      <div id="category-list" class="button-list"></div>
    </section>

    <section id="screen-question" class="screen" hidden>
      <div class="status">
        <span id="progress"></span>
        <span id="score"></span>
      </div>
      <p id="question-text" class="question"></p>
      <div id="choice-list" class="choice-list"></div>
      <div id="feedback" class="feedback" hidden>
        <p id="feedback-result" class="feedback-result"></p>
        <p id="feedback-explanation"></p>
        <p class="source">출처: <a id="feedback-source" target="_blank" rel="noopener noreferrer"></a></p>
        <button id="next-button" type="button" class="primary"></button>
      </div>
    </section>

    <section id="screen-result" class="screen" hidden>
      <h2>결과</h2>
      <p id="result-score" class="result-score"></p>
      <p id="result-count"></p>
      <p id="result-notice" class="notice">순위표에 기록되지 않음</p>
      <div class="button-row">
        <button id="again-button" type="button" class="primary">다시 하기</button>
        <button id="home-button" type="button">처음으로</button>
      </div>
    </section>
  </main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css` 를 만든다**

```css
/* 생성: 2026-10-08 12:30 KST */
:root {
  --bg: #f5f6fa;
  --card: #ffffff;
  --text: #222222;
  --muted: #666666;
  --primary: #3b5bdb;
  --border: #d0d4e0;
  --correct: #2f9e44;
  --correct-bg: #ebfbee;
  --wrong: #e03131;
  --wrong-bg: #fff5f5;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Malgun Gothic", sans-serif;
  line-height: 1.5;
}

.app { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
.screen { background: var(--card); border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
h1 { margin: 0 0 12px; font-size: 1.6rem; }
h2 { margin: 20px 0 8px; font-size: 1.1rem; }

button {
  font: inherit;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--text);
  cursor: pointer;
}
button:disabled { cursor: default; }
button.primary { background: var(--primary); border-color: var(--primary); color: #ffffff; }

.notice { color: var(--muted); font-size: 0.9rem; }
.button-list, .choice-list { display: grid; gap: 8px; }
.button-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }

.status { display: flex; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 0.9rem; }
.question { margin: 12px 0 16px; font-size: 1.15rem; font-weight: 600; overflow-wrap: anywhere; }
.choice { width: 100%; text-align: left; overflow-wrap: anywhere; }
.choice.correct { border-color: var(--correct); background: var(--correct-bg); color: var(--correct); font-weight: 600; }
.choice.wrong { border-color: var(--wrong); background: var(--wrong-bg); color: var(--wrong); }

.feedback { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
.feedback-result { margin: 0 0 4px; font-weight: 700; }
.source { color: var(--muted); font-size: 0.9rem; overflow-wrap: anywhere; }
.source a { color: var(--primary); }

.result-score { margin: 8px 0; font-size: 2rem; font-weight: 700; }
```

- [ ] **Step 3: `script.js` 의 순수 로직 구역 끝(`// ===== 자체 점검` 줄 바로 위)에 상태와 화면 조작 구역을 넣는다**

```js

// ===== 상태 =====

const state = {
  mode: 'practice',
  category: null,
  round: [],
  index: 0,
  score: 0,
  correctCount: 0,
  answered: false
};

// ===== 화면 조작 =====

const $ = id => document.getElementById(id);

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.hidden = screen.id !== `screen-${name}`;
  });
}

function renderCategories() {
  const list = $('category-list');
  CATEGORIES.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.addEventListener('click', () => startRound(category));
    list.appendChild(button);
  });
}

function startRound(category) {
  state.category = category;
  state.round = prepareRound(QUESTIONS, category);
  state.index = 0;
  state.score = 0;
  state.correctCount = 0;
  showScreen('question');
  showQuestion();
}

function renderScore() {
  $('score').textContent = `점수 ${state.score}`;
}

function showQuestion() {
  const q = state.round[state.index];
  state.answered = false;
  $('progress').textContent = `${state.index + 1} / ${state.round.length}`;
  renderScore();
  $('question-text').textContent = q.question;
  const list = $('choice-list');
  list.innerHTML = '';
  q.choices.forEach((choice, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = choice;
    button.addEventListener('click', () => handleAnswer(i));
    list.appendChild(button);
  });
  $('feedback').hidden = true;
}

function handleAnswer(choiceIndex) {
  if (state.answered) return;
  state.answered = true;
  const q = state.round[state.index];
  const points = scoreAnswer(q, choiceIndex);
  state.score += points;
  if (points > 0) state.correctCount += 1;
  showFeedback(q, choiceIndex);
}

function showFeedback(q, choiceIndex) {
  Array.from($('choice-list').children).forEach((button, i) => {
    button.disabled = true;
    if (i === q.answer) button.classList.add('correct');
    else if (i === choiceIndex) button.classList.add('wrong');
  });
  renderScore();
  $('feedback-result').textContent = choiceIndex === q.answer ? '정답입니다.' : '오답입니다.';
  $('feedback-explanation').textContent = q.explanation;
  $('feedback-source').textContent = q.source.name;
  $('feedback-source').href = q.source.url;
  $('next-button').textContent = state.index === state.round.length - 1 ? '결과 보기' : '다음';
  $('feedback').hidden = false;
}

function goNext() {
  if (state.index < state.round.length - 1) {
    state.index += 1;
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  $('result-score').textContent = `${state.score} / ${ROUND_SIZE}`;
  $('result-count').textContent = `${ROUND_SIZE}문제 중 ${state.correctCount}개 맞힘`;
  showScreen('result');
}

function init() {
  renderCategories();
  $('next-button').addEventListener('click', goNext);
  $('again-button').addEventListener('click', () => startRound(state.category));
  $('home-button').addEventListener('click', () => showScreen('start'));
}
```

- [ ] **Step 4: 자체 점검 명령을 다시 실행한다**

Expected: `자체 점검: 통과 (N개)`. 화면 코드가 Node에서 실행되지 않음을 함께 확인하는 셈이다.

- [ ] **Step 5: 커밋**

```bash
git add index.html style.css script.js && git commit -m "1단계: 연습 모드 화면 구현"
```

## 1단계 마무리 (멈춤)

- [ ] 자체 점검 명령이 `자체 점검: 통과` 로 끝나고, 1단계 커밋이 모두 들어갔는지 `git log --oneline` 으로 본다.
- [ ] 사용자에게 보고한다: 만든 파일, 자체 점검 결과(점검 개수와 경고 줄), `SOURCE-CHECK.md` 에서 사람이 확인할 칸, 아래 "1단계 브라우저에서 직접 확인할 항목".
- [ ] **여기서 멈춘다.** 사용자가 브라우저 확인을 마치고 2단계를 시작하라고 할 때까지 2단계 Task에 손대지 않는다. 확인 중 문제가 나오면 그것부터 고친다.

## 1단계 브라우저에서 직접 확인할 항목

`index.html` 을 탐색기에서 **더블클릭**해 연다(주소창이 `file:///` 로 시작해야 한다).

- [ ] 시작 화면에 카테고리 버튼 4개(한국사, 세계지리, 과학, 예술과 문화)와 "순위표에 기록되지 않음"이 보인다.
- [ ] 카테고리 4개를 하나씩 골라 각각 10문제를 끝까지 푼다. 진행 표시가 1 / 10부터 10 / 10까지 바뀐다.
- [ ] 같은 카테고리를 두 번 시작해 첫 문제와 보기 순서가 달라지는지 본다(우연히 같을 수 있으니 2~3번 해 본다).
- [ ] 정답을 고르면 그 보기가 초록, "정답입니다."가 나오고 점수가 1 오른다.
- [ ] 오답을 고르면 고른 보기가 빨강, 정답 보기가 초록, "오답입니다."가 나온다.
- [ ] 답을 고른 뒤에는 다른 보기를 눌러도 아무 일이 없다.
- [ ] 해설이 한 줄로 나오고, "출처: 기관명"의 기관명을 누르면 새 탭에서 출처 페이지가 열린다.
- [ ] 마지막 문제에서는 버튼이 [다음] 대신 [결과 보기]다.
- [ ] 결과 화면에 "7 / 10"처럼 점수, "10문제 중 7개 맞힘", "순위표에 기록되지 않음"이 보인다.
- [ ] [다시 하기]는 같은 카테고리로 새 판을 0점부터 시작하고, [처음으로]는 시작 화면으로 간다.
- [ ] 주소 끝에 `?test` 를 붙여 다시 열면 F12 → Console에 `자체 점검: 통과` 가 나온다.
- [ ] F12 → Console에 빨간 오류가 없다.
- [ ] F12 → 기기 툴바에서 너비 375로 바꿔도 가로 스크롤이 생기지 않는다.
- [ ] `SOURCE-CHECK.md` 를 열어 출처 몇 개를 직접 눌러 보고 "사람 확인" 칸을 채운다.

---

# 2단계: 스피드, 힌트, 모드 선택, 틀린 문제 다시 풀기

## 만들 것

- 시작 화면: 모드 3개(연습, 스피드, 힌트)를 설명과 함께 고르는 칸
- 스피드 모드: 문항마다 15초 타이머, 시간 초과 처리
- 힌트 모드: [힌트] 버튼, 오답 2개 지우기, 0.5점
- 연습 모드 결과 화면: [틀린 문제 다시 풀기]와 다시 푼 결과
- 순수 로직과 자체 점검: `scoreAnswer` 의 힌트 점수, `pickHintRemovals`

## 완료 기준 (PRD 6절)

- [ ] 시작 화면에서 모드 3개 중 하나를 고르고, 카테고리를 골라 시작한다.
- [ ] 스피드: 15초가 1초씩 줄고, 시간이 다 되면 "시간 초과"로 오답 처리되며 해설이 나온다.
- [ ] 스피드: 해설이 나와 있는 동안 타이머가 멈추고, [다음]을 누르면 15초부터 다시 센다.
- [ ] 힌트: [힌트]를 누르면 오답 2개가 지워지고, 그 문항에서 다시 누를 수 없다.
- [ ] 힌트: 힌트를 쓰고 맞히면 0.5점, 틀리면 0점이며, 결과에 7.5처럼 소수점 점수가 나온다.
- [ ] 다시 풀기: 틀린 문제가 있을 때만 버튼이 보이고, 틀린 문항만 다시 푼다.
- [ ] 다시 풀기: 또 틀리면 버튼이 다시 나오고, 다 맞히면 사라진다. 원래 점수는 바뀌지 않는다.
- [ ] 1단계 동작이 그대로 유지된다.

### Task 2.1: 힌트 점수와 지울 오답 고르기(순수 로직)

**Files:**
- Modify: `script.js` (순수 로직 구역의 `scoreAnswer` 교체와 `pickHintRemovals` 추가, 자체 점검 구역에 `checkHint` 추가)

**Interfaces:**
- Consumes: `shuffle`, `runSelfTest`(Task 1.1)
- Produces: `scoreAnswer(question, choiceIndex: number | null, usedHint = false): 0 | 0.5 | 1`, `pickHintRemovals(question, random?): number[]`(길이 2, 정답 위치 제외, 서로 다름), `checkHint(check)`

- [ ] **Step 1: 자체 점검 구역의 `checkQuestions` 바로 아래에 `checkHint` 를 넣는다**

```js

function checkHint(check) {
  const q = { id: 'x', choices: ['가', '나', '다', '라'], answer: 1 };
  check(scoreAnswer(q, 1, false) === 1, '힌트 채점: 힌트 없이 맞히면 1점');
  check(scoreAnswer(q, 1, true) === 0.5, '힌트 채점: 힌트를 쓰고 맞히면 0.5점');
  check(scoreAnswer(q, 0, true) === 0, '힌트 채점: 힌트를 쓰고 틀리면 0점');
  check([1, 0.5, 1, 0.5, 1, 1, 0.5, 1, 1, 0].reduce((a, b) => a + b, 0) === 7.5,
    '힌트 채점: 0.5점을 더해도 7.5처럼 정확해야 함');
  let valid = true;
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const removed = pickHintRemovals(q);
    if (removed.length !== 2 || removed[0] === removed[1] || removed.includes(q.answer) ||
        !removed.every(n => [0, 1, 2, 3].includes(n))) valid = false;
    seen.add([...removed].sort().join());
  }
  check(valid, '힌트: 정답이 아닌 서로 다른 보기 2개를 골라야 함');
  check(seen.size > 1, '힌트: 지우는 오답이 무작위여야 함');
}
```

`runSelfTest` 의 `checkQuestions(check);` 바로 아래에 넣는다.

```js
  checkHint(check);
```

- [ ] **Step 2: 자체 점검 명령을 실행해 실패를 본다**

Expected: `ReferenceError: pickHintRemovals is not defined`

- [ ] **Step 3: 순수 로직 구역의 `scoreAnswer` 를 아래로 바꾸고 바로 뒤에 `pickHintRemovals` 를 넣는다**

```js
function scoreAnswer(question, choiceIndex, usedHint = false) {
  if (choiceIndex !== question.answer) return 0;
  return usedHint ? 0.5 : 1;
}

function pickHintRemovals(question, random = Math.random) {
  const wrongIndexes = question.choices.map((_, i) => i).filter(i => i !== question.answer);
  return shuffle(wrongIndexes, random).slice(0, 2);
}
```

- [ ] **Step 4: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`(1단계 점검 포함)

- [ ] **Step 5: 커밋**

```bash
git add script.js && git commit -m "힌트 점수와 지울 오답 고르기 로직 추가"
```

### Task 2.2: 모드 선택과 스피드 모드

**Files:**
- Modify: `index.html` (시작 화면 교체, 문제 화면에 남은 시간 추가)
- Modify: `style.css` (끝에 추가)
- Modify: `script.js` (상수, 상태, 화면 조작)

**Interfaces:**
- Consumes: Task 1.3의 화면 조작 함수, `scoreAnswer`(Task 2.1)
- Produces: `TIME_LIMIT = 15`, `state.timerId`, `state.timeLeft`, `selectedMode(): 'practice' | 'speed' | 'hint'`, `startRound(mode, category)`(인자 2개로 바뀜), `startTimer()`, `tick()`, `stopTimer()`, `renderTimer()`. `handleAnswer(null)` 은 시간 초과를 뜻한다.

- [ ] **Step 1: `index.html` 의 `screen-start` 섹션 전체를 아래로 바꾼다**

```html
    <section id="screen-start" class="screen">
      <h1>상식 퀴즈</h1>
      <h2>모드</h2>
      <div class="mode-list">
        <label class="mode">
          <input type="radio" name="mode" value="practice" checked>
          <span class="mode-text">
            <strong>연습</strong>
            <span>시간 제한과 힌트가 없습니다. 맞히면 1점입니다.</span>
            <span class="notice">순위표에 기록되지 않음</span>
          </span>
        </label>
        <label class="mode">
          <input type="radio" name="mode" value="speed">
          <span class="mode-text">
            <strong>스피드</strong>
            <span>문항마다 15초 안에 답합니다. 시간이 지나면 오답입니다.</span>
          </span>
        </label>
        <label class="mode">
          <input type="radio" name="mode" value="hint">
          <span class="mode-text">
            <strong>힌트</strong>
            <span>문항마다 한 번 오답 2개를 지울 수 있습니다. 힌트를 쓰고 맞히면 0.5점입니다.</span>
          </span>
        </label>
      </div>
      <h2>카테고리</h2>
      <div id="category-list" class="button-list"></div>
    </section>
```

- [ ] **Step 2: 문제 화면의 `.status` 안, `<span id="score"></span>` 바로 뒤에 남은 시간을 넣는다**

```html
        <span id="timer" class="timer" hidden></span>
```

- [ ] **Step 3: `style.css` 끝에 추가한다**

```css

.mode-list { display: grid; gap: 8px; }
.mode { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; }
.mode:has(input:checked) { border-color: var(--primary); background: #edf2ff; }
.mode input { margin-top: 4px; }
.mode-text { display: grid; gap: 2px; }
.mode-text .notice { margin: 0; }
.timer { font-weight: 700; color: var(--wrong); }
```

- [ ] **Step 4: `script.js` 를 고친다**

(1) `CATEGORIES` 줄 바로 아래에 넣는다.

```js
const TIME_LIMIT = 15;
```

(2) `state` 객체의 `answered: false` 를 아래로 바꾼다.

```js
  answered: false,
  timerId: null,
  timeLeft: 0
```

(3) `renderCategories` 바로 위에 `selectedMode` 를 넣고, `renderCategories` 안의 클릭 처리 줄을 바꾼다.

```js
function selectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}
```

```js
    button.addEventListener('click', () => startRound(selectedMode(), category));
```

(4) `startRound` 를 통째로 바꾼다.

```js
function startRound(mode, category) {
  state.mode = mode;
  state.category = category;
  state.round = prepareRound(QUESTIONS, category);
  state.index = 0;
  state.score = 0;
  state.correctCount = 0;
  showScreen('question');
  showQuestion();
}
```

(5) `showQuestion` 끝의 `$('feedback').hidden = true;` 바로 뒤에 넣는다.

```js
  $('timer').hidden = state.mode !== 'speed';
  if (state.mode === 'speed') startTimer();
```

(6) `handleAnswer` 를 통째로 바꾼다. `state.answered` 확인이 맨 앞에 있어야 답한 뒤 타이머가 한 번 더 돌아도 다시 채점되지 않는다.

```js
function handleAnswer(choiceIndex) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  const q = state.round[state.index];
  const points = scoreAnswer(q, choiceIndex);
  state.score += points;
  if (points > 0) state.correctCount += 1;
  showFeedback(q, choiceIndex);
}
```

(7) `showFeedback` 의 `$('feedback-result').textContent = …` 한 줄을 아래로 바꾼다.

```js
  let result = '오답입니다.';
  if (choiceIndex === null) result = '시간 초과입니다. 오답으로 처리합니다.';
  else if (choiceIndex === q.answer) result = '정답입니다.';
  $('feedback-result').textContent = result;
```

(8) `showResult` 의 `showScreen('result');` 바로 앞에 넣는다.

```js
  $('result-notice').hidden = state.mode !== 'practice';
```

(9) `goNext` 바로 아래에 타이머 함수를 넣는다. `startTimer` 가 먼저 `stopTimer` 를 불러 타이머가 둘 생기지 않게 한다.

```js
function renderTimer() {
  $('timer').textContent = `남은 시간 ${state.timeLeft}초`;
}

function startTimer() {
  stopTimer();
  state.timeLeft = TIME_LIMIT;
  renderTimer();
  state.timerId = setInterval(tick, 1000);
}

function tick() {
  state.timeLeft -= 1;
  renderTimer();
  if (state.timeLeft <= 0) handleAnswer(null);
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}
```

(10) `init` 의 [다시 하기] 줄을 바꾼다.

```js
  $('again-button').addEventListener('click', () => startRound(state.mode, state.category));
```

- [ ] **Step 5: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js && git commit -m "모드 선택과 스피드 모드 추가"
```

### Task 2.3: 힌트 모드

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `pickHintRemovals`, `scoreAnswer(q, i, usedHint)`(Task 2.1), Task 2.2의 `handleAnswer`, `showQuestion`
- Produces: `state.usedHint: boolean`, `useHint()`

- [ ] **Step 1: `index.html` 문제 화면에서 `<div id="choice-list" …></div>` 바로 아래에 넣는다**

```html
      <button id="hint-button" type="button" class="hint-button" hidden>힌트</button>
```

- [ ] **Step 2: `style.css` 끝에 추가한다**

지운 보기는 자리를 비워 두어 다른 보기의 위치가 움직이지 않게 한다.

```css

.choice.removed { visibility: hidden; }
.hint-button { margin-top: 12px; }
```

- [ ] **Step 3: `script.js` 를 고친다**

(1) `state` 의 `answered: false,` 바로 아래에 넣는다.

```js
  usedHint: false,
```

(2) `showQuestion` 의 `state.answered = false;` 바로 아래에 넣는다.

```js
  state.usedHint = false;
```

같은 함수 끝(타이머 줄 뒤)에 넣는다.

```js
  $('hint-button').hidden = state.mode !== 'hint';
  $('hint-button').disabled = false;
```

(3) `handleAnswer` 의 `const points = scoreAnswer(q, choiceIndex);` 를 아래로 바꾸고, `showFeedback(q, choiceIndex);` 바로 앞에 힌트 버튼 잠금을 넣는다.

```js
  const points = scoreAnswer(q, choiceIndex, state.usedHint);
```

```js
  $('hint-button').disabled = true;
```

(4) `handleAnswer` 바로 아래에 `useHint` 를 넣는다.

```js
function useHint() {
  if (state.answered || state.usedHint) return;
  state.usedHint = true;
  const buttons = $('choice-list').children;
  pickHintRemovals(state.round[state.index]).forEach(i => {
    buttons[i].disabled = true;
    buttons[i].classList.add('removed');
  });
  $('hint-button').disabled = true;
}
```

(5) `init` 에 한 줄 넣는다.

```js
  $('hint-button').addEventListener('click', useHint);
```

- [ ] **Step 4: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`

- [ ] **Step 5: 커밋**

```bash
git add index.html style.css script.js && git commit -m "힌트 모드 추가"
```

### Task 2.4: 틀린 문제 다시 풀기(연습 모드)

**Files:**
- Modify: `index.html`, `script.js`

**Interfaces:**
- Consumes: `shuffle`, `shuffleChoices`(Task 1.1), Task 2.3까지의 화면 조작 함수
- Produces: `state.wrong: Question[]`(처음 10문제에서 틀린 문항), `state.retry: null | { correct: number, wrong: Question[] }`(다시 푸는 중이면 객체), `startRetry()`

- [ ] **Step 1: `index.html` 결과 화면에서 `<p id="result-notice" …>` 바로 아래에 넣고, `.button-row` 안 맨 앞에 버튼을 넣는다**

```html
      <p id="retry-result" hidden></p>
```

```html
        <button id="retry-button" type="button" hidden>틀린 문제 다시 풀기</button>
```

- [ ] **Step 2: `script.js` 를 고친다**

(1) `state` 의 `usedHint: false,` 바로 아래에 넣는다.

```js
  wrong: [],
  retry: null,
```

(2) `startRound` 의 `state.correctCount = 0;` 바로 아래에 넣는다. 새 판마다 이전 판의 틀린 목록과 다시 풀기 상태를 지운다.

```js
  state.wrong = [];
  state.retry = null;
```

(3) `renderScore` 를 바꾼다. 다시 푸는 동안에는 점수가 바뀌지 않으므로 점수 대신 "다시 풀기"를 보여 준다.

```js
function renderScore() {
  $('score').textContent = state.retry ? '다시 풀기' : `점수 ${state.score}`;
}
```

(4) `handleAnswer` 를 통째로 바꾼다.

```js
function handleAnswer(choiceIndex) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  const q = state.round[state.index];
  const points = scoreAnswer(q, choiceIndex, state.usedHint);
  if (state.retry) {
    if (points > 0) state.retry.correct += 1;
    else state.retry.wrong.push(q);
  } else {
    state.score += points;
    if (points > 0) state.correctCount += 1;
    else state.wrong.push(q);
  }
  $('hint-button').disabled = true;
  showFeedback(q, choiceIndex);
}
```

(5) `showResult` 를 통째로 바꾼다.

```js
function showResult() {
  $('result-score').textContent = `${state.score} / ${ROUND_SIZE}`;
  $('result-count').textContent = `${ROUND_SIZE}문제 중 ${state.correctCount}개 맞힘`;
  const isPractice = state.mode === 'practice';
  $('result-notice').hidden = !isPractice;
  $('retry-result').hidden = !state.retry;
  if (state.retry) {
    $('retry-result').textContent = `다시 풀기: ${state.round.length}문제 중 ${state.retry.correct}개 맞힘`;
  }
  const remaining = state.retry ? state.retry.wrong : state.wrong;
  $('retry-button').hidden = !isPractice || remaining.length === 0;
  showScreen('result');
}
```

(6) `showResult` 바로 아래에 `startRetry` 를 넣는다. 틀린 목록을 먼저 꺼낸 뒤 `state.retry` 를 새로 만든다.

```js
function startRetry() {
  const source = state.retry ? state.retry.wrong : state.wrong;
  state.round = shuffle(source).map(q => shuffleChoices(q));
  state.index = 0;
  state.retry = { correct: 0, wrong: [] };
  showScreen('question');
  showQuestion();
}
```

(7) `init` 에 한 줄 넣는다.

```js
  $('retry-button').addEventListener('click', startRetry);
```

- [ ] **Step 3: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`

- [ ] **Step 4: 커밋**

```bash
git add index.html script.js && git commit -m "2단계: 틀린 문제 다시 풀기 추가"
```

## 2단계 마무리 (멈춤)

- [ ] 자체 점검 명령이 `자체 점검: 통과` 로 끝나고, 2단계 커밋이 모두 들어갔는지 `git log --oneline` 으로 본다.
- [ ] 사용자에게 보고한다: 바꾼 파일, 자체 점검 결과, 아래 "2단계 브라우저에서 직접 확인할 항목"(특히 Review Focus 1번, 5번).
- [ ] **여기서 멈춘다.** 사용자가 브라우저 확인을 마치고 3단계를 시작하라고 할 때까지 3단계 Task에 손대지 않는다. 확인 중 문제가 나오면 그것부터 고친다.

## 2단계 브라우저에서 직접 확인할 항목

`index.html` 을 더블클릭해 연다.

**모드 선택**
- [ ] 시작 화면에 모드 3개가 설명과 함께 보이고, 연습 설명에 "순위표에 기록되지 않음"이 있다.
- [ ] 모드를 고른 뒤 카테고리를 누르면 그 모드로 시작한다.

**스피드**
- [ ] 문제가 나오면 "남은 시간 15초"부터 1초씩 줄어든다.
- [ ] 아무것도 누르지 않고 0초가 되면 "시간 초과입니다. 오답으로 처리합니다."와 정답(초록), 해설이 나오고 점수는 오르지 않는다.
- [ ] 답을 고르면 숫자가 그 자리에서 멈추고, 해설을 읽는 동안 줄지 않는다.
- [ ] [다음]을 누르면 다음 문항이 다시 15초부터 센다.
- [ ] (Review Focus 1) 1초쯤 남았을 때 보기를 누르면, 0초가 지나도 "시간 초과"로 바뀌지 않는다.
- [ ] (Review Focus 1) [다음]을 빠르게 여러 번 눌러도 숫자가 1초에 2씩 줄지 않는다.
- [ ] 결과 화면에 "순위표에 기록되지 않음"과 [틀린 문제 다시 풀기]가 보이지 않는다.

**힌트**
- [ ] 문제마다 [힌트] 버튼이 있고, 누르면 오답 보기 2개가 사라지며 버튼이 비활성화된다.
- [ ] 정답 보기는 절대 사라지지 않는다(여러 문항에서 확인).
- [ ] 다음 문항으로 가면 [힌트]가 다시 눌린다.
- [ ] 힌트를 쓰지 않고 답을 고르면 [힌트]가 비활성화된다.
- [ ] 힌트를 쓰고 맞히면 점수가 0.5 오르고, 결과 화면에 "7.5 / 10"처럼 소수점 점수가 나온다.
- [ ] 스피드 모드에는 [힌트]가 없고, 힌트 모드에는 남은 시간이 없다.

**틀린 문제 다시 풀기(연습)**
- [ ] 일부러 3문제쯤 틀리면 결과 화면에 [틀린 문제 다시 풀기]가 보인다.
- [ ] 누르면 틀린 문항만 "1 / 3"부터 나오고, 위쪽에 점수 대신 "다시 풀기"가 보인다.
- [ ] 다시 풀어 1개를 또 틀리면 결과에 "다시 풀기: 3문제 중 2개 맞힘"과 버튼이 다시 나오고, 원래 점수는 그대로다.
- [ ] 남은 문제를 다 맞히면 버튼이 사라진다.
- [ ] 10문제를 다 맞힌 판에는 처음부터 버튼이 없다.
- [ ] (Review Focus 5) 다시 풀기 결과 화면에서 [다시 하기]를 누르면 "1 / 10", "점수 0"으로 새 판이 시작되고, 이 판을 다 맞히면 버튼이 보이지 않는다.
- [ ] (Review Focus 5) 힌트 모드 한 판 뒤 [처음으로] → 연습 모드로 시작하면 [힌트]와 남은 시간이 보이지 않는다.

**공통**
- [ ] 1단계 브라우저 확인 항목을 연습 모드로 다시 해 보고 모두 그대로 동작한다.
- [ ] `index.html?test` 의 Console에 `자체 점검: 통과` 가 나온다.
- [ ] F12 → Console에 빨간 오류가 없고, 너비 375에서 가로 스크롤이 없다.

---

# 3단계: 점수 저장과 순위표

## 만들 것

- 순수 로직과 자체 점검: 이름 다듬기, 기록 넣기(정렬 후 5건), 표 꺼내기, 저장소 읽기와 쓰기
- 결과 화면(스피드, 힌트): 이름 입력 칸과 [기록하기]
- 순위표 화면: 모드와 카테고리를 골라 상위 5건 보기
- 시작 화면: 순위표로 가는 버튼
- 저장, 읽기 실패 시 "기록을 저장할 수 없습니다." 표시

## 완료 기준 (PRD 6절)

- [ ] 스피드, 힌트 모드 결과 화면에서 이름을 입력해 기록할 수 있다. 비우면 "익명", 최대 10자다.
- [ ] 연습 모드 결과는 기록되지 않는다.
- [ ] 순위표 화면에서 모드와 카테고리를 고르면 해당 표가 상위 5건까지 보인다.
- [ ] 점수가 같으면 먼저 세운 기록이 위에 오고, 6번째 기록이 들어와도 5건만 남는다.
- [ ] 새로고침하거나 브라우저를 다시 열어도 기록이 남아 있다.
- [ ] 저장에 실패하면 "기록을 저장할 수 없습니다."가 나오고, 게임은 계속된다.

### Task 3.1: 순위표 순수 로직과 저장

**Files:**
- Modify: `script.js` (상수 추가, 순수 로직 구역 끝에 함수 추가, 자체 점검 구역에 `checkLeaderboard` 추가)

**Interfaces:**
- Consumes: `runSelfTest`(Task 1.1)
- Produces: `STORAGE_KEY = 'quiz-leaderboard'`, `MAX_RECORDS = 5`, `NAME_MAX = 10`, `Record = { name: string, score: number, date: 'YYYY-MM-DD' }`, `normalizeName(raw: string): string`, `addRecord(table: Record[], record: Record): Record[]`, `boardKey(mode, category): string`, `getTable(boards: object, mode, category): Record[]`, `readBoards(storage = localStorage): object`(접근이 막히면 예외, 값이 깨졌으면 `{}`), `storeRecord(mode, category, record, storage = localStorage): void`(실패하면 예외), `today(): string`, `checkLeaderboard(check, same)`

- [ ] **Step 1: 자체 점검 구역의 `checkHint` 바로 아래에 `checkLeaderboard` 를 넣는다**

가짜 저장소를 넘기므로 브라우저에서 `?test` 로 실행해도 실제 순위표 기록은 바뀌지 않는다.

```js

function checkLeaderboard(check, same) {
  check(normalizeName('') === '익명' && normalizeName('   ') === '익명', '이름: 비우면 익명');
  check(normalizeName('  철수  ') === '철수', '이름: 앞뒤 공백 제거');
  check(normalizeName('가나다라마바사아자차카') === '가나다라마바사아자차', '이름: 10자까지');
  check(normalizeName('<b>굵게</b>') === '<b>굵게</b>', '이름: 태그도 글자 그대로');

  let table = [];
  [['A', 3], ['B', 5], ['C', 3], ['D', 1], ['E', 4], ['F', 3]].forEach(([name, score]) => {
    table = addRecord(table, { name, score, date: '2026-10-08' });
  });
  check(same(table.map(r => r.name), ['B', 'E', 'A', 'C', 'F']), '순위표: 점수 순, 동점은 먼저 세운 기록이 위, 5건만');
  check(same(addRecord(table, { name: 'G', score: 3, date: '2026-10-08' }).map(r => r.name),
    ['B', 'E', 'A', 'C', 'F']), '순위표: 6번째 동점 기록은 들어오지 못함');
  check(table.length === 5, '순위표: 원래 표를 바꾸면 안 됨');
  check(same(addRecord(table, { name: 'H', score: 4.5, date: '2026-10-08' }).map(r => r.name),
    ['B', 'H', 'E', 'A', 'C']), '순위표: 4.5점은 2등');
  check(/^\d{4}-\d{2}-\d{2}$/.test(today()), '날짜: YYYY-MM-DD 형식');

  const memory = (initial = {}) => {
    const data = { ...initial };
    return { data, getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
  };
  const store = memory();
  check(boardKey('speed', '과학') === 'speed:과학', '저장: 표 이름 형식');
  check(same(getTable(readBoards(store), 'speed', '과학'), []), '저장: 처음엔 빈 표');
  storeRecord('speed', '과학', { name: '철수', score: 7, date: '2026-10-08' }, store);
  storeRecord('hint', '과학', { name: '영희', score: 7.5, date: '2026-10-08' }, store);
  check(same(getTable(readBoards(store), 'speed', '과학').map(r => r.name), ['철수']), '저장: 스피드 과학 표');
  check(same(getTable(readBoards(store), 'hint', '과학').map(r => r.score), [7.5]), '저장: 힌트 과학 표');
  check(same(Object.keys(store.data), [STORAGE_KEY]), '저장: localStorage 키 하나만 씀');

  check(same(readBoards(memory({ [STORAGE_KEY]: '{깨짐' })), {}), '깨진 값: JSON이 아니면 빈 묶음');
  check(same(readBoards(memory({ [STORAGE_KEY]: '[1,2]' })), {}), '깨진 값: 배열이면 빈 묶음');
  const broken = memory({ [STORAGE_KEY]: JSON.stringify({
    'speed:과학': [null, { name: '정상', score: 3, date: '2026-10-08' }, { name: 1 }],
    'hint:과학': 'x'
  }) });
  check(same(getTable(readBoards(broken), 'speed', '과학').map(r => r.name), ['정상']), '깨진 값: 형식이 맞는 기록만 남김');
  check(same(getTable(readBoards(broken), 'hint', '과학'), []), '깨진 값: 표가 배열이 아니면 빈 표');
  storeRecord('hint', '과학', { name: '새', score: 1, date: '2026-10-08' }, broken);
  check(same(getTable(readBoards(broken), 'hint', '과학').map(r => r.name), ['새']), '깨진 값: 그 위에 새 기록을 저장함');

  const throws = fn => {
    try { fn(); return false; } catch (e) { return true; }
  };
  check(throws(() => storeRecord('speed', '과학', { name: 'x', score: 1, date: '2026-10-08' },
    { getItem: () => null, setItem: () => { throw new Error('가득 참'); } })), '저장 실패: 예외로 알림');
  check(throws(() => readBoards({ getItem: () => { throw new Error('막힘'); } })), '읽기 실패: 예외로 알림');
}
```

`runSelfTest` 의 `checkHint(check);` 바로 아래에 넣는다.

```js
  checkLeaderboard(check, same);
```

- [ ] **Step 2: 자체 점검 명령을 실행해 실패를 본다**

Expected: `ReferenceError: normalizeName is not defined`

- [ ] **Step 3: `TIME_LIMIT` 줄 아래에 상수를 넣는다**

```js
const STORAGE_KEY = 'quiz-leaderboard';
const MAX_RECORDS = 5;
const NAME_MAX = 10;
```

- [ ] **Step 4: 순수 로직 구역 끝(`pickHintRemovals` 아래, `// ===== 상태 =====` 위)에 넣는다**

정렬 비교는 점수만 본다. `Array.prototype.sort` 는 안정 정렬이고 새 기록은 늘 맨 뒤에 붙으므로, 점수가 같으면 먼저 세운 기록이 위에 남는다.

```js

function normalizeName(raw) {
  return raw.trim().slice(0, NAME_MAX) || '익명';
}

function addRecord(table, record) {
  return [...table, record]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECORDS);
}

function boardKey(mode, category) {
  return `${mode}:${category}`;
}

function getTable(boards, mode, category) {
  const table = boards[boardKey(mode, category)];
  if (!Array.isArray(table)) return [];
  return table.filter(r => r && typeof r.name === 'string' &&
    typeof r.score === 'number' && typeof r.date === 'string');
}

// 저장소에 접근할 수 없으면 예외를 그대로 던진다. 값이 깨졌으면 빈 묶음으로 본다.
function readBoards(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch (e) {
    // 깨진 값은 아래에서 빈 묶음으로 바꾼다
  }
  return {};
}

function storeRecord(mode, category, record, storage = localStorage) {
  const boards = readBoards(storage);
  boards[boardKey(mode, category)] = addRecord(getTable(boards, mode, category), record);
  storage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

function today() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
```

- [ ] **Step 5: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`(1, 2단계 점검 포함)

- [ ] **Step 6: 커밋**

```bash
git add script.js && git commit -m "순위표 정렬과 저장 로직 추가"
```

### Task 3.2: 결과 화면에서 기록하기

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `normalizeName`, `storeRecord`, `today`(Task 3.1), Task 2.4의 `showResult`
- Produces: `saveRecord(event)`(폼 제출 처리)

- [ ] **Step 1: `index.html` 결과 화면에서 `<p id="retry-result" hidden></p>` 바로 아래에 넣는다**

```html
      <form id="save-form" class="save-form" hidden>
        <label for="name-input">이름</label>
        <input id="name-input" type="text" maxlength="10" placeholder="비우면 익명" autocomplete="off">
        <button id="save-button" type="submit" class="primary">기록하기</button>
      </form>
      <p id="save-message" class="message" aria-live="polite"></p>
```

- [ ] **Step 2: `style.css` 끝에 추가한다**

```css

.save-form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 16px; }
.save-form input { flex: 1 1 140px; min-width: 0; font: inherit; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; }
.message { min-height: 1.5em; color: var(--muted); font-size: 0.9rem; }
```

- [ ] **Step 3: `script.js` 를 고친다**

(1) `showResult` 의 `showScreen('result');` 바로 앞에 넣는다.

```js
  $('save-form').hidden = isPractice;
  $('name-input').value = '';
  $('save-button').disabled = false;
  $('save-message').textContent = '';
```

(2) `startRetry` 바로 아래에 넣는다. 버튼이 이미 비활성이면 바로 돌아가므로 연타해도 한 번만 저장된다.

```js
function saveRecord(event) {
  event.preventDefault();
  if ($('save-button').disabled) return;
  $('save-button').disabled = true;
  try {
    storeRecord(state.mode, state.category, {
      name: normalizeName($('name-input').value),
      score: state.score,
      date: today()
    });
    $('save-message').textContent = '기록했습니다.';
  } catch (e) {
    $('save-message').textContent = '기록을 저장할 수 없습니다.';
    $('save-button').disabled = false;
  }
}
```

(3) `init` 에 한 줄 넣는다.

```js
  $('save-form').addEventListener('submit', saveRecord);
```

- [ ] **Step 4: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`

- [ ] **Step 5: 커밋**

```bash
git add index.html style.css script.js && git commit -m "결과 화면에 기록하기 추가"
```

### Task 3.3: 순위표 화면

**Files:**
- Modify: `index.html`, `style.css`, `script.js`

**Interfaces:**
- Consumes: `readBoards`, `getTable`(Task 3.1), `CATEGORIES`
- Produces: `renderBoardFilters()`, `showBoard()`, `openBoard()`

- [ ] **Step 1: `index.html` 을 고친다**

시작 화면의 `<div id="category-list" …></div>` 바로 아래에 넣는다.

```html
      <div class="button-row">
        <button id="leaderboard-button" type="button">순위표 보기</button>
      </div>
```

`screen-result` 섹션 바로 아래(`</main>` 위)에 넣는다.

```html
    <section id="screen-leaderboard" class="screen" hidden>
      <h2>순위표</h2>
      <div class="filters">
        <label>모드
          <select id="board-mode">
            <option value="speed">스피드</option>
            <option value="hint">힌트</option>
          </select>
        </label>
        <label>카테고리
          <select id="board-category"></select>
        </label>
      </div>
      <ol id="board-list" class="board-list"></ol>
      <p id="board-empty" class="notice" hidden>아직 기록이 없습니다.</p>
      <p id="board-message" class="message" aria-live="polite"></p>
      <div class="button-row">
        <button id="board-home-button" type="button">처음으로</button>
      </div>
    </section>
```

- [ ] **Step 2: `style.css` 끝에 추가한다**

```css

.filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.filters label { display: grid; gap: 4px; font-size: 0.9rem; color: var(--muted); }
.filters select { font: inherit; padding: 8px; border: 1px solid var(--border); border-radius: 8px; }
.board-list { margin: 0; padding-left: 1.5em; }
.board-list li { padding: 8px 0; border-bottom: 1px solid var(--border); overflow-wrap: anywhere; }
.board-list .record-score { font-weight: 700; margin: 0 8px; }
.board-list .record-date { color: var(--muted); font-size: 0.85rem; }
```

- [ ] **Step 3: `script.js` 를 고친다**

(1) `saveRecord` 바로 아래에 넣는다. 이름은 `textContent` 로만 넣는다.

```js
function renderBoardFilters() {
  const select = $('board-category');
  CATEGORIES.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function showBoard() {
  const list = $('board-list');
  list.innerHTML = '';
  $('board-message').textContent = '';
  let table = [];
  try {
    table = getTable(readBoards(), $('board-mode').value, $('board-category').value);
  } catch (e) {
    $('board-message').textContent = '기록을 저장할 수 없습니다.';
  }
  table.forEach(record => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const score = document.createElement('span');
    const date = document.createElement('span');
    name.textContent = record.name;
    score.className = 'record-score';
    score.textContent = `${record.score}점`;
    date.className = 'record-date';
    date.textContent = record.date;
    item.append(name, score, date);
    list.appendChild(item);
  });
  $('board-empty').hidden = table.length > 0;
}

function openBoard() {
  showBoard();
  showScreen('leaderboard');
}
```

(2) `init` 에 넣는다.

```js
  renderBoardFilters();
  $('leaderboard-button').addEventListener('click', openBoard);
  $('board-mode').addEventListener('change', showBoard);
  $('board-category').addEventListener('change', showBoard);
  $('board-home-button').addEventListener('click', () => showScreen('start'));
```

- [ ] **Step 4: 자체 점검 명령을 다시 실행한다** — Expected: `자체 점검: 통과 (N개)`

- [ ] **Step 5: 커밋**

```bash
git add index.html style.css script.js && git commit -m "3단계: 순위표 화면 추가"
```

## 3단계 마무리 (멈춤)

- [ ] 자체 점검 명령이 `자체 점검: 통과` 로 끝나고, 3단계 커밋이 모두 들어갔는지 `git log --oneline` 으로 본다.
- [ ] 사용자에게 보고한다: 바꾼 파일, 자체 점검 결과, 아래 "3단계 브라우저에서 직접 확인할 항목"(특히 Review Focus 2~4번), 맨 끝 "PRD 대응표"로 빠진 요구가 없는지 확인한 결과.
- [ ] **여기서 멈춘다.** 사용자가 브라우저 확인을 마칠 때까지 기다린다. 확인 중 문제가 나오면 그것부터 고친다.

## 3단계 브라우저에서 직접 확인할 항목

`index.html` 을 더블클릭해 연다. 콘솔 명령은 F12 → Console에 붙여 넣는다.

**기록하기**
- [ ] 스피드 모드 한 판을 끝내면 결과 화면에 이름 칸과 [기록하기]가 보인다. 힌트 모드도 같다.
- [ ] 연습 모드 결과 화면에는 이름 칸이 없고, 순위표 어느 표에도 연습 기록이 생기지 않는다.
- [ ] 이름을 비우고 [기록하기]를 누르면 "기록했습니다."가 나오고, 순위표에 "익명"으로 보인다.
- [ ] 이름 칸에 11자 이상은 입력되지 않는다.
- [ ] (Review Focus 2) [기록하기]를 빠르게 두 번 누르거나 Enter를 두 번 눌러도 순위표에 1건만 생긴다.

**순위표**
- [ ] 시작 화면의 [순위표 보기]를 누르면 순위표 화면이 나온다.
- [ ] 모드(스피드, 힌트)와 카테고리 4개를 바꿀 때마다 해당 표가 보이고, 기록이 없으면 "아직 기록이 없습니다."가 나온다.
- [ ] 스피드 과학에 남긴 기록이 힌트 과학이나 스피드 한국사에는 보이지 않는다.
- [ ] 각 줄에 이름, 점수, 날짜가 보이고, 힌트 모드의 7.5 같은 점수가 그대로 보인다.
- [ ] 새로고침(F5)한 뒤, 그리고 브라우저를 완전히 닫았다 다시 열어도 기록이 남아 있다.

**동점과 5건 제한**
- [ ] 콘솔에서 아래를 실행해 스피드 한국사 표에 0점 기록 4건을 넣는다.

```js
localStorage.setItem('quiz-leaderboard', JSON.stringify({ 'speed:한국사': [
  { name: '기존1', score: 0, date: '2026-10-01' },
  { name: '기존2', score: 0, date: '2026-10-02' },
  { name: '기존3', score: 0, date: '2026-10-03' },
  { name: '기존4', score: 0, date: '2026-10-04' }
] }));
```

- [ ] 스피드 한국사 한 판을 보기를 누르지 않고 시간 초과될 때마다 [다음]만 눌러 0점으로 끝낸 뒤, 이름 "동점"으로 기록한다. 순위표에서 "동점"이 5번째(기존1~4 아래)에 있다.
- [ ] 스피드 한국사를 한 판 더 해서 1점 이상으로 "새기록"을 남긴다. "새기록"이 맨 위에 오고, 표는 5건이며 "동점"이 빠져 있다.

**오류와 이상한 값**
- [ ] (Review Focus 4) 이름에 `<b>굵게</b>` 를 넣어 기록하면 순위표에 굵은 글씨가 아니라 글자 그대로 보인다. 공백만 넣으면 "익명"이다.
- [ ] (Review Focus 3) 콘솔에서 `localStorage.setItem('quiz-leaderboard', '{깨진 값')` 을 실행하고 순위표를 열면 오류 없이 "아직 기록이 없습니다."가 나온다. 이어서 한 판을 기록하면 정상으로 저장된다.
- [ ] 저장 실패: 결과 화면에서 콘솔에 `Storage.prototype.setItem = function () { throw new Error('테스트'); };` 를 실행한 뒤 [기록하기]를 누르면 "기록을 저장할 수 없습니다."가 나온다. 이어서 [다시 하기]로 게임이 그대로 진행된다. 확인 후 F5로 새로고침하면 원래대로 돌아온다.

**공통**
- [ ] 1단계, 2단계 브라우저 확인 항목을 빠르게 다시 해 보고 그대로 동작한다.
- [ ] `index.html?test` 의 Console에 `자체 점검: 통과` 가 나오고, 그 뒤에도 순위표 기록이 바뀌지 않았다.
- [ ] F12 → Console에 빨간 오류가 없고, 너비 375에서 결과 화면의 이름 칸과 순위표에 가로 스크롤이 없다.

---

# PRD 대응표

PRD의 항목마다 그것을 구현하는 Task다. 빠진 요구가 없는지 확인할 때 쓴다.

| PRD 항목 | 내용 | Task |
|---|---|---|
| 1.2 | 카테고리 4개, 카테고리마다 10문제, 총 40문제 | 1.1(`CATEGORIES`), 1.2 |
| 1.3 | 답을 고르면 곧바로 정답 여부와 한 줄 해설 | 1.3 |
| 1.4 | 한 판은 카테고리 1개의 10문제, 끝나면 점수 | 1.1(`prepareRound`), 1.3 |
| 1.5 | 서버 없음, 앱 파일 4개, 외부 라이브러리 없음 | Global Constraints, 1.3 |
| 1.5 | `file://` 동작, 모듈 없음, `QUESTIONS` 를 먼저 불러옴 | Global Constraints, 1.3(`index.html`) |
| 1.5 | 휴대폰 폭에서 가로 스크롤 없음 | 1.3, 2.2, 3.2, 3.3(`style.css`) |
| 2 표 | 모드별 시간 제한, 힌트, 점수, 순위표 기록 여부 | 2.1, 2.2, 2.3, 3.2 |
| 2.1 | 연습: 1점, 순위표 기록 안 함, "순위표에 기록되지 않음" | 1.3, 2.2, 3.2 |
| 2.1 | 틀린 문제 다시 풀기, 따로 보이는 결과, 반복, 점수 불변 | 2.4 |
| 2.2 | 스피드: 15초, 답하면 멈춤, 시간 초과 오답, [다음]에서 다시 15초 | 2.2 |
| 2.3 | 힌트: 문항마다 1번, 오답 2개 무작위 삭제, 답한 뒤 불가, 0.5점 | 2.1, 2.3 |
| 2.4 | 틀리면 0점, 시간 초과 0점 | 1.1, 2.1(`scoreAnswer`) |
| 2.4 | 판마다 문항 순서와 보기 순서 섞기 | 1.1(`prepareRound`), 2.4(`startRetry`) |
| 3 | 화면을 미리 만들어 두고 하나만 보여 줌 | 1.3(`showScreen`) |
| 3.1 | 시작: 카테고리 선택, 1단계 연습 안내, 3단계 순위표 버튼 | 1.3, 3.3 |
| 3.2 | 모드 선택과 설명, 연습에 "순위표에 기록되지 않음" | 2.2 |
| 3.3 | 문제: 진행, 점수, 보기 잠금, 초록/빨강, 해설, 출처 새 탭, [다음]/[결과 보기] | 1.3 |
| 3.3 | 스피드의 남은 시간, 힌트의 [힌트] | 2.2, 2.3 |
| 3.4 | 결과: 점수, 맞힌 개수, [다시 하기], [처음으로] | 1.3 |
| 3.4 | 연습: 안내와 [틀린 문제 다시 풀기] | 2.4 |
| 3.4 | 스피드, 힌트: 이름 입력과 [기록하기] | 3.2 |
| 3.5 | 순위표: 모드와 카테고리 선택, 상위 5건 | 3.3 |
| 4.1 | `questions.js` 데이터 모양 | 1.2 |
| 4.2 | 정답 하나, 출처 명시, 최상급 표현의 기준과 시점 | 1.2(`checkQuestions`, 문항 규칙) |
| 4.3 | 출처를 열어 확인, 결과를 표로 남김, 사람이 최종 확인 | 1.2(`SOURCE-CHECK.md`), 1단계 마무리 |
| 4.4 | 스피드, 힌트만 기록, 표 8개, 이름(빈칸은 익명, 10자), 이름 점수 날짜 | 3.1, 3.2 |
| 4.4 | 점수 내림차순, 동점은 먼저 세운 기록이 위, 5건만, 키 하나 | 3.1(`addRecord`, `storeRecord`) |
| 5.1 | 순수 로직(섞기, 한 판 준비, 채점, 힌트, 순위표 넣기) | 1.1, 2.1, 3.1 |
| 5.2 | 상태 객체 하나(모드, 카테고리, 문항, 번호, 점수, 힌트, 틀린 목록, 타이머) | 1.3, 2.2, 2.3, 2.4 |
| 5.3 | 화면 조작(전환, 문제, 해설, 결과, 순위표) | 1.3, 2.2~2.4, 3.2, 3.3 |
| 5.4 | 저장, 읽기 실패 시 "기록을 저장할 수 없습니다.", 게임 계속 | 3.1, 3.2, 3.3 |
| 6 | 단계별 구현과 완료 기준 | 각 단계의 완료 기준, 단계 마무리 |
| 7 | 테스트 파일 없음, 순수 로직 Node 확인, 문항 자동 점검 | `script.js` 자체 점검(1.1, 1.2, 2.1, 3.1) |
| 7 | 화면 확인, 더블클릭 확인 | 단계마다 "브라우저에서 직접 확인할 항목" |
| 8 | 범위 밖(난이도, 서버, 로그인, 문항 편집, 풀이 시간 순위) | 만들지 않음 |
