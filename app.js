(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    name: "",
    index: 0,
    answers: [], // "A" | "B"
    prevScreen: "screen-intro",
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

  function renderResult(code, scores, name) {
    const t = TYPES[code];
    if (!t) return show("screen-intro");

    $("result-owner").textContent = name ? `${name}님의 풋살 유형은` : "이 풋살 유형은";
    $("result-code").textContent = code;
    $("result-name").textContent = t.name;
    $("result-tagline").textContent = t.tagline;
    $("result-quote").textContent = `“${t.quote}”`;
    $("result-role").textContent = t.role;
    $("result-desc").textContent = t.desc;
    list("result-play", t.play);
    list("result-mental", t.mental);
    list("result-team", t.team);
    $("result-strength").textContent = t.strength;
    $("result-tip").textContent = t.tip;

    const p = partnerOf(code);
    $("partner-btn").innerHTML = "";
    $("partner-btn").append(
      Object.assign(document.createElement("span"), { textContent: `${p} · ${TYPES[p].name}` }),
      Object.assign(document.createElement("span"), { className: "arrow", textContent: "→" })
    );
    $("partner-btn").onclick = () => {
      renderResult(p, null, "");
      history.replaceState(null, "", `?type=${p}`);
    };

    // 축 막대 (실제로 테스트한 경우에만)
    $("axis-card").style.display = scores ? "" : "none";
    if (scores) {
      $("axis-bars").innerHTML = "";
      AXES.forEach((ax, i) => {
        const pctA = scores[i];
        const leftWin = code[i] === ax.a;
        const row = document.createElement("div");
        row.className = "axis-row";
        row.innerHTML = `
          <div class="axis-labels">
            <span class="${leftWin ? "win" : ""}">${ax.a} ${ax.aName} ${pctA}%</span>
            <span class="${!leftWin ? "win" : ""}">${100 - pctA}% ${ax.bName} ${ax.b}</span>
          </div>
          <div class="axis-track">
            <div class="axis-fill ${leftWin ? "left" : "right"}" style="width:${leftWin ? pctA : 100 - pctA}%"></div>
          </div>`;
        $("axis-bars").appendChild(row);
      });
    }

    $("btn-retry").textContent = scores ? "다시 하기" : "나도 테스트하기";
    show("screen-result");
  }

  async function share() {
    const code = new URLSearchParams(location.search).get("type");
    const t = TYPES[code];
    const url = `${location.origin}${location.pathname}?type=${code}`;
    const text = `나의 풋살 MBTI는 ${code} · ${t.name}! 너는 어떤 유형이야? ⚽`;
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
      toast("링크가 복사됐어요! 단톡방에 붙여넣기 📋");
    } catch {
      prompt("아래 링크를 복사하세요", url);
    }
  }

  // ---------- 전체 유형 ----------
  function renderAll() {
    const grid = $("type-grid");
    grid.innerHTML = "";
    ["D", "P"].forEach((group) => {
      const h = document.createElement("h3");
      h.className = "group-title";
      h.textContent = group === "D" ? "돌파형 D" : "연계형 P";
      grid.appendChild(h);
      Object.entries(TYPES)
        .filter(([code]) => code[0] === group)
        .forEach(([code, t]) => {
          const b = document.createElement("button");
          b.className = "type-tile";
          b.innerHTML = `<span class="tc"></span><span class="tn"></span>`;
          b.querySelector(".tc").textContent = code;
          b.querySelector(".tn").textContent = t.name;
          b.onclick = () => {
            renderResult(code, null, "");
            history.replaceState(null, "", `?type=${code}`);
          };
          grid.appendChild(b);
        });
    });
  }

  function openAll(from) {
    state.prevScreen = from;
    renderAll();
    show("screen-all");
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
  $("btn-all").onclick = () => openAll("screen-result");
  $("btn-all-intro").onclick = () => openAll("screen-intro");
  $("btn-all-back").onclick = () => show(state.prevScreen);

  // 공유 링크로 들어온 경우 (?type=XXXX)
  const shared = (new URLSearchParams(location.search).get("type") || "").toUpperCase();
  if (TYPES[shared]) renderResult(shared, null, "");
})();
