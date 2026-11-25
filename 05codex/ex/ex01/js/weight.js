"use strict";

const units = [
  { symbol: "mg", name: "밀리그램", kilograms: 0.000001, group: "metric" },
  { symbol: "g", name: "그램", kilograms: 0.001, group: "metric" },
  { symbol: "kg", name: "킬로그램", kilograms: 1, group: "metric" },
  { symbol: "t", name: "미터톤", kilograms: 1000, group: "metric" },
  { symbol: "oz", name: "온스", kilograms: 0.028349523125, group: "imperial" },
  { symbol: "lb", name: "파운드", kilograms: 0.45359237, group: "imperial" },
  { symbol: "st", name: "스톤", kilograms: 6.35029318, group: "imperial" },
  { symbol: "US ton", name: "미국 숏톤", kilograms: 907.18474, group: "imperial" }
];

const amount = document.querySelector("#amount");
const unitSelect = document.querySelector("#unit");
const inputError = document.querySelector("#input-error");
const copyStatus = document.querySelector("#copy-status");
const template = document.querySelector("#result-template");
const defaultUnit = "kg";
const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const decimalFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

let copyFeedbackTimer;
let copyRequest = 0;

const rows = units.map((unit) => {
  const option = document.createElement("option");
  option.value = unit.symbol;
  option.textContent = `${unit.name} (${unit.symbol})`;
  unitSelect.append(option);

  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector(".unit-symbol").textContent = unit.symbol;
  row.querySelector(".unit-name").textContent = unit.name;
  const output = row.querySelector("output");
  const button = row.querySelector(".copy");
  button.setAttribute("aria-label", `${unit.name} 결과 복사`);
  button.title = `${unit.name} 결과 복사`;
  const result = { unit, row, output, button, copyValue: "" };
  button.addEventListener("click", () => copyResult(result));
  document.getElementById(unit.group).append(row);
  return result;
});

function parseAmount(text) {
  const value = text.trim();
  if (!value) return { number: null, error: "" };
  if (!numericPattern.test(value)) {
    return { number: null, error: "올바른 숫자를 입력해 주세요. 예: -1.25 또는 2e-3" };
  }

  const number = Number(value);
  const mantissa = value.split(/[eE]/)[0];
  if (!Number.isFinite(number) || (number === 0 && /[1-9]/.test(mantissa))) {
    return { number: null, error: "입력값이 계산 가능한 범위를 벗어났습니다." };
  }
  return { number, error: "" };
}

function convert(number, base, target) {
  // 킬로그램 기준 비율을 먼저 구해 중간 계산에서의 오버플로를 피합니다.
  const value = number * (base.kilograms / target.kilograms);
  return Number.isFinite(value) && (value !== 0 || number === 0) ? value : null;
}

function formatResult(value) {
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e12 || magnitude < 1e-8) {
    const [mantissa, exponent] = value.toExponential(8).split("e");
    return `${mantissa.replace(/\.?0+$/, "")}e${exponent}`;
  }
  return decimalFormat.format(value);
}

function clearCopyFeedback() {
  window.clearTimeout(copyFeedbackTimer);
  copyStatus.textContent = "";
  copyStatus.removeAttribute("data-error");
  rows.forEach(({ button }) => button.classList.remove("is-copied"));
}

function renderResults() {
  copyRequest += 1;
  clearCopyFeedback();
  const { number, error } = parseAmount(amount.value);
  const base = units.find(({ symbol }) => symbol === unitSelect.value);
  inputError.textContent = error;
  amount.setAttribute("aria-invalid", String(Boolean(error)));

  rows.forEach((result) => {
    const { unit, row, output, button } = result;
    const isBase = unit === base;
    row.classList.toggle("is-base", isBase);
    if (isBase) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");

    const value = number === null ? null : convert(number, base, unit);
    const unavailable = number !== null && value === null;
    const formatted = value === null ? "" : formatResult(value);
    output.textContent = unavailable ? "범위 초과" : formatted;
    output.toggleAttribute("data-unavailable", unavailable);
    result.copyValue = formatted.replace(/,/g, "");
    const displayedNumber = result.copyValue ? Number(result.copyValue) : NaN;
    output.toggleAttribute("data-above-100", displayedNumber > 100);
    output.toggleAttribute("data-below-100", displayedNumber < 100);
    button.disabled = value === null;
  });
}

function copyWithSelection(value) {
  const active = document.activeElement;
  const helper = document.createElement("textarea");
  helper.className = "clipboard-helper";
  helper.value = value;
  helper.readOnly = true;
  helper.tabIndex = -1;
  document.body.append(helper);
  try {
    helper.select();
    if (!document.execCommand("copy")) throw new Error("Copy failed");
  } finally {
    helper.remove();
    active?.focus({ preventScroll: true });
  }
}

async function writeClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    copyWithSelection(value);
  }
}

async function copyResult(result) {
  if (!result.copyValue) return;
  const request = ++copyRequest;
  clearCopyFeedback();
  try {
    await writeClipboard(result.copyValue);
    if (request !== copyRequest) return;
    result.button.classList.add("is-copied");
    copyStatus.textContent = `${result.unit.name} 결과를 복사했습니다.`;
    copyFeedbackTimer = window.setTimeout(clearCopyFeedback, 2200);
  } catch {
    if (request !== copyRequest) return;
    copyStatus.setAttribute("data-error", "");
    copyStatus.textContent = "복사할 수 없습니다. 결과를 선택해 직접 복사해 주세요.";
  }
}

document.querySelector("#reset").addEventListener("click", () => {
  amount.value = "";
  unitSelect.value = defaultUnit;
  renderResults();
  amount.focus();
});

amount.addEventListener("input", renderResults);
unitSelect.addEventListener("change", renderResults);

unitSelect.value = defaultUnit;
renderResults();
