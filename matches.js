// ==========================================================================
// CALENDARIO MUNDIAL 2026 — 104 partidos
// FASE DE GRUPOS: kickoff en HORA DE COLOMBIA (-05:00), verificado con El Tiempo.
// ELIMINATORIAS: kickoff en hora local de sede + offset; el navegador convierte
// todo a hora colombiana (America/Bogota) automáticamente vía Intl.
// ==========================================================================

const VENUES = {
  azteca:    "Estadio Azteca · Ciudad de México",
  akron:     "Estadio Akron · Guadalajara",
  bbva:      "Estadio BBVA · Monterrey",
  toronto:   "BMO Field · Toronto",
  sofi:      "SoFi Stadium · Los Ángeles",
  levis:     "Levi's Stadium · San Francisco",
  metlife:   "MetLife Stadium · Nueva York/NJ",
  gillette:  "Gillette Stadium · Boston",
  nrg:       "NRG Stadium · Houston",
  att:       "AT&T Stadium · Dallas",
  lincoln:   "Lincoln Financial Field · Filadelfia",
  mercedes:  "Mercedes-Benz Stadium · Atlanta",
  lumen:     "Lumen Field · Seattle",
  hardrock:  "Hard Rock Stadium · Miami",
  arrowhead: "Arrowhead Stadium · Kansas City",
  bcplace:   "BC Place · Vancouver"
};

const MATCHES = [
  // ===================== FASE DE GRUPOS (hora Colombia) =====================
  // Jornada 1
  { n: 1,  phase: "grupos", group: "A", home: "mexico",       away: "sudafrica",     kickoff: "2026-06-11T14:00:00-05:00", venue: VENUES.azteca },
  { n: 2,  phase: "grupos", group: "A", home: "corea_sur",    away: "chequia",       kickoff: "2026-06-11T21:00:00-05:00", venue: VENUES.akron },
  { n: 3,  phase: "grupos", group: "B", home: "canada",       away: "bosnia",        kickoff: "2026-06-12T14:00:00-05:00", venue: VENUES.toronto },
  { n: 4,  phase: "grupos", group: "D", home: "usa",          away: "paraguay",      kickoff: "2026-06-12T20:00:00-05:00", venue: VENUES.sofi },
  { n: 5,  phase: "grupos", group: "B", home: "qatar",        away: "suiza",         kickoff: "2026-06-13T14:00:00-05:00", venue: VENUES.levis },
  { n: 6,  phase: "grupos", group: "C", home: "brasil",       away: "marruecos",     kickoff: "2026-06-13T17:00:00-05:00", venue: VENUES.metlife },
  { n: 7,  phase: "grupos", group: "C", home: "haiti",        away: "escocia",       kickoff: "2026-06-13T20:00:00-05:00", venue: VENUES.gillette },
  { n: 8,  phase: "grupos", group: "D", home: "australia",    away: "turquia",       kickoff: "2026-06-13T23:00:00-05:00", venue: VENUES.bcplace },
  { n: 9,  phase: "grupos", group: "E", home: "alemania",     away: "curazao",       kickoff: "2026-06-14T12:00:00-05:00", venue: VENUES.nrg },
  { n: 10, phase: "grupos", group: "F", home: "paises_bajos", away: "japon",         kickoff: "2026-06-14T15:00:00-05:00", venue: VENUES.att },
  { n: 11, phase: "grupos", group: "E", home: "costa_marfil", away: "ecuador",       kickoff: "2026-06-14T18:00:00-05:00", venue: VENUES.lincoln },
  { n: 12, phase: "grupos", group: "F", home: "suecia",       away: "tunez",         kickoff: "2026-06-14T21:00:00-05:00", venue: VENUES.bbva },
  { n: 13, phase: "grupos", group: "H", home: "espana",       away: "cabo_verde",    kickoff: "2026-06-15T11:00:00-05:00", venue: VENUES.mercedes },
  { n: 14, phase: "grupos", group: "G", home: "belgica",      away: "egipto",        kickoff: "2026-06-15T14:00:00-05:00", venue: VENUES.lumen },
  { n: 15, phase: "grupos", group: "H", home: "arabia_saudita", away: "uruguay",     kickoff: "2026-06-15T17:00:00-05:00", venue: VENUES.hardrock },
  { n: 16, phase: "grupos", group: "G", home: "iran",         away: "nueva_zelanda", kickoff: "2026-06-15T20:00:00-05:00", venue: VENUES.sofi },
  { n: 17, phase: "grupos", group: "I", home: "francia",      away: "senegal",       kickoff: "2026-06-16T14:00:00-05:00", venue: VENUES.metlife },
  { n: 18, phase: "grupos", group: "I", home: "irak",         away: "noruega",       kickoff: "2026-06-16T17:00:00-05:00", venue: VENUES.gillette },
  { n: 19, phase: "grupos", group: "J", home: "argentina",    away: "argelia",       kickoff: "2026-06-16T20:00:00-05:00", venue: VENUES.arrowhead },
  { n: 20, phase: "grupos", group: "J", home: "austria",      away: "jordania",      kickoff: "2026-06-16T23:00:00-05:00", venue: VENUES.levis },
  { n: 21, phase: "grupos", group: "K", home: "portugal",     away: "rd_congo",      kickoff: "2026-06-17T12:00:00-05:00", venue: VENUES.nrg },
  { n: 22, phase: "grupos", group: "L", home: "inglaterra",   away: "croacia",       kickoff: "2026-06-17T15:00:00-05:00", venue: VENUES.att },
  { n: 23, phase: "grupos", group: "L", home: "ghana",        away: "panama",        kickoff: "2026-06-17T18:00:00-05:00", venue: VENUES.toronto },
  { n: 24, phase: "grupos", group: "K", home: "uzbekistan",   away: "colombia",      kickoff: "2026-06-17T21:00:00-05:00", venue: VENUES.azteca },
  // Jornada 2
  { n: 25, phase: "grupos", group: "A", home: "chequia",      away: "sudafrica",     kickoff: "2026-06-18T11:00:00-05:00", venue: VENUES.mercedes },
  { n: 26, phase: "grupos", group: "B", home: "suiza",        away: "bosnia",        kickoff: "2026-06-18T14:00:00-05:00", venue: VENUES.sofi },
  { n: 27, phase: "grupos", group: "B", home: "canada",       away: "qatar",         kickoff: "2026-06-18T17:00:00-05:00", venue: VENUES.bcplace },
  { n: 28, phase: "grupos", group: "A", home: "mexico",       away: "corea_sur",     kickoff: "2026-06-18T20:00:00-05:00", venue: VENUES.akron },
  { n: 29, phase: "grupos", group: "D", home: "usa",          away: "australia",     kickoff: "2026-06-19T14:00:00-05:00", venue: VENUES.lumen },
  { n: 30, phase: "grupos", group: "C", home: "escocia",      away: "marruecos",     kickoff: "2026-06-19T17:00:00-05:00", venue: VENUES.gillette },
  { n: 31, phase: "grupos", group: "C", home: "brasil",       away: "haiti",         kickoff: "2026-06-19T20:00:00-05:00", venue: VENUES.lincoln },
  { n: 32, phase: "grupos", group: "D", home: "turquia",      away: "paraguay",      kickoff: "2026-06-19T23:00:00-05:00", venue: VENUES.levis },
  { n: 33, phase: "grupos", group: "F", home: "paises_bajos", away: "suecia",        kickoff: "2026-06-20T14:00:00-05:00", venue: VENUES.nrg },
  { n: 34, phase: "grupos", group: "E", home: "alemania",     away: "costa_marfil",  kickoff: "2026-06-20T15:00:00-05:00", venue: VENUES.toronto },
  { n: 35, phase: "grupos", group: "E", home: "ecuador",      away: "curazao",       kickoff: "2026-06-20T19:00:00-05:00", venue: VENUES.arrowhead },
  { n: 36, phase: "grupos", group: "F", home: "tunez",        away: "japon",         kickoff: "2026-06-20T23:00:00-05:00", venue: VENUES.bbva },
  { n: 37, phase: "grupos", group: "H", home: "espana",       away: "arabia_saudita", kickoff: "2026-06-21T11:00:00-05:00", venue: VENUES.mercedes },
  { n: 38, phase: "grupos", group: "G", home: "belgica",      away: "iran",          kickoff: "2026-06-21T14:00:00-05:00", venue: VENUES.sofi },
  { n: 39, phase: "grupos", group: "H", home: "uruguay",      away: "cabo_verde",    kickoff: "2026-06-21T17:00:00-05:00", venue: VENUES.hardrock },
  { n: 40, phase: "grupos", group: "G", home: "nueva_zelanda", away: "egipto",       kickoff: "2026-06-21T20:00:00-05:00", venue: VENUES.bcplace },
  { n: 41, phase: "grupos", group: "J", home: "argentina",    away: "austria",       kickoff: "2026-06-22T12:00:00-05:00", venue: VENUES.att },
  { n: 42, phase: "grupos", group: "I", home: "francia",      away: "irak",          kickoff: "2026-06-22T16:00:00-05:00", venue: VENUES.lincoln },
  { n: 43, phase: "grupos", group: "I", home: "noruega",      away: "senegal",       kickoff: "2026-06-22T19:00:00-05:00", venue: VENUES.metlife },
  { n: 44, phase: "grupos", group: "J", home: "jordania",     away: "argelia",       kickoff: "2026-06-22T22:00:00-05:00", venue: VENUES.levis },
  { n: 45, phase: "grupos", group: "K", home: "portugal",     away: "uzbekistan",    kickoff: "2026-06-23T12:00:00-05:00", venue: VENUES.nrg },
  { n: 46, phase: "grupos", group: "L", home: "inglaterra",   away: "ghana",         kickoff: "2026-06-23T15:00:00-05:00", venue: VENUES.gillette },
  { n: 47, phase: "grupos", group: "L", home: "panama",       away: "croacia",       kickoff: "2026-06-23T18:00:00-05:00", venue: VENUES.toronto },
  { n: 48, phase: "grupos", group: "K", home: "colombia",     away: "rd_congo",      kickoff: "2026-06-23T21:00:00-05:00", venue: VENUES.akron },
  // Jornada 3
  { n: 49, phase: "grupos", group: "B", home: "suiza",        away: "canada",        kickoff: "2026-06-24T14:00:00-05:00", venue: VENUES.bcplace },
  { n: 50, phase: "grupos", group: "B", home: "bosnia",       away: "qatar",         kickoff: "2026-06-24T14:00:00-05:00", venue: VENUES.lumen },
  { n: 51, phase: "grupos", group: "C", home: "escocia",      away: "brasil",        kickoff: "2026-06-24T17:00:00-05:00", venue: VENUES.hardrock },
  { n: 52, phase: "grupos", group: "C", home: "marruecos",    away: "haiti",         kickoff: "2026-06-24T17:00:00-05:00", venue: VENUES.mercedes },
  { n: 53, phase: "grupos", group: "A", home: "chequia",      away: "mexico",        kickoff: "2026-06-24T20:00:00-05:00", venue: VENUES.azteca },
  { n: 54, phase: "grupos", group: "A", home: "sudafrica",    away: "corea_sur",     kickoff: "2026-06-24T20:00:00-05:00", venue: VENUES.bbva },
  { n: 55, phase: "grupos", group: "E", home: "ecuador",      away: "alemania",      kickoff: "2026-06-25T15:00:00-05:00", venue: VENUES.metlife },
  { n: 56, phase: "grupos", group: "E", home: "curazao",      away: "costa_marfil",  kickoff: "2026-06-25T15:00:00-05:00", venue: VENUES.lincoln },
  { n: 57, phase: "grupos", group: "F", home: "japon",        away: "suecia",        kickoff: "2026-06-25T18:00:00-05:00", venue: VENUES.att },
  { n: 58, phase: "grupos", group: "F", home: "tunez",        away: "paises_bajos",  kickoff: "2026-06-25T18:00:00-05:00", venue: VENUES.arrowhead },
  { n: 59, phase: "grupos", group: "D", home: "turquia",      away: "usa",           kickoff: "2026-06-25T21:00:00-05:00", venue: VENUES.sofi },
  { n: 60, phase: "grupos", group: "D", home: "paraguay",     away: "australia",     kickoff: "2026-06-25T21:00:00-05:00", venue: VENUES.levis },
  { n: 61, phase: "grupos", group: "I", home: "noruega",      away: "francia",       kickoff: "2026-06-26T14:00:00-05:00", venue: VENUES.gillette },
  { n: 62, phase: "grupos", group: "I", home: "senegal",      away: "irak",          kickoff: "2026-06-26T14:00:00-05:00", venue: VENUES.toronto },
  { n: 63, phase: "grupos", group: "H", home: "cabo_verde",   away: "arabia_saudita", kickoff: "2026-06-26T19:00:00-05:00", venue: VENUES.nrg },
  { n: 64, phase: "grupos", group: "H", home: "uruguay",      away: "espana",        kickoff: "2026-06-26T19:00:00-05:00", venue: VENUES.akron },
  { n: 65, phase: "grupos", group: "G", home: "egipto",       away: "iran",          kickoff: "2026-06-26T22:00:00-05:00", venue: VENUES.lumen },
  { n: 66, phase: "grupos", group: "G", home: "nueva_zelanda", away: "belgica",      kickoff: "2026-06-26T22:00:00-05:00", venue: VENUES.bcplace },
  { n: 67, phase: "grupos", group: "L", home: "panama",       away: "inglaterra",    kickoff: "2026-06-27T16:00:00-05:00", venue: VENUES.metlife },
  { n: 68, phase: "grupos", group: "L", home: "croacia",      away: "ghana",         kickoff: "2026-06-27T16:00:00-05:00", venue: VENUES.lincoln },
  { n: 69, phase: "grupos", group: "K", home: "colombia",     away: "portugal",      kickoff: "2026-06-27T18:30:00-05:00", venue: VENUES.hardrock },
  { n: 70, phase: "grupos", group: "K", home: "rd_congo",     away: "uzbekistan",    kickoff: "2026-06-27T18:30:00-05:00", venue: VENUES.mercedes },
  { n: 71, phase: "grupos", group: "J", home: "argelia",      away: "austria",       kickoff: "2026-06-27T21:00:00-05:00", venue: VENUES.arrowhead },
  { n: 72, phase: "grupos", group: "J", home: "jordania",     away: "argentina",     kickoff: "2026-06-27T21:00:00-05:00", venue: VENUES.att },

  // ===================== RONDA DE 32 (hora local de sede + offset) =====================
  { n: 73, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-28T12:00:00-07:00", venue: VENUES.sofi },
  { n: 74, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-29T16:30:00-04:00", venue: VENUES.gillette },
  { n: 75, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-29T19:00:00-06:00", venue: VENUES.bbva },
  { n: 76, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-29T12:00:00-05:00", venue: VENUES.nrg },
  { n: 77, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-30T17:00:00-04:00", venue: VENUES.metlife },
  { n: 78, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-30T12:00:00-05:00", venue: VENUES.att },
  { n: 79, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-06-30T19:00:00-06:00", venue: VENUES.azteca },
  { n: 80, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-01T12:00:00-04:00", venue: VENUES.mercedes },
  { n: 81, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-01T17:00:00-07:00", venue: VENUES.levis },
  { n: 82, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-01T13:00:00-07:00", venue: VENUES.lumen },
  { n: 83, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-02T19:00:00-04:00", venue: VENUES.toronto },
  { n: 84, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-02T12:00:00-07:00", venue: VENUES.sofi },
  { n: 85, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-02T20:00:00-07:00", venue: VENUES.bcplace },
  { n: 86, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-03T18:00:00-04:00", venue: VENUES.hardrock },
  { n: 87, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-03T20:30:00-05:00", venue: VENUES.arrowhead },
  { n: 88, phase: "r32", label: "Ronda de 32", home: null, away: null, kickoff: "2026-07-03T13:00:00-05:00", venue: VENUES.att },

  // ===================== OCTAVOS =====================
  { n: 89, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-04T17:00:00-04:00", venue: VENUES.lincoln },
  { n: 90, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-04T12:00:00-05:00", venue: VENUES.nrg },
  { n: 91, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-05T16:00:00-04:00", venue: VENUES.metlife },
  { n: 92, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-05T18:00:00-06:00", venue: VENUES.azteca },
  { n: 93, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-06T14:00:00-05:00", venue: VENUES.att },
  { n: 94, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-06T17:00:00-07:00", venue: VENUES.lumen },
  { n: 95, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-07T12:00:00-04:00", venue: VENUES.mercedes },
  { n: 96, phase: "octavos", label: "Octavos de Final", home: null, away: null, kickoff: "2026-07-07T13:00:00-07:00", venue: VENUES.bcplace },

  // ===================== CUARTOS =====================
  { n: 97,  phase: "cuartos", label: "Cuartos de Final", home: null, away: null, kickoff: "2026-07-09T16:00:00-04:00", venue: VENUES.gillette },
  { n: 98,  phase: "cuartos", label: "Cuartos de Final", home: null, away: null, kickoff: "2026-07-10T12:00:00-07:00", venue: VENUES.sofi },
  { n: 99,  phase: "cuartos", label: "Cuartos de Final", home: null, away: null, kickoff: "2026-07-11T17:00:00-04:00", venue: VENUES.hardrock },
  { n: 100, phase: "cuartos", label: "Cuartos de Final", home: null, away: null, kickoff: "2026-07-11T20:00:00-05:00", venue: VENUES.arrowhead },

  // ===================== SEMIFINALES =====================
  { n: 101, phase: "semis", label: "Semifinal", home: null, away: null, kickoff: "2026-07-14T14:00:00-05:00", venue: VENUES.att },
  { n: 102, phase: "semis", label: "Semifinal", home: null, away: null, kickoff: "2026-07-15T15:00:00-04:00", venue: VENUES.mercedes },

  // ===================== TERCER PUESTO Y FINAL =====================
  { n: 103, phase: "tercer", label: "Tercer Puesto", home: null, away: null, kickoff: "2026-07-18T17:00:00-04:00", venue: VENUES.hardrock },
  { n: 104, phase: "final",  label: "Gran Final",    home: null, away: null, kickoff: "2026-07-19T15:00:00-04:00", venue: VENUES.metlife }
];

const PHASE_LABELS = {
  grupos:  "Fase de Grupos",
  r32:     "Ronda de 32",
  octavos: "Octavos de Final",
  cuartos: "Cuartos de Final",
  semis:   "Semifinales",
  tercer:  "Tercer Puesto",
  final:   "Gran Final"
};
