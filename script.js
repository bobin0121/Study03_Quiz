// 생성: 2026-10-08 13:33 KST
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
