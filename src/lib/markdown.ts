import { Marked } from "marked";

// One configured instance, shared between client (BioPage / BlockList preview)
// and SSR (Cloudflare Worker). Works in both because marked is pure JS with no
// DOM dependency.
const marked = new Marked({
  gfm: true,
  breaks: true,
});

/**
 * Pure string sanitizer — strips the subset of HTML that is dangerous when
 * injected into another visitor's page. We don't need full DOMPurify coverage
 * because the input comes from the page owner (who can already edit their own
 * site), but the output is rendered for arbitrary visitors so we still block
 * the obvious XSS vectors that a careless copy-paste could introduce.
 */
function sanitizeHtml(html: string): string {
  return html
    // Drop entire dangerous elements (and their content).
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|link|meta)\b[\s\S]*?<\/\1>/gi, "")
    // Drop self-closing / unclosed variants of the same.
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|link|meta)\b[^>]*>/gi, "")
    // Strip inline event handlers: onclick="…", onerror='…', onfoo=bar.
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Neutralise javascript:/vbscript:/data:text/html URLs in href/src.
    .replace(/(href|src)\s*=\s*(["'])\s*(javascript|vbscript|data:text\/html)[^"']*\2/gi, '$1="#"');
}

/**
 * Unwrap `<p><img></p>` → `<img>` so solo images become direct children of
 * `.markdown-body`. Needed so the card style can apply full-bleed negative
 * margins without a wrapping `<p>` element getting in the way.
 */
function unwrapSoloImages(html: string): string {
  return html.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/g, "$1");
}

export function renderMarkdown(source: string): string {
  if (!source) return "";
  const raw = marked.parse(source, { async: false }) as string;
  return unwrapSoloImages(sanitizeHtml(raw));
}
