// ==========================================================================
// RESULTADOS — respaldo manual (solo se usa si la API en vivo no responde).
// Clave = número de partido (n) en matches.js.
//
// Fase de grupos: { homeScore, awayScore } (null/null = no jugado).
// Eliminatorias: además de los scores, "home"/"away" se llenan a mano con
// los slugs de teams.js cuando se conocen los cruces (penales opcionales
// vía { penalties: { home, away } }).
//
// Nota: si la API en vivo (worldcup26.ir) responde, ella resuelve los cruces
// de eliminatorias automáticamente en cuanto el bracket queda definido
// (incluso antes de jugarse), usando su campo "id" como "n". Los "home"/"away"
// de aquí solo se usan si la API no responde o todavía no tiene el cruce.
// ==========================================================================

const RESULTS = {
  1: { homeScore: 2, awayScore: 0 }, // México 2-0 Sudáfrica
  2: { homeScore: 2, awayScore: 1 }, // Corea del Sur 2-1 Chequia
  3: { homeScore: 1, awayScore: 1 }, // Canadá 1-1 Bosnia
  4: { homeScore: 4, awayScore: 1 }  // USA 4-1 Paraguay
};
