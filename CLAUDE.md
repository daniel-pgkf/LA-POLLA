# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## La Polla Más Grande del Mundo 2026

Aplicación web (SPA, vanilla JS) que sirve como "companion app" informativa para una polla/apuesta grupal del Mundial 2026. La subasta y el sorteo de subsidios ya ocurrieron: la app muestra, en vivo, partidos, posiciones y premios actuales según la propiedad fija de equipos.

## Comandos

- **Servir la app** (necesario: `fetch("participants.csv")` falla por CORS si se abre como `file://`): `python -m http.server 8001` (configurado en `.claude/launch.json`), luego abrir `http://localhost:8001`.
- **Verificar sintaxis tras editar `app.js`** (o cualquier otro `.js` plano): `node --check app.js`.
- No hay build, linter, ni suite de tests — es JS plano sin dependencias de paquete.

## Stack

- HTML/CSS/JS plano, sin build ni framework.
- Sin `localStorage` ni configuración editable: los datos de propiedad/equipos vienen de `participants.csv` (fijo) y los parámetros económicos de `config.js` (fijo).
- Resultados y tablas de grupo: **preferentemente en vivo** desde `https://worldcup26.ir` (`external-api.js`), con `results.js` + cálculo propio como respaldo si la API falla.
- Librerías vía CDN: GSAP + ScrollTrigger (animaciones), KaTeX (fórmulas en la sección Reglamento), FontAwesome, Google Fonts.
- Caché-busting manual: los `<script src="...js?v=N">` y el CSS llevan querystring `?v=N` en `index.html` — incrementar al editar para forzar recarga en navegadores de los usuarios.

## Estructura de archivos

- `index.html` — toda la SPA: header con stats en vivo, nav, y vistas (`view-*`) controladas por `.view-section.active`.
- `app.js` — toda la lógica: carga de datos, cálculo de tablas/premios, render de cada vista.
- `teams.js` — array `TEAMS` (48 selecciones: id, name, rank FIFA, flag, color, group) y `GROUPS` (grupo → ids de equipo).
- `matches.js` — array `MATCHES` (104 partidos con horario en `America/Bogota`), `VENUES` y `PHASE_LABELS`.
- `config.js` — `CONFIG` fijo: `P`, `C`, `N`, `TOTAL_B`, `TOTAL_C`.
- `participants.csv` — propiedad fija de equipos por participante (sin UI de edición). Fotos en `assets/players/` con extensión **`.jpeg`** (no `.jpg`). Hay 18 participantes únicos (`CONFIG.N = 18`). Todos los 48 equipos de `teams.js` tienen al menos un dueño.
- `results.js` — resultados de respaldo (manual) por número de partido; usado solo si la API en vivo falla.
- `external-api.js` — cliente de `worldcup26.ir` (`fetchLiveGames`, `fetchLiveGroups`, `EXTERNAL_TEAM_ID_MAP`), con fetch defensivo (timeout + try/catch).
- `index.css` — design system completo (variables CSS, tema "gallo/trofeo" dorado-oscuro).
- `la-polla-mas-grande-del-mundo_2026.md` — **reglamento fuente de verdad**; toda la lógica de `app.js` debe ser consistente con este documento.
- `assets/` — logo, gallo, trofeo, fuente FWC2026, fondos, y `assets/players/` (fotos de participantes referenciadas desde el CSV).

## Concepto del juego (resumen del reglamento)

- Cada jugador pagó `P` (presupuesto de subasta) + `C` (comisión) — valores fijos en `config.js`.
- **Bolsa B** (`CONFIG.TOTAL_B`) se reparte 100% entre los 32 equipos que pasan de grupos, según tabla de posiciones (Campeón 20%, Subcampeón 12.5%, ... R32 1.037% c/u). Los 16 eliminados en grupos generan $0.
- **Bono de residuo**: cada equipo con `bonus_team=yes` en el CSV tiene un `bonus_pct` ya calculado y fijo, que se activa solo si ese equipo pasa de grupos. Fórmula de ajuste: `p_k' = p_k*(1 - T/100) + Δ_k`.
- **Bolsa C** (`CONFIG.TOTAL_C`) se reparte en partes iguales entre 3 premios especiales + subsidios activos (`V` = subsidiados con `subsidized=yes` que pasan de grupos): `valor_por_parte = C_total / (3 + V)`.
- **Subsidios**: 3 equipos ya sorteados antes de la subasta (marcados `subsidized=yes` en el CSV).
- **3 premios especiales**: Peor equipo de grupos, Mejor 3ro clasificado, Mayor goleada (dueño del perdedor) — calculados en vivo en `computeSpecialPrizes`.

## Datos de entrada (app.js)

- `PARTICIPANTS` / `OWNERSHIP` / `SUBSIDIZED_TEAM_IDS` — cargados de `participants.csv` por `loadParticipants()`. Soporta copropiedad (dos filas para el mismo `team_id` con `share` 0.5/0.5).
- `EFFECTIVE_RESULTS` / `GROUP_STANDINGS` / `QUALIFIED_IDS` / `KNOCKOUT_STATUS` — calculados por `loadResults()`: prioriza `fetchLiveGames()`/`fetchLiveGroups()` (worldcup26.ir), cae a `results.js` + `computeGroupStandings()`/`compute32Qualifiers()`/`computeKnockoutStatus()` si la API falla. Flags `liveGamesOk`/`liveGroupsOk` controlan los indicadores "🟢 Datos en vivo" / "📝 Datos manuales" (`dataSourceIndicator()`).
- **Cruces de eliminatoria (n=73-104)**: `matches.js` trae `home`/`away` en `null` para estos partidos. `fetchLiveGames()` los resuelve automáticamente apenas el bracket queda definido oficialmente (el campo `id` de la API coincide con `n`), incluso antes de jugarse; si la API no responde o aún no tiene ese cruce, se usa el respaldo manual en `results.js` (sección 8.1 del reglamento).

## Vistas y sus funciones de render (`initNavigation`)

- **Dashboard** (`renderDashboard`) — resumen de bolsas, equipos subsidiados, premios especiales, tabla de equipos/dueños y tabla de ganancias actuales por participante.
- **Partidos** (`renderMatchesPage`) — calendario filtrable (próximos/resultados/mis equipos/grupos/eliminatorias), hero del próximo partido con countdown en vivo, dueño(s) de cada equipo y marcador si ya se jugó. El render de cada lado del versus usa `renderMatchSide(teamId, big)`: en tarjetas normales (`big=false`) solo muestra fotos solapadas (`.vs-owner-stack`, avatar `lg`), sin nombres; en el hero (`big=true`) muestra avatar `xl` + nombre completo con chips.
- **Posiciones** (`renderStandingsPage`) — tablas de grupo (con dueños y fila resaltada para los que clasifican) y estado de la fase eliminatoria por equipo (`KNOCKOUT_STATUS`).
- **Premios Actuales** (`renderPrizesPage`) — cálculo en vivo de `calculateCurrentPrizes()`: resumen de bolsas, subsidios activos, premios especiales, ganancia actual por participante, y árbol del torneo (`renderBracketTree`/`bracketTeamBox`, con íconos compactos de subsidio/bono vía `getTeamSpecialFlags`).
- **Participantes** (`renderParticipantsPage`) — cards de solo lectura: foto, equipos, badges de copropiedad/subsidio/bono y ganancia actual.
- **Reglamento** (`renderRulesKatex`) — texto estático con fórmulas KaTeX.

## Convenciones

- Todo el texto de UI está en español.
- **Tamaños de avatar** (`renderAvatar`): `"sm"` (28px) en tablas de posiciones/dashboard; `"lg"` (56px) en tarjetas de partidos, lista de premios y knockout; `"xl"` (76px) en el hero de partidos y cards de participantes. Respetar esta jerarquía al añadir nuevas vistas.
- Los montos se formatean con `formatCurrency()` (COP, sin decimales).
- Las notificaciones usan `showToast()`, no `alert()`.
- Las animaciones de scroll se reinician en cada cambio de vista vía `initScrollAnimations()`.
- **Seguridad de datos externos**: nunca usar strings de `worldcup26.ir` (nombres, etc.) en el DOM. Solo se usan ids numéricos (vía `EXTERNAL_TEAM_ID_MAP`) y valores numéricos (scores, mp/w/d/l/pts/gf/ga/gd); nombres/banderas siempre vienen de `teams.js`.
- Al editar `app.js`, `teams.js`, `matches.js`, `config.js`, `results.js`, `external-api.js` o `index.css`, subir el número de versión `?v=N` en `index.html`.
- `loadParticipants()` usa `fetch("participants.csv", { cache: "no-store" })` para evitar que el navegador cachee el CSV (cambios en el CSV no se veían al refrescar).
- `loadResults()` y el `DOMContentLoaded` envuelven la carga de datos en `try/catch`: si algo falla, el header (`updateStatsHeader`) y la navegación igual se inicializan con valores por defecto.
