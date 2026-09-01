function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function href(parameters = {}) {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(name, value);
    }
  }
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

function sourceHref(location) {
  const search = new URLSearchParams({
    line: String(location.line),
    path: location.path,
  });
  return `/source?${search}`;
}

function claimMatches(claim, subject, filters) {
  if (filters.subject && claim.subjectId !== filters.subject) return false;
  if (filters.kind && claim.kind !== filters.kind) return false;
  if (filters.ownership === "seam" && !claim.seam) return false;
  if (filters.ownership === "local" && claim.seam) return false;
  if (!filters.query) return true;

  const searchable = [subject.name, subject.id, claim.id, claim.title, claim.statement]
    .join("\n")
    .toLocaleLowerCase();
  return searchable.includes(filters.query.toLocaleLowerCase());
}

function claimBadge(claim) {
  return `<span class="badge badge-${claim.kind}">${escapeHtml(claim.kind)}</span>${
    claim.seam ? '<span class="badge badge-seam">cross-cutting</span>' : ""
  }`;
}

function sourceLink(location) {
  return `<a class="source-link" href="${escapeHtml(sourceHref(location))}">${escapeHtml(location.path)}:${location.line}</a>`;
}

function fileLink(location) {
  const segments = location.path.split("/");
  const name = segments.pop();
  const directory = segments.join("/") || "repository root";
  const label = `${location.path}:${location.line}`;
  return `<a class="file-link" href="${escapeHtml(sourceHref(location))}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
    <span class="file-name">${escapeHtml(name)}</span>
    <span class="file-meta">${escapeHtml(directory)} <span aria-hidden="true">·</span> line ${location.line}</span>
  </a>`;
}

function subjectLabel(subject) {
  const label = subject.name.replaceAll(/[-_]+/g, " ");
  return `${label[0]?.toLocaleUpperCase() ?? ""}${label.slice(1)}`;
}

function renderProofs(claim) {
  return `<section class="proofs">
    <div class="section-label"><span>Executable proofs</span><span class="section-count">${claim.proofs.length}</span></div>
    <ul>${claim.proofs.map((proof) => `<li>${fileLink(proof)}</li>`).join("")}</ul>
  </section>`;
}

function renderClaimCard(claim, subject, filters) {
  const parameters = {
    claim: claim.key,
    kind: filters.kind,
    ownership: filters.ownership,
    q: filters.rawQuery,
    subject: filters.subject,
  };
  return `<article class="claim-card" data-claim-title="${escapeHtml(claim.title)}">
    <div class="claim-identity">
      <span class="claim-id">§${escapeHtml(claim.id)}</span>
      <div>${claimBadge(claim)}</div>
    </div>
    <div class="claim-content">
      <div class="claim-context">${escapeHtml(subjectLabel(subject))} <span aria-hidden="true">/</span> §${escapeHtml(claim.section?.id ?? "")} ${escapeHtml(claim.section?.title ?? "")}</div>
      <h3><a class="claim-card-link" href="${escapeHtml(href(parameters))}">${escapeHtml(claim.title)}</a></h3>
      <p>${escapeHtml(claim.statement)}</p>
      <div class="claim-meta">${claim.proofs.length} proof${claim.proofs.length === 1 ? "" : "s"} <span aria-hidden="true">·</span> ${sourceLink(claim.claimDocument)}</div>
    </div>
  </article>`;
}

function renderClaimDetail(claim, subject) {
  return `<article class="claim-detail" data-claim-title="${escapeHtml(claim.title)}">
    <div class="detail-content">
      <div class="detail-page-head">
        <a class="back-link" href="${escapeHtml(href({ subject: subject.id }))}">← All ${escapeHtml(subjectLabel(subject))} claims</a>
        <h1>${escapeHtml(subjectLabel(subject))}</h1>
        <div class="muted">${escapeHtml(subject.id)} · Claim and proofs</div>
      </div>
      <section class="detail-main">
        <div class="detail-heading">
          <div>${claimBadge(claim)}</div>
          <span class="claim-id">§${escapeHtml(claim.id)}</span>
        </div>
        <div class="claim-context">${escapeHtml(subject.id)} <span aria-hidden="true">/</span> §${escapeHtml(claim.section?.id ?? "")} ${escapeHtml(claim.section?.title ?? "")}</div>
        <h2>${escapeHtml(claim.title)}</h2>
        <div class="statement">${escapeHtml(claim.statement)}</div>
      </section>
    </div>
    <aside class="detail-sidebar" aria-label="Claim files">
      <section>
        <div class="section-label">Claim source</div>
        ${fileLink(claim.claimDocument)}
      </section>
      ${renderProofs(claim)}
    </aside>
  </article>`;
}

function renderSubjectCards(subjects, claimsByKey) {
  return `<div class="subject-list">
    <div class="subject-list-head"><span>Subject</span><span>Claims</span></div>
    ${subjects
      .map((subject) => {
        const claims = subject.claimKeys.map((key) => claimsByKey.get(key)).filter(Boolean);
        const invariantCount = claims.filter(({ kind }) => kind === "invariant").length;
        const scenarioCount = claims.length - invariantCount;
        return `<a class="subject-row" data-subject-id="${escapeHtml(subject.id)}" href="${escapeHtml(href({ subject: subject.id }))}">
        <span class="subject-icon">${subject.seam ? "↔" : "§"}</span>
        <span class="subject-copy">
          <span class="subject-title">${escapeHtml(subjectLabel(subject))}</span>
          <span class="subject-path">${escapeHtml(subject.path || "repository root")}</span>
        </span>
        <span class="subject-counts">
          ${invariantCount > 0 ? `<span><strong>${invariantCount}</strong> invariant${invariantCount === 1 ? "" : "s"}</span>` : ""}
          ${scenarioCount > 0 ? `<span><strong>${scenarioCount}</strong> scenario${scenarioCount === 1 ? "" : "s"}</span>` : ""}
          ${subject.seam ? '<span class="badge badge-seam">cross-cutting</span>' : ""}
        </span>
      </a>`;
      })
      .join("")}
  </div>`;
}

function layout({ body, detail = false, model, filters, subtitle, title }) {
  const currentQuery = filters.rawQuery;
  const clearSearchUrl = href({
    kind: filters.kind,
    ownership: filters.ownership,
    subject: filters.subject,
    view: "claims",
  });
  const invariantCount = model.claims.filter(({ kind }) => kind === "invariant").length;
  const scenarioCount = model.claims.length - invariantCount;
  const seamCount = model.claims.filter(({ seam }) => seam).length;
  const localCount = model.claims.length - seamCount;
  const navLink = ({ count, label, parameters, selected }) =>
    `<a class="nav-link${selected ? " active" : ""}" href="${escapeHtml(href(parameters))}"><span>${label}</span><span class="nav-count">${count}</span></a>`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · Semantic Explorer</title>
  <style>
    :root { color-scheme:dark; --ink:#eeeeef; --muted:#9a9ba4; --faint:#656671; --paper:#111114; --panel:#16161a; --panel-raised:#19191e; --panel-hover:#1b1b20; --sidebar:#0f0f12; --line:#27272d; --line-strong:#34343c; --accent:#8d82f6; --accent-soft:rgba(141,130,246,.12); --blue:#7fa6c9; --blue-soft:rgba(127,166,201,.11); --amber:#c3a26b; --amber-soft:rgba(195,162,107,.11); }
    * { box-sizing:border-box; }
    body { overflow-x:hidden; margin:0; color:var(--ink); background:var(--paper); font:13px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; -webkit-font-smoothing:antialiased; }
    a { color:inherit; }
    .app-shell { display:grid; grid-template-columns:224px minmax(0,1fr); min-height:100vh; }
    .sidebar { position:sticky; top:0; min-width:0; height:100vh; padding:20px 12px; border-right:1px solid var(--line); background:var(--sidebar); }
    .brand { display:flex; align-items:center; gap:10px; margin:0 8px 27px; text-decoration:none; }
    .mark { display:grid; place-items:center; width:28px; height:28px; border:1px solid rgba(141,130,246,.38); border-radius:7px; color:#d8d3ff; background:linear-gradient(145deg,rgba(141,130,246,.26),rgba(141,130,246,.08)); font:700 14px/1 ui-serif,Georgia,serif; box-shadow:inset 0 1px 0 rgba(255,255,255,.08); }
    .brand strong { display:block; font-size:12px; font-weight:600; letter-spacing:-.005em; }
    .brand span span { display:block; margin-top:1px; color:var(--faint); font-size:10px; }
    .nav-title { margin:20px 10px 6px; color:#555660; font-size:9px; font-weight:650; letter-spacing:.11em; text-transform:uppercase; }
    .nav-link { display:flex; align-items:center; justify-content:space-between; min-height:32px; padding:6px 9px; border:1px solid transparent; border-radius:6px; color:#888994; text-decoration:none; transition:background .12s ease,color .12s ease; }
    .nav-link:hover { color:#d8d8dc; background:rgba(255,255,255,.035); }
    .nav-link.active { border-color:rgba(255,255,255,.035); color:#f1f1f2; background:rgba(255,255,255,.065); }
    .nav-count { color:#5f606a; font-size:10px; font-variant-numeric:tabular-nums; }
    .nav-link.active .nav-count { color:#9d9ea7; }
    .sidebar-foot { position:absolute; right:20px; bottom:18px; left:20px; color:#4f5059; font-size:10px; }
    .workspace { min-width:0; }
    .toolbar { position:sticky; z-index:10; top:0; display:flex; align-items:center; gap:18px; min-height:58px; padding:11px clamp(22px,3vw,40px); border-bottom:1px solid var(--line); background:rgba(17,17,20,.88); backdrop-filter:blur(12px); }
    .search { position:relative; min-width:0; width:min(520px,100%); }
    .search-icon { position:absolute; z-index:1; top:50%; left:11px; width:14px; height:14px; color:#6b6c76; pointer-events:none; transform:translateY(-50%); }
    .search-icon svg { display:block; width:100%; height:100%; }
    .search input { width:100%; height:36px; padding:0 76px 0 35px; border:1px solid var(--line); border-radius:8px; outline:none; color:var(--ink); background:var(--panel); font:inherit; box-shadow:inset 0 1px 0 rgba(255,255,255,.02); }
    .search.has-query input { padding-right:104px; }
    .search input::-webkit-search-cancel-button { display:none; -webkit-appearance:none; }
    .search input::placeholder { color:#60616a; }
    .search input:focus { border-color:#565067; box-shadow:0 0 0 2px rgba(141,130,246,.09); }
    .search-actions { position:absolute; z-index:2; top:4px; right:4px; display:flex; height:28px; gap:4px; }
    .search-clear { display:grid; place-items:center; width:28px; height:28px; padding:0; border:0; border-radius:6px; color:#686973; background:transparent; cursor:pointer; }
    .search-clear[hidden] { display:none; }
    .search-clear:hover { color:#c2c2c8; background:rgba(255,255,255,.045); }
    .search-clear:focus-visible { outline:2px solid var(--accent); outline-offset:-2px; }
    .search-clear svg { display:block; width:12px; height:12px; }
    .search-submit { width:58px; height:28px; padding:0; border:1px solid var(--line); border-radius:6px; color:#aaaab2; background:#202026; font:550 10px/1 inherit; cursor:pointer; }
    .search-submit:hover { color:#ededee; background:#27272e; }
    .toolbar-summary { margin-left:auto; color:#64656e; font-size:10px; white-space:nowrap; }
    main { width:min(1080px,100%); padding:34px clamp(22px,3vw,40px) 64px; }
    .page-head { display:flex; align-items:end; justify-content:space-between; gap:24px; margin-bottom:22px; }
    h1,h2,h3,p { margin-top:0; }
    h1 { margin-bottom:3px; font-size:23px; font-weight:600; line-height:1.25; letter-spacing:-.025em; }
    h2 { font-size:22px; font-weight:580; line-height:1.3; letter-spacing:-.02em; }
    h3 { margin-bottom:5px; font-size:14px; font-weight:580; line-height:1.4; letter-spacing:-.007em; }
    h3 a { text-decoration:none; }
    h3 a:hover { color:#fff; }
    .muted,.summary { color:var(--muted); }
    .muted { font-size:12px; }
    .summary { padding-bottom:2px; font-size:10px; white-space:nowrap; }
    .subject-list,.claim-list { overflow:hidden; border:1px solid var(--line); border-radius:8px; background:var(--panel); box-shadow:0 12px 32px rgba(0,0,0,.08); }
    .subject-list-head { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:18px; padding:8px 16px 8px 58px; border-bottom:1px solid var(--line); color:#5b5c65; background:#141418; font-size:9px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
    .subject-row { display:grid; grid-template-columns:28px minmax(0,1fr) auto; align-items:center; gap:13px; min-height:62px; padding:10px 16px; border-bottom:1px solid var(--line); text-decoration:none; box-shadow:inset 2px 0 transparent; transition:background .1s ease,box-shadow .1s ease; }
    .subject-row:last-child { border-bottom:0; }
    .subject-row:hover { background:var(--panel-hover); box-shadow:inset 2px 0 rgba(141,130,246,.55); }
    .subject-row:focus-visible { outline:2px solid var(--accent); outline-offset:-2px; }
    .subject-icon { display:grid; place-items:center; width:28px; height:28px; border:1px solid rgba(141,130,246,.16); border-radius:6px; color:#afa7ff; background:var(--accent-soft); font:650 12px/1 ui-serif,Georgia,serif; }
    .subject-copy { min-width:0; }
    .subject-title,.subject-path { display:block; }
    .subject-title { overflow:hidden; font-weight:550; font-size:13px; text-overflow:ellipsis; white-space:nowrap; }
    .subject-path { overflow:hidden; margin-top:1px; color:#73747d; font:10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace; text-overflow:ellipsis; white-space:nowrap; }
    .subject-counts { display:flex; align-items:center; justify-content:flex-end; gap:14px; color:#777881; font-size:10px; white-space:nowrap; }
    .subject-counts strong { color:#b8b8be; font-weight:550; }
    .claim-grid { display:block; overflow:hidden; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
    .claim-card { position:relative; display:grid; grid-template-columns:84px minmax(0,1fr); gap:18px; padding:17px 16px; border-bottom:1px solid var(--line); cursor:pointer; box-shadow:inset 2px 0 transparent; transition:background .1s ease,box-shadow .1s ease; }
    .claim-card:last-child { border-bottom:0; }
    .claim-card:hover { background:var(--panel-hover); box-shadow:inset 2px 0 rgba(141,130,246,.55); }
    .claim-identity { padding-top:2px; }
    .claim-identity .badge { margin-top:8px; }
    .claim-context { margin-bottom:5px; color:#767780; font-size:10px; }
    .claim-context span { padding:0 3px; color:#4f5059; }
    .claim-content p { max-width:760px; margin-bottom:8px; color:#aaaab1; }
    .claim-card-link::after { position:absolute; inset:0; content:""; }
    .claim-card-link:focus-visible { outline:none; }
    .claim-card-link:focus-visible::after { border-radius:7px; outline:2px solid var(--accent); outline-offset:-2px; }
    .claim-card:hover h3 { color:#fff; }
    .claim-meta { color:#686972; font-size:10px; }
    .claim-meta > span { padding:0 4px; }
    .badge { display:inline-block; margin-right:4px; padding:2px 5px; border:1px solid transparent; border-radius:4px; font-size:8px; font-weight:650; letter-spacing:.045em; text-transform:uppercase; }
    .badge-invariant { color:var(--accent); background:var(--accent-soft); }
    .badge-scenario { color:var(--blue); background:var(--blue-soft); }
    .badge-seam { color:var(--amber); background:var(--amber-soft); }
    .claim-id { color:#8b8c95; font:600 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace; }
    .source-link { position:relative; z-index:1; color:#8d88bb; font:10px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace; text-decoration-color:#45425e; text-underline-offset:2px; }
    .source-link:hover { color:#b6afff; }
    .detail-view { width:100%; max-width:none; min-height:calc(100vh - 58px); padding:0; }
    .claim-detail { display:grid; grid-template-columns:minmax(0,1fr) 320px; min-height:calc(100vh - 58px); }
    .detail-content { min-width:0; padding:34px clamp(24px,4vw,56px) 64px; }
    .detail-page-head,.detail-main { width:min(760px,100%); }
    .detail-page-head { margin-bottom:22px; }
    .back-link { display:inline-block; margin-bottom:20px; color:#787983; font-size:11px; text-decoration:none; }
    .back-link:hover { color:var(--ink); }
    .detail-main { padding:30px; border:1px solid var(--line); border-radius:8px; background:var(--panel); box-shadow:0 12px 32px rgba(0,0,0,.08); }
    .detail-sidebar { position:sticky; top:58px; min-width:0; height:calc(100vh - 58px); overflow-y:auto; padding:30px 20px; border-left:1px solid var(--line); background:#0f0f12; scrollbar-color:#34343c transparent; scrollbar-width:thin; }
    .detail-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; }
    .statement { margin:22px 0 2px; padding:18px 20px; border:1px solid rgba(141,130,246,.12); border-left:2px solid var(--accent); border-radius:0 6px 6px 0; color:#d3d3d7; background:rgba(141,130,246,.045); white-space:pre-wrap; font-size:15px; line-height:1.65; }
    .section-label { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:9px; color:#7f808a; font-size:9px; font-weight:650; letter-spacing:.075em; text-transform:uppercase; }
    .section-count { display:grid; place-items:center; min-width:18px; height:18px; padding:0 5px; border:1px solid var(--line); border-radius:9px; color:#7f808a; font-size:9px; font-variant-numeric:tabular-nums; }
    .file-link { display:block; min-width:0; padding:8px 9px; border-radius:6px; text-decoration:none; transition:background .1s ease; }
    .file-link:hover { background:rgba(255,255,255,.045); }
    .file-link:focus-visible { outline:2px solid var(--accent); outline-offset:-2px; }
    .file-name,.file-meta { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .file-name { color:#aaa4ed; font:11px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace; }
    .file-link:hover .file-name { color:#c5c0ff; }
    .file-meta { margin-top:2px; color:#5f6069; font:9px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace; }
    .file-meta span { padding:0 3px; color:#45464e; }
    .proofs { margin-top:28px; }
    .proofs ul { margin:0; padding:0; list-style:none; }
    .proofs li { margin:0 0 2px; }
    .empty { padding:48px; border:1px dashed var(--line-strong); border-radius:8px; color:var(--muted); background:var(--panel); text-align:center; }
    @media (max-width:1050px) { .claim-detail { grid-template-columns:1fr; } .detail-sidebar { position:static; height:auto; max-height:none; border-top:1px solid var(--line); border-left:0; } }
    @media (max-width:820px) { .app-shell { grid-template-columns:1fr; } .sidebar { position:static; overflow:hidden; height:auto; padding:14px; border-right:0; border-bottom:1px solid var(--line); } .brand { margin:0 4px 14px; } .sidebar nav { display:flex; max-width:100%; gap:3px; overflow-x:auto; } .nav-title,.sidebar-foot { display:none; } .nav-link { flex:0 0 auto; gap:8px; } .toolbar { min-width:0; padding:10px 14px; } .toolbar-summary { display:none; } main { padding:26px 14px 48px; } main.detail-view { padding:0; } .page-head { align-items:start; flex-direction:column; margin-bottom:18px; } .subject-list-head { display:none; } .subject-row { grid-template-columns:28px minmax(0,1fr); } .subject-counts { grid-column:2; justify-content:flex-start; } .claim-card { grid-template-columns:1fr; } .claim-identity { display:flex; align-items:center; justify-content:space-between; grid-column:1; } .claim-identity .badge { margin-top:0; } .claim-content { grid-column:1; } .detail-content { padding:26px 14px 36px; } .detail-main { padding:24px 20px; } .detail-sidebar { padding:24px 14px; } }
  </style>
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/"><span class="mark">§</span><span><strong>Semantic Explorer</strong><span>Claims and proofs</span></span></a>
      <nav>
      <div class="nav-title">Explore</div>
      ${navLink({ count: model.subjects.length, label: "Subjects", parameters: {}, selected: !filters.claim && filters.view !== "claims" && !filters.kind && !filters.ownership && !filters.subject && !filters.query })}
      ${navLink({ count: model.claims.length, label: "All claims", parameters: { view: "claims" }, selected: (filters.view === "claims" || filters.claim) && !filters.kind && !filters.ownership })}
      <div class="nav-title">Claim kind</div>
      ${navLink({ count: invariantCount, label: "Invariants", parameters: { kind: "invariant" }, selected: filters.kind === "invariant" })}
      ${navLink({ count: scenarioCount, label: "Scenarios", parameters: { kind: "scenario" }, selected: filters.kind === "scenario" })}
      <div class="nav-title">Scope</div>
      ${navLink({ count: localCount, label: "Local", parameters: { ownership: "local" }, selected: filters.ownership === "local" })}
      ${navLink({ count: seamCount, label: "Cross-cutting", parameters: { ownership: "seam" }, selected: filters.ownership === "seam" })}
      </nav>
      <div class="sidebar-foot">Read-only · local repository</div>
    </aside>
    <section class="workspace">
      <header class="toolbar">
        <form class="search${filters.query ? " has-query" : ""}" method="get" action="/" data-clear-href="${escapeHtml(clearSearchUrl)}" data-filtered="${filters.query ? "true" : "false"}">
          ${filters.kind ? `<input type="hidden" name="kind" value="${escapeHtml(filters.kind)}">` : ""}
          ${filters.ownership ? `<input type="hidden" name="ownership" value="${escapeHtml(filters.ownership)}">` : ""}
          ${filters.subject ? `<input type="hidden" name="subject" value="${escapeHtml(filters.subject)}">` : ""}
          ${filters.view === "claims" || filters.query ? '<input type="hidden" name="view" value="claims">' : ""}
          <span class="search-icon" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.25" stroke="currentColor" stroke-width="1.5"/><path d="m10.25 10.25 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
          <input aria-label="Search claims" type="search" name="q" value="${escapeHtml(currentQuery)}" placeholder="Search subjects, claims, and statements">
          <span class="search-actions">
            <button class="search-clear" type="button" aria-label="Clear search"${filters.query ? "" : " hidden"}><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 3 6 6M9 3 3 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
            <button class="search-submit" type="submit">Search</button>
          </span>
        </form>
        <div class="toolbar-summary">${model.claims.length} claims · ${model.subjects.length} subjects</div>
      </header>
      <main${detail ? ' class="detail-view"' : ""}>
        ${detail ? "" : `<div class="page-head"><div><h1>${escapeHtml(title)}</h1><div class="muted">${escapeHtml(subtitle)}</div></div><div class="summary">${filters.subject ? `${model.claims.filter(({ subjectId }) => subjectId === filters.subject).length} claims` : ""}</div></div>`}
        ${body}
      </main>
    </section>
  </div>
  <script>
    const searchForm = document.querySelector('.search');
    const searchInput = searchForm.querySelector('input[type="search"]');
    const clearSearch = searchForm.querySelector('.search-clear');
    searchInput.addEventListener('input', () => {
      const hasQuery = searchInput.value.length > 0;
      searchForm.classList.toggle('has-query', hasQuery);
      clearSearch.hidden = !hasQuery;
    });
    clearSearch.addEventListener('click', () => {
      if (searchForm.dataset.filtered === 'true') {
        window.location.assign(searchForm.dataset.clearHref);
        return;
      }
      searchInput.value = '';
      searchForm.classList.remove('has-query');
      clearSearch.hidden = true;
      searchInput.focus();
    });
  </script>
</body>
</html>`;
}

export function renderExplorer(model, searchParameters = new URLSearchParams()) {
  const subjectsById = new Map(model.subjects.map((subject) => [subject.id, subject]));
  const claimsByKey = new Map(model.claims.map((claim) => [claim.key, claim]));
  const kind = ["invariant", "scenario"].includes(searchParameters.get("kind"))
    ? searchParameters.get("kind")
    : "";
  const ownership = ["local", "seam"].includes(searchParameters.get("ownership"))
    ? searchParameters.get("ownership")
    : "";
  const subjectId = subjectsById.has(searchParameters.get("subject"))
    ? searchParameters.get("subject")
    : "";
  const selectedClaim = claimsByKey.get(searchParameters.get("claim"));
  const filters = {
    claim: selectedClaim?.key ?? "",
    kind,
    ownership,
    query: (searchParameters.get("q") ?? "").trim(),
    rawQuery: searchParameters.get("q") ?? "",
    subject: subjectId,
    view: searchParameters.get("view") ?? "",
  };

  if (selectedClaim) {
    const subject = subjectsById.get(selectedClaim.subjectId);
    return layout({
      body: renderClaimDetail(selectedClaim, subject),
      detail: true,
      filters,
      model,
      subtitle: `${subject.id} · Claim and proofs`,
      title: subjectLabel(subject),
    });
  }

  const showSubjects =
    searchParameters.get("view") !== "claims" &&
    !filters.kind &&
    !filters.ownership &&
    !filters.query &&
    !filters.subject;
  if (showSubjects) {
    return layout({
      body: renderSubjectCards(model.subjects, claimsByKey),
      filters,
      model,
      subtitle: "Subjects with Semantic Claims",
      title: "Subjects",
    });
  }

  const claims = model.claims.filter((claim) =>
    claimMatches(claim, subjectsById.get(claim.subjectId), filters),
  );
  const selectedSubject = subjectsById.get(filters.subject);
  const title = selectedSubject
    ? subjectLabel(selectedSubject)
    : filters.kind
      ? `${filters.kind[0].toUpperCase()}${filters.kind.slice(1)}s`
      : filters.ownership === "seam"
        ? "Cross-cutting claims"
        : filters.query
          ? "Search results"
          : "All claims";
  const subtitle = selectedSubject
    ? `${selectedSubject.id}${selectedSubject.seam ? " · cross-cutting claims" : ""}`
    : `${claims.length} matching claim${claims.length === 1 ? "" : "s"}`;
  const body = claims.length
    ? `<div class="claim-grid">${claims
        .map((claim) => renderClaimCard(claim, subjectsById.get(claim.subjectId), filters))
        .join("")}</div>`
    : '<div class="empty">No Semantic Claims match this view.</div>';

  return layout({ body, filters, model, subtitle, title });
}

export function renderSource({ contents, line, path }) {
  const sourceLines = contents.split(/\r?\n/);
  const body = sourceLines
    .map(
      (sourceLine, index) =>
        `<span id="L${index + 1}" class="source-line${index + 1 === line ? " highlight" : ""}"><span class="line-number">${index + 1}</span>${escapeHtml(sourceLine)}</span>`,
    )
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(path)} · Semantic Explorer</title><style>*{box-sizing:border-box}body{margin:0;color:#eeeeef;background:#111114;font:13px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}.source-page{max-width:1100px;margin:0 auto;padding:34px 24px 60px}.source-nav{color:#8d88bb;text-decoration:none}.source-nav:hover{color:#b6afff}h1{margin:22px 0 18px;font-size:20px;font-weight:600;letter-spacing:-.02em}pre{overflow:auto;margin:0;padding:16px 0;border:1px solid #27272d;border-radius:8px;color:#d6d6da;background:#16161a;font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace}.source-line{display:block;padding:0 18px;white-space:pre}.source-line.highlight{background:rgba(141,130,246,.12)}.line-number{display:inline-block;width:38px;margin-right:16px;color:#555660;text-align:right;user-select:none}</style></head><body><main class="source-page"><a class="source-nav" href="/">← Semantic Explorer</a><h1>${escapeHtml(path)}</h1><pre>${body}</pre></main></body></html>`;
}
