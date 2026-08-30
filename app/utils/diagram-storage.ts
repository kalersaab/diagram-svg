/**
 * Diagram storage helpers.
 *
 * localStorage functions are kept for offline / guest use and as an optimistic
 * cache.  The API-backed helpers in diagrams-api.ts are the source of truth when
 * the user is authenticated.
 */

export interface StoredDiagram {
  id: string;
  title: string;
  description: string;
  category: 'cloud' | 'flowchart' | 'uml' | 'network' | 'system' | 'custom';
  xml: string;
  svg?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'drawio_saved_diagrams_v2';
const ACTIVE_ID_KEY = 'drawio_active_diagram_id_v2';

export const SAMPLE_DRAWIO_DIAGRAMS: StoredDiagram[] = [
  {
    id: 'sample-cloud-arch',
    title: 'Cloud Microservices & Edge CDN',
    description: 'High-availability global microservices architecture with CDN, API Gateway, and Distributed DB.',
    category: 'cloud',
    createdAt: 1724000000000,
    updatedAt: 1724000000000,
    xml: `<mxfile host="app.diagrams.net">
  <diagram id="cloud-arch" name="Cloud Architecture">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        
        <!-- Clients -->
        <mxCell id="client1" value="Web &amp; Mobile Clients" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#6366f1;strokeColor=#4f46e5;fontColor=#ffffff;fontStyle=1;arcSize=24;" vertex="1" parent="1">
          <mxGeometry x="60" y="240" width="160" height="60" as="geometry"/>
        </mxCell>
        
        <!-- Cloudflare Edge -->
        <mxCell id="cdn1" value="Global Edge CDN &amp; WAF&#xa;(DDoS Protection / SSL)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#3b82f6;strokeColor=#2563eb;fontColor=#ffffff;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="280" y="235" width="180" height="70" as="geometry"/>
        </mxCell>
        
        <!-- API Gateway -->
        <mxCell id="gw1" value="API Gateway Cluster&#xa;(JWT Auth / Rate Limiting)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ec4899;strokeColor=#db2777;fontColor=#ffffff;fontStyle=1;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="520" y="235" width="180" height="70" as="geometry"/>
        </mxCell>
        
        <!-- Microservice 1 -->
        <mxCell id="svc1" value="Auth &amp; User Service&#xa;(Node.js / OAuth2)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#10b981;strokeColor=#059669;fontColor=#ffffff;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="770" y="130" width="180" height="60" as="geometry"/>
        </mxCell>
        
        <!-- Microservice 2 -->
        <mxCell id="svc2" value="Core GraphQL API&#xa;(Go / High Concurrency)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#10b981;strokeColor=#059669;fontColor=#ffffff;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="770" y="240" width="180" height="60" as="geometry"/>
        </mxCell>
        
        <!-- Microservice 3 -->
        <mxCell id="svc3" value="Analytics &amp; AI Service&#xa;(Python / PyTorch)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#10b981;strokeColor=#059669;fontColor=#ffffff;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="770" y="350" width="180" height="60" as="geometry"/>
        </mxCell>
        
        <!-- Database -->
        <mxCell id="db1" value="PostgreSQL Distributed Cluster&#xa;(Read Replicas + Sharding)" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#8b5cf6;strokeColor=#7c3aed;fontColor=#ffffff;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1020" y="160" width="190" height="90" as="geometry"/>
        </mxCell>
        
        <!-- Redis Cache -->
        <mxCell id="cache1" value="Redis Cache Cluster&#xa;(In-Memory L2 Cache)" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#f59e0b;strokeColor=#d97706;fontColor=#ffffff;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="1020" y="310" width="190" height="90" as="geometry"/>
        </mxCell>
        
        <!-- Connectors -->
        <mxCell id="e1" value="HTTPS" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#6366f1;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="client1" target="cdn1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e2" value="mTLS" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3b82f6;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="cdn1" target="gw1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e3" value="Route /auth" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ec4899;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="gw1" target="svc1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e4" value="Route /graphql" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ec4899;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="gw1" target="svc2">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e5" value="Route /ai" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#ec4899;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="gw1" target="svc3">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e6" value="SQL Queries" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#10b981;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="svc2" target="db1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="e7" value="Sessions" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#10b981;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="svc1" target="cache1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="980" y="160"/>
              <mxPoint x="980" y="340"/>
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="e8" value="Pub/Sub Events" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#10b981;strokeWidth=2;fontColor=#a1a1aa;" edge="1" parent="1" source="svc3" target="cache1">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  },
  {
    id: 'sample-ai-pipeline',
    title: 'Autonomous AI Agent Pipeline',
    description: 'Multi-agent orchestration workflow with retrieval augmented generation, tools, and evaluation.',
    category: 'system',
    createdAt: 1724000000000,
    updatedAt: 1724000000000,
    xml: `<mxfile host="app.diagrams.net">
  <diagram id="ai-pipeline" name="AI Agent Pipeline">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        
        <mxCell id="user_prompt" value="User Query / Task Prompt" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#6366f1;strokeColor=#4f46e5;fontColor=#ffffff;fontStyle=1;arcSize=24;" vertex="1" parent="1">
          <mxGeometry x="60" y="200" width="180" height="60" as="geometry"/>
        </mxCell>
        
        <mxCell id="orchestrator" value="Planner &amp; Router Agent&#xa;(Gemini 1.5 Pro / GPT-4o)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#8b5cf6;strokeColor=#7c3aed;fontColor=#ffffff;fontStyle=1;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="300" y="195" width="190" height="70" as="geometry"/>
        </mxCell>
        
        <mxCell id="rag_engine" value="Vector DB &amp; Hybrid RAG&#xa;(Pinecone / Milvus)" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#06b6d4;strokeColor=#0891b2;fontColor=#ffffff;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="550" y="80" width="180" height="80" as="geometry"/>
        </mxCell>
        
        <mxCell id="tool_agent" value="Tool Execution Engine&#xa;(Code Exec, Web, APIs)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f59e0b;strokeColor=#d97706;fontColor=#ffffff;fontStyle=1;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="550" y="195" width="180" height="70" as="geometry"/>
        </mxCell>
        
        <mxCell id="evaluator" value="Critic &amp; Safety Guardrail&#xa;(Self-Reflection / Validator)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ec4899;strokeColor=#db2777;fontColor=#ffffff;fontStyle=1;arcSize=16;" vertex="1" parent="1">
          <mxGeometry x="550" y="310" width="180" height="70" as="geometry"/>
        </mxCell>
        
        <mxCell id="output_node" value="Structured Final Response&#xa;(&amp; UI Visualization)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#10b981;strokeColor=#059669;fontColor=#ffffff;fontStyle=1;arcSize=24;" vertex="1" parent="1">
          <mxGeometry x="800" y="195" width="200" height="70" as="geometry"/>
        </mxCell>
        
        <mxCell id="p1" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#6366f1;strokeWidth=2;" edge="1" parent="1" source="user_prompt" target="orchestrator">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="p2" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#8b5cf6;strokeWidth=2;" edge="1" parent="1" source="orchestrator" target="rag_engine">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="p3" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#8b5cf6;strokeWidth=2;" edge="1" parent="1" source="orchestrator" target="tool_agent">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="p4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#8b5cf6;strokeWidth=2;" edge="1" parent="1" source="orchestrator" target="evaluator">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="p5" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#10b981;strokeWidth=2;" edge="1" parent="1" source="evaluator" target="output_node">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="760" y="345"/>
              <mxPoint x="760" y="230"/>
            </Array>
          </mxGeometry>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  }
];

export function getStoredDiagrams(): StoredDiagram[] {
  if (typeof window === 'undefined') return SAMPLE_DRAWIO_DIAGRAMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DRAWIO_DIAGRAMS));
      return SAMPLE_DRAWIO_DIAGRAMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_DRAWIO_DIAGRAMS;
  } catch (e) {
    console.error('Failed to read diagrams from localStorage', e);
    return SAMPLE_DRAWIO_DIAGRAMS;
  }
}

export function saveDiagramToStorage(diagram: StoredDiagram): StoredDiagram[] {
  if (typeof window === 'undefined') return [];
  try {
    const diagrams = getStoredDiagrams();
    const existingIndex = diagrams.findIndex((d) => d.id === diagram.id);
    let updated: StoredDiagram[];
    
    if (existingIndex >= 0) {
      updated = [...diagrams];
      updated[existingIndex] = {
        ...diagram,
        updatedAt: Date.now()
      };
    } else {
      updated = [
        {
          ...diagram,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        ...diagrams
      ];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_ID_KEY, diagram.id);
    return updated;
  } catch (e) {
    console.error('Failed to save diagram to localStorage', e);
    return [];
  }
}

export function deleteDiagramFromStorage(id: string): StoredDiagram[] {
  if (typeof window === 'undefined') return [];
  try {
    const diagrams = getStoredDiagrams();
    const updated = diagrams.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete diagram', e);
    return [];
  }
}

export function getActiveDiagramId(): string {
  if (typeof window === 'undefined') return 'sample-cloud-arch';
  return localStorage.getItem(ACTIVE_ID_KEY) || 'sample-cloud-arch';
}

export function setActiveDiagramId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

/**
 * File Download helpers
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSvgAsPng(svgContent: string, fileName: string) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1920;
    canvas.height = img.naturalHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
