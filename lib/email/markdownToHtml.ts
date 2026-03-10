import { marked } from "marked";

/**
 * Convert markdown to email-safe HTML with inline styles.
 * Email clients strip <style> tags and CSS classes, so everything
 * must be inline.
 */
export function markdownToEmailHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;

  // Wrap in email-safe container with inline styles
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
${rawHtml
  .replace(/<p>/g, '<p style="margin: 0 0 12px 0;">')
  .replace(/<a /g, '<a style="color: #2563eb;" ')
  .replace(/<strong>/g, '<strong style="font-weight: 600;">')
  .replace(/<ul>/g, '<ul style="margin: 0 0 12px 0; padding-left: 20px;">')
  .replace(/<ol>/g, '<ol style="margin: 0 0 12px 0; padding-left: 20px;">')
  .replace(/<li>/g, '<li style="margin: 0 0 4px 0;">')
  .replace(/<blockquote>/g, '<blockquote style="margin: 0 0 12px 0; padding: 8px 12px; border-left: 3px solid #d1d5db; color: #6b7280;">')
  .replace(/<code>/g, '<code style="font-family: monospace; font-size: 13px; background: #f3f4f6; padding: 1px 4px; border-radius: 3px;">')
  .replace(/<pre>/g, '<pre style="font-family: monospace; font-size: 13px; background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0 0 12px 0;">')
  .replace(/<h1>/g, '<h1 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">')
  .replace(/<h2>/g, '<h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">')
  .replace(/<h3>/g, '<h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">')
  .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">')
  .replace(/<table>/g, '<table style="border-collapse: collapse; margin: 0 0 12px 0;">')
  .replace(/<th>/g, '<th style="border: 1px solid #d1d5db; padding: 6px 10px; font-weight: 600; background: #f9fafb;">')
  .replace(/<td>/g, '<td style="border: 1px solid #d1d5db; padding: 6px 10px;">')}
</div>`;
}
