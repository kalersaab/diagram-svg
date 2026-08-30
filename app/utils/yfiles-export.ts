import {
  Graph,
  GraphComponent,
  Insets,
  type Rect,
  SvgExport
} from '@yfiles/yfiles';

export interface SvgExportOptions {
  scale?: number;
  background?: string;
  margin?: number;
  bounds?: Rect | null;
  inlineImages?: boolean;
}

/**
 * Exports the graph from GraphComponent into an SVG Element
 */
export async function exportGraphToSvgElement(
  graphComponent: GraphComponent,
  options: SvgExportOptions = {}
): Promise<SVGElement> {
  const {
    scale = 1,
    background = 'transparent',
    margin = 20,
    bounds = null,
    inlineImages = true
  } = options;

  // Create temporary export component
  const exportComponent = new GraphComponent();
  exportComponent.graph = graphComponent.graph;
  exportComponent.updateContentBounds();

  const worldBounds = bounds || exportComponent.contentBounds;

  const exporter = new SvgExport({
    worldBounds,
    scale,
    margins: new Insets(margin, margin, margin, margin),
    encodeImagesBase64: inlineImages,
    inlineSvgImages: inlineImages,
    background: background === 'transparent' ? undefined : background,
    copyDefsElements: true
  });

  exporter.cssStyleSheet = null;

  try {
    const svgElement = await exporter.exportSvgAsync(exportComponent);
    return svgElement as SVGElement;
  } finally {
    exportComponent.graph = new Graph();
    exportComponent.cleanUp();
  }
}

/**
 * Serializes SVG Element to an XML string.
 */
export function svgElementToString(svgElement: SVGElement): string {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure proper namespaces
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }
  if (
    !svgString.includes('xmlns:xlink="http://www.w3.org/1999/xlink"') &&
    svgString.includes('xlink:href')
  ) {
    svgString = svgString.replace(
      '<svg',
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
    );
  }

  // Prepend XML declaration
  return '<?xml version="1.0" encoding="utf-8"?>\n' + svgString;
}

/**
 * Triggers browser download of SVG string as a file.
 */
export function downloadSvgString(svgString: string, filename = 'diagram.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders SVG string to PNG data URL or triggers file download.
 */
export async function downloadPngFromSvg(
  svgString: string,
  filename = 'diagram.png',
  scaleMultiplier = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = (img.naturalWidth || img.width || 800) * scaleMultiplier;
        canvas.height = (img.naturalHeight || img.height || 600) * scaleMultiplier;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.scale(scaleMultiplier, scaleMultiplier);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        resolve(pngUrl);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image element'));
    };

    img.src = url;
  });
}
