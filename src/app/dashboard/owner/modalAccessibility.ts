const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "details summary",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function getModalFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function focusFirstModalElement(container: HTMLElement | null) {
  const firstFocusable = getModalFocusableElements(container)[0];
  (firstFocusable ?? container)?.focus();
}

export function trapFocusInModal(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab" || !container) return;

  const focusable = getModalFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
