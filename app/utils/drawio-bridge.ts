
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
  data: string; 
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

export function sanitizeDiagramXml(xml: string): string {
  if (!xml || typeof xml !== 'string') return BLANK_DRAWIO_XML;

  const trimmed = xml.trim();

  if (trimmed.startsWith('<mxfile')) {
    const end = trimmed.indexOf('</mxfile>');
    if (end !== -1) return trimmed.slice(0, end + '</mxfile>'.length);
  }

  if (trimmed.startsWith('<mxGraphModel')) {
    const end = trimmed.indexOf('</mxGraphModel>');
    if (end !== -1) return trimmed.slice(0, end + '</mxGraphModel>'.length);
  }

  if (trimmed.includes('<mxfile') && trimmed.includes('</mxfile>')) {
    const start = trimmed.indexOf('<mxfile');
    const end = trimmed.indexOf('</mxfile>') + '</mxfile>'.length;
    return trimmed.slice(start, end);
  }

  return BLANK_DRAWIO_XML;
}

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

export function decodeDrawioSvgData(dataUrlOrSvg: string): string {
  if (!dataUrlOrSvg) return '';

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

  if (dataUrlOrSvg.startsWith('data:image/svg+xml,')) {
    return decodeURIComponent(dataUrlOrSvg.slice('data:image/svg+xml,'.length));
  }

  if (dataUrlOrSvg.includes('<svg') && dataUrlOrSvg.includes('</svg>')) {
    return dataUrlOrSvg;
  }

  return dataUrlOrSvg;
}

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