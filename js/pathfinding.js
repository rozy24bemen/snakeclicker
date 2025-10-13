// pathfinding.js - Algoritmos de pathfinding para la IA de la serpiente

class PathfindingAI {
    constructor() {
        this.currentPath = [];
        this.currentTargetKey = null;
        this.lastDirection = DIRECTIONS.RIGHT;
        this.pathHoldTicks = 0; // suavizado: mantener path algunos ticks aunque surja alternativa
        this.maxHoldTicks = 4;  // configurable
        this.viabilityFailCounts = new Map(); // targetKey -> rechazos consecutivos
        this.stagnationCounter = 0; // ticks sin mejorar distancia a fruta
        this.lastManhattan = null; // distancia anterior
        this.greedyTrigger = 6; // tras N ticks estancados forzar greedy
        this.debugInfo = {}; // exposición debug
    }

    // Punto de entrada
    getNextDirection(snake, fruit, walls, gridSize) {
        const head = snake.body[0];
        const target = fruit.position;
        const targetKey = `${target.x},${target.y}`;

        // Distancia Manhattan actual
        const distNow = Math.abs(head.x - target.x) + Math.abs(head.y - target.y);
        const earlyGame = snake.body.length < 12; // relajar reglas cuando es pequeña
        if (this.lastManhattan == null || distNow < this.lastManhattan) {
            this.stagnationCounter = 0;
        } else {
            this.stagnationCounter++;
        }
        this.lastManhattan = distNow;

        // Sincronizar path cache: eliminar pasos ya alcanzados
        if (this.currentPath.length > 0) {
            // Si la cabeza ya está en el segundo nodo del path (porque no eliminamos el primero tras mover), consumimos el primero.
            if (this.currentPath.length > 1 && MathUtils.positionsEqual(head, this.currentPath[1])) {
                this.currentPath.shift();
            }
            // Asegurar que el primer nodo coincide con la cabeza; si no, buscar y recortar.
            if (this.currentPath.length > 0 && !MathUtils.positionsEqual(head, this.currentPath[0])) {
                const idx = this.currentPath.findIndex(p => MathUtils.positionsEqual(p, head));
                if (idx > 0) this.currentPath = this.currentPath.slice(idx);
                else if (idx === -1) this.currentPath = []; // ya no es representativo
            }
        }

        // 1. Reutilizar path si sigue válido y dentro de ventana de hold (consumiendo el primer nodo que es la cabeza)
        if (this.currentPath.length > 1 && this.currentTargetKey === targetKey) {
            const nextStep = this.currentPath[1];
            if (this.isFree(nextStep, snake, walls, gridSize)) {
                // decrementa hold y avanza
                if (this.pathHoldTicks > 0) this.pathHoldTicks--;
                return this.dirBetween(head, nextStep);
            } else {
                // invalidar
                this.currentPath = [];
                this.pathHoldTicks = 0;
            }
        }

        // 2. Intentar A* y validar que el primer paso no encierre (escape a cola) y que el espacio accesible sea suficiente
        const path = this.findPath(head, target, snake, walls, gridSize);
        if (path && path.length > 1) {
            const firstStep = path[1];
            const failInfo = this.viabilityFailCounts.get(targetKey) || { fails: 0 };
            // Relajaciones progresivas según número de fallos
            // 0: requisitos completos (escape + área)
            // 1: ignorar requisito de área
            // 2+: ignorar área y escape (solo colisión básica)
            let relaxArea = earlyGame || failInfo.fails >= 1;
            let relaxEscape = earlyGame || failInfo.fails >= 2;
            if (this.stepIsViable(firstStep, snake, walls, gridSize, { relaxArea, relaxEscape })) {
                // éxito: reset contador
                this.viabilityFailCounts.delete(targetKey);
                this.currentPath = path;
                this.currentTargetKey = targetKey;
                this.pathHoldTicks = this.maxHoldTicks; // activar suavizado
                const dir = this.dirBetween(head, firstStep);
                this.lastDirection = dir;
                this.publishDebug('A_STAR', { dist: distNow, fails: 0, relaxArea, relaxEscape });
                return dir;
            } else {
                failInfo.fails++;
                this.viabilityFailCounts.set(targetKey, failInfo);
                this.publishDebug('REJECT_FIRST_STEP', { fails: failInfo.fails, relaxArea, relaxEscape, dist: distNow });
            }
        }

        // 3. Fallback: perseguir cola (camino seguro habitual)
        const tail = snake.body[snake.body.length - 1];
        if (!MathUtils.positionsEqual(tail, target)) {
            const tailPath = this.findPath(head, tail, snake, walls, gridSize, true); // permitir usar fruta como libre
            if (tailPath && tailPath.length > 1) {
                const firstStep = tailPath[1];
                if (this.stepIsViable(firstStep, snake, walls, gridSize, { relaxArea: true, relaxEscape: false })) {
                    const dir = this.dirBetween(head, firstStep);
                    this.lastDirection = dir;
                    this.publishDebug('TAIL_CHASE', { dist: distNow });
                    return dir;
                }
            }
        }

        // 4b. Greedy directo si estancado demasiado tiempo (más agresivo early game)
        if (this.stagnationCounter >= (earlyGame ? 2 : this.greedyTrigger)) {
            const gdir = this.greedyDirection(head, target, snake, walls, gridSize);
            if (gdir) {
                this.lastDirection = gdir;
                this.publishDebug('GREEDY', { dist: distNow, stagnation: this.stagnationCounter });
                return gdir;
            }
        }

        // 4. Mantener dirección si sigue segura para reducir jitter
        if (this.directionStillSafe(snake, this.lastDirection, walls, gridSize)) {
            return this.lastDirection;
        }

        // 5. Último recurso: primera dirección segura disponible
        for (const dir of Object.values(DIRECTIONS)) {
            if (this.directionStillSafe(snake, dir, walls, gridSize)) {
                this.lastDirection = dir;
                this.publishDebug('ANY_SAFE', {});
                return dir;
            }
        }
        this.publishDebug('LAST_RESORT', {});
        return this.lastDirection; // nada mejor
    }

    greedyDirection(head, target, snake, walls, gridSize) {
        const prio = [];
        if (target.x > head.x) prio.push(DIRECTIONS.RIGHT); else if (target.x < head.x) prio.push(DIRECTIONS.LEFT);
        if (target.y > head.y) prio.push(DIRECTIONS.DOWN); else if (target.y < head.y) prio.push(DIRECTIONS.UP);
        for (const d of Object.values(DIRECTIONS)) if (!prio.includes(d)) prio.push(d);
        for (const d of prio) if (this.directionStillSafe(snake, d, walls, gridSize)) return d;
        return null;
    }

    findPath(start, goal, snake, walls, gridSize, ignoreFruit = false) {
        const getKey = p => `${p.x},${p.y}`;
        const open = [{ p: start, g: 0, f: this.h(start, goal), parent: null }];
        const best = new Map([[getKey(start), 0]]);
        const obstacles = this.obstacleSet(snake, walls, gridSize, goal, ignoreFruit);
        while (open.length) {
            open.sort((a, b) => a.f - b.f);
            const cur = open.shift();
            if (MathUtils.positionsEqual(cur.p, goal)) {
                return this.reconstruct(cur);
            }
            for (const dir of this.neighborOrder(cur.p, goal)) {
                const np = { x: cur.p.x + dir.x, y: cur.p.y + dir.y };
                const k = getKey(np);
                if (!MathUtils.isValidPosition(np, gridSize) || obstacles.has(k)) continue;
                const g = cur.g + 1;
                if (g >= (best.get(k) ?? Infinity)) continue;
                best.set(k, g);
                open.push({ p: np, g, f: g + this.h(np, goal), parent: cur });
            }
        }
        return null;
    }

    obstacleSet(snake, walls, gridSize, goal, ignoreFruit) {
        const set = new Set();
        // Excluir cola (se moverá) -> hasta length - 1
        for (let i = 1; i < snake.body.length - 1; i++) {
            const s = snake.body[i];
            set.add(`${s.x},${s.y}`);
        }
        walls.forEach(w => { if (w.type !== WALL_TYPES.PORTAL) w.positions.forEach(pos => set.add(`${pos.x},${pos.y}`)); });
        if (ignoreFruit) set.delete(`${goal.x},${goal.y}`);
        return set;
    }

    // Verifica que mover la cabeza a 'cell' permite un escape hacia la cola y que el área accesible no es demasiado pequeña
    stepIsViable(cell, snake, walls, gridSize, options = {}) {
        const { relaxArea = false, relaxEscape = false } = options;
        if (!this.isFree(cell, snake, walls, gridSize)) return false;
        const tail = snake.body[snake.body.length - 1];
        if (!relaxEscape && !this.escapeToTailPossible(cell, tail, snake, walls, gridSize)) return false;
        if (!relaxArea) {
            const area = this.accessibleArea(cell, snake, walls, gridSize);
            const minRequired = Math.max(8, Math.floor(snake.body.length * 0.7));
            if (area < minRequired) return false;
        }
        return true;
    }

    escapeToTailPossible(startCell, tailCell, snake, walls, gridSize) {
        const getKey = p => `${p.x},${p.y}`;
        const obstacles = new Set();
        // Cuerpo excepto cola (se mueve)
        for (let i = 1; i < snake.body.length - 1; i++) {
            const b = snake.body[i];
            obstacles.add(getKey(b));
        }
        // Muros
        for (const w of walls) {
            if (w.type !== WALL_TYPES.PORTAL) {
                for (const p of w.positions) obstacles.add(getKey(p));
            }
        }
        const q = [startCell];
        const visited = new Set([getKey(startCell)]);
        while (q.length) {
            const cur = q.shift();
            if (MathUtils.positionsEqual(cur, tailCell)) return true;
            for (const d of Object.values(DIRECTIONS)) {
                const np = { x: cur.x + d.x, y: cur.y + d.y };
                const k = getKey(np);
                if (!MathUtils.isValidPosition(np, gridSize) || visited.has(k) || obstacles.has(k)) continue;
                visited.add(k); q.push(np);
            }
        }
        return false;
    }

    accessibleArea(startCell, snake, walls, gridSize) {
        const getKey = p => `${p.x},${p.y}`;
        const obstacles = new Set();
        for (let i = 1; i < snake.body.length - 1; i++) obstacles.add(getKey(snake.body[i]));
        for (const w of walls) if (w.type !== WALL_TYPES.PORTAL) for (const p of w.positions) obstacles.add(getKey(p));
        const q = [startCell];
        const visited = new Set([getKey(startCell)]);
        let count = 0;
        const AREA_CAP = 600; // limitar coste
        while (q.length && count < AREA_CAP) {
            const cur = q.shift();
            count++;
            for (const d of Object.values(DIRECTIONS)) {
                const np = { x: cur.x + d.x, y: cur.y + d.y };
                const k = getKey(np);
                if (!MathUtils.isValidPosition(np, gridSize) || visited.has(k) || obstacles.has(k)) continue;
                visited.add(k); q.push(np);
            }
        }
        return count;
    }

    h(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

    reconstruct(node) {
        const path = []; let n = node;
        while (n) { path.unshift(n.p); n = n.parent; }
        return path;
    }

    neighborOrder(from, target) {
        const dirs = [];
        const dx = target.x - from.x; const dy = target.y - from.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
            dirs.push(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
            if (dy !== 0) dirs.push(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
        } else {
            dirs.push(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
            if (dx !== 0) dirs.push(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
        }
        for (const d of Object.values(DIRECTIONS)) if (!dirs.includes(d)) dirs.push(d);
        return dirs;
    }

    dirBetween(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx === 1 && dy === 0) return DIRECTIONS.RIGHT;
        if (dx === -1 && dy === 0) return DIRECTIONS.LEFT;
        if (dx === 0 && dy === 1) return DIRECTIONS.DOWN;
        if (dx === 0 && dy === -1) return DIRECTIONS.UP;
        return this.lastDirection;
    }

    isFree(cell, snake, walls, gridSize) {
        if (!MathUtils.isValidPosition(cell, gridSize)) return false;
        for (let i = 0; i < snake.body.length - 1; i++) { // dejar cola
            if (MathUtils.positionsEqual(cell, snake.body[i])) return false;
        }
        for (const w of walls) {
            if (w.type !== WALL_TYPES.PORTAL) {
                for (const p of w.positions) if (MathUtils.positionsEqual(cell, p)) return false;
            }
        }
        return true;
    }

    directionStillSafe(snake, dir, walls, gridSize) {
        if (!dir) return false;
        const head = snake.body[0];
        const nxt = { x: head.x + dir.x, y: head.y + dir.y };
        return this.isFree(nxt, snake, walls, gridSize);
    }

    reset() {
        this.currentPath = [];
        this.currentTargetKey = null;
        this.pathHoldTicks = 0;
        this.viabilityFailCounts.clear();
        this.stagnationCounter = 0;
        this.lastManhattan = null;
    }

    publishDebug(mode, extra) {
        this.debugInfo = { mode, ...extra };
        if (typeof window !== 'undefined') window.DEBUG_AI = this.debugInfo;
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PathfindingAI };
}