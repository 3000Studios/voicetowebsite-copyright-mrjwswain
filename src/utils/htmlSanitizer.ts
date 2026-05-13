/**
 * Safe HTML utilities to prevent XSS attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Safely set element content
 */
export const safeSetContent = (element: Element, content: string): void => {
  element.textContent = content;
};

/**
 * Create a safe element with attributes
 */
export const safeCreateElement = (
  tagName: string,
  attributes: Record<string, string> = {},
  content: string = ""
): HTMLElement => {
  const element = document.createElement(tagName);

  // Set attributes safely
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith("on") || key.toLowerCase().includes("script")) {
      console.warn(`Skipping potentially dangerous attribute: ${key}`);
      return;
    }
    element.setAttribute(key, escapeHtml(value));
  });

  // Set content safely
  if (content) {
    element.textContent = content;
  }

  return element;
};

/**
 * Build safe HTML from template with escaped values
 */
export const safeHtml = (
  template: string,
  values: Record<string, string | number>
): string => {
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    result = result.replace(regex, escapeHtml(String(value)));
  });
  return result;
};
