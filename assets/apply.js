const steps = Array.from(document.querySelectorAll(".step"));
const progressBar = document.getElementById("progressBar");
const form = document.getElementById("surveyForm");
const storageKey = "metsApplySurvey";

let currentStep = Number(sessionStorage.getItem("metsApplyStep") || 0);
const state = JSON.parse(localStorage.getItem(storageKey) || "{}");

const fields = Array.from(document.querySelectorAll("input, textarea"));
fields.forEach((field) => {
  if (state[field.name]) field.value = state[field.name];
  field.addEventListener("input", () => {
    state[field.name] = field.value.trim();
    persist();
  });
});

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  sessionStorage.setItem("metsApplyStep", String(currentStep));
}

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });
  progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  persist();
}

function activeInputs() {
  return Array.from(steps[currentStep].querySelectorAll("input, textarea"));
}

function validateCurrentStep() {
  const inputs = activeInputs();
  let valid = true;
  inputs.forEach((input) => {
    const value = input.value.trim();
    const inputValid = input.type === "email" ? input.checkValidity() : value.length > 0;
    input.toggleAttribute("aria-invalid", !inputValid);
    valid = valid && inputValid;
  });

  const error = steps[currentStep].querySelector(".error");
  if (error) error.classList.toggle("is-visible", !valid);
  return valid;
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!validateCurrentStep()) return;
    showStep(currentStep + 1);
  });
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => showStep(currentStep - 1));
});

document.querySelectorAll("[data-choice-group]").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-value]");
    if (!button) return;
    const key = group.dataset.choiceGroup;
    state[key] = button.dataset.value;
    persist();
    window.setTimeout(() => showStep(currentStep + 1), 140);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  fields.forEach((field) => {
    state[field.name] = field.value.trim();
  });
  state.submittedAt = new Date().toISOString();
  persist();

  window.location.href = "/verify/";
});

showStep(currentStep);
