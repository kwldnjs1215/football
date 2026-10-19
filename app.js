(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    name: "",
    index: 0,
    answers: [], // "A" | "B"
  };

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({ top: 0 });
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- 퀴즈 ----------
  function startQuiz() {
    state.index = 0;
    state.answers = [];
    state.done = false;
    renderQuestion();
    show("screen-quiz");
  }

  function renderQuestion() {
    const q = QUESTIONS[state.index];
    const total = QUESTIONS.length;
    $("q-num").textContent = `Q${state.index + 1}`;
    $("q-text").textContent = q.q;
    $("opt-a").textContent = q.A;
    $("opt-b").textContent = q.B;
    $("opt-a").classList.toggle("picked", state.answers[state.index] === "A");
    $("opt-b").classList.toggle("picked", state.answers[state.index] === "B");
    $("progress-text").textContent = `${state.index + 1}/${total}`;
    $("progress-bar").style.width = `${(state.index / total) * 100}%`;
    $("btn-back").style.visibility = "visible";

    const wrap = document.querySelector(".question-wrap");
    wrap.classList.remove("enter");
    void wrap.offsetWidth;
    wrap.classList.add("enter");
  }

  function answer(choice) {
    if (state.done) return;
    state.answers[state.index] = choice;
    if (state.index < QUESTIONS.length - 1) {
      state.index++;
      renderQuestion();
    } else {
      $("progress-bar").style.width = "100%";
      const { code, scores } = calculate();
      state.done = true;
      setTimeout(() => {
        renderResult(code, scores, state.name);
        saveResult(state.name, code, scores);
        history.replaceState(null, "", `?type=${code}`);
      }, 250);
    }
  }

  function goBack() {
    if (state.index === 0) {
      show("screen-intro");
    } else {
      state.index--;
      renderQuestion();
    }
  }

  // 각 축마다 a 글자를 고른 비율(0~100) 계산
  function calculate() {
    const countA = [0, 0, 0, 0];
    const count = [0, 0, 0, 0];
    QUESTIONS.forEach((q, i) => {
      count[q.axis]++;
      if (state.answers[i] === "A") countA[q.axis]++;
    });
    const scores = count.map((n, i) => Math.round((countA[i] / n) * 100));
    const code = AXES.map((ax, i) => (countA[i] * 2 > count[i] ? ax.a : ax.b)).join("");
    return { code, scores };
  }

  // ---------- 결과 ----------
  function list(id, items) {
    $(id).innerHTML = "";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      $(id).appendChild(li);
    });
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // 유형 코드 4글자를 축 이름·비율과 함께 보여준다
  function renderLetters(code, scores) {
    const box = $("letters");
    box.innerHTML = "";
    AXES.forEach((ax, i) => {
      const isA = code[i] === ax.a;
      const cell = el("div", "letter");
      cell.append(el("b", null, code[i]), el("span", null, isA ? ax.aName : ax.bName));
      if (scores) {
        const pct = isA ? scores[i] : 100 - scores[i];
        const bar = el("i");
        bar.style.setProperty("--w", `${pct}%`);
        cell.append(bar, el("small", null, `${pct}%`));
      }
      box.appendChild(cell);
    });
  }

  const POSITION_DESC = {
    피보: "최전방에서 공 받아 지키고, 돌아서서 마무리",
    알라: "측면을 오르내리며 공격도 수비도 다 함",
    픽소: "맨 뒤에서 수비를 정리하고 빌드업 시작",
    골레이로: "골문을 지키고, 뒤에서 공격의 첫 패스를 시작",
  };

  function renderPosition(role) {
    const picks = role.split("·").map((r) => r.trim());
    $("result-role").textContent = picks.join(" · ");
    document.querySelectorAll(".pitch .spot[data-pos]").forEach((g) => {
      g.classList.toggle("on", picks.includes(g.dataset.pos));
    });
    $("position-desc").innerHTML = "";
    picks.forEach((p) => $("position-desc").appendChild(el("li", null, `${p}: ${POSITION_DESC[p]}`)));
  }

  function renderMatch(target, kind, code) {
    const other = kind === "best" ? bestMatchOf(code) : worstMatchOf(code);
    const t = TYPES[other];
    const box = $(target);
    box.innerHTML = "";
    box.append(
      el("p", "match-kicker", kind === "best" ? "찰떡 파트너" : "최악의 궁합"),
      el("p", "match-code", other),
      el("p", "match-name", t.name),
      el("p", "match-line", kind === "best" ? "같이 뛰면 골이 터지는 사이" : "같이 뛰면 서로 답답해지는 사이"),
      el("p", "match-scene", matchScene(code, other)),
      el("h4", null, kind === "best" ? "왜 잘 맞냐면" : "왜 파국이냐면")
    );
    const ol = el("ol");
    matchReasons(code, other, kind).forEach((r) => ol.appendChild(el("li", null, r)));
    box.appendChild(ol);
  }

  function renderResult(code, scores, name) {
    const t = TYPES[code];
    if (!t) return show("screen-intro");

    $("report-no").textContent = `No. ${code}`;
    $("result-owner").textContent = name ? `${name}님의 풋살 유형` : "풋살 유형";
    $("result-name").textContent = t.name;
    $("result-quote").textContent = t.quote;
    $("result-desc").textContent = t.desc;
    list("result-play", t.play);
    if (t.gk) {
      const li = el("li", "gk-line");
      li.append(el("b", null, "골레이로를 맡으면"), el("span", null, t.gk));
      $("result-play").appendChild(li);
    }
    list("result-mental", t.mental);
    list("result-team", t.team);
    $("result-strength").textContent = t.strength;
    $("result-tip").textContent = t.tip;
    renderLetters(code, scores);
    renderPosition(t.role);
    const pl = PLAYERS[code];
    $("player-name").textContent = pl.name;
    $("player-nation").textContent = pl.nation;
    $("player-why").textContent = pl.why;
    renderMatch("match-good", "best", code);
    renderMatch("match-bad", "worst", code);

    $("btn-retry").textContent = scores ? "다시 하기" : "나도 테스트하기";
    show("screen-result");
  }

  // 이름 + 결과를 서버(Cloudflare D1)에 저장. 실패해도 화면엔 영향 없음
  function saveResult(name, code, scores) {
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: code, scores, answers: state.answers.join("") }),
    }).catch(() => {});
  }

  async function share() {
    const code = new URLSearchParams(location.search).get("type");
    const t = TYPES[code];
    const url = `${location.origin}${location.pathname}?type=${code}`;
    const text = `나의 풋살 MBTI는 ${code} · ${t.name}! 너는 어떤 유형이야?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "풋살 MBTI", text, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("링크가 복사됐어요! 단톡방에 붙여넣기");
    } catch {
      prompt("아래 링크를 복사하세요", url);
    }
  }

  // ---------- 이벤트 ----------
  $("name-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.name = $("name-input").value.trim();
    if (!state.name) return;
    startQuiz();
  });
  $("opt-a").onclick = () => answer("A");
  $("opt-b").onclick = () => answer("B");
  $("btn-back").onclick = goBack;
  $("btn-share").onclick = share;
  $("btn-retry").onclick = () => {
    history.replaceState(null, "", location.pathname);
    show("screen-intro");
    $("name-input").focus();
  };

  // 공유 링크로 들어온 경우 (?type=XXXX)
  const shared = (new URLSearchParams(location.search).get("type") || "").toUpperCase();
  if (TYPES[shared]) renderResult(shared, null, "");
})();
