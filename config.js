// ==========================================================================
// CONFIGURACIÓN FIJA DE LA POLLA — valores acordados antes de la subasta.
// ==========================================================================

const CONFIG = {
  P: 50000,   // Presupuesto de subasta por jugador
  C: 10000,   // Comisión por jugador
  N: 18       // Número de jugadores/participantes
};

// Bolsa B = suma de lo realmente pujado en la subasta (histórico, ya cerrado).
// TODO: reemplazar por el total real una vez se tenga el registro de la subasta.
CONFIG.TOTAL_B = CONFIG.P * CONFIG.N;

// Bolsa C = comisión total recaudada, para subsidios y premios especiales.
CONFIG.TOTAL_C = CONFIG.C * CONFIG.N;
