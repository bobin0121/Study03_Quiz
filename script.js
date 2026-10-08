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

// ===== 5. 시작 =====
if (typeof document === "undefined") {
  // 점검 명령(Node)으로 실행한 경우: 자체 점검만 돌린다.
  process.exitCode = runSelfTests() === 0 ? 0 : 1;
} else {
  if (new URLSearchParams(location.search).has("test")) runSelfTests();
  init();
}
