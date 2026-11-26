const byId = (id) => document.getElementById(id);
const allNumbers = Array.from({ length: 45 }, (_, index) => index + 1);
const modes = document.querySelectorAll("[data-mode]");
const grid = byId("number-grid");
const gameCount = byId("game-count");
const manualGame = byId("manual-game");
const themeButton = byId("theme-button");
const themeKey = "lotto-645-theme";
const drawButton = byId("draw-button");
const redrawButton = byId("redraw-button");
const resetButton = byId("reset-button");
const clearSelection = byId("clear-selection");
const machine = byId("machine");
const tray = byId("tray");
const progress = byId("progress");
const notice = byId("notice");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const archiveKey = "lotto-645-archive";
const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" });

let mode = "auto";
let busy = false;
let results = [];
const fixed = new Set();
const manualSelections = Array.from({ length: 5 }, () => new Set());

function sorted(numbers) {
    return [...numbers].sort((a, b) => a - b);
}

function validNumbers(numbers) {
    return Array.isArray(numbers) && numbers.length === 6 && new Set(numbers).size === 6
        && numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 45);
}

function loadArchive() {
    try {
        const data = JSON.parse(localStorage.getItem(archiveKey));
        const validEntry = (entry) => validNumbers(entry?.numbers) && Number.isFinite(entry.time)
            && Math.abs(entry.time) <= 8.64e15;
        const loadEntries = (entries) => Array.isArray(entries)
            ? entries.filter(validEntry).map((entry) => ({ numbers: sorted(entry.numbers), time: entry.time }))
            : [];
        return { saved: loadEntries(data?.saved), history: loadEntries(data?.history) };
    } catch {
        return { saved: [], history: [] };
    }
}

const archive = loadArchive();

function persist() {
    try {
        localStorage.setItem(archiveKey, JSON.stringify(archive));
        return true;
    } catch {
        notice.textContent = "브라우저에 보관하지 못했어요. 이 페이지를 열어 둔 동안만 유지됩니다.";
        return false;
    }
}

function uniformIndex(length) {
    const word = new Uint32Array(1);
    const limit = 2 ** 32 - (2 ** 32 % length);
    do {
        crypto.getRandomValues(word);
    } while (word[0] >= limit);
    return word[0] % length;
}

function drawNumbers(locked) {
    const pool = allNumbers.filter((number) => !locked.has(number));
    const drawn = [];
    for (let index = 0; index < 6 - locked.size; index += 1) {
        const swap = index + uniformIndex(pool.length - index);
        [pool[index], pool[swap]] = [pool[swap], pool[index]];
        drawn.push(pool[index]);
    }
    return drawn;
}

function selection() {
    return mode === "manual" ? manualSelections[Number(manualGame.value)] : fixed;
}

function count() {
    const value = Number(gameCount.value);
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 1;
}

function canDraw() {
    if (mode === "manual") return manualSelections.slice(0, count()).every((numbers) => numbers.size === 6);
    return mode === "auto" || (fixed.size >= 1 && fixed.size <= 5);
}

function renderControls() {
    const manual = mode === "manual";
    const selected = selection();
    const max = manual ? 6 : 5;
    byId("picker").hidden = mode === "auto";
    byId("manual-game-control").hidden = !manual || count() === 1;
    machine.hidden = manual;
    redrawButton.hidden = manual;
    byId("picker-title").textContent = manual ? "게임별 번호 6개 선택" : "고정할 번호 1~5개 선택";
    byId("selection-count").textContent = selected.size + " / " + max + "개 선택";
    for (const button of grid.children) {
        button.setAttribute("aria-pressed", String(selected.has(Number(button.value))));
        button.disabled = busy;
    }
    for (const button of modes) {
        button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
        button.disabled = busy;
    }
    gameCount.disabled = manualGame.disabled = themeButton.disabled = busy;
    clearSelection.disabled = busy || selected.size === 0;
    drawButton.textContent = manual ? "번호 확정" : "번호 추첨";
    drawButton.disabled = busy || !canDraw();
    redrawButton.disabled = busy || !results.length || !canDraw();
    resetButton.disabled = busy || (!results.length && !fixed.size && !manualSelections.some((numbers) => numbers.size));
}

function updateManualGames() {
    const previous = Number(manualGame.value);
    manualGame.replaceChildren();
    for (let index = 0; index < count(); index += 1) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = (index + 1) + "게임";
        manualGame.append(option);
    }
    manualGame.value = Math.min(previous, count() - 1);
}

function clearSelections() {
    fixed.clear();
    manualSelections.forEach((numbers) => numbers.clear());
    manualGame.value = 0;
}

function ball(number) {
    const element = document.createElement("span");
    element.className = "ball";
    element.dataset.band = Math.ceil(number / 10);
    element.textContent = number;
    return element;
}

function action(label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
}

async function copyNumbers(numbers) {
    try {
        await navigator.clipboard.writeText(numbers.join(", "));
        notice.textContent = "번호를 복사했어요.";
    } catch {
        notice.textContent = "번호를 복사하지 못했어요. 브라우저의 클립보드 접근을 확인해 주세요.";
    }
}

function saveEntry(entry) {
    if (archive.saved.some((item) => item.numbers.join(",") === entry.numbers.join(","))) {
        notice.textContent = "이미 저장한 번호예요.";
        return;
    }
    archive.saved.unshift(entry);
    if (persist()) notice.textContent = "번호를 저장했어요.";
    renderArchives();
}

function deleteEntry(id, list, entry) {
    const index = list.indexOf(entry);
    if (index < 0) return;
    list.splice(index, 1);
    if (persist()) notice.textContent = "항목을 삭제했어요.";
    renderArchives();
    const container = byId(id);
    const next = container.querySelectorAll("button")[Math.min(index, list.length - 1)];
    (next ?? container.closest("details").querySelector("summary")).focus();
}

function renderList(id, entries, emptyText) {
    const container = byId(id);
    container.replaceChildren();
    if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = emptyText;
        container.append(empty);
        return;
    }

    entries.forEach((entry, index) => {
        const row = document.createElement("div");
        const label = document.createElement("span");
        const numbers = document.createElement("div");
        const actions = document.createElement("div");
        row.className = "entry";
        label.className = "entry-label";
        label.textContent = id === "results" ? (index + 1) + "게임" : dateFormat.format(entry.time);
        numbers.className = "balls";
        numbers.append(...entry.numbers.map(ball));
        actions.className = "actions";
        if (id === "results") {
            actions.append(action("복사", () => copyNumbers(entry.numbers)), action("저장", () => saveEntry(entry)));
        } else {
            actions.append(action("삭제", () => deleteEntry(id, entries, entry)));
        }
        row.append(label, numbers, actions);
        container.append(row);
    });
}

function renderEntries() {
    renderList("results", results, "아직 추첨한 번호가 없어요.");
    renderArchives();
}

function renderArchives() {
    renderList("saved", archive.saved, "저장한 번호가 없어요.");
    renderList("history", archive.history, "추첨 기록이 없어요.");
    byId("saved-count").textContent = archive.saved.length + "건";
    byId("history-count").textContent = archive.history.length + "건";
}

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

async function animateDraw(batches) {
    machine.classList.add("running");
    for (const [index, drawn] of batches.entries()) {
        tray.replaceChildren();
        progress.textContent = (index + 1) + " / " + batches.length + "게임 · 공을 섞고 있어요.";
        await wait(300);
        for (const [position, number] of drawn.entries()) {
            tray.append(ball(number));
            progress.textContent = (index + 1) + " / " + batches.length + "게임 · "
                + (position + 1) + " / " + drawn.length + "개 배출";
            await wait(200);
        }
    }
}

async function runDraw() {
    if (busy || !canDraw()) return;

    const sourceButton = document.activeElement;
    busy = true;
    notice.textContent = "";
    tray.replaceChildren();
    renderControls();

    try {
        const locked = mode === "semi" ? new Set(fixed) : new Set();
        const manual = mode === "manual";
        const batches = manual ? manualSelections.slice(0, count()).map(sorted)
            : Array.from({ length: count() }, () => drawNumbers(locked));
        if (!manual && !reducedMotion.matches) await animateDraw(batches);

        const time = Date.now();
        results = batches.map((numbers) => ({ numbers: sorted([...locked, ...numbers]), time }));
        archive.history.unshift(...results);
        persist();
        renderEntries();
        progress.textContent = results.length + "게임 " + (manual ? "확정 완료" : "추첨 완료");
    } catch {
        progress.textContent = "번호를 처리하지 못했어요. 다시 시도해 주세요.";
    } finally {
        machine.classList.remove("running");
        busy = false;
        renderControls();
        if (document.activeElement === document.body && (sourceButton === drawButton || sourceButton === redrawButton)) {
            sourceButton.focus();
        }
    }
}

for (const number of allNumbers) {
    const button = action(String(number), () => {
        if (busy || mode === "auto") return;
        const selected = selection();
        const max = mode === "manual" ? 6 : 5;
        if (selected.has(number)) selected.delete(number);
        else if (selected.size < max) selected.add(number);
        else {
            byId("selection-count").textContent = "최대 " + max + "개까지 선택할 수 있어요.";
            return;
        }
        renderControls();
    });
    button.value = number;
    grid.append(button);
}

for (const button of modes) {
    button.addEventListener("click", () => {
        if (busy || mode === button.dataset.mode) return;
        mode = button.dataset.mode;
        clearSelections();
        tray.replaceChildren();
        progress.textContent = "";
        renderControls();
    });
}

gameCount.addEventListener("change", () => {
    if (busy) return;
    manualSelections.slice(count()).forEach((numbers) => numbers.clear());
    updateManualGames();
    renderControls();
});
manualGame.addEventListener("change", renderControls);
clearSelection.addEventListener("click", () => {
    if (busy) return;
    selection().clear();
    renderControls();
    grid.firstElementChild.focus();
});
drawButton.addEventListener("click", runDraw);
redrawButton.addEventListener("click", runDraw);
resetButton.addEventListener("click", () => {
    if (busy) return;
    results = [];
    clearSelections();
    tray.replaceChildren();
    progress.textContent = "";
    notice.textContent = "추첨 화면을 초기화했어요.";
    renderEntries();
    renderControls();
    document.querySelector('[data-mode="' + mode + '"]').focus();
});

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
}

try {
    applyTheme(localStorage.getItem(themeKey) === "dark" ? "dark" : "light");
} catch {
    applyTheme("light");
}

themeButton.addEventListener("click", () => {
    if (busy) return;
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    try {
        localStorage.setItem(themeKey, theme);
    } catch {
        // Keep the selected theme for the current page when storage is unavailable.
    }
});

updateManualGames();
renderControls();
renderEntries();
