import { validateDemoRequest } from "./form-validation.js";

const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const navigation = document.querySelector("[data-nav]");
const navLinks = [...navigation.querySelectorAll("a")];
let previousFocus = null;

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.querySelector(".sr-only").textContent = open ? "Close navigation" : "Open navigation";
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  if (open) {
    previousFocus = document.activeElement;
    navLinks[0].focus();
  } else if (previousFocus === menuButton || navigation.contains(previousFocus)) {
    menuButton.focus();
  }
}

menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
navLinks.forEach(link => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") setMenu(false);
  if (event.key !== "Tab" || menuButton.getAttribute("aria-expanded") !== "true") return;
  const focusables = [menuButton, ...navLinks];
  const first = focusables[0];
  const last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function updateScrollChrome() {
  header.classList.toggle("scrolled", window.scrollY > 10);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  header.style.setProperty("--scroll-progress", progress);
}

window.addEventListener("scroll", updateScrollChrome, { passive: true });
updateScrollChrome();
window.addEventListener("resize", () => {
  if (window.innerWidth > 820 && menuButton.getAttribute("aria-expanded") === "true") setMenu(false);
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));

function selectTab(selectedTab, focus = true) {
  tabs.forEach((tab, index) => {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[index].hidden = !selected;
  });
  if (focus) selectedTab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab, false));
  tab.addEventListener("keydown", event => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== index) {
      event.preventDefault();
      selectTab(tabs[nextIndex]);
    }
  });
});

const modeToggle = document.querySelector("[data-mode-toggle]");
const modeCard = modeToggle.closest(".mode-card");
const modeLabel = document.querySelector("[data-mode-label]");
modeToggle.addEventListener("click", () => {
  const enabled = modeToggle.getAttribute("aria-checked") !== "true";
  modeToggle.setAttribute("aria-checked", String(enabled));
  modeCard.querySelector("strong").textContent = enabled ? "Automation enabled" : "Suggestion mode";
  modeCard.querySelector("small").textContent = enabled
    ? "Routine permitted changes can run within project budgets and daily limits."
    : "Every change becomes a suggestion awaiting a person.";
  modeLabel.textContent = enabled ? "Can run automatically" : "Becomes a suggestion";
});

document.querySelector("[data-approve-preview]").addEventListener("click", event => {
  event.currentTarget.textContent = event.currentTarget.textContent === "Review" ? "Queued" : "Review";
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(element => revealObserver.observe(element));

const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (motionAllowed && precisePointer) {
  document.querySelectorAll(".light-card").forEach(card => {
    card.addEventListener("pointermove", event => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--mouse-y", `${event.clientY - bounds.top}px`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
    });
  });

  document.querySelectorAll("[data-tilt-scene]").forEach(scene => {
    scene.addEventListener("pointermove", event => {
      const bounds = scene.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
      scene.style.setProperty("--tilt-x", `${vertical * -3.5}deg`);
      scene.style.setProperty("--tilt-y", `${horizontal * 5}deg`);
      scene.style.setProperty("--tilt-lift", "-3px");
    });
    scene.addEventListener("pointerleave", () => {
      scene.style.setProperty("--tilt-x", "0deg");
      scene.style.setProperty("--tilt-y", "-2deg");
      scene.style.setProperty("--tilt-lift", "0px");
    });
  });
}

const form = document.querySelector("[data-demo-form]");
const status = form.querySelector("[data-form-status]");
const submitButton = form.querySelector('button[type="submit"]');

function setFieldErrors(errors) {
  ["name", "email", "company", "role"].forEach(name => {
    const field = form.elements[name];
    const error = document.getElementById(`${name}-error`);
    const message = errors[name] || "";
    error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form));
  const validation = validateDemoRequest(payload);
  setFieldErrors(validation.errors);
  status.className = "form-status";

  if (!validation.valid) {
    status.textContent = "Please correct the highlighted fields.";
    status.classList.add("error");
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Sending…";
  status.textContent = "Sending your request securely…";

  try {
    const response = await fetch("/api/demo-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.values)
    });
    const result = await response.json();
    if (!response.ok) {
      setFieldErrors(result.errors || {});
      throw new Error(result.message || "We could not send your request. Please try again.");
    }
    form.reset();
    setFieldErrors({});
    status.textContent = result.message;
    status.classList.add("success");
  } catch (error) {
    status.textContent = error.message || "We could not send your request. Please try again.";
    status.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Request a demo";
  }
});
