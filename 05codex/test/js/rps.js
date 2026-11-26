const choices = {
    scissors: { label: "가위", beats: "paper" },
    rock: { label: "바위", beats: "scissors" },
    paper: { label: "보", beats: "rock" },
};

const choiceNames = Object.keys(choices);
const choiceButtons = document.querySelectorAll("[data-choice]");
const resetButton = document.querySelector("#reset-records");
const result = document.querySelector("#result");
const playerHand = document.querySelector("#player-hand");
const computerHand = document.querySelector("#computer-hand");
const playerChoice = document.querySelector("#player-choice");
const computerChoice = document.querySelector("#computer-choice");
const totalDisplay = document.querySelector("#total");
const winsDisplay = document.querySelector("#wins");
const lossesDisplay = document.querySelector("#losses");
const drawsDisplay = document.querySelector("#draws");
const rateDisplay = document.querySelector("#win-rate");
const bestStreakDisplay = document.querySelector("#best-streak");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const records = { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 };
let roundInProgress = false;

function showHand(display, choice) {
    const placeholder = display.querySelector("span");
    const icon = display.querySelector("svg");
    placeholder.hidden = Boolean(choice);
    icon.toggleAttribute("hidden", !choice);

    if (choice) {
        icon.querySelector("use").setAttribute("href", "#hand-" + choice);
    }
}

function setRoundInProgress(inProgress) {
    roundInProgress = inProgress;
    choiceButtons.forEach((button) => {
        button.setAttribute("aria-disabled", String(inProgress));
    });
    resetButton.setAttribute("aria-disabled", String(inProgress));
}

function renderRecords() {
    const total = records.wins + records.losses + records.draws;
    totalDisplay.textContent = total;
    winsDisplay.textContent = records.wins;
    lossesDisplay.textContent = records.losses;
    drawsDisplay.textContent = records.draws;
    rateDisplay.textContent = total ? Math.round(records.wins / total * 100) + "%" : "0%";
    bestStreakDisplay.textContent = records.bestStreak;
}

function playRound(player) {
    if (roundInProgress) return;

    setRoundInProgress(true);
    const computer = choiceNames[Math.floor(Math.random() * choiceNames.length)];
    showHand(playerHand, player);
    showHand(computerHand);
    playerChoice.textContent = choices[player].label;
    computerChoice.textContent = "선택 중";
    result.removeAttribute("data-outcome");
    result.textContent = "컴퓨터가 선택 중이에요.";

    let frame = 0;
    const animation = reducedMotion.matches ? null : window.setInterval(() => {
        showHand(computerHand, choiceNames[frame % choiceNames.length]);
        frame += 1;
    }, 100);

    window.setTimeout(() => {
        if (animation !== null) window.clearInterval(animation);

        const playerLabel = choices[player].label;
        const computerLabel = choices[computer].label;
        showHand(computerHand, computer);
        computerChoice.textContent = computerLabel;

        let outcome;
        let message;
        if (player === computer) {
            outcome = "draws";
            message = "비겼어요!";
        } else if (choices[player].beats === computer) {
            outcome = "wins";
            message = "이겼어요!";
        } else {
            outcome = "losses";
            message = "졌어요!";
        }

        records[outcome] += 1;
        records.streak = outcome === "wins" ? records.streak + 1 : 0;
        records.bestStreak = Math.max(records.bestStreak, records.streak);
        renderRecords();

        result.dataset.outcome = outcome;
        result.textContent = message + " 나 " + playerLabel + ", 컴퓨터 " + computerLabel;
        setRoundInProgress(false);
    }, 1000);
}

choiceButtons.forEach((button) => {
    button.addEventListener("click", () => playRound(button.dataset.choice));
});

resetButton.addEventListener("click", () => {
    if (roundInProgress || !window.confirm("게임 전적을 초기화할까요?")) return;

    Object.assign(records, { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 });
    renderRecords();
    showHand(playerHand);
    showHand(computerHand);
    playerChoice.textContent = "선택 전";
    computerChoice.textContent = "선택 전";
    result.removeAttribute("data-outcome");
    result.textContent = "전적을 초기화했어요.";
});
