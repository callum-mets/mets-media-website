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
    if (field.name === "name") updateNameSlots();
  });
});

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  sessionStorage.setItem("metsApplyStep", String(currentStep));
}

function firstNameOf(fullName) {
  return (fullName || "").trim().split(/\s+/)[0] || "";
}

function updateNameSlots() {
  const first = firstNameOf(state.name);
  document.querySelectorAll("[data-name-slot='thanks']").forEach((el) => {
    el.textContent = first ? ` ${first}` : "";
  });
  document.querySelectorAll("[data-name-slot='perfect']").forEach((el) => {
    el.textContent = first ? `, ${first}` : "";
  });
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
  return Array.from(steps[currentStep].querySelectorAll("input[required], textarea[required]"));
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
  const key = group.dataset.choiceGroup;
  const isMulti = group.hasAttribute("data-multi");

  if (isMulti) {
    if (!Array.isArray(state[key])) state[key] = [];
    group.querySelectorAll("[data-value]").forEach((button) => {
      const selected = state[key].includes(button.dataset.value);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-value]");
    if (!button) return;

    if (isMulti) {
      const values = state[key];
      const selected = button.classList.toggle("is-selected");
      button.setAttribute("aria-pressed", String(selected));
      if (selected) {
        values.push(button.dataset.value);
      } else {
        const i = values.indexOf(button.dataset.value);
        if (i > -1) values.splice(i, 1);
      }
      persist();
      return;
    }

    state[key] = button.dataset.value;
    persist();
    window.setTimeout(() => showStep(currentStep + 1), 140);
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  fields.forEach((field) => {
    state[field.name] = field.value.trim();
  });
  state.submittedAt = new Date().toISOString();
  state.referrer = document.referrer || "";
  state.landingPage = window.location.href;
  persist();

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending\u2026";
  }

  // Let them through even if the send fails. A lost application is worse
  // than a lost email, and the booking form is the backstop.
  try {
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    state.delivered = res.ok;
  } catch (error) {
    state.delivered = false;
  }
  persist();

  sessionStorage.setItem("metsApplyComplete", "1");
  window.location.href = "/verify/";
});

updateNameSlots();
showStep(currentStep);
