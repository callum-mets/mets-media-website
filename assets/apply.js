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

// Only the steps marked data-question count towards the bar. The intro and the
// final booking step are not questions, so the bar reads 0% and 100% on those.
// Keeping this derived from the DOM means a reorder cannot desync it again.
const questionSteps = steps.filter((step) => step.hasAttribute("data-question"));

function progressFor(index) {
  const step = steps[index];
  const position = questionSteps.indexOf(step);
  if (position === -1) return index === 0 ? 0 : 100;
  return ((position + 1) / questionSteps.length) * 100;
}

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });
  progressBar.style.width = `${progressFor(currentStep)}%`;
  persist();
}

function activeInputs() {
  return Array.from(steps[currentStep].querySelectorAll("input[required], textarea[required]"));
}

const EMAIL_DOMAIN_FIXES = {
  "gmail.com.au": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho.com": "yahoo.com",
  "bigpond.con": "bigpond.com",
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
};

// Returns a corrected address when the domain is an obvious typo, else null.
function suggestEmailFix(value) {
  const email = (value || "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const fixed = EMAIL_DOMAIN_FIXES[domain];
  return fixed ? `${local}@${fixed}` : null;
}

// Ask DNS whether a domain can actually receive mail. Catches every typo, not
// just the ones on a list. Returns true, false, or null when we could not tell.
const domainCache = new Map();
async function mailDomainExists(domain) {
  if (domainCache.has(domain)) return domainCache.get(domain);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { accept: "application/dns-json" }, signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // NXDOMAIN means the domain does not exist at all.
    if (data.Status === 3) {
      domainCache.set(domain, false);
      return false;
    }
    if (data.Status !== 0) return null;
    const hasMx = Array.isArray(data.Answer) && data.Answer.some((a) => a.type === 15);
    domainCache.set(domain, hasMx);
    return hasMx;
  } catch (error) {
    return null; // offline, blocked or slow. Never block the applicant.
  } finally {
    window.clearTimeout(timer);
  }
}

// Returns null when fine, or a message when the address looks unreachable.
async function emailDomainProblem(input) {
  const value = (input.value || "").trim().toLowerCase();
  const domain = value.slice(value.lastIndexOf("@") + 1);
  if (!domain) return null;
  if (input.dataset.domainConfirmed === domain) return null;
  const exists = await mailDomainExists(domain);
  if (exists === false) {
    input.dataset.domainConfirmed = domain;
    return `We cannot find a mail server for ${domain}. Check the spelling, or press Continue again if it is correct.`;
  }
  return null;
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

  // Multi-select steps marked data-require-answer need either a chosen option
  // or something typed in the companion box, so applications cannot land with
  // no stated need and no stated service.
  steps[currentStep].querySelectorAll("[data-require-answer]").forEach((group) => {
    const chosen = state[group.dataset.choiceGroup];
    const hasChoice = Array.isArray(chosen) && chosen.length > 0;
    const other = document.getElementById(group.dataset.requireAnswer);
    const hasText = Boolean(other && other.value.trim());
    if (!hasChoice && !hasText) valid = false;
  });

  const error = steps[currentStep].querySelector(".error");

  // Catch obvious address typos before they cost us a reachable lead.
  const emailInput = steps[currentStep].querySelector('input[type="email"]');
  if (valid && emailInput) {
    const suggestion = suggestEmailFix(emailInput.value);
    if (suggestion && emailInput.dataset.typoAccepted !== suggestion) {
      emailInput.value = suggestion;
      state[emailInput.name] = suggestion;
      emailInput.dataset.typoAccepted = suggestion;
      persist();
      if (error) {
        error.textContent = `We corrected that to ${suggestion}. Change it back if that is wrong, otherwise carry on.`;
        error.classList.add("is-visible");
      }
      return false;
    }
  }

  if (error) error.classList.toggle("is-visible", !valid);
  return valid;
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!validateCurrentStep()) return;

    const emailInput = steps[currentStep].querySelector('input[type="email"]');
    if (emailInput) {
      const error = steps[currentStep].querySelector(".error");
      button.disabled = true;
      const problem = await emailDomainProblem(emailInput);
      button.disabled = false;
      if (problem) {
        if (error) {
          error.textContent = problem;
          error.classList.add("is-visible");
        }
        return;
      }
    }

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
      // Clear the "pick at least one" warning as soon as they pick one.
      const stepError = group.closest(".step").querySelector(".error");
      if (stepError) stepError.classList.remove("is-visible");
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
