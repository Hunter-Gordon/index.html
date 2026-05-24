// ── CONSTANTS ─────────────────────────────────────────────────────────
var OWNER = { user: "gordonh15769", pass: "hunhedg6" };
var PLAYOFF_SPOTS = 12;

// Sport season defaults
var SPORT_SEASONS = {
  "Football":"Fall","Volleyball":"Fall","Cross Country":"Fall",
  "Soccer":"Fall","Golf":"Fall","Basketball":"Winter","Wrestling":"Winter",
  "Swimming":"Winter","Bowling":"Winter","Indoor Track":"Winter",
  "Baseball":"Spring","Softball":"Spring","Tennis":"Spring",
  "Track & Field":"Spring","Lacrosse":"Spring"
};

// ── STATE ─────────────────────────────────────────────────────────────
var S = {
  gender: "", sport: "", editIdx: -1, session: null, rankView: "table",
  currentSeasonFilter: "All", currentGenderFilter: "All",
  sports:        lsGet("gcl_sports",      ["Football","Basketball","Soccer","Baseball","Volleyball","Wrestling","Swimming","Tennis"]),
  sportSeasons:  lsGet("gcl_sport_seasons",{}),
  sportGenders:  lsGet("gcl_sport_genders",{}),
  schools:       lsGet("gcl_schools",     []),
  news:          lsGet("gcl_news",        []),
  polls:         lsGet("gcl_polls",       []),
  votes:         lsGet("gcl_votes",       {}),
  admins:        lsGet("gcl_admins",      []),
  gotw:          lsGet("gcl_gotw",        {}),
  ticker:        lsGet("gcl_ticker",      []),
  rivalries:     lsGet("gcl_rivalries",   [])
};

function lsGet(k, d) {
  try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e) { return d; }
}
function save() {
  var keys = {
    gcl_sports: S.sports, gcl_sport_seasons: S.sportSeasons,
    gcl_sport_genders: S.sportGenders,
    gcl_schools: S.schools, gcl_news: S.news, gcl_polls: S.polls,
    gcl_votes: S.votes, gcl_admins: S.admins, gcl_gotw: S.gotw,
    gcl_ticker: S.ticker, gcl_rivalries: S.rivalries
  };
  Object.keys(keys).forEach(k => {
    try { localStorage.setItem(k, JSON.stringify(keys[k])); } catch(e) {}
  });
}

function getSportSeason(sport) {
  if (S.sportSeasons[sport]) return S.sportSeasons[sport];
  if (SPORT_SEASONS[sport]) return SPORT_SEASONS[sport];
  return "Fall";
}

function getSportGender(sport) {
  if (S.sportGenders[sport]) return S.sportGenders[sport];
  return "Both";
}

// ── RATING ENGINE ─────────────────────────────────────────────────────
function autoRating(school) {
  var w = 0, l = 0, cw = 0, cl = 0;
  if (school.record) {
    var p = String(school.record).split(/[-\/]/);
    w = Number(p[0])||0; l = Number(p[1])||0;
  }
  if (school.conf) {
    var cp = String(school.conf).split(/[-\/]/);
    cw = Number(cp[0])||0; cl = Number(cp[1])||0;
  }
  var games = w + l || 1;
  var cgames = cw + cl || 1;
  var winPct = w / games;
  var confPct = cw / cgames;
  var streakBonus = 0;
  if (school.streak) {
    var sm = String(school.streak).match(/([WL])(\d+)/i);
    if (sm) {
      var n = Math.min(Number(sm[2]), 10);
      streakBonus = sm[1].toUpperCase() === 'W' ? n * 1.5 : -(n * 1.2);
    }
  }
  var rating = (winPct * 50) + (confPct * 25) + streakBonus + (w * 0.5);
  rating = Math.min(99, Math.max(1, Math.round(rating)));
  return rating;
}

// ── HELPERS ───────────────────────────────────────────────────────────
function calcWinPct(record) {
  if (!record) return { w: 0, l: 0, pct: 0, str: "0%" };
  var p = String(record).split(/[-\/]/);
  var w = Number(p[0])||0, l = Number(p[1])||0;
  var pct = w + l > 0 ? Math.round(w / (w + l) * 100) : 0;
  return { w, l, pct, str: pct + "%" };
}

function logoTag(url, name, bigCls, phCls) {
  var ini = initials(name);
  if (url && url.trim()) {
    return `<img src="${url.trim()}" class="${bigCls}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="${phCls}" style="display:none">${ini}</span>`;
  }
  return `<span class="${phCls}">${ini}</span>`;
}

function initials(name) {
  return (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
}

function fmtTime(t) {
  if (!t) return "";
  var p = t.split(":"); var h = Number(p[0]); var m = p[1];
  return (h%12||12)+":"+m+" "+(h>=12?"PM":"AM");
}

function flash(id, msg, isErr) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = isErr ? "var(--redsoft)" : "var(--green-soft)";
  setTimeout(()=>{ if(el) el.textContent=""; }, 2800);
}

function escQ(s) { return String(s).replace(/'/g,"\\'"); }

function isCurrentSeason(year) {
  var y = String(year||"").toLowerCase().replace(/\s/g,"");
  return y === "2025-26" || y === "2026-27" || y === "2025" || y === "2026";
}

function genderChip(gender) {
  if (!gender) return '';
  var g = String(gender).toLowerCase();
  if (g === 'boys') return `<span class="gender-chip-b">♂ BOYS</span>`;
  if (g === 'girls') return `<span class="gender-chip-g">♀ GIRLS</span>`;
  if (g === 'both') return `<span class="gender-chip-both">⚥ BOTH</span>`;
  return '';
}

function sportIcon(sport) {
  var icons = {
    "Football":"🏈","Basketball":"🏀","Soccer":"⚽","Baseball":"⚾",
    "Volleyball":"🏐","Tennis":"🎾","Swimming":"🏊","Wrestling":"🤼",
    "Golf":"⛳","Cross Country":"🏃","Softball":"🥎","Lacrosse":"🥍",
    "Track & Field":"🏟","Indoor Track":"🏃","Bowling":"🎳","Hockey":"🏒"
  };
  return icons[sport] || "🏆";
}

// ── HEADER SCROLL ─────────────────────────────────────────────────────
window.addEventListener("scroll", function() {
  var hdr = document.getElementById("siteHeader");
  if (hdr) hdr.classList.toggle("scrolled", window.scrollY > 20);
});

// ── NAV ───────────────────────────────────────────────────────────────
function gTab(t) {
  document.querySelectorAll(".pg").forEach(p => p.classList.remove("act"));
  var target = document.getElementById("gcl-"+t);
  if (target) target.classList.add("act");
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("act"));
  var nb = document.getElementById("nb-"+t);
  if (nb) nb.classList.add("act");
  if (t === "news") renderNews();
  if (t === "polls") renderPolls();
  if (t === "predictor") initPredictor();
  if (t === "gotw") renderGOTW();
  if (t === "standings") initStandings();
  window.scrollTo(0, 0);
}

function toggleMenu() {
  var nav = document.getElementById("mainNav");
  var ham = document.getElementById("hamburger");
  nav.classList.toggle("open");
  ham.classList.toggle("open");
}
function closeMenu() {
  document.getElementById("mainNav").classList.remove("open");
  document.getElementById("hamburger").classList.remove("open");
}

// ── TICKER ────────────────────────────────────────────────────────────
function renderTicker() {
  var bar = document.getElementById("ticker-bar");
  if (!S.ticker.length) { bar.classList.remove("visible"); return; }
  bar.classList.add("visible");
  document.getElementById("ticker-content").textContent =
    S.ticker.map(t => "⚡ " + t).join("   ·   ");
}

// ── MARQUEE ───────────────────────────────────────────────────────────
function updateMarquee() {
  var items = S.sports.map(s => {
    var icon = sportIcon(s);
    return `<span class="mq-item">${icon} ${s}</span><span class="mq-sep">·</span>`;
  }).join("");
  var t1 = document.getElementById("marqueeTrack");
  var t2 = document.getElementById("marqueeTrack2");
  if (t1 && items) t1.innerHTML = items;
  if (t2 && items) t2.innerHTML = items;
}

// ── STATS BAR ─────────────────────────────────────────────────────────
function renderStatsBar() {
  var el = document.getElementById("statsBar");
  if (!el) return;
  var curSchools = S.schools.filter(x => isCurrentSeason(x.year));
  var sports = new Set(curSchools.map(x => x.sport)).size;
  var schools = new Set(curSchools.map(x => x.name)).size;
  var boys = curSchools.filter(x => x.gender === 'Boys').length;
  var girls = curSchools.filter(x => x.gender === 'Girls').length;

  el.innerHTML = [
    { val: curSchools.length || "—", lbl: "Team Entries" },
    { val: schools || "—", lbl: "Schools" },
    { val: sports || S.sports.length, lbl: "Sports" },
    { val: boys || "—", lbl: "Boys Teams" },
    { val: girls || "—", lbl: "Girls Teams" }
  ].map(x => `<div class="stat-bar-item">
    <div class="sbi-val">${x.val}</div>
    <div class="sbi-lbl">${x.lbl}</div>
  </div>`).join("");
}

// ── HOME ──────────────────────────────────────────────────────────────
function renderHome() {
  renderHotTeams();
  renderHomeNews();
  renderHomePoll();
  renderSeasonCards();
  updateMarquee();
  renderStatsBar();
  renderSpotlight();
  renderCincySchools();
}

function renderHotTeams() {
  var filtered = S.schools.filter(x => isCurrentSeason(x.year));
  var all = filtered.slice().sort((a,b) => autoRating(b) - autoRating(a)).slice(0, 6);
  var el = document.getElementById("hot-list");
  if (!all.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px 0">No teams yet for 2025–26. Add via Admin panel.</div>';
    return;
  }
  el.innerHTML = all.map((x,i) => {
    var r = autoRating(x);
    return `<div class="hot-row" onclick="openSchoolByName('${escQ(x.name)}')">
      <span class="hot-rank ${i<3?'top':''}">${i+1}</span>
      ${logoTag(x.logo, x.name, 'hot-logo-sm', 'hot-logo-ph')}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:4px;min-width:0">
          <span class="hot-name">${x.name}</span>
          ${genderChip(x.gender)}
        </div>
        <div class="hot-sport-tag">${sportIcon(x.sport)} ${x.sport}</div>
      </div>
      <div class="hot-meta2">
        <div class="hot-rating">${r}</div>
        <div>${x.record||"—"}</div>
      </div>
    </div>`;
  }).join("");
}

function renderHomeNews() {
  var el = document.getElementById("home-news");
  if (!S.news.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px 0">No news yet.</div>';
    return;
  }
  var n = S.news[S.news.length-1];
  el.innerHTML = `<div class="news-preview-card" onclick="gTab('news')">
    ${n.img ? `<img src="${n.img}" class="news-prev-img" onerror="this.style.display='none'">` : ''}
    <div class="news-prev-tag">${n.tag||"General"}</div>
    <div class="news-prev-title">${n.headline}</div>
    <div class="news-prev-date">${n.date||""}</div>
    ${S.news.length>1 ? `<div style="font-size:11px;color:var(--red);margin-top:8px">+${S.news.length-1} more articles →</div>` : ''}
  </div>`;
}

function renderHomePoll() {
  var el = document.getElementById("home-poll");
  if (!S.polls.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px 0">No polls yet.</div>';
    return;
  }
  var p = S.polls[S.polls.length-1];
  var pi = S.polls.length-1;
  renderPollCard(el, p, pi, true);
}

function renderSeasonCards() {
  ["Fall","Winter","Spring"].forEach(season => {
    var el = document.getElementById("sc-" + season.toLowerCase() + "-sports");
    if (!el) return;
    var sports = S.sports.filter(s => getSportSeason(s) === season);
    el.textContent = sports.slice(0,5).join(" · ") + (sports.length>5 ? " & more" : "");
  });
}

// ── SPOTLIGHT ─────────────────────────────────────────────────────────
function renderSpotlight() {
  var el = document.getElementById("school-spotlight");
  if (!el) return;
  var cur = S.schools.filter(x => isCurrentSeason(x.year));
  if (!cur.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">No schools yet. Add via Admin to see spotlight.</div>';
    return;
  }
  cur.sort((a,b) => autoRating(b) - autoRating(a));
  var x = cur[0];
  var r = autoRating(x);
  var wp = calcWinPct(x.record);
  var sameGroup = S.schools.filter(s => s.gender===x.gender && s.sport===x.sport && String(s.year)===String(x.year));
  sameGroup.sort((a,b) => autoRating(b)-autoRating(a));
  var rank = sameGroup.indexOf(x)+1;
  var idx = S.schools.indexOf(x);

  el.innerHTML = `<div class="spotlight-card" onclick="openSchool(${idx})">
    <span class="spotlight-badge">⭐ TOP RATED ${x.gender} ${x.sport}</span>
    ${logoTag(x.logo, x.name, 'spotlight-logo', 'spotlight-logo-ph')}
    <div class="spotlight-info">
      <div class="spotlight-name">${x.name}</div>
      <div class="spotlight-meta">
        ${genderChip(x.gender)}
        <span>${sportIcon(x.sport)} ${x.sport}</span>
        ${x.city ? `<span>📍 ${x.city}</span>` : ''}
        ${x.coach ? `<span>👨‍🏫 ${x.coach}</span>` : ''}
      </div>
      <div class="spotlight-stats">
        <div class="rci-stat"><div class="sl-stat-val">${r}</div><div class="sl-stat-lbl">Rating</div></div>
        <div class="rci-stat"><div class="sl-stat-val">${x.record||"—"}</div><div class="sl-stat-lbl">Record</div></div>
        <div class="rci-stat"><div class="sl-stat-val">${wp.str}</div><div class="sl-stat-lbl">Win %</div></div>
        ${rank>0?`<div class="rci-stat"><div class="sl-stat-val">#${rank}</div><div class="sl-stat-lbl">Ranked</div></div>`:''}
      </div>
    </div>
  </div>`;
}

// ── CINCINNATI'S FINEST — only from created schools ───────────────────
function renderCincySchools() {
  var el = document.getElementById("cincySchoolsGrid");
  if (!el) return;

  // Get unique schools from S.schools (deduplicated by name)
  var seen = {};
  var unique = [];
  S.schools.forEach(x => {
    if (!seen[x.name]) {
      seen[x.name] = true;
      unique.push(x);
    }
  });

  if (!unique.length) {
    el.innerHTML = `<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px;grid-column:1/-1">
      No schools added yet. Create schools via the Admin panel to see them here.
    </div>`;
    return;
  }

  // Sort by highest rating across all their entries
  unique.sort((a, b) => {
    var aMax = Math.max(...S.schools.filter(s=>s.name===a.name).map(s=>autoRating(s)));
    var bMax = Math.max(...S.schools.filter(s=>s.name===b.name).map(s=>autoRating(s)));
    return bMax - aMax;
  });

  el.innerHTML = unique.map(x => {
    var allEntries = S.schools.filter(s => s.name === x.name);
    var sportSet = [...new Set(allEntries.map(s => s.sport))];
    var idx = S.schools.indexOf(x);
    return `<div class="cincy-school-card" onclick="openSchool(${idx})">
      ${x.logo
        ? `<img src="${x.logo}" class="cincy-school-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="cincy-school-logo-ph" style="display:none">${initials(x.name)}</div>`
        : `<div class="cincy-school-logo-ph">${initials(x.name)}</div>`
      }
      <div class="cincy-school-name">${x.name}</div>
      <div class="cincy-school-sub">${sportSet.slice(0,2).map(s=>sportIcon(s)).join(" ")} ${sportSet.slice(0,2).join(", ")}${sportSet.length>2?` +${sportSet.length-2}`:""}</div>
    </div>`;
  }).join("");
}

// ── SEASON HIGHLIGHT ──────────────────────────────────────────────────
function highlightSeason(season) {
  S.gender = S.gender || "Boys";
  document.getElementById("sport-title").textContent = "SELECT SPORT";
  S.currentSeasonFilter = season;
  S.currentGenderFilter = "All";
  renderGenderFilter();
  renderSportsList(season, "All");
  document.querySelectorAll(".sfTab").forEach(b => b.classList.remove("act"));
  var seasonOrder = ["All","Fall","Winter","Spring"];
  var tabs = document.querySelectorAll(".sfTab");
  var idx = seasonOrder.indexOf(season);
  if (tabs[idx]) tabs[idx].classList.add("act");
  gTab("sports");
}

// ── SPORTS ────────────────────────────────────────────────────────────
function pickGender(g) {
  S.gender = g;
  document.getElementById("sport-title").textContent = (g==="Both"?"ALL":"") + " — SELECT SPORT";
  S.currentSeasonFilter = "All";
  S.currentGenderFilter = g;
  document.querySelectorAll(".sfTab").forEach((b,i) => b.classList.toggle("act", i===0));
  renderGenderFilter();
  renderSportsList("All", g);
  gTab("sports");
}

function renderGenderFilter() {
  var bar = document.getElementById("genderFilterBar");
  if (!bar) return;
  var opts = [
    { val: "All", cls: "gfTab-all", label: "All" },
    { val: "Boys", cls: "gfTab-boys", label: "♂ Boys" },
    { val: "Girls", cls: "gfTab-girls", label: "♀ Girls" },
    { val: "Both", cls: "gfTab-both", label: "⚥ Both" }
  ];
  bar.innerHTML = opts.map(o =>
    `<button class="gfTab ${o.cls} ${S.currentGenderFilter===o.val?'act':''}" onclick="setGenderFilter('${o.val}',this)">${o.label}</button>`
  ).join("");
}

function setGenderFilter(g, btn) {
  S.currentGenderFilter = g;
  document.querySelectorAll(".gfTab").forEach(b => b.classList.remove("act"));
  if (btn) btn.classList.add("act");
  renderSportsList(S.currentSeasonFilter, g);
}

function filterBySeason(season, btn) {
  S.currentSeasonFilter = season;
  document.querySelectorAll(".sfTab").forEach(b => b.classList.remove("act"));
  if (btn) btn.classList.add("act");
  renderSportsList(season, S.currentGenderFilter);
}

function renderSportsList(seasonFilter, genderFilter) {
  var gf = genderFilter || S.currentGenderFilter || "All";

  // Filter sports by season
  var bySeason = seasonFilter === "All"
    ? S.sports
    : S.sports.filter(s => getSportSeason(s) === seasonFilter);

  // Filter sports by gender: show sport if it has matching schools OR if sport gender matches
  var list = bySeason.filter(s => {
    if (gf === "All") return true;
    var sportGender = getSportGender(s);
    // Include if sport is designated for that gender (or both)
    if (sportGender === "Both" || sportGender === gf) return true;
    // Also include if there are actual school entries matching
    var hasSchools = S.schools.some(x => x.sport === s && (x.gender === gf || x.gender === "Both"));
    return hasSchools;
  });

  var seasonColors = { Fall:"var(--fall-soft)", Winter:"var(--winter-soft)", Spring:"var(--spring-soft)" };

  // Group by season for cleaner display
  var seasons = ["Fall", "Winter", "Spring"];
  var grouped = {};
  list.forEach(s => {
    var season = getSportSeason(s);
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(s);
  });

  var html = "";

  // If filtering by a specific season, just show flat grid
  if (seasonFilter !== "All") {
    html = renderSportCards(list, gf, seasonColors);
  } else {
    // Show grouped by season with headers
    var hasSections = seasons.some(season => grouped[season] && grouped[season].length > 0);
    if (hasSections) {
      var seasonLabels = { Fall: "🍂 Fall", Winter: "❄️ Winter", Spring: "🌸 Spring" };
      seasons.forEach(season => {
        if (!grouped[season] || !grouped[season].length) return;
        html += `<div class="sport-season-group">
          <div class="sport-season-group-hdr" style="color:${seasonColors[season]}">
            ${seasonLabels[season]}
            <span class="ssg-count">${grouped[season].length} sport${grouped[season].length!==1?"s":""}</span>
          </div>
          <div class="sports-grid-inner">${renderSportCards(grouped[season], gf, seasonColors)}</div>
        </div>`;
      });
    } else {
      html = renderSportCards(list, gf, seasonColors);
    }
  }

  document.getElementById("sportsList").innerHTML = html || `<div style="color:var(--muted);font-size:13px;padding:20px 0">No sports match the current filters.</div>`;
}

function renderSportCards(sports, gf, seasonColors) {
  return sports.map(s => {
    var season = getSportSeason(s);
    var sportSchools = S.schools.filter(x => x.sport === s);
    var hasB = sportSchools.some(x => x.gender === "Boys" || x.gender === "Both");
    var hasG = sportSchools.some(x => x.gender === "Girls" || x.gender === "Both");
    var sportGender = getSportGender(s);
    var genderTags = "";
    if (sportGender === "Boys" || sportGender === "Both" || hasB) genderTags += `<span class="gender-chip-b">♂ B</span>`;
    if (sportGender === "Girls" || sportGender === "Both" || hasG) genderTags += `<span class="gender-chip-g">♀ G</span>`;

    return `<div class="sport-card season-group-${season.toLowerCase()}" onclick="pickSport('${escQ(s)}')">
      <div class="sport-icon-wrap">${sportIcon(s)}</div>
      <div class="sport-name">${s}</div>
      <div class="sport-season-tag" style="color:${seasonColors[season]||'var(--muted2)'}">${season}</div>
      <div class="sport-gender-tags">${genderTags}</div>
    </div>`;
  }).join("");
}

function pickSport(s) {
  S.sport = s;
  document.getElementById("rankTitle").textContent = S.gender + " " + s;
  var gender = S.currentGenderFilter === "All" ? "" : S.currentGenderFilter;
  var relevantSchools = S.schools.filter(x => x.sport === s && (!gender || x.gender === gender || x.gender === "Both"));
  var years = [...new Set(relevantSchools.map(x => x.year))].sort((a,b) => String(b).localeCompare(String(a)));
  if (!years.length) years = ["2025-26"];
  document.getElementById("yearSel").innerHTML = years.map(y => `<option>${y}</option>`).join("");
  renderRankings();
  gTab("rankings");
}

// ── RANKINGS ──────────────────────────────────────────────────────────
function setRankView(view, btn) {
  S.rankView = view;
  document.querySelectorAll(".rvt-btn").forEach(b => b.classList.remove("act"));
  if (btn) btn.classList.add("act");
  document.getElementById("rankTableWrap").style.display = view === "table" ? "" : "none";
  document.getElementById("rankCardsWrap").style.display = view === "cards" ? "" : "none";
  renderRankings();
}

function renderRankings() {
  var yr = document.getElementById("yearSel").value;
  var gender = S.currentGenderFilter === "All" ? "" : S.currentGenderFilter;
  var cur = S.schools.filter(x =>
    x.sport === S.sport &&
    String(x.year) === String(yr) &&
    (!gender || x.gender === gender || x.gender === "Both")
  );
  cur.sort((a,b) => autoRating(b) - autoRating(a));

  var prevYears = [...new Set(S.schools.filter(x=>x.sport===S.sport).map(x=>x.year))].sort((a,b)=>String(b).localeCompare(String(a)));
  var prevYr = prevYears.find(y => String(y) !== String(yr));
  var prevData = prevYr ? S.schools.filter(x => x.sport===S.sport && String(x.year)===String(prevYr)) : [];
  prevData.sort((a,b) => autoRating(b) - autoRating(a));
  var prevMap = {};
  prevData.forEach((x,i) => prevMap[x.name] = i+1);

  document.getElementById("rankCount").textContent = cur.length + " team" + (cur.length!==1?"s":"");
  var maxR = Math.max(...cur.map(x => autoRating(x)), 1);

  if (S.rankView === "table") {
    document.getElementById("rankBody").innerHTML = cur.length ? cur.map((x,i) => {
      var rank = i+1;
      var pv = prevMap[x.name];
      var moveHtml = '<span class="move-fl">—</span>';
      var animCls = "";
      if (pv) {
        var diff = pv - rank;
        if (diff>0) { moveHtml = `<span class="move-up">▲${diff}</span>`; animCls = "anim-up"; }
        else if (diff<0) { moveHtml = `<span class="move-dn">▼${Math.abs(diff)}</span>`; animCls = "anim-dn"; }
      }
      var wp = calcWinPct(x.record);
      var r = autoRating(x);
      var bar = Math.round(r/maxR*100);
      var rowCls = rank===1?"r1":rank===2?"r2":rank===3?"r3":"";
      var streakHtml = x.streak
        ? `<span class="${x.streak.toUpperCase().startsWith('W')?'streak-w':'streak-l'}">${x.streak}</span>`
        : '<span style="color:var(--muted2)">—</span>';
      var schoolIdx = S.schools.indexOf(x);
      return `<tr class="${rowCls} ${animCls}" onclick="openSchool(${schoolIdx})">
        <td class="rnum">${rank}</td>
        <td><div style="display:flex;align-items:center">
          ${logoTag(x.logo,x.name,'school-logo-sm','school-logo-ph')}
          <div>
            <div class="rschool-name" style="display:flex;align-items:center;gap:5px">
              ${x.name}${genderChip(x.gender)}
            </div>
            ${x.coach?`<div class="rschool-sub">${x.coach}</div>`:""}
          </div>
        </div></td>
        <td>${x.record||"—"}</td>
        <td style="color:var(--muted)">${x.conf||"—"}</td>
        <td><span style="font-weight:600">${wp.str}</span></td>
        <td>${moveHtml}</td>
        <td>${streakHtml}</td>
        <td><div class="rating-chip"><span class="rating-num">${r}</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${bar}%"></div></div></div></td>
      </tr>`;
    }).join("") : `<tr><td colspan="8" style="color:var(--muted);padding:32px;text-align:center;font-size:13px">No teams yet. Add schools via Admin panel.</td></tr>`;
  } else {
    document.getElementById("rankCardsGrid").innerHTML = cur.length ? cur.map((x,i) => {
      var rank = i+1;
      var wp = calcWinPct(x.record);
      var r = autoRating(x);
      var schoolIdx = S.schools.indexOf(x);
      return `<div class="rank-card-item" onclick="openSchool(${schoolIdx})">
        <div class="rci-num">${rank}</div>
        <div class="rci-top">
          ${logoTag(x.logo,x.name,'rci-logo-big','rci-logo-ph')}
          <div>
            <div class="rci-name">${x.name}</div>
            <div class="rci-sub" style="display:flex;align-items:center;gap:4px">${x.record||"—"}${genderChip(x.gender)}</div>
          </div>
        </div>
        <div class="rci-stats">
          <div class="rci-stat"><div class="rci-stat-val">${r}</div><div class="rci-stat-lbl">Rating</div></div>
          <div class="rci-stat"><div class="rci-stat-val">${wp.str}</div><div class="rci-stat-lbl">Win%</div></div>
          <div class="rci-stat"><div class="rci-stat-val" style="${x.streak&&x.streak.toUpperCase().startsWith('W')?'color:var(--green-soft)':'color:var(--redsoft)'}">${x.streak||"—"}</div><div class="rci-stat-lbl">Streak</div></div>
        </div>
      </div>`;
    }).join("") : `<div style="color:var(--muted);padding:32px;font-size:13px">No teams yet.</div>`;
  }
}

// ── SCHOOL PROFILE ────────────────────────────────────────────────────
function openSchool(idx) {
  var x = S.schools[idx];
  if (!x) return;
  var wp = calcWinPct(x.record);
  var r = autoRating(x);
  var rivals = S.rivalries.filter(rv => rv.s1===x.name || rv.s2===x.name);
  var champsArr = x.champs ? String(x.champs).split(",").map(s=>s.trim()).filter(Boolean) : [];
  var playersArr = x.players ? String(x.players).split(",").map(s=>s.trim()).filter(Boolean) : [];
  var sameGroup = S.schools.filter(s => s.sport===x.sport && String(s.year)===String(x.year));
  sameGroup.sort((a,b) => autoRating(b) - autoRating(a));
  var rank = sameGroup.indexOf(x)+1;

  document.getElementById("school-detail").innerHTML = `
  <div class="school-profile">
    <div class="sp-hero">
      <div class="sp-hero-bg"></div>
      <div class="sp-top">
        <div class="sp-logo-wrap">${logoTag(x.logo, x.name, 'sp-logo-big', 'sp-logo-big-ph')}</div>
        <div class="sp-info">
          <div class="sp-name">${x.name}</div>
          <div class="sp-sport-row">
            ${rank>0?`<span class="sp-rank-badge">#${rank} ${x.sport}</span>`:''}
            ${genderChip(x.gender)}
            ${x.city?`<span class="sp-tag">${x.city}</span>`:''}
            ${x.year?`<span class="sp-tag">${x.year}</span>`:''}
            ${x.streak?`<span class="sp-tag" style="${x.streak.toUpperCase().startsWith('W')?'color:var(--green-soft);border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.08)':'color:var(--redsoft);border-color:rgba(248,113,113,.3);background:rgba(248,113,113,.08)'}">${x.streak}</span>`:''}
          </div>
          ${x.coach?`<div class="sp-coach">Head Coach: <strong style="color:var(--text)">${x.coach}</strong></div>`:''}
          ${x.venue?`<div class="sp-coach" style="margin-top:4px">🏟 <strong style="color:var(--text)">${x.venue}</strong></div>`:''}
          ${x.desc?`<div class="sp-desc">${x.desc}</div>`:''}
          ${champsArr.length?`<div class="sp-champs-row">${champsArr.map(c=>`<span class="champ-badge">🏆 ${c} State Champion</span>`).join("")}</div>`:''}
        </div>
      </div>
      <div class="sp-stats-grid">
        <div class="sp-stat"><div class="sp-stat-val">${x.record||"—"}</div><div class="sp-stat-lbl">Overall</div></div>
        <div class="sp-stat"><div class="sp-stat-val">${x.conf||"—"}</div><div class="sp-stat-lbl">Conference</div></div>
        <div class="sp-stat"><div class="sp-stat-val">${wp.str}</div><div class="sp-stat-lbl">Win Rate</div></div>
        <div class="sp-stat"><div class="sp-stat-val" style="color:var(--red)">${r}</div><div class="sp-stat-lbl">Power Rtg</div></div>
        <div class="sp-stat"><div class="sp-stat-val">${rank>0?"#"+rank:"—"}</div><div class="sp-stat-lbl">Ranking</div></div>
        ${wp.w+wp.l>0?`<div class="sp-stat"><div class="sp-stat-val">${wp.w}</div><div class="sp-stat-lbl">Wins</div></div>`:''}
        ${wp.w+wp.l>0?`<div class="sp-stat"><div class="sp-stat-val">${wp.l}</div><div class="sp-stat-lbl">Losses</div></div>`:''}
        ${champsArr.length?`<div class="sp-stat"><div class="sp-stat-val" style="color:var(--gold-soft)">${champsArr.length}</div><div class="sp-stat-lbl">State Titles</div></div>`:''}
      </div>
    </div>
    <div class="sp-sections">
      <div class="sp-section">
        <div class="sp-section-title">Season Details</div>
        ${[
          ['Gender',x.gender||'—'],['Sport',`${sportIcon(x.sport)} ${x.sport}`],
          ['Season',x.year||'—'],['Division/Level',x.city||'—'],
          ['Head Coach',x.coach||'—'],['Home Venue',x.venue||'—'],
          ['Current Streak',x.streak||'—']
        ].map(([l,v])=>`<div class="sp-section-item"><span class="item-lbl">${l}</span><span>${v}</span></div>`).join("")}
      </div>
      <div class="sp-section">
        <div class="sp-section-title">Program Info</div>
        ${champsArr.length?`<div class="sp-section-item"><span class="item-lbl">State Championships</span><span style="color:var(--gold-soft)">${champsArr.join(", ")}</span></div>`:''}
        ${playersArr.length?`<div class="sp-section-item" style="flex-direction:column;gap:4px"><span class="item-lbl">Notable Players</span><span>${playersArr.join(", ")}</span></div>`:''}
        ${rivals.length?`<div class="sp-section-item" style="flex-direction:column;gap:8px"><span class="item-lbl">Rivals</span><div class="sp-rivals">${rivals.map(rv=>`<span class="rival-pill">⚔️ ${rv.s1===x.name?rv.s2:rv.s1}${rv.label?" · "+rv.label:""}</span>`).join("")}</div></div>`:''}
        ${!champsArr.length&&!playersArr.length&&!rivals.length?`<div style="color:var(--muted);font-size:13px;padding:8px 0">No additional program info yet.</div>`:''}
      </div>
    </div>
  </div>`;
  gTab("school");
}

function openSchoolByName(name) {
  var idx = S.schools.findIndex(x => x.name===name);
  if (idx >= 0) openSchool(idx);
}

// ── NEWS ──────────────────────────────────────────────────────────────
function renderNews() {
  var el = document.getElementById("newsList");
  if (!S.news.length) {
    el.innerHTML = '<div style="color:var(--muted);padding:20px">No news posted yet.</div>';
    return;
  }
  el.innerHTML = [...S.news].reverse().map(n => `
    <div class="news-card-full">
      ${n.img ? `<img src="${n.img}" class="news-card-img" onerror="this.style.display='none'">` : ''}
      <div class="news-card-body">
        <div class="news-card-meta">${sportIcon(n.tag||"")} ${n.tag||"General"} · ${n.date||""}</div>
        <div class="news-card-title">${n.headline}</div>
        ${n.body ? `<div class="news-card-text">${n.body}</div>` : ''}
      </div>
    </div>`).join("");
}

// ── POLLS ─────────────────────────────────────────────────────────────
function renderPollCard(container, p, pi, compact) {
  var tot = (p.va||0)+(p.vb||0);
  var pA = tot ? Math.round((p.va||0)/tot*100) : 50;
  var pB = tot ? 100-pA : 50;
  var v = S.votes["p"+pi];
  container.innerHTML = `
    <div class="${compact?'':'poll-card-full'}">
      <div class="${compact?'poll-prev-q':'poll-card-q'}">${p.q}</div>
      <div class="poll-opt ${v==='a'?'voted':''}" onclick="vote(${pi},'a')">
        <div class="poll-opt-bg" style="width:${v?pA:0}%"></div>
        <span class="poll-lbl">${p.a}</span>
        ${v?`<span class="poll-pct">${pA}%</span>`:''}
      </div>
      <div class="poll-opt ${v==='b'?'voted':''}" onclick="vote(${pi},'b')">
        <div class="poll-opt-bg" style="width:${v?pB:0}%"></div>
        <span class="poll-lbl">${p.b}</span>
        ${v?`<span class="poll-pct">${pB}%</span>`:''}
      </div>
      <div class="poll-votes">${tot} vote${tot!==1?"s":""}${!v?' · Tap to vote':''}</div>
    </div>`;
}

function renderPolls() {
  var el = document.getElementById("pollList");
  if (!S.polls.length) {
    el.innerHTML = '<div style="color:var(--muted);padding:20px">No polls yet.</div>';
    return;
  }
  el.innerHTML = S.polls.map((p,pi) => {
    var tot = (p.va||0)+(p.vb||0);
    var pA = tot ? Math.round((p.va||0)/tot*100) : 50;
    var pB = tot ? 100-pA : 50;
    var v = S.votes["p"+pi];
    return `<div class="poll-card-full">
      <div class="poll-card-q">${p.q}</div>
      <div class="poll-opt ${v==='a'?'voted':''}" onclick="vote(${pi},'a')">
        <div class="poll-opt-bg" style="width:${v?pA:0}%"></div>
        <span class="poll-lbl">${p.a}</span>
        ${v?`<span class="poll-pct">${pA}%</span>`:''}
      </div>
      <div class="poll-opt ${v==='b'?'voted':''}" onclick="vote(${pi},'b')">
        <div class="poll-opt-bg" style="width:${v?pB:0}%"></div>
        <span class="poll-lbl">${p.b}</span>
        ${v?`<span class="poll-pct">${pB}%</span>`:''}
      </div>
      <div class="poll-votes">${tot} vote${tot!==1?"s":""}${!v?' · Tap to vote':''}</div>
    </div>`;
  }).join("");
}

function vote(pi, ch) {
  if (S.votes["p"+pi]) return;
  if (ch==="a") S.polls[pi].va = (S.polls[pi].va||0)+1;
  else S.polls[pi].vb = (S.polls[pi].vb||0)+1;
  S.votes["p"+pi] = ch;
  save();
  renderPolls();
  renderHomePoll();
}

// ── STANDINGS ─────────────────────────────────────────────────────────
function initStandings() {
  var ps = document.getElementById("st-sport");
  if (ps) ps.innerHTML = `<option value="">All Sports</option>` + S.sports.map(s=>`<option>${s}</option>`).join("");
  updateStandingsYears();
  renderStandings();
}

function updateStandingsYears() {
  var yrEl = document.getElementById("st-year");
  if (!yrEl) return;
  var years = [...new Set(S.schools.map(x=>x.year))].sort((a,b)=>String(b).localeCompare(String(a)));
  if (!years.length) years = ["2025-26"];
  yrEl.innerHTML = years.map(y=>`<option>${y}</option>`).join("");
}

function renderStandings() {
  var el = document.getElementById("standingsBody");
  if (!el) return;
  var g = document.getElementById("st-gender").value;
  var sp = document.getElementById("st-sport").value;
  var yr = document.getElementById("st-year").value;
  var filtered = S.schools.filter(x =>
    (!g || x.gender===g) &&
    (!sp || x.sport===sp) &&
    (!yr || String(x.year)===String(yr))
  );
  if (!filtered.length) {
    el.innerHTML = `<div style="color:var(--muted);padding:32px;text-align:center;font-size:13px">No teams match current filters.</div>`;
    return;
  }

  var groups = {};
  filtered.forEach(x => {
    var key = x.sport + (x.gender ? " — " + x.gender : "");
    if (!groups[key]) groups[key] = [];
    groups[key].push(x);
  });

  el.innerHTML = Object.keys(groups).sort().map(gk => {
    var teams = groups[gk].slice().sort((a,b)=>autoRating(b)-autoRating(a));
    return `<div class="standings-table-wrap">
      <div class="standings-group-hdr">
        ${sportIcon(teams[0].sport)} ${gk}
        <span style="font-size:10px;color:var(--muted2)">${teams.length} teams</span>
      </div>
      <div class="standings-row standings-hdr-row">
        <span>#</span><span>School</span><span>Record</span><span>Conf</span><span>Win%</span><span>Streak</span><span>Rating</span>
      </div>
      ${teams.map((x,i) => {
        var r = autoRating(x);
        var wp = calcWinPct(x.record);
        var idx = S.schools.indexOf(x);
        return `<div class="standings-row" onclick="openSchool(${idx})">
          <span class="st-num">${i+1}</span>
          <div class="st-school">
            ${logoTag(x.logo,x.name,'school-logo-sm','school-logo-ph')}
            <span class="st-name">${x.name}${genderChip(x.gender)}</span>
          </div>
          <span class="st-val">${x.record||"—"}</span>
          <span style="color:var(--muted);font-size:13px">${x.conf||"—"}</span>
          <span class="st-val">${wp.str}</span>
          <span class="${x.streak&&x.streak.toUpperCase().startsWith('W')?'streak-w':'streak-l'}">${x.streak||"—"}</span>
          <span class="st-rating">${r}</span>
        </div>`;
      }).join("")}
    </div>`;
  }).join("");
}

// ── PREDICTOR ─────────────────────────────────────────────────────────
function initPredictor() {
  var ps = document.getElementById("pred-sport");
  ps.innerHTML = S.sports.map(s => `<option>${s}</option>`).join("");
  updatePredYears();
  renderPredictor();
}

function updatePredYears() {
  var g = document.getElementById("pred-gender").value;
  var sp = document.getElementById("pred-sport").value;
  var years = [...new Set(S.schools.filter(x => (!g||x.gender===g||x.gender==="Both") && x.sport===sp).map(x => x.year))]
    .sort((a,b) => String(b).localeCompare(String(a)));
  if (!years.length) years = ["2025-26"];
  document.getElementById("pred-year").innerHTML = years.map(y => `<option>${y}</option>`).join("");
}

function renderPredictor() {
  updatePredYears();
  var g = document.getElementById("pred-gender").value;
  var sp = document.getElementById("pred-sport").value;
  var yr = document.getElementById("pred-year").value;
  var teams = S.schools.filter(x => x.sport===sp && String(x.year)===String(yr) && (!g||x.gender===g||x.gender==="Both"));
  teams.sort((a,b) => autoRating(b) - autoRating(a));
  var res = document.getElementById("pred-results");
  if (!teams.length) {
    res.innerHTML = `<div style="color:var(--muted);padding:20px;text-align:center">No teams in this category.</div>`;
    return;
  }
  var n = teams.length;
  var html = "";
  teams.forEach((x,i) => {
    var r = autoRating(x);
    var rankBonus = Math.max(0,(n-i)/n);
    var raw = (r/100*0.65 + rankBonus*0.35) * (PLAYOFF_SPOTS/n);
    var pct = Math.min(99, Math.max(1, Math.round(raw*100)));
    if (i < PLAYOFF_SPOTS && pct < 50) pct = Math.max(50, pct);
    if (i >= PLAYOFF_SPOTS && pct > 49) pct = Math.min(49, pct);
    var col = pct>=70 ? "var(--green-soft)" : pct>=40 ? "var(--gold-soft)" : "var(--redsoft)";
    var wp = calcWinPct(x.record);
    if (i === PLAYOFF_SPOTS && i < n) {
      html += `<div class="playoff-cut"><span class="playoff-cut-label">PLAYOFF LINE</span></div>`;
    }
    html += `<div class="pred-row">
      <div class="pred-rank">${i+1}</div>
      <div class="pred-school">
        ${logoTag(x.logo,x.name,'school-logo-sm','school-logo-ph')}
        <div>
          <div style="display:flex;align-items:center;gap:5px">${x.name}${genderChip(x.gender)}</div>
          <div class="pred-school-sub">${x.record||""} · Rtg ${r}</div>
        </div>
      </div>
      <div class="pred-bar-wrap"><div class="pred-bar-fill" style="width:${pct}%;background:${col}"></div></div>
      <div class="pred-pct" style="color:${col}">${pct}%</div>
    </div>`;
  });
  res.innerHTML = html;
}

// ── GAME OF WEEK ──────────────────────────────────────────────────────
function renderGOTW() {
  var tabs = document.getElementById("gotw-sport-tabs");
  if (!S.sports.length) { tabs.innerHTML=""; return; }
  tabs.innerHTML = S.sports.map((s,i) =>
    `<button class="gotw-stab ${i===0?'act':''}" onclick="showGOTW('${escQ(s)}',this)">${sportIcon(s)} ${s}</button>`
  ).join("");
  showGOTW(S.sports[0]||"", tabs.querySelector(".act"));
}

function showGOTW(sport, btn) {
  document.querySelectorAll(".gotw-stab").forEach(b => b.classList.remove("act"));
  if (btn) btn.classList.add("act");
  var g = S.gotw[sport];
  var d = document.getElementById("gotw-display");
  if (!g || (!g.t1 && !g.t2)) {
    d.innerHTML = `<div class="gotw-empty">No game of the week set for ${sport} yet.</div>`;
    return;
  }
  var dateStr = g.date
    ? new Date(g.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})
    : "";
  var t1Logo = g.t1logo
    ? `<img src="${g.t1logo}" class="gotw-team-logo" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><div class="gotw-team-logo-ph" style="display:none">${initials(g.t1)}</div>`
    : `<div class="gotw-team-logo-ph">${initials(g.t1||"?")}</div>`;
  var t2Logo = g.t2logo
    ? `<img src="${g.t2logo}" class="gotw-team-logo" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><div class="gotw-team-logo-ph" style="display:none">${initials(g.t2)}</div>`
    : `<div class="gotw-team-logo-ph">${initials(g.t2||"?")}</div>`;
  d.innerHTML = `<div class="gotw-matchup-card">
    <div class="gotw-card-top">
      <span class="gotw-sport-lbl">${sportIcon(sport)} ${sport} — Game of the Week</span>
      ${dateStr ? `<span class="gotw-date-lbl">${dateStr}</span>` : ''}
    </div>
    <div class="gotw-matchup-body">
      <div class="gotw-teams-row">
        <div class="gotw-team-block">${t1Logo}<div class="gotw-team-name">${g.t1||"TBD"}</div></div>
        <div class="gotw-divider">${g.type==="at"?"@":"VS"}</div>
        <div class="gotw-team-block">${t2Logo}<div class="gotw-team-name">${g.t2||"TBD"}</div></div>
      </div>
    </div>
    <div class="gotw-meta-row">
      ${g.time ? `<div class="gotw-meta-item">🕐 <strong>${fmtTime(g.time)}</strong></div>` : ''}
      ${g.loc ? `<div class="gotw-meta-item">📍 <strong>${g.loc}</strong></div>` : ''}
      ${g.tickets ? `<a href="${g.tickets}" target="_blank" class="gotw-ticket-btn">🎟 Get Tickets</a>` : ''}
    </div>
  </div>`;
}

// ── LOGIN ─────────────────────────────────────────────────────────────
function doLogin() {
  if (S.session) { gTab("admin"); buildAdminTabs(); return; }
  gTab("login");
}
function checkLogin() {
  var u = document.getElementById("li-user").value.trim();
  var p = document.getElementById("li-pass").value;
  if (u===OWNER.user && p===OWNER.pass) { S.session="owner"; gTab("admin"); buildAdminTabs(); return; }
  if (S.admins.find(a => a.user===u && a.pass===p)) { S.session="admin"; gTab("admin"); buildAdminTabs(); return; }
  document.getElementById("li-err").textContent = "Invalid username or password.";
}
function logout() { S.session=null; gTab("home"); }

// ── ADMIN SETUP ───────────────────────────────────────────────────────
function buildAdminTabs() {
  var isOwner = S.session==="owner";
  document.getElementById("session-badge").textContent = isOwner ? "OWNER" : "ADMIN";
  document.getElementById("session-badge").className = "session-badge " + (isOwner?"owner":"admin");
  var tabs = [
    {id:"news",l:"📰 News"},
    {id:"polls",l:"📊 Polls"},
    {id:"schools",l:"🏫 Schools"},
    {id:"gotw",l:"⚡ Game of Week"},
    {id:"ticker",l:"📡 Ticker"}
  ];
  if (isOwner) tabs.push(
    {id:"rivalries",l:"⚔️ Rivalries"},
    {id:"sports",l:"🏆 Sports"},
    {id:"accounts",l:"👤 Accounts"}
  );
  document.getElementById("adminTabs").innerHTML = tabs.map((t,i) =>
    `<button class="tabbt ${i===0?'act':''}" onclick="switchATab('${t.id}',this)">${t.l}</button>`
  ).join("");
  document.querySelectorAll(".asec").forEach(s => s.classList.remove("act"));
  document.getElementById("admin-news-sec").classList.add("act");
  populateSels();
  renderAdminNews();
  renderAdminPolls();
  renderAdminSchools();
  renderAdminGOTW();
  renderTickerAdmin();
  if (isOwner) { renderRivalryList(); renderSportTags(); renderAccounts(); }
}

function switchATab(id, btn) {
  document.querySelectorAll(".asec").forEach(s => s.classList.remove("act"));
  document.getElementById("admin-"+id+"-sec").classList.add("act");
  document.querySelectorAll(".tabbt").forEach(b => b.classList.remove("act"));
  btn.classList.add("act");
}

function populateSels() {
  var opts = S.sports.map(s => `<option>${s}</option>`).join("");
  ["n-tag","s-sport","e-sport","g-sport","r-sport"].forEach(id => {
    var el = document.getElementById(id); if (!el) return;
    var prev = el.value;
    el.innerHTML = (id==="n-tag" ? opts+`<option>General</option>` : opts);
    if (prev) el.value = prev;
  });
  var fs = document.getElementById("filter-sport");
  if (fs) fs.innerHTML = `<option value="">All Sports</option>` + opts;
  var sts = document.getElementById("st-sport");
  if (sts) sts.innerHTML = `<option value="">All Sports</option>` + opts;
}

// ── ADMIN: NEWS ───────────────────────────────────────────────────────
function addNews() {
  var h = document.getElementById("n-head").value.trim();
  if (!h) return;
  S.news.push({
    headline: h,
    body: document.getElementById("n-body").value.trim(),
    tag: document.getElementById("n-tag").value,
    img: document.getElementById("n-img").value.trim(),
    date: new Date().toLocaleDateString()
  });
  save();
  flash("n-msg","✓ Article published!");
  ["n-head","n-body","n-img"].forEach(id => document.getElementById(id).value="");
  renderAdminNews(); renderHomeNews();
}

function renderAdminNews() {
  document.getElementById("admin-news-list").innerHTML = S.news.length
    ? [...S.news].reverse().map((n,ri) => {
        var i = S.news.length-1-ri;
        return `<div class="srow"><div class="srow-info"><div>${n.headline}</div><div>${n.tag} · ${n.date}</div></div><button class="delbtn" onclick="delNews(${i})">✕</button></div>`;
      }).join("")
    : `<div style="color:var(--muted);font-size:13px">No articles yet.</div>`;
}
function delNews(i) { S.news.splice(i,1); save(); renderAdminNews(); renderHomeNews(); }

// ── ADMIN: POLLS ──────────────────────────────────────────────────────
function addPoll() {
  var q = document.getElementById("p-q").value.trim();
  var a = document.getElementById("p-a").value.trim();
  var b = document.getElementById("p-b").value.trim();
  if (!q||!a||!b) return;
  S.polls.push({q,a,b,va:0,vb:0});
  save();
  flash("p-msg","✓ Poll created!");
  ["p-q","p-a","p-b"].forEach(id => document.getElementById(id).value="");
  renderAdminPolls(); renderHomePoll();
}

function renderAdminPolls() {
  document.getElementById("admin-polls-list").innerHTML = S.polls.length
    ? S.polls.map((p,i) =>
        `<div class="srow"><div class="srow-info"><div>${p.q}</div><div>${p.a} vs ${p.b} · ${(p.va||0)+(p.vb||0)} votes</div></div><button class="delbtn" onclick="delPoll(${i})">✕</button></div>`
      ).join("")
    : `<div style="color:var(--muted);font-size:13px">No polls yet.</div>`;
}
function delPoll(i) { S.polls.splice(i,1); delete S.votes["p"+i]; save(); renderAdminPolls(); }

// ── ADMIN: SCHOOLS ────────────────────────────────────────────────────
function addSchool() {
  var name = document.getElementById("s-name").value.trim();
  var record = document.getElementById("s-record").value.trim();
  if (!name||!record) { flash("s-msg","Name and record required.",true); return; }
  S.schools.push({
    name,
    logo: document.getElementById("s-logo").value.trim(),
    gender: document.getElementById("s-gender").value,
    sport: document.getElementById("s-sport").value,
    record,
    conf: document.getElementById("s-conf").value.trim(),
    year: document.getElementById("s-year").value || "2025-26",
    streak: document.getElementById("s-streak").value.trim(),
    coach: document.getElementById("s-coach").value.trim(),
    city: document.getElementById("s-city").value.trim(),
    desc: document.getElementById("s-desc").value.trim(),
    champs: document.getElementById("s-champs").value.trim(),
    players: document.getElementById("s-players").value.trim(),
    venue: document.getElementById("s-venue").value.trim()
  });
  save();
  flash("s-msg","✓ " + name + " added!");
  ["s-name","s-logo","s-record","s-conf","s-streak","s-coach","s-city","s-desc","s-champs","s-players","s-venue"].forEach(id => document.getElementById(id).value="");
  renderAdminSchools(); renderHotTeams(); renderStatsBar(); renderSpotlight(); renderCincySchools();
}

function renderAdminSchools() {
  var fg = document.getElementById("filter-gender").value;
  var fsp = document.getElementById("filter-sport").value;
  var list = S.schools.filter(x => (!fg||x.gender===fg) && (!fsp||x.sport===fsp));
  document.getElementById("admin-school-list").innerHTML = list.length
    ? list.map(x => {
        var i = S.schools.indexOf(x);
        var r = autoRating(x);
        return `<div class="srow">
          <div style="display:flex;align-items:center;gap:10px;min-width:0">
            ${logoTag(x.logo,x.name,'school-logo-sm','school-logo-ph')}
            <div class="srow-info">
              <div style="display:flex;align-items:center;gap:5px">${x.name}${genderChip(x.gender)}</div>
              <div>${sportIcon(x.sport)} ${x.sport} · ${x.year} · ${x.record} · Rtg ${r}</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="editbtn" onclick="openEdit(${i})">Edit</button>
            <button class="delbtn" onclick="delSchool(${i})">✕</button>
          </div>
        </div>`;
      }).join("")
    : `<div style="color:var(--muted);font-size:13px">No schools match filter.</div>`;
}

function openEdit(i) {
  S.editIdx = i;
  var x = S.schools[i];
  var fields = {
    "e-name":x.name,"e-logo":x.logo,"e-record":x.record,"e-conf":x.conf,
    "e-year":x.year,"e-streak":x.streak,"e-coach":x.coach,"e-city":x.city,
    "e-desc":x.desc,"e-champs":x.champs,"e-players":x.players,"e-venue":x.venue
  };
  Object.keys(fields).forEach(id => { var el=document.getElementById(id); if(el) el.value=fields[id]||""; });
  document.getElementById("e-gender").value = x.gender||"Boys";
  var es = document.getElementById("e-sport");
  es.innerHTML = S.sports.map(s=>`<option>${s}</option>`).join("");
  es.value = x.sport||S.sports[0];
  var modal = document.getElementById("edit-school-modal");
  modal.classList.add("open");
  modal.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function closeEdit() { document.getElementById("edit-school-modal").classList.remove("open"); }
function saveEditSchool() {
  if (S.editIdx<0 || S.editIdx>=S.schools.length) return;
  var x = S.schools[S.editIdx];
  var fields = {
    name:"e-name",logo:"e-logo",gender:"e-gender",sport:"e-sport",record:"e-record",
    conf:"e-conf",year:"e-year",streak:"e-streak",coach:"e-coach",city:"e-city",
    desc:"e-desc",champs:"e-champs",players:"e-players",venue:"e-venue"
  };
  Object.keys(fields).forEach(k => { var el=document.getElementById(fields[k]); if(el) x[k]=el.value.trim(); });
  save(); closeEdit(); renderAdminSchools(); renderHotTeams(); renderSpotlight(); renderCincySchools();
}
function delSchool(i) {
  if (!confirm("Delete " + S.schools[i].name + "?")) return;
  S.schools.splice(i,1);
  save(); renderAdminSchools(); renderHotTeams(); renderStatsBar(); renderSpotlight(); renderCincySchools();
}

// ── ADMIN: GOTW ───────────────────────────────────────────────────────
function saveGOTW() {
  var sport = document.getElementById("g-sport").value;
  S.gotw[sport] = {
    t1: document.getElementById("g-t1").value.trim(),
    t1logo: document.getElementById("g-t1logo").value.trim(),
    t2: document.getElementById("g-t2").value.trim(),
    t2logo: document.getElementById("g-t2logo").value.trim(),
    type: document.getElementById("g-type").value,
    date: document.getElementById("g-date").value,
    time: document.getElementById("g-time").value,
    tickets: document.getElementById("g-tickets").value.trim(),
    loc: document.getElementById("g-loc").value.trim()
  };
  save(); flash("g-msg","✓ Saved for "+sport+"!"); renderAdminGOTW();
}
function renderAdminGOTW() {
  var html = "";
  S.sports.forEach(sp => {
    var g = S.gotw[sp];
    if (!g||(!g.t1&&!g.t2)) return;
    html += `<div class="srow"><div class="srow-info"><div>${sportIcon(sp)} ${sp}: ${g.t1||"?"} ${g.type==="at"?"@":"vs"} ${g.t2||"?"}</div><div>${g.date||"No date"}</div></div><button class="delbtn" onclick="clearGOTW('${sp}')">✕</button></div>`;
  });
  document.getElementById("admin-gotw-list").innerHTML = html || `<div style="color:var(--muted);font-size:13px">No games set yet.</div>`;
}
function clearGOTW(sp) { delete S.gotw[sp]; save(); renderAdminGOTW(); }

// ── ADMIN: TICKER ─────────────────────────────────────────────────────
function addTicker() {
  var v = document.getElementById("tick-new").value.trim();
  if (!v) return;
  S.ticker.push(v);
  save();
  document.getElementById("tick-new").value = "";
  renderTickerAdmin(); renderTicker();
}
function renderTickerAdmin() {
  document.getElementById("ticker-list").innerHTML = S.ticker.length
    ? S.ticker.map((t,i) =>
        `<div class="srow" style="max-width:480px"><div class="srow-info"><div>${t}</div></div><button class="delbtn" onclick="delTicker(${i})">✕</button></div>`
      ).join("")
    : `<div style="color:var(--muted);font-size:13px">No headlines yet.</div>`;
}
function delTicker(i) { S.ticker.splice(i,1); save(); renderTickerAdmin(); renderTicker(); }

// ── OWNER: RIVALRIES ──────────────────────────────────────────────────
function addRivalry() {
  var s1 = document.getElementById("r-s1").value.trim();
  var s2 = document.getElementById("r-s2").value.trim();
  if (!s1||!s2) return;
  S.rivalries.push({s1, s2, sport:document.getElementById("r-sport").value, label:document.getElementById("r-label").value.trim()});
  save();
  ["r-s1","r-s2","r-label"].forEach(id => document.getElementById(id).value="");
  flash("r-msg","✓ Rivalry added!"); renderRivalryList();
}
function renderRivalryList() {
  document.getElementById("rivalry-list").innerHTML = S.rivalries.length
    ? S.rivalries.map((r,i) =>
        `<div class="srow"><div class="srow-info"><div>⚔️ ${r.s1} vs ${r.s2}</div><div>${sportIcon(r.sport)} ${r.sport}${r.label?" · "+r.label:""}</div></div><button class="delbtn" onclick="delRivalry(${i})">✕</button></div>`
      ).join("")
    : `<div style="color:var(--muted);font-size:13px">No rivalries yet.</div>`;
}
function delRivalry(i) { S.rivalries.splice(i,1); save(); renderRivalryList(); }

// ── OWNER: SPORTS ─────────────────────────────────────────────────────
function addSport() {
  var name = document.getElementById("sport-new").value.trim();
  var season = document.getElementById("sport-season").value || "Fall";
  var gender = document.getElementById("sport-gender").value || "Both";
  if (!name || S.sports.includes(name)) return;
  S.sports.push(name);
  S.sportSeasons[name] = season;
  S.sportGenders[name] = gender;
  save();
  document.getElementById("sport-new").value = "";
  renderSportTags(); populateSels(); updateMarquee(); renderSeasonCards();
}

function renderSportTags() {
  var seasonColors = { Fall:"var(--fall-soft)", Winter:"var(--winter-soft)", Spring:"var(--spring-soft)" };
  var genderColors = { Boys:"var(--boys)", Girls:"var(--girls)", Both:"var(--both)" };
  document.getElementById("sports-tag-list").innerHTML = S.sports.map((s,i) => {
    var season = getSportSeason(s);
    var gender = getSportGender(s);
    return `<span class="sport-tag" onclick="delSport(${i})">
      ${sportIcon(s)} ${s}
      <span class="st-season" style="color:${seasonColors[season]||'var(--muted2)'}">${season}</span>
      <span class="st-season" style="color:${genderColors[gender]||'var(--muted2)'}">${gender}</span>
      ✕
    </span>`;
  }).join("");
}
function delSport(i) {
  var name = S.sports[i];
  if (!confirm("Remove " + name + "?")) return;
  S.sports.splice(i,1);
  delete S.sportSeasons[name];
  delete S.sportGenders[name];
  save(); renderSportTags(); populateSels(); updateMarquee(); renderSeasonCards();
}

// ── OWNER: ACCOUNTS ───────────────────────────────────────────────────
function addAdmin() {
  var u = document.getElementById("ac-user").value.trim();
  var p = document.getElementById("ac-pass").value;
  if (!u||!p) { flash("ac-msg","Fill both fields.",true); return; }
  if (u===OWNER.user) { flash("ac-msg","Reserved username.",true); return; }
  if (S.admins.find(a => a.user===u)) { flash("ac-msg","Username taken.",true); return; }
  S.admins.push({user:u,pass:p});
  save();
  document.getElementById("ac-user").value = "";
  document.getElementById("ac-pass").value = "";
  flash("ac-msg","✓ Admin created!"); renderAccounts();
}
function renderAccounts() {
  document.getElementById("acct-list").innerHTML =
    `<div class="acct-row"><div><span style="font-weight:600;font-size:13px;color:var(--text)">${OWNER.user}</span><span class="owner-badge">OWNER</span></div></div>` +
    S.admins.map((a,i) =>
      `<div class="acct-row"><span style="font-weight:600;font-size:13px;color:var(--text)">${a.user}</span><button class="delbtn" onclick="delAdmin(${i})">✕</button></div>`
    ).join("");
}
function delAdmin(i) { S.admins.splice(i,1); save(); renderAccounts(); }

// ── INIT ──────────────────────────────────────────────────────────────
renderTicker();
renderHome();
renderGenderFilter();