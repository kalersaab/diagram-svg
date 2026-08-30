/**
 * Draw.io PostMessage Embed Protocol Bridge
 * Reference: https://www.diagrams.net/doc/faq/embed-mode
 */

export interface DrawioInitEvent {
  event: 'init';
}

export interface DrawioLoadEvent {
  event: 'load';
  xml?: string;
}

export interface DrawioSaveEvent {
  event: 'save';
  xml: string;
  exit?: boolean;
}

export interface DrawioAutosaveEvent {
  event: 'autosave';
  xml: string;
}

export interface DrawioExportEvent {
  event: 'export';
  format: 'svg' | 'xmlsvg' | 'xml' | 'png';
  data: string; // Data URL or XML string
  xml?: string;
  message?: Record<string, unknown>;
}

export interface DrawioExitEvent {
  event: 'exit';
  modified?: boolean;
}

export type DrawioEvent =
  | DrawioInitEvent
  | DrawioLoadEvent
  | DrawioSaveEvent
  | DrawioAutosaveEvent
  | DrawioExportEvent
  | DrawioExitEvent;

export interface DrawioLoadAction {
  action: 'load';
  xml: string;
  autosave?: 1 | 0;
  title?: string;
  modified?: boolean;
}

export interface DrawioExportAction {
  action: 'export';
  format: 'svg' | 'xmlsvg' | 'xml' | 'png';
  xml?: string;
  spin?: string;
}

export interface DrawioStatusAction {
  action: 'status';
  message: string;
  modified?: boolean;
}

export type DrawioAction =
  | DrawioLoadAction
  | DrawioExportAction
  | DrawioStatusAction;

// ─── XML sanitizer ────────────────────────────────────────────────────────────

/**
 * Ensure the XML fed back to Draw.io is a valid mxfile / mxGraphModel document.
 *
 * Problems this guards against:
 * - The `xmlsvg` export format wraps SVG *inside* the mxfile XML. If that
 *   string is naively stored as "the diagram XML" and then reloaded, Draw.io
 *   throws "Unescaped '<' not allowed in attribute values" because SVG markup
 *   appears inside XML attribute content.
 * - Stale attribute values that contain raw `<` / `>` characters.
 *
 * Strategy: extract only the `<mxfile …>…</mxfile>` or
 * `<mxGraphModel …>…</mxGraphModel>` subtree. Returns the blank fallback for
 * anything unrecognised.
 */
export function sanitizeDiagramXml(xml: string): string {
  if (!xml || typeof xml !== 'string') return BLANK_DRAWIO_XML;

  const trimmed = xml.trim();

  // mxfile document — strip anything that appears after </mxfile>
  if (trimmed.startsWith('<mxfile')) {
    const end = trimmed.indexOf('</mxfile>');
    if (end !== -1) return trimmed.slice(0, end + '</mxfile>'.length);
  }

  // Bare mxGraphModel (no wrapping mxfile)
  if (trimmed.startsWith('<mxGraphModel')) {
    const end = trimmed.indexOf('</mxGraphModel>');
    if (end !== -1) return trimmed.slice(0, end + '</mxGraphModel>'.length);
  }

  // xmlsvg output: starts with something other than <mxfile but contains it
  if (trimmed.includes('<mxfile') && trimmed.includes('</mxfile>')) {
    const start = trimmed.indexOf('<mxfile');
    const end = trimmed.indexOf('</mxfile>') + '</mxfile>'.length;
    return trimmed.slice(start, end);
  }

  // Unrecognised — return blank
  return BLANK_DRAWIO_XML;
}

// ─── postMessage helpers ──────────────────────────────────────────────────────

/**
 * Send a typed action to the Draw.io iframe window.
 */
export function sendDrawioAction(
  iframe: HTMLIFrameElement | null,
  action: DrawioAction,
) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(JSON.stringify(action), '*');
  } catch (err) {
    console.error('Failed to postMessage to Draw.io iframe:', err);
  }
}

/**
 * Send load action to populate the Draw.io editor.
 * The XML is sanitized before sending to prevent XML parse errors in Draw.io.
 */
export function loadDiagramIntoDrawio(
  iframe: HTMLIFrameElement | null,
  xml: string,
  title?: string,
) {
  sendDrawioAction(iframe, {
    action: 'load',
    xml: sanitizeDiagramXml(xml),
    autosave: 1,
    title: title || 'Untitled Diagram',
  });
}

/**
 * Request SVG export from Draw.io editor.
 *
 * Uses `'svg'` by default (not `'xmlsvg'`) so:
 * - `msg.data`  → pure SVG data URL (safe to store as the SVG preview)
 * - `msg.xml`   → clean diagram XML (safe to reload into Draw.io later)
 *
 * Using `'xmlsvg'` would embed SVG inside the XML which, if naively stored
 * and reloaded, triggers "Unescaped '<' not allowed in attribute values".
 */
export function requestDrawioExport(
  iframe: HTMLIFrameElement | null,
  format: 'svg' | 'xmlsvg' = 'svg',
) {
  sendDrawioAction(iframe, {
    action: 'export',
    format,
    spin: 'Generating SVG...',
  });
}

// ─── SVG decoder ─────────────────────────────────────────────────────────────

/**
 * Normalize SVG data received from a Draw.io export event.
 * Handles base64 data URLs, percent-encoded data URLs, and raw SVG strings.
 */
export function decodeDrawioSvgData(dataUrlOrSvg: string): string {
  if (!dataUrlOrSvg) return '';

  // data:image/svg+xml;base64,…
  if (dataUrlOrSvg.startsWith('data:image/svg+xml;base64,')) {
    const base64 = dataUrlOrSvg.slice('data:image/svg+xml;base64,'.length);
    try {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
    } catch {
      try {
        return atob(base64);
      } catch (err) {
        console.error('Failed to decode base64 SVG:', err);
        return '';
      }
    }
  }

  // data:image/svg+xml,… (percent-encoded)
  if (dataUrlOrSvg.startsWith('data:image/svg+xml,')) {
    return decodeURIComponent(dataUrlOrSvg.slice('data:image/svg+xml,'.length));
  }

  // Raw SVG markup
  if (dataUrlOrSvg.includes('<svg') && dataUrlOrSvg.includes('</svg>')) {
    return dataUrlOrSvg;
  }

  return dataUrlOrSvg;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Default blank diagram XML loaded into a new Draw.io editor.
 */
export const BLANK_DRAWIO_XML = `<mxfile host="app.diagrams.net">
  <diagram id="diagram_1" name="Page-1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
