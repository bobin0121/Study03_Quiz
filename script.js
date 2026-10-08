// 생성: 2026-10-08 13:33 KST
"use strict";

// ===== 1. 순수 로직 =====
const CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"];
const QUESTIONS_PER_CATEGORY = 10;

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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

function pickHintRemovals(question) {
  const wrong = [0, 1, 2, 3].filter((i) => i !== question.answer);
  return shuffle(wrong).slice(0, 2);
}

// ===== 2. 상태 =====
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

// ===== 3. 화면 조작 =====
const $ = (id) => document.getElementById(id);

function showScreen(id) {
  stopTimer();
  for (const section of document.querySelectorAll(".screen")) {
    section.hidden = section.id !== id;
  }
  window.scrollTo(0, 0);
}

function init() {
  const list = $("category-list");
  for (const category of CATEGORIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category";
    button.textContent = category;
    button.addEventListener("click", () => chooseCategory(category));
    list.appendChild(button);
  }
  $("next-button").addEventListener("click", nextQuestion);
  $("hint-button").addEventListener("click", useHint);
  for (const button of document.querySelectorAll(".mode")) {
    button.addEventListener("click", () => startRound(state.category, button.dataset.mode));
  }
  $("back-button").addEventListener("click", () => showScreen("screen-start"));
  $("again-button").addEventListener("click", () => startRound(state.category, state.mode));
  $("home-button").addEventListener("click", () => showScreen("screen-start"));

  const problems = validateQuestions(QUESTIONS);
  if (problems.length > 0) {
    console.error("문항 데이터 오류:", problems);
    $("data-error").hidden = false;
    for (const button of list.querySelectorAll("button")) button.disabled = true;
  }
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
  const timed = state.mode === "speed";
  $("quiz-timer").hidden = !timed;
  if (timed) startTimer();
  $("hint-button").hidden = state.mode !== "hint" || state.isRetry;
  $("hint-button").disabled = false;
}

// choiceIndex가 null이면 스피드 모드의 시간 초과다.
function handleAnswer(choiceIndex) {
  stopTimer();
  $("hint-button").disabled = true;
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

function chooseCategory(category) {
  state.category = category;
  $("mode-title").textContent = category;
  showScreen("screen-mode");
}

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
check("shuffle: 길이를 유지한다", () => shuffle([1, 2, 3, 4, 5]).length === 5);
check("shuffle: 원소를 그대로 가진다", () => shuffle([1, 2, 3, 4, 5]).slice().sort().join(",") === "1,2,3,4,5");
check("shuffle: 원본을 바꾸지 않는다", () => {
  const original = [1, 2, 3, 4, 5];
  shuffle(original);
  return original.join(",") === "1,2,3,4,5";
});

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
check("QUESTIONS: 실제 문항 데이터가 validateQuestions를 통과한다", () => {
  const problems = validateQuestions(QUESTIONS);
  problems.forEach((p) => console.error(`  ${p}`));
  return problems.length === 0;
});
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

// ===== 5. 시작 =====
if (typeof document === "undefined") {
  // 점검 명령(Node)으로 실행한 경우: 자체 점검만 돌린다.
  process.exitCode = runSelfTests() === 0 ? 0 : 1;
} else {
  if (new URLSearchParams(location.search).has("test")) runSelfTests();
  init();
}
