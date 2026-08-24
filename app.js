(() => {
  "use strict";

  const COST_ORTHO = 10;
  const COST_DIAG = 15;

  // Orden de vecinos (como en el pizarrón): desde Oeste, sentido horario.
  const DIRS = [
    { dr: 0, dc: -1, cost: COST_ORTHO }, // ←
    { dr: 1, dc: -1, cost: COST_DIAG }, // ↙
    { dr: 1, dc: 0, cost: COST_ORTHO }, // ↓
    { dr: 1, dc: 1, cost: COST_DIAG }, // ↘
    { dr: 0, dc: 1, cost: COST_ORTHO }, // →
    { dr: -1, dc: 1, cost: COST_DIAG }, // ↗
    { dr: -1, dc: 0, cost: COST_ORTHO }, // ↑
    { dr: -1, dc: -1, cost: COST_DIAG }, // ↖
  ];

  // Arrow in child points TOWARD parent.
  // If we came from parent by moving (dr, dc), parent is at (-dr, -dc) relative to child,
  // so the arrow should point in direction (-dr, -dc).
  function arrowTowardParent(drFromParent, dcFromParent) {
    // Child was reached by moving (drFromParent, dcFromParent) from parent.
    // Arrow should point back: opposite direction.
    const key = `${-drFromParent},${-dcFromParent}`;
    const map = {
      "-1,0": "↑",
      "1,0": "↓",
      "0,-1": "←",
      "0,1": "→",
      "-1,-1": "↖",
      "-1,1": "↗",
      "1,-1": "↙",
      "1,1": "↘",
    };
    return map[key] || "·";
  }

  const els = {
    cols: document.getElementById("cols"),
    rows: document.getElementById("rows"),
    grid: document.getElementById("grid"),
    closed: document.getElementById("closed-list"),
    open: document.getElementById("open-list"),
    status: document.getElementById("status"),
    btnResize: document.getElementById("btn-resize"),
    btnRun: document.getElementById("btn-run"),
    btnStep: document.getElementById("btn-step"),
    btnReset: document.getElementById("btn-reset"),
  };

  let cols = 4;
  let rows = 4;
  let mode = "block";
  /** @type {('empty'|'block'|'start'|'end')[][]} */
  let cells = [];
  let start = { r: 0, c: 1 };
  let end = { r: 2, c: 3 };

  /** Snapshot / step state for A* */
  let run = null;

  function key(r, c) {
    return `${r},${c}`;
  }

  function inBounds(r, c) {
    return r >= 0 && r < rows && c >= 0 && c < cols;
  }

  function heuristic(r, c) {
    return (Math.abs(r - end.r) + Math.abs(c - end.c)) * COST_ORTHO;
  }

  function setStatus(msg, type = "") {
    els.status.textContent = msg;
    els.status.className = "status" + (type ? ` ${type}` : "");
  }

  function initGrid(newCols, newRows, preserve = true) {
    const old = cells;
    const oldStart = start;
    const oldEnd = end;
    cols = newCols;
    rows = newRows;
    cells = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        if (preserve && old[r] && old[r][c]) return old[r][c];
        return "empty";
      })
    );

    if (
      preserve &&
      inBounds(oldStart.r, oldStart.c) &&
      cells[oldStart.r][oldStart.c] !== "block"
    ) {
      start = { ...oldStart };
    } else {
      start = { r: 0, c: Math.min(1, cols - 1) };
    }

    if (
      preserve &&
      inBounds(oldEnd.r, oldEnd.c) &&
      !(oldEnd.r === start.r && oldEnd.c === start.c)
    ) {
      end = { ...oldEnd };
    } else {
      end = { r: rows - 1, c: cols - 1 };
      if (end.r === start.r && end.c === start.c) {
        end = { r: rows - 1, c: Math.max(0, cols - 2) };
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cells[r][c] === "start" || cells[r][c] === "end") {
          cells[r][c] = "empty";
        }
      }
    }
    cells[start.r][start.c] = "start";
    cells[end.r][end.c] = "end";

    // Default demo obstacles for 4x4 like the board
    if (!preserve && rows === 4 && cols === 4) {
      cells[0][2] = "block";
      cells[1][2] = "block";
      start = { r: 0, c: 1 };
      end = { r: 2, c: 3 };
      cells[0][1] = "start";
      cells[2][3] = "end";
    }

    run = null;
    renderGrid();
    renderLists([], []);
    setStatus("Definí A, B y obstáculos, luego calculá.");
  }

  function cellSize() {
    const maxDim = Math.max(cols, rows);
    if (maxDim <= 6) return 88;
    if (maxDim <= 10) return 68;
    if (maxDim <= 14) return 52;
    return 42;
  }

  function renderGrid() {
    const size = cellSize();
    els.grid.style.setProperty("--cell-size", `${size}px`);
    els.grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    els.grid.innerHTML = "";

    const nodeMap = run ? run.nodeByPos : null;
    const pathSet = run && run.pathKeys ? run.pathKeys : new Set();
    const closedSet = run ? new Set(run.closedIds) : new Set();
    const openAlive = run
      ? new Set(run.openLog.filter((e) => !e.crossed).map((e) => e.id))
      : new Set();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const div = document.createElement("div");
        div.className = "cell";
        div.dataset.r = String(r);
        div.dataset.c = String(c);
        div.setAttribute("role", "gridcell");

        const type = cells[r][c];
        if (type === "block") div.classList.add("blocked");

        const k = key(r, c);
        const node = nodeMap ? nodeMap.get(k) : null;

        if (node) {
          div.classList.add("has-data");
          if (closedSet.has(node.id)) div.classList.add("in-closed");
          else if (openAlive.has(node.id)) div.classList.add("in-open");
          if (pathSet.has(k)) div.classList.add("path");

          const fEl = document.createElement("span");
          fEl.className = "f";
          fEl.textContent = String(node.f);
          div.appendChild(fEl);

          const idEl = document.createElement("span");
          idEl.className = "id";
          idEl.textContent = String(node.id);
          div.appendChild(idEl);

          const gEl = document.createElement("span");
          gEl.className = "g";
          gEl.textContent = String(node.g);
          div.appendChild(gEl);

          const hEl = document.createElement("span");
          hEl.className = "h";
          hEl.textContent = String(node.h);
          div.appendChild(hEl);

          if (node.parent) {
            const arr = document.createElement("span");
            arr.className = "arrow";
            arr.textContent = node.arrow;
            div.appendChild(arr);
          }
        }

        if (type === "start") {
          const m = document.createElement("span");
          m.className = "mark";
          m.textContent = "A";
          div.appendChild(m);
        } else if (type === "end") {
          const m = document.createElement("span");
          m.className = "mark";
          m.textContent = "B";
          div.appendChild(m);
        }

        div.addEventListener("click", () => onCellClick(r, c));
        els.grid.appendChild(div);
      }
    }
  }

  function renderLists(closedIds, openLog) {
    els.closed.innerHTML = closedIds
      .map((id) => `<div>${id}</div>`)
      .join("");
    els.open.innerHTML = openLog
      .map(
        (e) =>
          `<div class="${e.crossed ? "crossed" : ""}">${e.id}</div>`
      )
      .join("");
  }

  function onCellClick(r, c) {
    if (run && run.finished) {
      // Allow editing after clearing calc implicitly
    }
    clearComputation(false);

    if (mode === "block") {
      if (cells[r][c] === "start" || cells[r][c] === "end") return;
      cells[r][c] = cells[r][c] === "block" ? "empty" : "block";
    } else if (mode === "start") {
      if (cells[r][c] === "block") return;
      cells[start.r][start.c] = "empty";
      if (r === end.r && c === end.c) {
        // swap: move B elsewhere temporarily handled by placing A over B not allowed
        setStatus("A y B no pueden coincidir.", "err");
        cells[start.r][start.c] = "start";
        return;
      }
      start = { r, c };
      cells[r][c] = "start";
    } else if (mode === "end") {
      if (cells[r][c] === "block") return;
      if (r === start.r && c === start.c) {
        setStatus("A y B no pueden coincidir.", "err");
        return;
      }
      cells[end.r][end.c] = "empty";
      end = { r, c };
      cells[r][c] = "end";
    } else if (mode === "clear") {
      if (cells[r][c] === "start" || cells[r][c] === "end") return;
      cells[r][c] = "empty";
    }

    renderGrid();
    setStatus("Grilla actualizada. Podés calcular A*.");
  }

  function clearComputation(redraw = true) {
    run = null;
    renderLists([], []);
    if (redraw) {
      renderGrid();
      setStatus("Cálculo limpio. Editá la grilla o volvé a calcular.");
    }
  }

  /**
   * Create a full A* run object with step() capability.
   * Open list is a min-f priority queue; ties prefer lower h, then lower id.
   * Node IDs assigned in discovery order (when first added to open).
   */
  function createRun() {
    if (!inBounds(start.r, start.c) || !inBounds(end.r, end.c)) {
      throw new Error("A o B fuera de la grilla.");
    }
    if (cells[start.r][start.c] === "block" || cells[end.r][end.c] === "block") {
      throw new Error("A o B están sobre un bloqueo.");
    }

    let nextId = 1;
    /** @type {Map<string, object>} */
    const nodeByPos = new Map();
    /** @type {Map<number, object>} */
    const nodeById = new Map();

    const openHeap = []; // array of node refs; we sort each pick for clarity
    const openLog = []; // {id, crossed}
    const closedIds = [];
    const closedSet = new Set(); // position keys

    function addToOpen(node) {
      openHeap.push(node);
      openLog.push({ id: node.id, crossed: false });
    }

    function crossOpen(id) {
      for (const e of openLog) {
        if (e.id === id && !e.crossed) {
          e.crossed = true;
          break;
        }
      }
    }

    function popBest() {
      openHeap.sort((a, b) => a.f - b.f || a.h - b.h || a.id - b.id);
      return openHeap.shift();
    }

    const h0 = heuristic(start.r, start.c);
    const startNode = {
      id: nextId++,
      r: start.r,
      c: start.c,
      g: 0,
      h: h0,
      f: h0,
      parent: null,
      arrow: "",
    };
    nodeByPos.set(key(start.r, start.c), startNode);
    nodeById.set(startNode.id, startNode);
    addToOpen(startNode);

    return {
      nodeByPos,
      nodeById,
      openHeap,
      openLog,
      closedIds,
      closedSet,
      nextId,
      finished: false,
      found: false,
      pathKeys: new Set(),
      addToOpen,
      crossOpen,
      popBest,
    };
  }

  function stepOnce(state) {
    if (state.finished) return state;

    if (state.openHeap.length === 0) {
      state.finished = true;
      state.found = false;
      return state;
    }

    const current = state.popBest();
    const ck = key(current.r, current.c);

    // Skip stale heap entries (worse g after a better path was found)
    const canonical = state.nodeByPos.get(ck);
    if (!canonical || canonical !== current) {
      return state;
    }
    if (state.closedSet.has(ck)) {
      return state;
    }

    state.closedSet.add(ck);
    state.closedIds.push(current.id);
    state.crossOpen(current.id);

    if (current.r === end.r && current.c === end.c) {
      state.finished = true;
      state.found = true;
      // Reconstruct path
      let n = current;
      while (n) {
        state.pathKeys.add(key(n.r, n.c));
        n = n.parent;
      }
      return state;
    }

    for (const d of DIRS) {
      const nr = current.r + d.dr;
      const nc = current.c + d.dc;
      if (!inBounds(nr, nc)) continue;
      if (cells[nr][nc] === "block") continue;

      // Optional: prevent corner-cutting through blocked diagonals
      if (d.dr !== 0 && d.dc !== 0) {
        if (cells[current.r][nc] === "block" && cells[nr][current.c] === "block") {
          continue;
        }
      }

      const nk = key(nr, nc);
      if (state.closedSet.has(nk)) continue;

      const gNew = current.g + d.cost;
      const existing = state.nodeByPos.get(nk);

      if (!existing) {
        const h = heuristic(nr, nc);
        const node = {
          id: state.nextId++,
          r: nr,
          c: nc,
          g: gNew,
          h,
          f: gNew + h,
          parent: current,
          arrow: arrowTowardParent(d.dr, d.dc),
        };
        state.nodeByPos.set(nk, node);
        state.nodeById.set(node.id, node);
        state.addToOpen(node);
      } else if (gNew < existing.g) {
        existing.g = gNew;
        existing.f = gNew + existing.h;
        existing.parent = current;
        existing.arrow = arrowTowardParent(d.dr, d.dc);
        // Re-insert into heap (lazy). Cross old open entry visually? Keep same id.
        state.openHeap.push(existing);
      }
    }

    if (state.openHeap.length === 0) {
      state.finished = true;
      state.found = false;
    }

    return state;
  }

  function syncView() {
    if (!run) {
      renderLists([], []);
      renderGrid();
      return;
    }
    renderLists(run.closedIds, run.openLog);
    renderGrid();
  }

  function ensureRun() {
    if (!run || run.finished) {
      run = createRun();
    }
    return run;
  }

  function runAll() {
    try {
      run = createRun();
      let guard = 0;
      const maxSteps = cols * rows * 20;
      while (!run.finished && guard++ < maxSteps) {
        stepOnce(run);
      }
      syncView();
      if (run.found) {
        setStatus(
          `Camino encontrado. Nodos cerrados: ${run.closedIds.length}. El camino está resaltado en amarillo.`,
          "ok"
        );
      } else {
        setStatus("No hay camino hasta B (lista de abiertos vacía).", "err");
      }
    } catch (e) {
      setStatus(e.message || String(e), "err");
    }
  }

  function runStep() {
    try {
      ensureRun();
      if (run.finished) {
        setStatus(
          run.found
            ? "Ya terminó: camino encontrado."
            : "Ya terminó: no hay camino.",
          run.found ? "ok" : "err"
        );
        syncView();
        return;
      }
      // Keep stepping until we actually close a node (skip stale)
      const before = run.closedIds.length;
      let guard = 0;
      while (
        !run.finished &&
        run.closedIds.length === before &&
        guard++ < 50
      ) {
        stepOnce(run);
      }
      syncView();
      if (run.finished) {
        setStatus(
          run.found
            ? "Camino encontrado. Resaltado en amarillo."
            : "No hay camino hasta B.",
          run.found ? "ok" : "err"
        );
      } else {
        const last = run.closedIds[run.closedIds.length - 1];
        setStatus(`Paso: se cerró el nodo ${last}.`);
      }
    } catch (e) {
      setStatus(e.message || String(e), "err");
    }
  }

  // UI bindings
  document.querySelectorAll(".btn.mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn.mode").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      mode = btn.dataset.mode;
    });
  });

  els.btnResize.addEventListener("click", () => {
    const c = Math.max(2, Math.min(20, Number(els.cols.value) || 4));
    const r = Math.max(2, Math.min(20, Number(els.rows.value) || 4));
    els.cols.value = String(c);
    els.rows.value = String(r);
    initGrid(c, r, false);
  });

  els.btnRun.addEventListener("click", runAll);
  els.btnStep.addEventListener("click", runStep);
  els.btnReset.addEventListener("click", () => clearComputation(true));

  // Boot with the classic 4×4 example from the board
  initGrid(4, 4, false);
})();
