// ==========================================================================
// LA POLLA MAS GRANDE DEL MUNDO 2026 — APP INFORMATIVA EN VIVO
//
// La subasta ya ocurrió. Los datos de participantes/equipos vienen de
// participants.csv (fijo, sin UI de edición). Resultados y tablas de grupo
// se obtienen preferentemente de la API en vivo (external-api.js) y, si
// falla, de results.js / cálculo propio.
// ==========================================================================

// ==========================================================================
// DATOS CARGADOS EN TIEMPO DE EJECUCIÓN
// ==========================================================================

let PARTICIPANTS = [];      // [{ name, photo, teams: [{teamId, share, subsidized, bonusTeam, bonusPct}] }]
let OWNERSHIP = {};          // teamId -> [{ owner, share }]
let SUBSIDIZED_TEAM_IDS = []; // teamIds marcados subsidized=yes en el CSV

let EFFECTIVE_RESULTS = {};  // n -> { homeScore, awayScore, home?, away?, penalties? }
let GROUP_STANDINGS = {};    // group letter -> [{teamId, mp, w, d, l, pts, gf, ga, gd}, ...] (ordenado)
let QUALIFIED_IDS = [];       // 32 teamIds que pasan de grupos
let KNOCKOUT_STATUS = {};     // teamId -> { stage, pct }

let liveGamesOk = false;
let liveGroupsOk = false;

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

function formatCurrency(val) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(val);
}

function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}

// Bandera de un equipo como ícono SVG (flag-icons): los emoji de bandera
// no renderizan en Chrome/Windows, así que se usa esto en vez de team.flag.
function flagIcon(team, extraClass = "") {
  return `<span class="fi fi-${team.cc} team-flag-icon ${extraClass}"></span>`;
}

// Iniciales de un nombre — "Juan Pérez" → "JP", "Madonna" → "M"
function playerInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]).join("").toUpperCase();
}

// Color del avatar por hash del nombre (1-8)
function playerColorClass(name) {
  if (!name) return "c1";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return "c" + ((h % 8) + 1);
}

// Render del avatar de un participante: foto del CSV o iniciales con color.
// Si la foto no carga (placeholder ausente), cae a las iniciales.
function renderAvatar(participant, size = "") {
  const sizeClass = size ? " " + size : "";
  const colorCls = playerColorClass(participant && participant.name);
  const initials = playerInitials(participant && participant.name);
  if (participant && participant.photo) {
    return `<span class="player-avatar has-photo${sizeClass}"><img src="${participant.photo}" alt="" class="avatar-img" onerror="const s=this.parentElement;s.classList.remove('has-photo');s.classList.add('${colorCls}');s.textContent='${initials}';"></span>`;
  }
  return `<span class="player-avatar ${colorCls}${sizeClass}">${initials}</span>`;
}

// Toast notification helper -- reemplaza alerts del navegador
function showToast(message, type = "info", duration = 3200) {
  const container = document.getElementById("toast-container");
  if (!container) {
    console.log(message);
    return;
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const iconMap = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    info: "fa-circle-info",
    warning: "fa-triangle-exclamation"
  };
  toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  gsap.fromTo(toast,
    { x: 80, opacity: 0, scale: 0.9 },
    { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }
  );

  setTimeout(() => {
    gsap.to(toast, {
      x: 80, opacity: 0, duration: 0.3, ease: "power2.in",
      onComplete: () => toast.remove()
    });
  }, duration);
}

// Animated counter for currency / number displays
function animateNumber(el, targetVal, isCurrency = true) {
  if (!el) return;
  const startVal = parseFloat(el.dataset.lastVal || 0);
  const obj = { val: startVal };

  gsap.to(obj, {
    val: targetVal,
    duration: 0.8,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = isCurrency ? formatCurrency(Math.round(obj.val)) : Math.round(obj.val);
    }
  });

  el.dataset.lastVal = targetVal;
}

// Render KaTeX en la vista de Reglamento (defer-loaded)
let katexRendered = false;
function renderRulesKatex() {
  const view = document.getElementById("view-rules");
  if (!view || katexRendered) return;

  const tryRender = () => {
    if (window.renderMathInElement) {
      window.renderMathInElement(view, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
      katexRendered = true;
      return true;
    }
    return false;
  };

  if (!tryRender()) {
    // KaTeX scripts cargan defer — reintenta cuando estén listas
    const interval = setInterval(() => { if (tryRender()) clearInterval(interval); }, 100);
    setTimeout(() => clearInterval(interval), 5000);
  }
}

// Indicador visual de fuente de datos (vivo vs respaldo manual)
function dataSourceIndicator(ok, label) {
  return ok
    ? `<span class="data-source live"><i class="fa-solid fa-circle"></i> Datos en vivo (${label})</span>`
    : `<span class="data-source manual"><i class="fa-solid fa-file-pen"></i> Datos manuales (respaldo)</span>`;
}

// ==========================================================================
// SCROLL ANIMATIONS (GSAP ScrollTrigger)
// ==========================================================================

function initScrollAnimations() {
  if (!window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Limpia triggers previos (en SPA cuando cambias de vista)
  ScrollTrigger.getAll().forEach(t => t.kill());

  // Parallax sutil del gallo del hero
  const heroRooster = document.querySelector(".dash-hero-rooster");
  if (heroRooster) {
    gsap.to(heroRooster, {
      y: 60,
      ease: "none",
      scrollTrigger: {
        trigger: ".dash-hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.6
      }
    });
  }

  // Parallax del trofeo (más lento todavía)
  const heroTrophy = document.querySelector(".dash-hero-trophy");
  if (heroTrophy) {
    gsap.to(heroTrophy, {
      y: 100,
      rotation: -12,
      ease: "none",
      scrollTrigger: {
        trigger: ".dash-hero",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });
  }

  // Reveal: section-header con la barra dorada que crece
  document.querySelectorAll(".section-header").forEach(header => {
    gsap.from(header, {
      opacity: 0,
      x: -30,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: {
        trigger: header,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  });

  // Reveal: panels que entran al viewport con stagger.
  // Se excluye #view-prizes: su árbol del torneo es alto y queda bajo el
  // pliegue, y el reveal por scroll lo dejaba atascado en opacity:0 (vacío).
  // En esa vista los panels se muestran siempre, sin animación.
  const panels = document.querySelectorAll(".view-section.active:not(#view-prizes) .panel");
  panels.forEach((panel, i) => {
    gsap.from(panel, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      delay: (i % 3) * 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: panel,
        start: "top 88%",
        toggleActions: "play none none none"
      }
    });
  });

  // Reveal: prize cards (mini) en cascada.
  // Excluidas dentro de #view-prizes por el mismo motivo que sus panels
  // (evitar que queden invisibles si están bajo el pliegue al abrir la pestaña).
  document.querySelectorAll(".prize-card-mini").forEach((card, i) => {
    if (card.closest("#view-prizes")) return;
    gsap.from(card, {
      opacity: 0,
      x: -20,
      duration: 0.5,
      delay: i * 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 92%",
        toggleActions: "play none none none"
      }
    });
  });

  // Reveal: participant cards
  document.querySelectorAll(".participant-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 30,
      scale: 0.96,
      duration: 0.55,
      delay: (i % 4) * 0.07,
      ease: "back.out(1.2)",
      scrollTrigger: {
        trigger: card,
        start: "top 88%",
        toggleActions: "play none none none"
      }
    });
  });

  // Reveal: filas de tablas de datos
  document.querySelectorAll(".data-table tbody tr").forEach((row, i) => {
    if (i > 12) return; // solo las primeras visibles
    gsap.from(row, {
      opacity: 0,
      x: -10,
      duration: 0.4,
      delay: i * 0.03,
      ease: "power2.out",
      scrollTrigger: {
        trigger: row,
        start: "top 95%",
        toggleActions: "play none none none"
      }
    });
  });

  // Reveal: rules cards
  document.querySelectorAll(".rules-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      delay: i * 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  });
}

// ==========================================================================
// CARGA DE DATOS: PARTICIPANTES (CSV)
// ==========================================================================

// Parser CSV simple (sin comas dentro de campos, sin comillas).
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1)
    .filter(line => line.trim().length > 0)
    .map(line => {
      const values = line.split(",");
      const row = {};
      headers.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
      return row;
    });
}

async function loadParticipants() {
  let rows = [];
  try {
    const res = await fetch("participants.csv", { cache: "no-store" });
    rows = parseCSV(await res.text());
  } catch (e) {
    console.error("No se pudo cargar participants.csv", e);
  }

  const byOwner = {};
  OWNERSHIP = {};
  SUBSIDIZED_TEAM_IDS = [];

  rows.forEach(row => {
    const teamId = row.team_id;
    const ownerName = row.owner_name;
    if (!teamId || !ownerName) return;

    const share = parseFloat(row.share) || 0;
    const bonusPct = parseFloat(row.bonus_pct) || 0;
    const isSubsidized = (row.subsidized || "").toLowerCase() === "yes";
    const isBonusTeam = (row.bonus_team || "").toLowerCase() === "yes";

    if (!byOwner[ownerName]) {
      byOwner[ownerName] = { name: ownerName, photo: row.photo || "", teams: [] };
    }
    byOwner[ownerName].teams.push({
      teamId, share, subsidized: isSubsidized, bonusTeam: isBonusTeam, bonusPct
    });

    if (!OWNERSHIP[teamId]) OWNERSHIP[teamId] = [];
    OWNERSHIP[teamId].push({ owner: ownerName, share });

    if (isSubsidized && !SUBSIDIZED_TEAM_IDS.includes(teamId)) {
      SUBSIDIZED_TEAM_IDS.push(teamId);
    }
  });

  PARTICIPANTS = Object.values(byOwner);
}

// Dueño(s) de un equipo: array de { owner, share } (1 o 2 entradas).
function getTeamOwners(teamId) {
  return OWNERSHIP[teamId] || [];
}

// ==========================================================================
// CARGA DE RESULTADOS Y TABLAS DE GRUPO (vivo con respaldo manual)
// ==========================================================================

async function loadResults() {
  // Punto de partida: respaldo manual de results.js
  EFFECTIVE_RESULTS = {};
  for (const n in RESULTS) {
    EFFECTIVE_RESULTS[n] = { ...RESULTS[n] };
  }

  const [liveGames, liveGroups] = await Promise.all([fetchLiveGames(), fetchLiveGroups()]);

  liveGamesOk = Array.isArray(liveGames);
  if (liveGamesOk) {
    liveGames.forEach(g => {
      if (!EFFECTIVE_RESULTS[g.n]) EFFECTIVE_RESULTS[g.n] = {};
      const r = EFFECTIVE_RESULTS[g.n];
      if (g.home) r.home = g.home;
      if (g.away) r.away = g.away;
      if (g.homeScore != null) r.homeScore = g.homeScore;
      if (g.awayScore != null) r.awayScore = g.awayScore;
    });
  }

  liveGroupsOk = !!liveGroups;
  GROUP_STANDINGS = {};
  Object.keys(GROUPS).forEach(g => {
    GROUP_STANDINGS[g] = (liveGroupsOk && liveGroups[g]) ? liveGroups[g] : computeGroupStandings(g);
  });

  try {
    QUALIFIED_IDS = compute32Qualifiers();
    KNOCKOUT_STATUS = computeKnockoutStatus(QUALIFIED_IDS);
  } catch (e) {
    console.error("Error calculando clasificados/eliminatorias:", e);
    QUALIFIED_IDS = [];
    KNOCKOUT_STATUS = {};
  }
}

// Tabla de grupo calculada desde EFFECTIVE_RESULTS (respaldo si falla la API).
// Criterio simplificado: Pts, luego DG, luego GF (no replica 100% los desempates FIFA).
function computeGroupStandings(group) {
  const teamIds = GROUPS[group] || [];
  const table = {};
  teamIds.forEach(id => { table[id] = { teamId: id, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }; });

  MATCHES.filter(m => m.phase === "grupos" && m.group === group).forEach(m => {
    const r = EFFECTIVE_RESULTS[m.n];
    if (!r || r.homeScore == null || r.awayScore == null) return;
    const h = table[m.home], a = table[m.away];
    if (!h || !a) return;

    h.mp++; a.mp++;
    h.gf += r.homeScore; h.ga += r.awayScore;
    a.gf += r.awayScore; a.ga += r.homeScore;

    if (r.homeScore > r.awayScore) { h.w++; a.l++; h.pts += 3; }
    else if (r.homeScore < r.awayScore) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  });

  Object.values(table).forEach(t => { t.gd = t.gf - t.ga; });
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

// 32 clasificados: top 2 de cada grupo + mejores 8 terceros.
function compute32Qualifiers() {
  const top2 = [];
  const thirds = [];
  Object.keys(GROUPS).forEach(g => {
    const standings = GROUP_STANDINGS[g] || [];
    if (standings.length >= 2) top2.push(standings[0].teamId, standings[1].teamId);
    if (standings.length >= 3) thirds.push(standings[2]);
  });
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const best8 = thirds.slice(0, 8).map(t => t.teamId);
  return [...top2, ...best8];
}

// Resultado normalizado de un partido (grupos o eliminatorias), o null si no
// está jugado / no se conocen los equipos todavía.
function findMatchResult(n) {
  const r = EFFECTIVE_RESULTS[n];
  if (!r || r.homeScore == null || r.awayScore == null) return null;

  const match = MATCHES.find(m => m.n === n);
  const home = r.home || (match && match.home);
  const away = r.away || (match && match.away);
  if (!home || !away) return null;

  let winner, loser;
  if (r.homeScore > r.awayScore) { winner = home; loser = away; }
  else if (r.awayScore > r.homeScore) { winner = away; loser = home; }
  else if (r.penalties) {
    winner = r.penalties.home > r.penalties.away ? home : away;
    loser = winner === home ? away : home;
  } else {
    return null; // empate sin penales registrados: aún sin resolver
  }

  return { home, away, homeScore: r.homeScore, awayScore: r.awayScore, winner, loser };
}

// Rondas eliminatorias y el % de Bolsa B que cada nivel garantiza.
const KNOCKOUT_RANGES = [
  { phase: "r32", range: [73, 88], winPct: 2.074, losePct: 1.037, nextStage: "octavos" },
  { phase: "octavos", range: [89, 96], winPct: 4.148, losePct: 2.074, nextStage: "cuartos" },
  { phase: "cuartos", range: [97, 100], winPct: 7.5, losePct: 4.148, nextStage: "semis" }
];

// Última fase alcanzada por cada equipo y el % de Bolsa B garantizado en
// ese punto (premio "actual", no necesariamente el final).
function computeKnockoutStatus(qualifiedIds) {
  const status = {};
  TEAMS.forEach(t => {
    status[t.id] = qualifiedIds.includes(t.id)
      ? { stage: "r32", pct: 1.037 }
      : { stage: "eliminado_grupos", pct: 0 };
  });

  KNOCKOUT_RANGES.forEach(({ phase, range, winPct, losePct, nextStage }) => {
    for (let n = range[0]; n <= range[1]; n++) {
      const res = findMatchResult(n);
      if (!res) continue;
      if (status[res.winner]) status[res.winner] = { stage: nextStage, pct: winPct };
      if (status[res.loser]) status[res.loser] = { stage: phase + "_eliminado", pct: losePct };
    }
  });

  // Semis: ganador -> final (garantiza subcampeón 12.5%), perdedor -> tercer puesto (garantiza 4to 7.5%)
  for (let n = 101; n <= 102; n++) {
    const res = findMatchResult(n);
    if (!res) continue;
    if (status[res.winner]) status[res.winner] = { stage: "final", pct: 12.5 };
    if (status[res.loser]) status[res.loser] = { stage: "tercer_puesto", pct: 7.5 };
  }

  // Tercer puesto
  const tercer = findMatchResult(103);
  if (tercer) {
    if (status[tercer.winner]) status[tercer.winner] = { stage: "tercero", pct: 10.0 };
    if (status[tercer.loser]) status[tercer.loser] = { stage: "cuarto", pct: 7.5 };
  }

  // Final
  const final = findMatchResult(104);
  if (final) {
    if (status[final.winner]) status[final.winner] = { stage: "campeon", pct: 20.0 };
    if (status[final.loser]) status[final.loser] = { stage: "subcampeon", pct: 12.5 };
  }

  return status;
}

// Etiqueta legible de una fase/estado de eliminatoria.
function stageLabel(stage) {
  const labels = {
    eliminado_grupos: "Eliminado en grupos",
    r32: "Clasificado (R32)",
    r32_eliminado: "Eliminado en R32",
    octavos: "Octavos de Final",
    octavos_eliminado: "Eliminado en Octavos",
    cuartos: "Cuartos de Final",
    cuartos_eliminado: "Eliminado en Cuartos",
    semis: "Semifinales",
    tercer_puesto: "Jugó por el 3er puesto",
    final: "Finalista",
    cuarto: "4to puesto",
    tercero: "3er puesto",
    subcampeon: "Subcampeón",
    campeon: "🏆 Campeón"
  };
  return labels[stage] || "—";
}

// ==========================================================================
// PREMIOS ESPECIALES (estado actual)
// ==========================================================================

// Determina, con los datos disponibles, los ganadores actuales/parciales de
// los 3 premios especiales. Peor equipo y mejor 3ro solo se pueden definir
// cuando termina la fase de grupos; la goleada se actualiza partido a partido.
function computeSpecialPrizes() {
  let goleada = null;
  Object.keys(EFFECTIVE_RESULTS).forEach(key => {
    const r = EFFECTIVE_RESULTS[key];
    if (r.homeScore == null || r.awayScore == null) return;
    const diff = Math.abs(r.homeScore - r.awayScore);
    if (diff === 0) return;

    const match = MATCHES.find(m => m.n === Number(key));
    const home = r.home || (match && match.home);
    const away = r.away || (match && match.away);
    if (!home || !away) return;

    if (!goleada || diff > goleada.diff) {
      const loserId = r.homeScore > r.awayScore ? away : home;
      goleada = { diff, loserId };
    }
  });

  const groupsComplete = Object.values(GROUP_STANDINGS).length > 0 &&
    Object.values(GROUP_STANDINGS).every(arr => arr.every(t => t.mp >= 3));

  let worstTeamId = null;
  let best3rdTeamId = null;

  if (groupsComplete) {
    const allTeams = [];
    Object.values(GROUP_STANDINGS).forEach(arr => allTeams.push(...arr));
    allTeams.sort((a, b) => a.pts - b.pts || a.gd - b.gd || a.gf - b.gf);
    if (allTeams.length) worstTeamId = allTeams[0].teamId;

    const thirds = [];
    Object.keys(GROUP_STANDINGS).forEach(g => {
      const arr = GROUP_STANDINGS[g];
      if (arr.length >= 3) thirds.push(arr[2]);
    });
    thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    if (thirds.length) best3rdTeamId = thirds[0].teamId;
  }

  return { worstTeamId, best3rdTeamId, goleadaTeamId: goleada ? goleada.loserId : null };
}

// ==========================================================================
// CÁLCULO DE PREMIOS ACTUALES
// ==========================================================================

// Para cada equipo, % de Bolsa B ajustado por el bono de residuo:
//   p_k' = p_k * (1 - T/100) + Δ_k
// donde T = suma de bonus_pct activados (equipo bono pasó de grupos) y
// Δ_k = suma de esos bonus_pct cuyo equipo está actualmente en el nivel k.
function calculateCurrentPrizes() {
  let T = 0;
  const teamBonus = {}; // teamId -> bono de residuo activado para ese equipo

  PARTICIPANTS.forEach(p => {
    p.teams.forEach(t => {
      if (t.bonusTeam && t.bonusPct > 0 && QUALIFIED_IDS.includes(t.teamId)) {
        T += t.bonusPct;
        teamBonus[t.teamId] = (teamBonus[t.teamId] || 0) + t.bonusPct;
      }
    });
  });

  const adjustedPct = {};
  TEAMS.forEach(team => {
    const base = KNOCKOUT_STATUS[team.id] ? KNOCKOUT_STATUS[team.id].pct : 0;
    if (base === 0) { adjustedPct[team.id] = 0; return; }
    const d = teamBonus[team.id] || 0;
    adjustedPct[team.id] = base * (1 - T / 100) + d;
  });

  // Subsidios activos: equipos subsidiados que pasaron de grupos
  const activeSubsidies = SUBSIDIZED_TEAM_IDS.filter(tid => QUALIFIED_IDS.includes(tid));
  const V = activeSubsidies.length;
  const partValue = CONFIG.TOTAL_C / (3 + V);

  const special = computeSpecialPrizes();

  const perParticipant = {};
  PARTICIPANTS.forEach(p => {
    perParticipant[p.name] = { name: p.name, photo: p.photo, grossB: 0, extraC: 0, total: 0 };
  });

  PARTICIPANTS.forEach(p => {
    p.teams.forEach(t => {
      const pct = adjustedPct[t.teamId] || 0;
      perParticipant[p.name].grossB += (pct / 100) * CONFIG.TOTAL_B * t.share;

      if (activeSubsidies.includes(t.teamId)) {
        perParticipant[p.name].extraC += partValue * t.share;
      }
    });
  });

  // Premios especiales: se reparten según la propiedad (con share) del equipo ganador.
  [special.worstTeamId, special.best3rdTeamId, special.goleadaTeamId].forEach(teamId => {
    if (!teamId) return;
    getTeamOwners(teamId).forEach(o => {
      if (perParticipant[o.owner]) perParticipant[o.owner].extraC += partValue * o.share;
    });
  });

  Object.values(perParticipant).forEach(pp => { pp.total = pp.grossB + pp.extraC; });

  return {
    adjustedPct, T, V, partValue, activeSubsidies, special,
    perParticipant: Object.values(perParticipant)
  };
}

// ==========================================================================
// HEADER STATS
// ==========================================================================

function updateStatsHeader() {
  animateNumber(document.querySelector("#stat-players .stat-value"), CONFIG.N, false);
  animateNumber(document.querySelector("#stat-pot-b .stat-value"), CONFIG.TOTAL_B);
  animateNumber(document.querySelector("#stat-pot-c .stat-value"), CONFIG.TOTAL_C);

  const valP = document.getElementById("val-p-budget");
  if (valP) {
    valP.textContent = formatCurrency(CONFIG.P);
    document.getElementById("val-c-fee").textContent = formatCurrency(CONFIG.C);
    document.getElementById("val-total-fee").textContent = formatCurrency(CONFIG.P + CONFIG.C);
    animateNumber(document.getElementById("val-total-pot"), CONFIG.TOTAL_B + CONFIG.TOTAL_C);
  }
}

// ==========================================================================
// SPA NAV ROUTING
// ==========================================================================

function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".view-section");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-target");

      // Update active nav link
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Animate transition using GSAP
      sections.forEach(section => {
        if (section.id === targetId) {
          section.classList.add("active");
          gsap.fromTo(section,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
          );
        } else {
          section.classList.remove("active");
        }
      });

      // Run view specific initializations
      if (targetId === "view-dashboard") renderDashboard();
      if (targetId === "view-matches") renderMatchesPage();
      if (targetId === "view-standings") renderStandingsPage();
      if (targetId === "view-prizes") renderPrizesPage();
      if (targetId === "view-participants") renderParticipantsPage();
      if (targetId === "view-rules") renderRulesKatex();

      // Detiene countdown al salir de Partidos
      if (targetId !== "view-matches" && matchCountdownInterval) {
        clearInterval(matchCountdownInterval);
      }

      // Refresca scroll animations para la nueva vista
      requestAnimationFrame(() => initScrollAnimations());
    });
  });

  // Handle initial view
  const hash = window.location.hash;
  if (hash) {
    const targetLink = document.querySelector(`.nav-link[href="${hash}"]`);
    if (targetLink) targetLink.click();
  } else {
    renderDashboard();
  }
}

// ==========================================================================
// VIEW: DASHBOARD
// ==========================================================================

function renderDashboard() {
  updateStatsHeader();

  const prizes = calculateCurrentPrizes();

  // Equipos subsidiados
  const subDiv = document.getElementById("dashboard-subsidies");
  if (SUBSIDIZED_TEAM_IDS.length === 0) {
    subDiv.innerHTML = `<div class="no-data"><i class="fa-solid fa-circle-info"></i> No hay equipos subsidiados configurados.</div>`;
  } else {
    subDiv.innerHTML = SUBSIDIZED_TEAM_IDS.map((teamId, index) => {
      const team = getTeamById(teamId);
      if (!team) return "";
      const ownerNames = getTeamOwners(teamId).map(o => o.owner).join(" / ") || "Sin dueño";
      const active = QUALIFIED_IDS.includes(teamId);
      return `
        <div class="sub-team-slot active">
          <span>#${index + 1}</span>
          <span class="flag">${flagIcon(team)}</span>
          <strong>${team.name}</strong>
          <span class="team-owner">(${ownerNames})</span>
          ${active ? '<span class="badge-live">Activo</span>' : ''}
        </div>
      `;
    }).join("");
  }

  // Premios especiales (valor por parte actual)
  const setIfExists = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const partValStr = formatCurrency(prizes.partValue);
  setIfExists("prize-worst-val", partValStr);
  setIfExists("prize-best3rd-val", partValStr);
  setIfExists("prize-goleada-val", partValStr);

  // Tabla: Equipos y Dueños
  const tbodySold = document.querySelector("#table-sold-teams tbody");
  const teamsSorted = [...TEAMS].sort((a, b) => (prizes.adjustedPct[b.id] || 0) - (prizes.adjustedPct[a.id] || 0));
  tbodySold.innerHTML = teamsSorted.map(team => {
    const owners = getTeamOwners(team.id);
    const ownersHtml = owners.length
      ? owners.map(o => owners.length > 1 ? `${o.owner} (${Math.round(o.share * 100)}%)` : o.owner).join(" / ")
      : "Sin dueño";
    const pct = prizes.adjustedPct[team.id] || 0;
    const status = KNOCKOUT_STATUS[team.id];
    return `
      <tr>
        <td><span class="bold">${flagIcon(team)} ${team.name}</span></td>
        <td>${ownersHtml}</td>
        <td class="text-gold bold">${pct.toFixed(3)}%</td>
        <td>${stageLabel(status ? status.stage : "eliminado_grupos")}</td>
      </tr>
    `;
  }).join("");

  // Tabla: Participantes
  const tbodyPlayers = document.querySelector("#table-dashboard-players tbody");
  const sortedParticipants = [...prizes.perParticipant].sort((a, b) => b.total - a.total);
  tbodyPlayers.innerHTML = sortedParticipants.map(pp => {
    const participant = PARTICIPANTS.find(p => p.name === pp.name);
    const teamCount = participant ? participant.teams.length : 0;
    return `
      <tr>
        <td><div class="with-avatar">${renderAvatar(participant, "sm")}<span class="bold">${pp.name}</span></div></td>
        <td>${teamCount}</td>
        <td class="text-gold bold">${formatCurrency(pp.grossB)}</td>
        <td>${formatCurrency(pp.extraC)}</td>
        <td class="bold">${formatCurrency(pp.total)}</td>
      </tr>
    `;
  }).join("");
}

// ==========================================================================
// VIEW: PARTIDOS (versus, hora colombiana, dueños, marcadores)
// ==========================================================================

let matchFilter = "proximos";
let matchCountdownInterval = null;

// Fecha/hora del partido en zona horaria de Colombia
function formatMatchDateCO(iso) {
  const d = new Date(iso);
  const fecha = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", weekday: "short", day: "numeric", month: "short"
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", hour: "numeric", minute: "2-digit", hour12: true
  }).format(d);
  return { fecha, hora };
}

// Clave de día (en COL) para agrupar: "2026-06-11"
function getCODateKey(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(iso));
}

// Etiqueta de día relativa: HOY / MAÑANA / "Jueves 11 jun"
function dayLabelCO(iso) {
  const key = getCODateKey(iso);
  const todayKey = getCODateKey(new Date().toISOString());
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowKey = getCODateKey(tomorrow.toISOString());
  if (key === todayKey) return "HOY";
  if (key === tomorrowKey) return "MAÑANA";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long"
  }).format(new Date(iso));
}

// Estado del partido: finished | live | upcoming.
// Si ya hay marcador en EFFECTIVE_RESULTS, se considera finalizado sin importar la fecha.
function getMatchState(match, now = Date.now()) {
  const r = EFFECTIVE_RESULTS[match.n];
  if (r && r.homeScore != null && r.awayScore != null) return "finished";

  const start = new Date(match.kickoff).getTime();
  const end = start + 115 * 60000; // ~115 min de duración estimada
  if (now >= end) return "finished";
  if (now >= start) return "live";
  return "upcoming";
}

// Countdown legible
function formatCountdown(ms) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

// Render de un lado del versus (equipo + dueño(s))
function renderMatchSide(teamId, big = false) {
  const flagCls = big ? "vs-flag big" : "vs-flag";
  const avSize = big ? "xl" : "lg";
  if (!teamId) {
    return `<div class="vs-team tbd">
      <div class="${flagCls}">❔</div>
      <div class="vs-team-name">Por definir</div>
    </div>`;
  }
  const team = getTeamById(teamId);
  const owners = getTeamOwners(teamId);

  let ownerHtml;
  if (owners.length === 0) {
    ownerHtml = `<div class="vs-owner none"><i class="fa-solid fa-user-slash"></i> Sin dueño</div>`;
  } else if (!big) {
    // Tarjetas compactas: solo fotos solapadas, sin nombres
    ownerHtml = `<div class="vs-owner-stack">${owners.map(o => {
      const participant = PARTICIPANTS.find(p => p.name === o.owner);
      return renderAvatar(participant, "lg");
    }).join("")}</div>`;
  } else if (owners.length === 1) {
    const participant = PARTICIPANTS.find(p => p.name === owners[0].owner);
    ownerHtml = `<div class="vs-owner">${renderAvatar(participant, avSize)}<span class="vs-owner-name">${owners[0].owner}</span></div>`;
  } else {
    ownerHtml = `<div class="vs-owner-multi">${owners.map(o => {
      const participant = PARTICIPANTS.find(p => p.name === o.owner);
      return `<div class="vs-owner">${renderAvatar(participant, avSize)}<span class="vs-owner-name">${o.owner}</span></div>`;
    }).join("")}</div>`;
  }

  return `<div class="vs-team${big ? " big" : ""}" style="--tc:${team.color}">
    <div class="${flagCls}">${flagIcon(team)}</div>
    <div class="vs-team-name">${team.name}</div>
    <div class="vs-rank">FIFA #${team.rank}</div>
    ${ownerHtml}
  </div>`;
}

// Etiqueta de contexto (grupo o fase)
function matchContextLabel(match) {
  if (match.phase === "grupos") return `Grupo ${match.group}`;
  return match.label || PHASE_LABELS[match.phase] || "";
}

// Tarjeta versus estándar (incluye marcador si ya finalizó)
function renderMatchCard(match) {
  const { fecha, hora } = formatMatchDateCO(match.kickoff);
  const st = getMatchState(match);
  const r = EFFECTIVE_RESULTS[match.n];
  const homeId = match.home || (r && r.home) || null;
  const awayId = match.away || (r && r.away) || null;
  const hasOwner = getTeamOwners(homeId).length > 0 || getTeamOwners(awayId).length > 0;

  const stateBadge =
    st === "live" ? `<span class="match-state live"><i class="fa-solid fa-circle"></i> EN VIVO</span>`
    : st === "finished" ? `<span class="match-state finished">Finalizado</span>`
    : "";

  const showScore = st === "finished" && r && r.homeScore != null && r.awayScore != null;
  const centerContent = showScore
    ? `<div class="vs-badge score">${r.homeScore} - ${r.awayScore}</div>`
    : `<div class="vs-badge">VS</div>`;

  return `
    <div class="match-card ${st} ${hasOwner ? "has-owner" : ""}">
      <div class="match-card-top">
        <span class="match-context">${matchContextLabel(match)}</span>
        ${stateBadge}
        <span class="match-num">#${match.n}</span>
      </div>
      <div class="match-versus">
        ${renderMatchSide(homeId)}
        <div class="vs-center">
          ${centerContent}
          <div class="vs-time">${hora}</div>
          <div class="vs-date">${fecha}</div>
        </div>
        ${renderMatchSide(awayId)}
      </div>
      <div class="match-card-foot">
        <i class="fa-solid fa-location-dot"></i> ${match.venue}
      </div>
    </div>
  `;
}

// Hero del próximo partido (grande, con countdown)
function renderNextMatchHero(match) {
  const host = document.getElementById("next-match-hero");
  if (!host) return;
  if (!match) { host.innerHTML = ""; return; }

  const { fecha, hora } = formatMatchDateCO(match.kickoff);
  const st = getMatchState(match);
  const liveTag = st === "live"
    ? `<span class="match-state live"><i class="fa-solid fa-circle"></i> EN VIVO AHORA</span>`
    : `<span class="next-eyebrow"><i class="fa-solid fa-stopwatch"></i> Próximo partido</span>`;

  const r = EFFECTIVE_RESULTS[match.n];
  const homeId = match.home || (r && r.home) || null;
  const awayId = match.away || (r && r.away) || null;

  host.innerHTML = `
    <div class="next-match ${st}">
      <div class="next-match-head">
        ${liveTag}
        <span class="next-context">${matchContextLabel(match)} · Partido #${match.n}</span>
      </div>
      <div class="next-versus">
        ${renderMatchSide(homeId, true)}
        <div class="next-center">
          <div class="next-countdown" id="next-countdown">—</div>
          <div class="next-vs">VS</div>
          <div class="next-datetime">
            <strong>${hora}</strong>
            <span>${fecha} · hora COL 🇨🇴</span>
          </div>
        </div>
        ${renderMatchSide(awayId, true)}
      </div>
      <div class="next-match-foot">
        <i class="fa-solid fa-location-dot"></i> ${match.venue}
      </div>
    </div>
  `;

  // Countdown en vivo
  if (matchCountdownInterval) clearInterval(matchCountdownInterval);
  const cdEl = document.getElementById("next-countdown");
  const tick = () => {
    const ms = new Date(match.kickoff).getTime() - Date.now();
    const st2 = getMatchState(match);
    if (st2 === "live") {
      cdEl.innerHTML = `<span class="cd-live">● EN JUEGO</span>`;
    } else if (st2 === "finished") {
      cdEl.textContent = "Finalizado";
      clearInterval(matchCountdownInterval);
    } else {
      cdEl.textContent = formatCountdown(ms) || "¡Ya!";
    }
  };
  tick();
  matchCountdownInterval = setInterval(tick, 1000);
}

function renderMatchesPage() {
  const list = document.getElementById("matches-list");
  const countEl = document.getElementById("matches-count");
  const heroHost = document.getElementById("next-match-hero");
  if (!list) return;

  const now = Date.now();
  const sorted = [...MATCHES].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  // El próximo partido futuro (o en vivo) para el hero
  const nextMatch = sorted.find(m => getMatchState(m, now) !== "finished");

  // Filtro
  let filtered;
  switch (matchFilter) {
    case "mios":
      filtered = sorted.filter(m => getTeamOwners(m.home).length > 0 || getTeamOwners(m.away).length > 0);
      break;
    case "todos":
      filtered = sorted;
      break;
    case "grupos":
      filtered = sorted.filter(m => m.phase === "grupos");
      break;
    case "eliminatorias":
      filtered = sorted.filter(m => m.phase !== "grupos");
      break;
    case "resultados":
      filtered = sorted.filter(m => getMatchState(m, now) === "finished").reverse();
      break;
    case "proximos":
    default:
      filtered = sorted.filter(m => getMatchState(m, now) !== "finished");
      break;
  }

  // Hero solo en vistas con próximos relevantes
  if (matchFilter === "proximos" || matchFilter === "mios") {
    renderNextMatchHero(nextMatch);
    heroHost.style.display = "";
    // Evita duplicar el hero en la lista
    if (nextMatch && matchFilter === "proximos") {
      filtered = filtered.filter(m => m.n !== nextMatch.n);
    }
  } else {
    if (matchCountdownInterval) clearInterval(matchCountdownInterval);
    heroHost.innerHTML = "";
    heroHost.style.display = "none";
  }

  countEl.textContent = `${filtered.length} partido${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="no-data"><i class="fa-solid fa-futbol"></i> No hay partidos para este filtro.</div>`;
    return;
  }

  // Render con separadores de día
  let html = "";
  let lastDay = null;
  filtered.forEach(m => {
    const dayKey = getCODateKey(m.kickoff);
    if (dayKey !== lastDay) {
      lastDay = dayKey;
      html += `<div class="match-day-sep"><span>${dayLabelCO(m.kickoff)}</span></div>`;
    }
    html += renderMatchCard(m);
  });
  list.innerHTML = html;

  // Animación de entrada en cascada
  if (window.gsap) {
    gsap.from("#matches-list .match-card", {
      opacity: 0, y: 24, duration: 0.4, stagger: 0.04, ease: "power2.out"
    });
  }
}

// ==========================================================================
// VIEW: POSICIONES (tablas de grupo + eliminatorias)
// ==========================================================================

function renderStandingsPage() {
  const groupsIndicator = document.getElementById("standings-groups-indicator");
  if (groupsIndicator) groupsIndicator.innerHTML = dataSourceIndicator(liveGroupsOk, "worldcup26.ir");

  const grid = document.getElementById("standings-groups-grid");
  if (grid) {
    grid.innerHTML = Object.keys(GROUPS).sort().map(g => {
      const standings = GROUP_STANDINGS[g] || [];
      const rows = standings.map((t, i) => {
        const team = getTeamById(t.teamId);
        const owners = getTeamOwners(t.teamId);
        let ownersHtml;
        if (owners.length === 0) {
          ownersHtml = `<span class="vs-owner none"><i class="fa-solid fa-circle-question"></i> Sin dueño</span>`;
        } else if (owners.length === 1) {
          const participant = PARTICIPANTS.find(p => p.name === owners[0].owner);
          ownersHtml = `<div class="vs-owner">${renderAvatar(participant, "sm")}<span class="vs-owner-name">${owners[0].owner}</span></div>`;
        } else {
          ownersHtml = `<div class="vs-owner-multi">${owners.map(o => {
            const participant = PARTICIPANTS.find(p => p.name === o.owner);
            return `<div class="vs-owner">${renderAvatar(participant, "sm")}<span class="vs-owner-name">${o.owner} (${Math.round(o.share * 100)}%)</span></div>`;
          }).join("")}</div>`;
        }
        return `
          <tr class="${i < 2 ? "qualified" : ""}">
            <td>${i + 1}</td>
            <td>${flagIcon(team)} ${team.name}</td>
            <td class="font-sm">${ownersHtml}</td>
            <td>${t.mp}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
            <td>${t.gf}</td><td>${t.ga}</td><td>${t.gd}</td>
            <td class="bold">${t.pts}</td>
          </tr>
        `;
      }).join("");

      return `
        <div class="panel glass">
          <h2>Grupo ${g}</h2>
          <div class="table-wrapper">
            <table class="data-table table-sm">
              <thead>
                <tr>
                  <th>#</th><th>Equipo</th><th>Dueño(s)</th>
                  <th>PJ</th><th>G</th><th>E</th><th>P</th>
                  <th>GF</th><th>GC</th><th>DG</th><th>Pts</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join("");
  }

  const koIndicator = document.getElementById("standings-knockout-indicator");
  if (koIndicator) koIndicator.innerHTML = dataSourceIndicator(liveGamesOk, "worldcup26.ir");

  const koContainer = document.getElementById("standings-knockout-container");
  if (koContainer) {
    if (QUALIFIED_IDS.length === 0) {
      koContainer.innerHTML = `<div class="no-data"><i class="fa-solid fa-circle-info"></i> Aún no hay equipos clasificados a la fase eliminatoria.</div>`;
    } else {
      // Orden de presentación de las fases (de la más avanzada a la menos)
      const stageOrder = [
        "campeon", "subcampeon", "tercero", "cuarto",
        "final", "tercer_puesto",
        "semis", "cuartos_eliminado",
        "cuartos", "octavos_eliminado",
        "octavos", "r32_eliminado",
        "r32"
      ];

      const groupsByStage = {};
      QUALIFIED_IDS.forEach(tid => {
        const stage = KNOCKOUT_STATUS[tid] ? KNOCKOUT_STATUS[tid].stage : "r32";
        if (!groupsByStage[stage]) groupsByStage[stage] = [];
        groupsByStage[stage].push(tid);
      });

      koContainer.innerHTML = `<div class="knockout-grid">${
        stageOrder.filter(stage => groupsByStage[stage]).map(stage => `
          <div class="knockout-stage-box">
            <h3>${stageLabel(stage)}</h3>
            <div class="participant-teams-flex">
              ${groupsByStage[stage].map(tid => {
                const team = getTeamById(tid);
                const owners = getTeamOwners(tid);
                const ownersHtml = owners.length
                  ? owners.map(o => {
                      const participant = PARTICIPANTS.find(p => p.name === o.owner);
                      return `${renderAvatar(participant, "lg")}<small>${o.owner}</small>`;
                    }).join("")
                  : `<small>Sin dueño</small>`;
                return `<span class="p-team-badge">${flagIcon(team)} ${team.name} ${ownersHtml}</span>`;
              }).join("")}
            </div>
          </div>
        `).join("")
      }</div>`;
    }
  }
}

// ==========================================================================
// VIEW: PREMIOS ACTUALES
// ==========================================================================

function renderPrizesPage() {
  const prizes = calculateCurrentPrizes();

  document.getElementById("pay-total-b").textContent = formatCurrency(CONFIG.TOTAL_B);
  document.getElementById("pay-total-c").textContent = formatCurrency(CONFIG.TOTAL_C);
  document.getElementById("pay-active-v").textContent = `${prizes.V} de 3`;
  document.getElementById("pay-part-val").textContent = formatCurrency(prizes.partValue);
  document.getElementById("pay-total-t").textContent = `${prizes.T.toFixed(2)}%`;

  const renderSpecial = (label, icon, teamId) => {
    if (!teamId) {
      return `
        <div class="prize-card-mini">
          <div class="prize-icon"><i class="fa-solid ${icon}"></i></div>
          <div class="prize-info">
            <h3>${label}</h3>
            <p>Pendiente de definir</p>
          </div>
        </div>
      `;
    }
    const team = getTeamById(teamId);
    const owners = getTeamOwners(teamId).map(o => o.owner).join(" / ") || "Sin dueño";
    return `
      <div class="prize-card-mini">
        <div class="prize-icon"><i class="fa-solid ${icon}"></i></div>
        <div class="prize-info">
          <h3>${label}</h3>
          <p>${flagIcon(team)} ${team.name} — ${owners}</p>
          <span class="prize-tag">${formatCurrency(prizes.partValue)}</span>
        </div>
      </div>
    `;
  };

  document.getElementById("special-prizes-status").innerHTML =
    renderSpecial("Peor Equipo (Grupos)", "fa-poo", prizes.special.worstTeamId) +
    renderSpecial("Mejor 3ro Clasificado", "fa-medal", prizes.special.best3rdTeamId) +
    renderSpecial("Mayor Goleada", "fa-fire", prizes.special.goleadaTeamId);

  const container = document.getElementById("payout-results-container");
  const sorted = [...prizes.perParticipant].sort((a, b) => b.total - a.total);
  container.innerHTML = sorted.map(pp => {
    const participant = PARTICIPANTS.find(p => p.name === pp.name);
    return `
      <div class="player-payout-item">
        <div class="payout-item-header">
          <div class="with-avatar">
            ${renderAvatar(participant, "lg")}
            <span class="p-name">${pp.name}</span>
          </div>
          <span class="p-net positive">${formatCurrency(pp.total)}</span>
        </div>
        <div class="payout-item-body">
          <div><span>Bolsa B (deportivo):</span> <strong>${formatCurrency(pp.grossB)}</strong></div>
          <div><span>Subsidios + Premios C:</span> <strong>${formatCurrency(pp.extraC)}</strong></div>
        </div>
      </div>
    `;
  }).join("");

  renderBracketTree(prizes.adjustedPct);
}

// Subsidio activo y/o bono de residuo asignados a un equipo (si los tiene).
function getTeamSpecialFlags(teamId) {
  let subsidized = false, bonusPct = 0;
  PARTICIPANTS.forEach(p => {
    p.teams.forEach(t => {
      if (t.teamId !== teamId) return;
      if (t.subsidized) subsidized = true;
      if (t.bonusTeam && t.bonusPct > bonusPct) bonusPct = t.bonusPct;
    });
  });
  return { subsidized, bonusPct };
}

// Caja de un equipo dentro del árbol: bandera, nombre, dueño(s), % y monto.
function bracketTeamBox(teamId, adjustedPct) {
  const team = getTeamById(teamId);
  const owners = getTeamOwners(teamId);
  const pct = adjustedPct[teamId] || 0;
  const amount = (pct / 100) * CONFIG.TOTAL_B;
  const flags = getTeamSpecialFlags(teamId);

  const ownersHtml = owners.length
    ? owners.map(o => {
        const participant = PARTICIPANTS.find(p => p.name === o.owner);
        return renderAvatar(participant, "sm");
      }).join("")
    : `<span class="vs-owner none"><i class="fa-solid fa-circle-question"></i></span>`;

  const tagsHtml =
    (flags.subsidized ? `<i class="fa-solid fa-hand-holding-dollar bracket-tag tag-subsidy" title="Subsidiado"></i>` : "") +
    (flags.bonusPct > 0 ? `<i class="fa-solid fa-bolt bracket-tag tag-bonus" title="Bono de residuo +${flags.bonusPct}%"></i>` : "");

  return `
    <div class="bracket-team">
      <div class="bracket-team-main">
        <span class="bracket-flag">${flagIcon(team)}</span>
        <span class="bracket-name">${team.name}</span>
        ${tagsHtml}
      </div>
      <div class="bracket-team-meta">
        <div class="bracket-owners">${ownersHtml}</div>
        <span class="bracket-pct">${pct.toFixed(3)}%</span>
      </div>
      <div class="bracket-amount">${formatCurrency(amount)}</div>
    </div>
  `;
}

// Árbol horizontal del torneo: R32 (clasificados actuales, agrupados por
// 1°/2°/mejor 3°) -> Octavos -> Cuartos -> Semis -> 3er puesto / Final -> Campeón.
// Las rondas futuras se llenan solo con los equipos que ya asegararon ese nivel.
function renderBracketTree(adjustedPct) {
  const host = document.getElementById("prizes-bracket-tree");
  const elimHost = document.getElementById("prizes-bracket-eliminated");
  if (!host) return;

  if (QUALIFIED_IDS.length === 0) {
    host.innerHTML = `<div class="no-data"><i class="fa-solid fa-circle-info"></i> Aún no hay tabla de grupos para armar el árbol.</div>`;
    if (elimHost) elimHost.innerHTML = "";
    return;
  }

  // R32: agrupar los 32 clasificados actuales por su posición de grupo.
  const primeros = [], segundos = [], terceros = [];
  Object.keys(GROUPS).sort().forEach(g => {
    const standings = GROUP_STANDINGS[g] || [];
    if (standings[0] && QUALIFIED_IDS.includes(standings[0].teamId)) primeros.push(standings[0].teamId);
    if (standings[1] && QUALIFIED_IDS.includes(standings[1].teamId)) segundos.push(standings[1].teamId);
    if (standings[2] && QUALIFIED_IDS.includes(standings[2].teamId)) terceros.push(standings[2].teamId);
  });

  const r32Col = `
    <div class="bracket-column bracket-col-r32">
      <div class="bracket-col-head">
        <h3>R32</h3>
        <span class="bracket-col-pct">1.037% c/u (+ bono)</span>
      </div>
      <div class="bracket-subgroup">
        <h4>1° de grupo</h4>
        ${primeros.map(id => bracketTeamBox(id, adjustedPct)).join("")}
      </div>
      <div class="bracket-subgroup">
        <h4>2° de grupo</h4>
        ${segundos.map(id => bracketTeamBox(id, adjustedPct)).join("")}
      </div>
      <div class="bracket-subgroup">
        <h4>Mejores terceros</h4>
        ${terceros.map(id => bracketTeamBox(id, adjustedPct)).join("")}
      </div>
    </div>
  `;

  // Siguientes rondas: solo equipos que ya asegararon ese % (según KNOCKOUT_STATUS).
  const stageColumns = [
    { pct: 2.074, label: "Octavos de Final" },
    { pct: 4.148, label: "Cuartos de Final" },
    { pct: 7.5, label: "Semifinal (4to puesto asegurado)" },
    { pct: 10.0, label: "3er Puesto" },
    { pct: 12.5, label: "Final (Subcampeón asegurado)" },
    { pct: 20.0, label: "🏆 Campeón" }
  ];

  const teamsByPct = {};
  TEAMS.forEach(t => {
    const st = KNOCKOUT_STATUS[t.id];
    if (!st) return;
    if (!teamsByPct[st.pct]) teamsByPct[st.pct] = [];
    teamsByPct[st.pct].push(t.id);
  });

  const nextCols = stageColumns.map(({ pct, label }) => {
    const teams = teamsByPct[pct] || [];
    const body = teams.length
      ? teams.map(id => bracketTeamBox(id, adjustedPct)).join("")
      : `<div class="bracket-empty"><i class="fa-solid fa-hourglass-half"></i> Por definir</div>`;
    return `
      <div class="bracket-column">
        <div class="bracket-col-head">
          <h3>${label}</h3>
          <span class="bracket-col-pct">${pct.toFixed(3)}% c/u</span>
        </div>
        ${body}
      </div>
    `;
  }).join(`<div class="bracket-connector"><i class="fa-solid fa-chevron-right"></i></div>`);

  host.innerHTML = r32Col +
    `<div class="bracket-connector"><i class="fa-solid fa-chevron-right"></i></div>` +
    nextCols;

  // Eliminados de grupos: fuera del árbol, generan $0.
  if (elimHost) {
    const eliminados = TEAMS.filter(t => !QUALIFIED_IDS.includes(t.id));
    elimHost.innerHTML = `
      <h4 class="text-muted"><i class="fa-solid fa-circle-xmark"></i> Eliminados en fase de grupos (${eliminados.length} equipos — $0 cada uno)</h4>
      <div class="participant-teams-flex">
        ${eliminados.map(t => {
          const owners = getTeamOwners(t.id);
          const ownersHtml = owners.map(o => {
            const participant = PARTICIPANTS.find(p => p.name === o.owner);
            return renderAvatar(participant, "sm");
          }).join("");
          return `<span class="p-team-badge">${flagIcon(t)} ${t.name} ${ownersHtml}</span>`;
        }).join("")}
      </div>
    `;
  }
}

// ==========================================================================
// VIEW: PARTICIPANTES (solo lectura)
// ==========================================================================

function renderParticipantsPage() {
  const container = document.getElementById("participants-cards-container");
  const prizes = calculateCurrentPrizes();

  if (PARTICIPANTS.length === 0) {
    container.innerHTML = `<div class="no-data"><i class="fa-solid fa-circle-info"></i> No hay participantes cargados (revisa participants.csv).</div>`;
    return;
  }

  container.innerHTML = PARTICIPANTS.map(p => {
    const pp = prizes.perParticipant.find(x => x.name === p.name);

    const teamsHtml = p.teams.map(t => {
      const team = getTeamById(t.teamId);
      const co = getTeamOwners(t.teamId).length > 1;
      const extras = [];
      if (co) {
        const other = getTeamOwners(t.teamId).find(o => o.owner !== p.name);
        extras.push(`<small>Copropiedad ${Math.round(t.share * 100)}% (con ${other ? other.owner : "?"})</small>`);
      }
      if (t.subsidized) extras.push(`<small class="badge-subsidy">Subsidiado</small>`);
      if (t.bonusTeam) extras.push(`<small class="badge-bonus">⚡ Bono +${t.bonusPct}%</small>`);

      return `
        <span class="p-team-badge ${t.bonusTeam ? "bonus-active" : ""}">
          ${flagIcon(team)} ${team.name}
          ${extras.join(" ")}
        </span>
      `;
    }).join("");

    return `
      <div class="participant-card">
        <div class="participant-card-header">
          <div class="with-avatar">
            ${renderAvatar(p, "xl")}
            <h3>${p.name}</h3>
          </div>
        </div>
        <div class="participant-finance">
          <div class="finance-box residue-highlight">
            <span class="lbl">Ganancia Actual</span>
            <span class="val text-gold">${formatCurrency(pp ? pp.total : 0)}</span>
          </div>
        </div>
        <div class="participant-teams-section">
          <h4>Equipos (${p.teams.length}):</h4>
          <div class="participant-teams-flex">
            ${teamsHtml}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadParticipants();
    await loadResults();
  } catch (e) {
    console.error("Error cargando datos iniciales:", e);
  }

  initNavigation();

  // Initial entrance animation
  gsap.from(".site-header", { y: -30, opacity: 0, duration: 0.7, ease: "power3.out" });
  gsap.from(".nav-bar", { y: -10, opacity: 0, duration: 0.5, delay: 0.15, ease: "power2.out" });
  gsap.from(".dash-hero", { y: 20, opacity: 0, duration: 0.8, delay: 0.25, ease: "power3.out" });
  gsap.from(".dash-hero-rooster", { x: 80, opacity: 0, duration: 1, delay: 0.5, ease: "power3.out" });

  requestAnimationFrame(() => initScrollAnimations());

  // -----------------------------------------------------------
  // Hero CTAs navigation
  // -----------------------------------------------------------
  document.querySelectorAll(".dash-hero-actions [data-target]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-target");
      const navLink = document.querySelector(`.nav-link[data-target="${target}"]`);
      if (navLink) navLink.click();
    });
  });

  // -----------------------------------------------------------
  // Matches filters
  // -----------------------------------------------------------
  const phaseFilters = document.getElementById("matches-phase-filters");
  if (phaseFilters) {
    phaseFilters.querySelectorAll(".chip-filter").forEach(chip => {
      chip.addEventListener("click", () => {
        phaseFilters.querySelectorAll(".chip-filter").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        matchFilter = chip.getAttribute("data-filter");
        renderMatchesPage();
      });
    });
  }
});
