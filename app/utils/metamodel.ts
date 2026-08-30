/**
 * Metamodel — frontend type definitions.
 *
 * ObjectType and RelationshipType each carry:
 *   - `id`  – a stable client-side slug (e.g. 'ot-microservice') used in the
 *             DEFAULT_METAMODEL and as a local reference key before save
 *   - `_id` – the MongoDB ObjectId string assigned by the backend after first
 *             save; always present on documents loaded from the API
 *
 * RelationshipType.allowedSourceTypes / allowedTargetTypes store *backend _id*
 * strings after save. Before save (DEFAULT_METAMODEL) they carry slug strings
 * that the frontend sync service re-maps to real _ids before sending to the API.
 */

import type { NodeShape } from './yfiles-styles';

export type AttributeType = 'string' | 'number' | 'boolean' | 'enum';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: AttributeType;
  enumValues?: string[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
}

export interface ObjectTypeDefinition {
  /** Client-side stable slug, e.g. 'ot-microservice'. Used before first save. */
  id: string;
  /** MongoDB ObjectId string – present after the document has been persisted. */
  _id?: string;
  name: string;
  group?: string;
  description?: string;
  icon: string;
  color: string;
  shape: NodeShape;
  defaultWidth?: number;
  defaultHeight?: number;
  allowedAttributes: AttributeDefinition[];
}

export interface RelationshipTypeDefinition {
  /** Client-side stable slug, e.g. 'rt-calls'. Used before first save. */
  id: string;
  /** MongoDB ObjectId string – present after the document has been persisted. */
  _id?: string;
  name: string;
  description?: string;
  color: string;
  strokeWidth?: number;
  dashed?: boolean;
  /**
   * List of ObjectType identifiers this relationship may originate from.
   * Before save: slug strings (e.g. 'ot-microservice').
   * After save: MongoDB ObjectId strings of the saved ObjectTypes.
   * Empty / absent = any ObjectType is a valid source.
   */
  allowedSourceTypes?: string[];
  /**
   * List of ObjectType identifiers this relationship may target.
   * Before save: slug strings. After save: MongoDB ObjectId strings.
   * Empty / absent = any ObjectType is a valid target.
   */
  allowedTargetTypes?: string[];
}

export interface Metamodel {
  objectTypes: ObjectTypeDefinition[];
  relationshipTypes: RelationshipTypeDefinition[];
}

// ─── Default built-in metamodel ───────────────────────────────────────────────

export const DEFAULT_METAMODEL: Metamodel = {
  objectTypes: [
    {
      id: 'ot-microservice',
      name: 'Microservice',
      group: 'Infrastructure',
      description: 'An independently deployable service',
      icon: 'server',
      color: '#6366f1',
      shape: 'card',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'technology', label: 'Technology', type: 'enum', enumValues: ['Node.js', 'Go', 'Python', 'Java', 'Rust', 'Other'], defaultValue: 'Node.js' },
        { key: 'version', label: 'Version', type: 'string', placeholder: 'e.g. 2.4.1' },
        { key: 'port', label: 'Port', type: 'number', placeholder: '8080' },
        { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 1 },
        { key: 'healthCheck', label: 'Health Check URL', type: 'string', placeholder: '/health' },
        { key: 'monitored', label: 'Monitored', type: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'ot-database',
      name: 'Database',
      group: 'Infrastructure',
      description: 'A persistent data store',
      icon: 'database',
      color: '#3b82f6',
      shape: 'cylinder',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'engine', label: 'Engine', type: 'enum', enumValues: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Other'], defaultValue: 'PostgreSQL' },
        { key: 'version', label: 'Version', type: 'string', placeholder: 'e.g. 15.2' },
        { key: 'schema', label: 'Schema / DB Name', type: 'string', placeholder: 'mydb' },
        { key: 'replication', label: 'Replication', type: 'enum', enumValues: ['None', 'Primary-Replica', 'Multi-AZ', 'Sharded'], defaultValue: 'None' },
        { key: 'encrypted', label: 'Encrypted at Rest', type: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'ot-api-gateway',
      name: 'API Gateway',
      group: 'Infrastructure',
      description: 'An API gateway or reverse proxy',
      icon: 'gateway',
      color: '#a855f7',
      shape: 'card',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'product', label: 'Product', type: 'enum', enumValues: ['Kong', 'NGINX', 'AWS API Gateway', 'Traefik', 'Envoy', 'Custom'] },
        { key: 'protocols', label: 'Protocols', type: 'string', placeholder: 'HTTP, gRPC, WebSocket' },
        { key: 'rateLimit', label: 'Rate Limit (req/s)', type: 'number', placeholder: '1000' },
        { key: 'auth', label: 'Auth Method', type: 'enum', enumValues: ['JWT', 'OAuth2', 'API Key', 'mTLS', 'None'] },
      ],
    },
    {
      id: 'ot-message-queue',
      name: 'Message Queue',
      group: 'Infrastructure',
      description: 'An async messaging system or event bus',
      icon: 'queue',
      color: '#eab308',
      shape: 'cylinder',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'technology', label: 'Technology', type: 'enum', enumValues: ['Kafka', 'RabbitMQ', 'AWS SQS', 'NATS', 'Redis Streams', 'Other'] },
        { key: 'topic', label: 'Topic / Queue Name', type: 'string', placeholder: 'orders.created' },
        { key: 'partitions', label: 'Partitions', type: 'number', defaultValue: 3 },
        { key: 'retention', label: 'Retention (hours)', type: 'number', defaultValue: 168 },
      ],
    },
    {
      id: 'ot-cdn',
      name: 'CDN / Edge',
      group: 'Infrastructure',
      description: 'Content delivery network or edge layer',
      icon: 'cloud',
      color: '#f97316',
      shape: 'card',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'provider', label: 'Provider', type: 'enum', enumValues: ['Cloudflare', 'AWS CloudFront', 'Fastly', 'Akamai', 'Other'] },
        { key: 'waf', label: 'WAF Enabled', type: 'boolean', defaultValue: true },
        { key: 'ddos', label: 'DDoS Protection', type: 'boolean', defaultValue: true },
        { key: 'cachePolicy', label: 'Cache Policy', type: 'string', placeholder: 'max-age=3600' },
      ],
    },
    {
      id: 'ot-client',
      name: 'Client',
      group: 'Actors',
      description: 'An end-user client application',
      icon: 'user',
      color: '#38bdf8',
      shape: 'capsule',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'platform', label: 'Platform', type: 'enum', enumValues: ['Web Browser', 'iOS', 'Android', 'Desktop', 'CLI', 'Third-party API'] },
        { key: 'auth', label: 'Auth Method', type: 'enum', enumValues: ['JWT Cookie', 'OAuth2 PKCE', 'API Key', 'None'] },
      ],
    },
    {
      id: 'ot-iam',
      name: 'Auth / IAM',
      group: 'Security',
      description: 'Identity and access management service',
      icon: 'shield',
      color: '#ef4444',
      shape: 'card',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'provider', label: 'Provider', type: 'enum', enumValues: ['Auth0', 'Keycloak', 'AWS Cognito', 'Okta', 'Custom'] },
        { key: 'mfa', label: 'MFA Enabled', type: 'boolean', defaultValue: true },
        { key: 'tokenType', label: 'Token Type', type: 'enum', enumValues: ['JWT', 'Opaque', 'SAML'] },
        { key: 'ssoEnabled', label: 'SSO Enabled', type: 'boolean', defaultValue: false },
      ],
    },
    {
      id: 'ot-container',
      name: 'Container / Pod',
      group: 'Infrastructure',
      description: 'A Docker container or Kubernetes pod',
      icon: 'docker',
      color: '#06b6d4',
      shape: 'card',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'image', label: 'Docker Image', type: 'string', placeholder: 'nginx:1.25-alpine' },
        { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
        { key: 'cpuLimit', label: 'CPU Limit', type: 'string', placeholder: '500m' },
        { key: 'memLimit', label: 'Memory Limit', type: 'string', placeholder: '256Mi' },
        { key: 'namespace', label: 'K8s Namespace', type: 'string', placeholder: 'production' },
      ],
    },
    {
      id: 'ot-process',
      name: 'Process Step',
      group: 'Flowchart',
      description: 'A step in a process or workflow',
      icon: 'process',
      color: '#6366f1',
      shape: 'rectangle',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'owner', label: 'Owner / Team', type: 'string', placeholder: 'Platform Team' },
        { key: 'duration', label: 'Est. Duration', type: 'string', placeholder: '2 hours' },
        { key: 'automated', label: 'Automated', type: 'boolean', defaultValue: false },
        { key: 'sla', label: 'SLA (minutes)', type: 'number' },
      ],
    },
    {
      id: 'ot-decision',
      name: 'Decision',
      group: 'Flowchart',
      description: 'A branching decision gate',
      icon: 'decision',
      color: '#f59e0b',
      shape: 'diamond',
      defaultWidth: 120,
      defaultHeight: 100,
      allowedAttributes: [
        { key: 'condition', label: 'Condition', type: 'string', placeholder: 'Is valid?' },
        { key: 'trueLabel', label: 'True Branch Label', type: 'string', placeholder: 'Yes' },
        { key: 'falseLabel', label: 'False Branch Label', type: 'string', placeholder: 'No' },
      ],
    },
    {
      id: 'ot-storage',
      name: 'Object Storage',
      group: 'Infrastructure',
      description: 'Blob or object storage bucket',
      icon: 'storage',
      color: '#14b8a6',
      shape: 'cylinder',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [
        { key: 'provider', label: 'Provider', type: 'enum', enumValues: ['AWS S3', 'GCS', 'Azure Blob', 'MinIO', 'Other'] },
        { key: 'bucket', label: 'Bucket / Container Name', type: 'string', placeholder: 'my-app-assets' },
        { key: 'encrypted', label: 'Encrypted', type: 'boolean', defaultValue: true },
        { key: 'publicAccess', label: 'Public Access', type: 'boolean', defaultValue: false },
        { key: 'versioning', label: 'Versioning', type: 'boolean', defaultValue: false },
      ],
    },
  ],

  relationshipTypes: [
    {
      id: 'rt-calls',
      name: 'Calls (sync)',
      description: 'Synchronous HTTP/gRPC call',
      color: '#6366f1',
      strokeWidth: 2.5,
      dashed: false,
    },
    {
      id: 'rt-publishes',
      name: 'Publishes',
      description: 'Publishes an event or message',
      color: '#eab308',
      strokeWidth: 2,
      dashed: false,
    },
    {
      id: 'rt-subscribes',
      name: 'Subscribes',
      description: 'Consumes events or messages',
      color: '#f97316',
      strokeWidth: 2,
      dashed: true,
    },
    {
      id: 'rt-reads',
      name: 'Reads',
      description: 'Reads data from',
      color: '#3b82f6',
      strokeWidth: 2,
      dashed: false,
      allowedTargetTypes: ['ot-database', 'ot-storage'],
    },
    {
      id: 'rt-writes',
      name: 'Writes',
      description: 'Writes data to',
      color: '#10b981',
      strokeWidth: 2.5,
      dashed: false,
      allowedTargetTypes: ['ot-database', 'ot-storage'],
    },
    {
      id: 'rt-managed-by',
      name: 'Managed by',
      description: 'This entity is managed/owned by',
      color: '#64748b',
      strokeWidth: 1.5,
      dashed: true,
    },
    {
      id: 'rt-routes-to',
      name: 'Routes to',
      description: 'Traffic is forwarded to',
      color: '#a855f7',
      strokeWidth: 2.5,
      dashed: false,
    },
    {
      id: 'rt-depends-on',
      name: 'Depends on',
      description: 'Has a runtime dependency on',
      color: '#f43f5e',
      strokeWidth: 1.5,
      dashed: true,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up an ObjectType by either its backend _id or its client-side id slug. */
export function findObjectType(
  metamodel: Metamodel,
  id: string,
): ObjectTypeDefinition | undefined {
  return metamodel.objectTypes.find(t => t._id === id || t.id === id);
}

/** Look up a RelationshipType by either its backend _id or its client-side id slug. */
export function findRelationshipType(
  metamodel: Metamodel,
  id: string,
): RelationshipTypeDefinition | undefined {
  return metamodel.relationshipTypes.find(t => t._id === id || t.id === id);
}

/** Build instance attributes map pre-filled with default values. */
export function buildDefaultAttributes(
  objectType: ObjectTypeDefinition,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const attr of objectType.allowedAttributes) {
    if (attr.defaultValue !== undefined) {
      result[attr.key] = attr.defaultValue;
    }
  }
  return result;
}

/** Return unique group names in insertion order. */
export function getObjectTypeGroups(metamodel: Metamodel): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const ot of metamodel.objectTypes) {
    const g = ot.group ?? 'Other';
    if (!seen.has(g)) { seen.add(g); groups.push(g); }
  }
  return groups;
}

/**
 * Merge backend-persisted ObjectTypes back into the local metamodel so that
 * each entry gains its real `_id`.  Called after a successful save.
 */
export function mergeBackendIds(
  local: Metamodel,
  savedObjectTypes: ObjectTypeDefinition[],
  savedRelationshipTypes: RelationshipTypeDefinition[],
): Metamodel {
  // Build slug → _id map from the saved ObjectTypes
  const idBySlug = new Map<string, string>();
  for (const saved of savedObjectTypes) {
    const match = local.objectTypes.find(
      t => t.name === saved.name && t.group === saved.group,
    );
    if (match && saved._id) idBySlug.set(match.id, saved._id);
  }

  const mergedOTs = local.objectTypes.map(ot => {
    const savedOT = savedObjectTypes.find(
      s => s._id === ot._id || s.name === ot.name,
    );
    return { ...ot, _id: savedOT?._id ?? ot._id };
  });

  const mergedRTs = local.relationshipTypes.map(rt => {
    const savedRT = savedRelationshipTypes.find(
      s => s._id === rt._id || s.name === rt.name,
    );
    return { ...rt, _id: savedRT?._id ?? rt._id };
  });

  return { objectTypes: mergedOTs, relationshipTypes: mergedRTs };
}

/** Colour palette for user-created types. */
export const TYPE_COLOR_PALETTE = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#eab308',
  '#f97316', '#ef4444', '#a855f7', '#14b8a6', '#f43f5e',
  '#38bdf8', '#64748b', '#8b5cf6', '#ec4899', '#84cc16',
];
