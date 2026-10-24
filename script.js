const $ = (id) => document.getElementById(id);
const LEVELS = ["easy", "medium", "hard"];
const LEVEL_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const CATEGORIES = [...new Set(QUESTIONS.map((q) => q.category))];

let state = null; // { name, questions, answers, index, startedAt }
let selected = null;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function show(id) {
  for (const s of ["start", "quiz", "result"]) $(s).hidden = s !== id;
  window.scrollTo(0, 0);
}

// ---------- Start screen ----------
for (const c of CATEGORIES) $("topics").append(el("li", "", c));
for (const l of LEVELS) {
  const n = QUESTIONS.filter((q) => q.level === l).length;
  $("levels").append(el("li", "", `${LEVEL_LABEL[l]}: ${n}`));
}
$("count-hint").textContent = `${QUESTIONS.length} questions, from easy to hard. About 20 minutes.`;

$("start-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("name").value.trim();
  if (!name) {
    $("start-error").textContent = "Enter your name to start.";
    return;
  }
  $("start-error").textContent = "";
  // Easy first, then medium, then hard. Questions and options are shuffled within each level.
  const questions = LEVELS.flatMap((l) =>
    shuffle(QUESTIONS.filter((q) => q.level === l)).map((q) => ({ ...q, options: shuffle(q.options) }))
  );
  state = { name, questions, answers: [], index: 0, startedAt: new Date() };
  show("quiz");
  renderQuestion();
});

// ---------- Question screen ----------
function renderQuestion() {
  const { questions, index } = state;
  const q = questions[index];
  selected = null;
  $("next").disabled = true;
  $("next").textContent = index === questions.length - 1 ? "Finish" : "Next";
  $("counter").textContent = `Question ${index + 1} of ${questions.length}`;
  $("level").className = `level ${q.level}`;
  $("level").textContent = LEVEL_LABEL[q.level];
  $("cat").textContent = q.category;
  $("bar").style.width = `${(index / questions.length) * 100}%`;
  $("question").textContent = q.question;
  $("cell").hidden = !q.code;
  $("cell-in").textContent = `In [${index + 1}]:`;
  $("code").textContent = q.code || "";

  const box = $("options");
  box.innerHTML = "";
  q.options.forEach((opt, i) => {
    const label = el("label", "opt");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "opt";
    input.id = `opt-${i}`;
    input.addEventListener("change", () => {
      selected = opt;
      $("next").disabled = false;
    });
    label.append(input, el("code", "", opt));
    box.append(label);
  });
}

$("next").addEventListener("click", () => {
  if (selected === null) return;
  const q = state.questions[state.index];
  state.answers.push({ q, choice: selected, correct: selected === q.answer });
  state.index += 1;
  if (state.index < state.questions.length) renderQuestion();
  else showResult();
});

// ---------- Result screen ----------
function tally(key, values) {
  return values.map((v) => {
    const list = state.answers.filter((a) => a.q[key] === v);
    return { label: LEVEL_LABEL[v] || v, ok: list.filter((a) => a.correct).length, total: list.length };
  });
}

function summary() {
  const score = state.answers.filter((a) => a.correct).length;
  return {
    score,
    total: state.answers.length,
    byLevel: tally("level", LEVELS),
    byCat: tally("category", CATEGORIES),
  };
}

function renderRows(container, rows) {
  container.innerHTML = "";
  for (const { label, ok, total } of rows) {
    const row = el("div", "row");
    const track = el("div", "track");
    const fill = el("div", "fill");
    fill.style.width = `${total ? (ok / total) * 100 : 0}%`;
    track.append(fill);
    row.append(el("span", "", label), track, el("span", "n", `${ok}/${total}`));
    container.append(row);
  }
}

function showResult() {
  const { score, total, byLevel, byCat } = summary();
  const pct = Math.round((score / total) * 100);
  show("result");
  $("copied").hidden = true;
  document.querySelector(".copy-box")?.remove();

  $("r-name").textContent = state.name;
  $("r-score").innerHTML = "";
  $("r-score").append(`${score} / ${total} `, el("small", "", `${pct}%`));
  const grade = $("r-grade");
  grade.className = "grade " + (pct >= 75 ? "good" : pct >= 50 ? "mid" : "low");
  grade.textContent = pct >= 75 ? "Strong result" : pct >= 50 ? "Passing" : "Needs review";

  renderRows($("r-levels"), byLevel);
  renderRows($("r-cats"), byCat);

  const review = $("r-review");
  review.innerHTML = "";
  state.answers.forEach((a, i) => {
    const item = el("div", `ritem ${a.correct ? "ok" : "bad"}`);
    const head = el("div", "rhead");
    head.append(el("span", "rq", `${i + 1}. ${a.q.question}`), el("span", `level ${a.q.level}`, LEVEL_LABEL[a.q.level]));
    item.append(head);
    if (a.q.code) {
      const cell = el("div", "cell");
      const pre = el("pre");
      pre.append(el("code", "", a.q.code));
      cell.append(el("span", "in", `In [${i + 1}]:`), pre);
      item.append(cell);
    }
    const yours = el("div", "ans");
    yours.append(el("span", "tag", a.correct ? "Correct: " : "Your answer: "), el("code", "", a.choice));
    item.append(yours);
    if (!a.correct) {
      const right = el("div", "ans");
      right.append(el("span", "", "Right answer: "), el("code", "", a.q.answer));
      item.append(right);
    }
    review.append(item);
  });
}

function resultText() {
  const { score, total, byLevel, byCat } = summary();
  return [
    "Python Quiz result",
    `Name: ${state.name}`,
    `Score: ${score}/${total} (${Math.round((score / total) * 100)}%)`,
    "By level:",
    ...byLevel.map((r) => `  ${r.label}: ${r.ok}/${r.total}`),
    "By topic:",
    ...byCat.map((r) => `  ${r.label}: ${r.ok}/${r.total}`),
    `Date: ${state.startedAt.toLocaleString()}`,
  ].join("\n");
}

$("copy").addEventListener("click", async () => {
  const text = resultText();
  try {
    await navigator.clipboard.writeText(text);
    $("copied").textContent = "Copied. Paste it to your teacher.";
  } catch {
    // Clipboard blocked: show the text selected so the student can copy it by hand.
    let box = document.querySelector(".copy-box");
    if (!box) {
      box = el("textarea", "copy-box");
      box.rows = 12;
      box.readOnly = true;
      $("copy").closest(".actions").after(box);
    }
    box.value = text;
    box.select();
    $("copied").textContent = "Select the text below and copy it.";
  }
  $("copied").hidden = false;
});

$("restart").addEventListener("click", () => {
  state = null;
  $("name").value = "";
  show("start");
  $("name").focus();
});
