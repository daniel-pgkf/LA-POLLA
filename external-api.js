// ==========================================================================
// API COMUNITARIA EN VIVO — worldcup26.ir
// Fuente preferida para resultados y tablas de grupos. Si falla cualquiera
// de los fetch (red, CORS, forma inesperada), se devuelve null y quien
// llama debe usar el respaldo (results.js / cálculo propio).
//
// SEGURIDAD: nunca se usan strings de esta API (nombres, scorers, etc.) en
// el DOM. Solo se usan valores numéricos (scores, mp/w/d/l/pts/gf/ga/gd) y
// los ids numéricos de equipo, traducidos a nuestros slugs vía
// EXTERNAL_TEAM_ID_MAP. Los nombres/banderas siempre vienen de teams.js.
// ==========================================================================

const EXTERNAL_API_BASE = "https://worldcup26.ir";
const EXTERNAL_API_TIMEOUT_MS = 5000;

// Mapeo id numérico (worldcup26.ir) -> slug de teams.js.
// Construido cruzando /get/teams (groups A-L + nombre) con TEAMS/GROUPS de teams.js.
const EXTERNAL_TEAM_ID_MAP = {
  1: "mexico",
  2: "sudafrica",
  3: "corea_sur",
  4: "chequia",
  5: "canada",
  6: "bosnia",
  7: "qatar",
  8: "suiza",
  9: "brasil",
  10: "marruecos",
  11: "haiti",
  12: "escocia",
  13: "usa",
  14: "paraguay",
  15: "australia",
  16: "turquia",
  17: "alemania",
  18: "curazao",
  19: "costa_marfil",
  20: "ecuador",
  21: "paises_bajos",
  22: "japon",
  23: "suecia",
  24: "tunez",
  25: "belgica",
  26: "egipto",
  27: "iran",
  28: "nueva_zelanda",
  29: "espana",
  30: "cabo_verde",
  31: "arabia_saudita",
  32: "uruguay",
  33: "francia",
  34: "senegal",
  35: "irak",
  36: "noruega",
  37: "argentina",
  38: "argelia",
  39: "austria",
  40: "jordania",
  41: "portugal",
  42: "rd_congo",
  43: "uzbekistan",
  44: "colombia",
  45: "inglaterra",
  46: "croacia",
  47: "ghana",
  48: "panama"
};

// fetch con timeout corto, nunca lanza: devuelve null en cualquier error.
async function fetchJsonSafe(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);
  try {
    const res = await fetch(EXTERNAL_API_BASE + path, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Resultados y emparejamientos en vivo. Devuelve un array de entradas
// normalizadas o null si falla. Cada entrada: { n, home?, away?, homeScore?, awayScore? }
// - Partidos de grupos: solo se incluyen si finished === true, con homeScore/awayScore.
// - Eliminatorias (type !== "group"): el "id" del partido en la API coincide con
//   el "n" de matches.js (numeración oficial 1-104). Antes de que el cruce de
//   llaves se resuelva oficialmente, home_team_id/away_team_id vienen en "0"
//   (se descartan). En cuanto la API asigna los equipos del cruce (aunque el
//   partido no se haya jugado), se incluyen home/away ya resueltos a nuestros
//   slugs; homeScore/awayScore solo si finished === true.
async function fetchLiveGames() {
  const data = await fetchJsonSafe("/get/games");
  if (!data || !Array.isArray(data.games)) return null;

  const out = [];

  data.games.forEach(game => {
    const finished = String(game.finished).toUpperCase() === "TRUE";
    const homeScore = Number(game.home_score);
    const awayScore = Number(game.away_score);
    const homeSlug = EXTERNAL_TEAM_ID_MAP[Number(game.home_team_id)];
    const awaySlug = EXTERNAL_TEAM_ID_MAP[Number(game.away_team_id)];

    if (game.type === "group") {
      if (!finished || !Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return;
      if (!homeSlug || !awaySlug) return;

      const match = MATCHES.find(m =>
        m.phase === "grupos" &&
        ((m.home === homeSlug && m.away === awaySlug) ||
         (m.home === awaySlug && m.away === homeSlug))
      );
      if (!match) return;

      const flipped = match.home === awaySlug;
      out.push({
        n: match.n,
        homeScore: flipped ? awayScore : homeScore,
        awayScore: flipped ? homeScore : awayScore
      });
    } else {
      if (!homeSlug || !awaySlug) return;
      const n = Number(game.id);
      if (!Number.isInteger(n)) return;

      out.push({
        n,
        home: homeSlug,
        away: awaySlug,
        homeScore: (finished && Number.isFinite(homeScore)) ? homeScore : null,
        awayScore: (finished && Number.isFinite(awayScore)) ? awayScore : null
      });
    }
  });

  return out;
}

// Tablas de grupo en vivo (ya ordenadas con tiebreakers oficiales por la API).
// Devuelve { A: [{teamId, mp, w, d, l, pts, gf, ga, gd}, ...], B: [...], ... } o null si falla.
async function fetchLiveGroups() {
  const data = await fetchJsonSafe("/get/groups");
  if (!data || !Array.isArray(data.groups)) return null;

  const out = {};
  for (const group of data.groups) {
    if (!group || typeof group.name !== "string" || !Array.isArray(group.teams)) return null;

    const teams = [];
    for (const t of group.teams) {
      const slug = EXTERNAL_TEAM_ID_MAP[Number(t.team_id)];
      if (!slug) return null;

      const mp = Number(t.mp), w = Number(t.w), d = Number(t.d), l = Number(t.l);
      const pts = Number(t.pts), gf = Number(t.gf), ga = Number(t.ga), gd = Number(t.gd);
      if (![mp, w, d, l, pts, gf, ga, gd].every(Number.isFinite)) return null;

      teams.push({ teamId: slug, mp, w, d, l, pts, gf, ga, gd });
    }

    out[group.name] = teams;
  }

  return out;
}
