# Reglamento — La Polla Mas Grande del Mundo 2026

---

## 1. Estructura general

Antes del torneo, cada jugador participó en una subasta para adquirir equipos del Mundial. El desempeño deportivo de esos equipos determina cuánto dinero recupera cada jugador al final. **La subasta y el sorteo de subsidios ya se realizaron**; la app ahora es un panel informativo en vivo (ver `config.js` y `participants.csv` para los valores y asignaciones reales).

**Parámetros base (ejemplo):**

| Parámetro | Valor |
|---|---|
| Presupuesto de subasta por jugador | P = $50.000 |
| Cuota de comisión por jugador | C = $10.000 |
| Total pagado por participante | $60.000 |
| Número de jugadores | n |
| Jackpot máximo teórico | J = P × n |

---

## 2. Bolsas

### 2.1 Bolsa principal (B)

Compuesta únicamente por los presupuestos de subasta.

$$B = P \times n$$

Se distribuye según el desempeño deportivo de cada equipo, conforme a la tabla de porcentajes de la sección 4.

### 2.2 Bolsa de comisiones (C_total)

Compuesta por las cuotas de comisión.

$$C_{total} = C \times n$$

Se destina exclusivamente a premios especiales y subsidios. Su distribución se detalla en la sección 6.

---

## 3. Subasta (histórico)

- Cada jugador dispuso de un presupuesto máximo de **P pesos** para pujar por equipos.
- Un jugador podía adquirir múltiples equipos (incluso en copropiedad 50/50 con otro jugador).
- El precio final pagado por cada equipo en subasta integra la bolsa B.
- El dinero no gastado al final de la subasta fue el **residuo** de cada jugador ($R_i$), usado para calcular el bono de la sección 5.
- La propiedad final de cada equipo (dueño(s), % de copropiedad, equipo subsidiado y equipo elegido para el bono de residuo) queda fija en `participants.csv` y no se modifica desde la app.

---

## 4. Distribución de la bolsa principal (B)

Los equipos que **no superan la fase de grupos** (los 16 eliminados) generan **ingreso cero**. Su dueño pierde el monto pagado en subasta.

Los **32 equipos que superan la fase de grupos** reparten la bolsa B según la posición final:

| Posición | Equipos | % por equipo | % total del nivel |
|---|---|---|---|
| Eliminado en R32 (16avos) | 16 | 1.037% | 16.6% |
| Eliminado en octavos | 8 | 2.074% | 16.6% |
| Eliminado en cuartos | 4 | 4.148% | 16.6% |
| 4to puesto | 1 | 7.5% | 7.5% |
| 3er puesto | 1 | 10.0% | 10.0% |
| Subcampeón | 1 | 12.5% | 12.5% |
| Campeón | 1 | 20.0% | 20.0% |

**Suma total: 100% de B.**

El ingreso bruto de un equipo en posición $k$ es:

$$\text{Ingreso}_k = p_k \times B$$

La ganancia neta de su dueño es:

$$\text{Ganancia neta} = \text{Ingreso}_k - \text{Precio pagado en subasta}$$

---

## 5. Propuesta contra residuo (bonificación por ahorro)

### 5.1 Motivación

Si los jugadores no gastan todo su presupuesto P, la bolsa B es menor al Jackpot teórico J, haciendo los porcentajes de la tabla impredecibles en valor absoluto. Este mecanismo redistribuye los residuos como bonos de porcentaje extra.

### 5.2 Definiciones

- $R_i$ = dinero sobrante del jugador $i$ al final de la subasta.
- $R_{max} = \max_i(R_i)$
- $t_i = R_i / R_{max}$ → proporción relativa del residuo del jugador $i$.
- $B_i = t_i \times 3\%$ → bono de porcentaje del jugador $i$, con $B_{max} = 3\%$.

### 5.3 Aplicación del bono

Cada jugador asigna su bono $B_i$ a **uno** de sus equipos antes de que inicie el torneo.

**Condición de activación:** el bono solo se aplica si el equipo elegido **supera la fase de grupos**. Si el equipo es eliminado en grupos, el bono se pierde.

### 5.4 Redistribución de porcentajes

Sean:

- $p_k$ = porcentaje base de la posición $k$ (tabla sección 4).
- $\Delta_k$ = suma de bonos activados asignados a equipos que terminaron en posición $k$.
- $T = \sum_{k} \Delta_k$ = total de bonos activados.

El porcentaje ajustado de cada posición es:

$$p_k' = p_k\left(1 - \frac{T}{100}\right) + \Delta_k$$

**Propiedades:**
- La reducción $p_k \cdot (T/100)$ es proporcional al peso base: posiciones de mayor % absorben mayor recorte.
- La suma se conserva: $\sum_k p_k' = 100\%$.

### 5.5 Ejemplo

3 jugadores, J = $500, residuos: $R_s = 30$, $R_j = 15$, $R_d = 5$.

| Jugador | Residuo | $t_i$ | Bono $B_i$ | Equipo |
|---|---|---|---|---|
| s | 30 | 1.00 | 3.0% | Campeón |
| j | 15 | 0.50 | 1.5% | Subcampeón |
| d | 5 | 0.17 | 0.5% | Un 8vo |

$T = 5\%$. Porcentajes ajustados:

| Posición | $p_k$ base | $\Delta_k$ | $p_k'$ |
|---|---|---|---|
| Campeón | 20.0% | 3.0% | 22.0% |
| Subcampeón | 12.5% | 1.5% | 13.375% |
| 8vo (con bono) | 2.074% | 0.5% | 2.470% |
| 16vo (sin bono) | 1.037% | 0% | 0.985% |

---

## 6. Bolsa de comisiones: subsidios y premios

### 6.1 Distribución

La bolsa $C_{total}$ se divide en partes iguales entre los 3 premios especiales y los equipos subsidiados que superaron la fase de grupos.

Sea $V$ = número de equipos subsidiados que superaron grupos ($0 \leq V \leq 3$):

$$\text{Partes totales} = 3 + V$$

$$\text{Valor por parte} = \frac{C_{total}}{3 + V}$$

Cada premio recibe una parte. Cada subsidio válido recibe una parte.

Si $V = 0$: los 3 premios se reparten $C_{total}$ en tercios.

### 6.2 Sistema de subsidios (histórico)

**Selección:** se eligieron 3 equipos mediante ruleta ponderada, con probabilidad inversamente proporcional al ranking FIFA. A menor ranking (equipo más débil), mayor probabilidad.

**Fórmula de pesos (cuadrática):**

Sea $\text{pos}_i$ = posición en el ranking FIFA del equipo $i$ entre los 48 clasificados (1 = mejor, 48 = peor).

$$w_i = \text{pos}_i^{\,2}$$

$$p_i = \frac{\text{pos}_i^{\,2}}{\displaystyle\sum_{j=1}^{48} \text{pos}_j^{\,2}} = \frac{\text{pos}_i^{\,2}}{38{,}024}$$

El cuadrado amplifica la ventaja de los equipos débiles: el #48 tiene ≈6% de probabilidad mientras el #1 apenas ≈0.003%. Los 10 peores acumulan ≈50% del total.

**Método de sorteo (ya realizado):**
1. Se publicó la tabla con ranking FIFA y probabilidades de los 48 equipos.
2. Tres giros en vivo con ruleta digital ponderada.
3. Sin reemplazo: si salía un equipo ya seleccionado, se repetía el giro.
4. Los 3 equipos subsidiados se anunciaron **antes de la subasta** para influir en las pujas. Quedan marcados con `subsidized = yes` en `participants.csv`.

**Regla de activación:** un equipo subsidiado recibe su parte de $C_{total}$ **solo si supera la fase de grupos**. Si no la supera, su parte se redistribuye proporcionalmente entre los demás ítems válidos (premios + subsidios activos) en ese momento.

---

## 7. Premios especiales

Cada premio recibe una parte igual de $C_{total}$ según la fórmula de la sección 6.1. Un mismo jugador puede ganar más de un premio.

### Premio 1 — Peor equipo

**Gana el dueño del equipo con el peor registro en la fase de grupos**, entre los 16 eliminados.

Criterios de desempate (en orden):
1. Menos puntos.
2. Peor diferencia de goles.
3. Más goles en contra.
4. Peor ranking FIFA.

### Premio 2 — Mejor tercero clasificado

**Gana el dueño del mejor equipo entre los 8 terceros que clasifican al R32**, usando los mismos criterios de desempate que usa FIFA para rankear terceros:
1. Puntos.
2. Diferencia de goles.
3. Goles a favor.
4. Fair play (menos tarjetas).
5. Ranking FIFA.

### Premio 3 — Mayor goleada (GMH)

**Gana el dueño del equipo que PERDIÓ el partido con mayor diferencia de goles del torneo.**

Aplica en cualquier fase (grupos, R32, octavos, cuartos, semifinales, final).

Criterio de desempate: si dos partidos tienen la misma diferencia de goles, gana el que RECIBIÓ más goles totales en ese partido.

---

## 8. Fuente de datos y desempates (app en vivo)

La app obtiene resultados y tablas de grupo preferentemente de la API en vivo `worldcup26.ir` (ya incluye los desempates oficiales de FIFA). Si esa API no responde, se usa como respaldo:

- `results.js`: marcadores cargados a mano.
- Cálculo propio de tablas de grupo, con un criterio **simplificado** de desempate: Puntos → Diferencia de goles → Goles a favor. No replica al 100% los criterios oficiales de FIFA (fair play, enfrentamiento directo, sorteo), que solo se aplican en casos extremos. Esto solo afecta a la vista "Posiciones" cuando la API externa no está disponible.

Cada sección de la app indica si está mostrando "🟢 Datos en vivo" o "📝 Datos manuales" según la fuente usada en ese momento.

### 8.1 Cruces de la fase eliminatoria (R32 en adelante)

`matches.js` no trae fijos los equipos de los partidos de eliminatoria (n=73 a 104), ya que dependen de los resultados de grupos y de cada ronda previa. La app los resuelve así:

1. **Preferido**: la API en vivo asigna los equipos de cada cruce (campo `id` = `n` de `matches.js`) en cuanto el bracket queda definido oficialmente — incluso antes de jugarse ese partido.
2. **Respaldo manual**: si la API no responde o aún no tiene ese cruce, se usa `results.js`, donde se pueden agregar a mano los slugs `home`/`away` de cada partido de eliminatoria a medida que se conocen los cruces oficiales.

Mientras un cruce no esté resuelto (ni por la API ni a mano), ese partido se muestra como "por definir" y los equipos involucrados permanecen en su última fase confirmada (ej. "R32" hasta que se sepa contra quién juegan octavos).

---

## 9. Resumen de flujo de dinero

```
Cada jugador paga: P + C
                        │
          ┌─────────────┴─────────────┐
    Bolsa B = P × n           Bolsa C = C × n
    (desempeño deportivo)     (premios y subsidios)
          │                           │
  Distribuida según        Dividida en partes iguales:
  tabla de posiciones      3 premios + V subsidios válidos
  + bonos por residuo
```

---

*Documento de reglas para el Mundial 2026. Los valores de ejemplo son ilustrativos; los parámetros reales (P, C, n) están fijos en `config.js` y la asignación de equipos en `participants.csv`.*
