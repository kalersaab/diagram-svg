import { type IGraph, type INode, Rect } from '@yfiles/yfiles';
import { type DiagramEdgeData, type DiagramNodeData } from './yfiles-styles';
import { type LayoutType } from './yfiles-layouts';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  recommendedLayout: LayoutType;
  nodes: {
    id: string;
    tag: DiagramNodeData;
    width?: number;
    height?: number;
  }[];
  edges: {
    source: string;
    target: string;
    tag?: DiagramEdgeData;
  }[];
}

export const SAMPLE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'cloud-architecture',
    name: 'Cloud Microservices & Kubernetes',
    category: 'Architecture',
    description: 'High-scale microservices system with API Gateway, Kafka, Redis, and DB cluster.',
    recommendedLayout: 'hierarchical-tb',
    nodes: [
      {
        id: 'client',
        tag: {
          title: 'Client Apps',
          subtitle: 'Web, iOS & Android',
          icon: 'user',
          color: '#38bdf8',
          badge: 'v3.2',
          shape: 'card'
        }
      },
      {
        id: 'cdn',
        tag: {
          title: 'Cloudflare Edge',
          subtitle: 'CDN, WAF & DDoS Filter',
          icon: 'cloud',
          color: '#f97316',
          badge: 'Global',
          shape: 'card'
        }
      },
      {
        id: 'gateway',
        tag: {
          title: 'Kong API Gateway',
          subtitle: 'Rate Limiter & Routing',
          icon: 'gateway',
          color: '#a855f7',
          shape: 'card',
          status: 'online'
        }
      },
      {
        id: 'auth',
        tag: {
          title: 'Auth0 / IAM Service',
          subtitle: 'JWT & OAuth2 Tokens',
          icon: 'shield',
          color: '#ef4444',
          shape: 'card'
        }
      },
      {
        id: 'order_service',
        tag: {
          title: 'Order Microservice',
          subtitle: 'Go / gRPC Server',
          icon: 'docker',
          color: '#6366f1',
          shape: 'card',
          status: 'online'
        }
      },
      {
        id: 'product_service',
        tag: {
          title: 'Product Catalog',
          subtitle: 'Node.js / Express',
          icon: 'docker',
          color: '#06b6d4',
          shape: 'card',
          status: 'online'
        }
      },
      {
        id: 'payment_service',
        tag: {
          title: 'Payment Gateway',
          subtitle: 'Stripe & PayPal Hook',
          icon: 'shield',
          color: '#10b981',
          shape: 'card'
        }
      },
      {
        id: 'kafka',
        tag: {
          title: 'Kafka Event Bus',
          subtitle: 'Pub/Sub Broker Cluster',
          icon: 'queue',
          color: '#eab308',
          badge: '3 Nodes',
          shape: 'cylinder'
        }
      },
      {
        id: 'redis',
        tag: {
          title: 'Redis Cache',
          subtitle: 'In-memory Cache & Sessions',
          icon: 'database',
          color: '#ec4899',
          shape: 'cylinder'
        }
      },
      {
        id: 'postgres',
        tag: {
          title: 'PostgreSQL Cluster',
          subtitle: 'Primary + Read Replicas',
          icon: 'database',
          color: '#3b82f6',
          badge: 'Multi-AZ',
          shape: 'cylinder'
        }
      },
      {
        id: 's3',
        tag: {
          title: 'AWS S3 Bucket',
          subtitle: 'Encrypted Media Assets',
          icon: 'storage',
          color: '#14b8a6',
          shape: 'cylinder'
        }
      }
    ],
    edges: [
      { source: 'client', target: 'cdn', tag: { label: 'HTTPS / TLS', color: '#38bdf8' } },
      { source: 'cdn', target: 'gateway', tag: { label: 'Route Traffic', color: '#f97316' } },
      { source: 'gateway', target: 'auth', tag: { label: 'Verify Token', color: '#ef4444' } },
      { source: 'gateway', target: 'order_service', tag: { label: '/api/v1/orders', color: '#6366f1' } },
      { source: 'gateway', target: 'product_service', tag: { label: '/api/v1/products', color: '#06b6d4' } },
      { source: 'order_service', target: 'payment_service', tag: { label: 'Process Bill', color: '#10b981' } },
      { source: 'order_service', target: 'kafka', tag: { label: 'Publish Event', color: '#eab308' } },
      { source: 'product_service', target: 'redis', tag: { label: 'Query Cache', color: '#ec4899' } },
      { source: 'product_service', target: 'postgres', tag: { label: 'Read/Write DB', color: '#3b82f6' } },
      { source: 'order_service', target: 'postgres', tag: { label: 'Persist Order', color: '#3b82f6' } },
      { source: 'product_service', target: 's3', tag: { label: 'Fetch Images', color: '#14b8a6' } }
    ]
  },
  {
    id: 'cicd-flowchart',
    name: 'CI/CD Automated Deployment Flow',
    category: 'DevOps',
    description: 'Continuous Integration & Deployment workflow with automated testing and blue-green rollout.',
    recommendedLayout: 'hierarchical-lr',
    nodes: [
      {
        id: 'git_push',
        tag: {
          title: 'Git Push',
          subtitle: 'main branch trigger',
          icon: 'code',
          color: '#6366f1',
          shape: 'capsule'
        }
      },
      {
        id: 'test_stage',
        tag: {
          title: 'Lint & Unit Tests',
          subtitle: 'Jest & TypeScript check',
          icon: 'process',
          color: '#06b6d4',
          shape: 'card'
        }
      },
      {
        id: 'docker_build',
        tag: {
          title: 'Docker Image Build',
          subtitle: 'Multi-stage Dockerfile',
          icon: 'docker',
          color: '#3b82f6',
          shape: 'card'
        }
      },
      {
        id: 'security_scan',
        tag: {
          title: 'Security & CVE Scan',
          subtitle: 'Trivy / SonarQube',
          icon: 'shield',
          color: '#eab308',
          shape: 'card'
        }
      },
      {
        id: 'deploy_staging',
        tag: {
          title: 'Deploy to Staging',
          subtitle: 'K8s cluster rollout',
          icon: 'k8s',
          color: '#a855f7',
          shape: 'card'
        }
      },
      {
        id: 'e2e_tests',
        tag: {
          title: 'E2E & Smoke Tests',
          subtitle: 'Playwright automation',
          icon: 'process',
          color: '#ec4899',
          shape: 'card'
        }
      },
      {
        id: 'approval',
        tag: {
          title: 'Manual Gate?',
          subtitle: 'Release Lead Sign-off',
          icon: 'decision',
          color: '#f97316',
          shape: 'diamond'
        }
      },
      {
        id: 'prod_deploy',
        tag: {
          title: 'Production Blue-Green',
          subtitle: '0% Downtime Deployment',
          icon: 'server',
          color: '#10b981',
          shape: 'card',
          badge: 'Live'
        }
      }
    ],
    edges: [
      { source: 'git_push', target: 'test_stage', tag: { color: '#6366f1' } },
      { source: 'test_stage', target: 'docker_build', tag: { label: 'Passed', color: '#06b6d4' } },
      { source: 'docker_build', target: 'security_scan', tag: { color: '#3b82f6' } },
      { source: 'security_scan', target: 'deploy_staging', tag: { label: '0 Vulns', color: '#eab308' } },
      { source: 'deploy_staging', target: 'e2e_tests', tag: { color: '#a855f7' } },
      { source: 'e2e_tests', target: 'approval', tag: { label: '100% Pass', color: '#ec4899' } },
      { source: 'approval', target: 'prod_deploy', tag: { label: 'Approved', color: '#10b981' } }
    ]
  },
  {
    id: 'org-chart',
    name: 'Organization Team Hierarchy',
    category: 'Management',
    description: 'Executive, product, engineering, and design organizational breakdown.',
    recommendedLayout: 'tree',
    nodes: [
      {
        id: 'ceo',
        tag: {
          title: 'Alex Vance',
          subtitle: 'Chief Executive Officer',
          icon: 'user',
          color: '#6366f1',
          badge: 'Exec',
          shape: 'card'
        }
      },
      {
        id: 'vp_eng',
        tag: {
          title: 'Sarah Connor',
          subtitle: 'VP of Engineering',
          icon: 'user',
          color: '#3b82f6',
          shape: 'card'
        }
      },
      {
        id: 'vp_prod',
        tag: {
          title: 'Elena Gomez',
          subtitle: 'VP of Product & UX',
          icon: 'user',
          color: '#ec4899',
          shape: 'card'
        }
      },
      {
        id: 'vp_growth',
        tag: {
          title: 'Marcus Brody',
          subtitle: 'VP of Sales & Growth',
          icon: 'user',
          color: '#10b981',
          shape: 'card'
        }
      },
      {
        id: 'lead_arch',
        tag: {
          title: 'David Chen',
          subtitle: 'Principal Architect',
          icon: 'server',
          color: '#8b5cf6',
          shape: 'card'
        }
      },
      {
        id: 'lead_frontend',
        tag: {
          title: 'Maya Lin',
          subtitle: 'Frontend Engineering Lead',
          icon: 'code',
          color: '#06b6d4',
          shape: 'card'
        }
      },
      {
        id: 'lead_design',
        tag: {
          title: 'Julian Rivera',
          subtitle: 'Design Systems Lead',
          icon: 'user',
          color: '#f43f5e',
          shape: 'card'
        }
      }
    ],
    edges: [
      { source: 'ceo', target: 'vp_eng', tag: { color: '#3b82f6' } },
      { source: 'ceo', target: 'vp_prod', tag: { color: '#ec4899' } },
      { source: 'ceo', target: 'vp_growth', tag: { color: '#10b981' } },
      { source: 'vp_eng', target: 'lead_arch', tag: { color: '#8b5cf6' } },
      { source: 'vp_eng', target: 'lead_frontend', tag: { color: '#06b6d4' } },
      { source: 'vp_prod', target: 'lead_design', tag: { color: '#f43f5e' } }
    ]
  }
];

/**
 * Loads a template into the given graph and applies its recommended layout.
 */
export function loadTemplateIntoGraph(graph: IGraph, template: TemplateDefinition) {
  graph.clear();

  const nodeMap = new Map<string, INode>();

  for (const n of template.nodes) {
    const width = n.width || (n.tag.shape === 'diamond' ? 120 : 180);
    const height = n.height || (n.tag.shape === 'diamond' ? 100 : 58);
    const node = graph.createNode({
      layout: new Rect(0, 0, width, height),
      tag: n.tag
    });
    nodeMap.set(n.id, node);
  }

  for (const e of template.edges) {
    const sourceNode = nodeMap.get(e.source);
    const targetNode = nodeMap.get(e.target);
    if (sourceNode && targetNode) {
      const edge = graph.createEdge({
        source: sourceNode,
        target: targetNode,
        tag: e.tag || {}
      });
      if (e.tag?.label) {
        graph.addLabel(edge, e.tag.label);
      }
    }
  }
}
