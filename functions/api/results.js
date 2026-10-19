// Cloudflare Pages Function: POST /api/results
// 테스트 결과(닉네임 + 유형)를 D1 데이터베이스에 저장한다.
// Pages 프로젝트 설정에서 D1 바인딩 이름을 DB로 연결해야 동작한다.

const TYPE_RE = /^[DP][IO][FC][LM]$/;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "DB not bound" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }

  const name = String(body.name || "").trim().slice(0, 12);
  const type = String(body.type || "");
  const answers = String(body.answers || "").replace(/[^AB]/g, "").slice(0, 20);
  const scores = Array.isArray(body.scores) ? body.scores.slice(0, 4).map((n) => Number(n) || 0) : [];

  if (!name || !TYPE_RE.test(type)) return json({ ok: false, error: "invalid input" }, 400);

  await env.DB.prepare(
    "INSERT INTO results (name, type, scores, answers) VALUES (?1, ?2, ?3, ?4)"
  )
    .bind(name, type, JSON.stringify(scores), answers)
    .run();

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
