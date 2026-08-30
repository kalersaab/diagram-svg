import {
  CircularLayout,
  GraphComponent,
  HierarchicalLayout,
  type ILayoutAlgorithm,
  LayoutExecutor,
  LayoutOrientation,
  OrganicLayout,
  OrthogonalLayout,
  RadialLayout,
  TreeLayout
} from '@yfiles/yfiles';

export type LayoutType =
  | 'hierarchical-tb'
  | 'hierarchical-lr'
  | 'organic'
  | 'orthogonal'
  | 'circular'
  | 'tree'
  | 'radial';

export interface LayoutOptions {
  duration?: string;
  animate?: boolean;
}

export function getLayoutAlgorithm(type: LayoutType): ILayoutAlgorithm {
  switch (type) {
    case 'hierarchical-tb': {
      const layout = new HierarchicalLayout();
      layout.layoutOrientation = LayoutOrientation.TOP_TO_BOTTOM;
      layout.minimumLayerDistance = 75;
      layout.nodeDistance = 45;
      layout.edgeDistance = 25;
      return layout;
    }
    case 'hierarchical-lr': {
      const layout = new HierarchicalLayout();
      layout.layoutOrientation = LayoutOrientation.LEFT_TO_RIGHT;
      layout.minimumLayerDistance = 80;
      layout.nodeDistance = 45;
      layout.edgeDistance = 25;
      return layout;
    }
    case 'organic': {
      const layout = new OrganicLayout();
      layout.defaultMinimumNodeDistance = 75;
      layout.deterministic = true;
      layout.avoidNodeEdgeOverlap = true;
      layout.allowNodeOverlaps = false;
      return layout;
    }
    case 'orthogonal': {
      const layout = new OrthogonalLayout();
      layout.gridSpacing = 35;
      return layout;
    }
    case 'circular': {
      const layout = new CircularLayout();
      return layout;
    }
    case 'tree': {
      const layout = new TreeLayout();
      return layout;
    }
    case 'radial': {
      const layout = new RadialLayout();
      return layout;
    }
    default:
      return new HierarchicalLayout();
  }
}

export async function applyLayout(
  graphComponent: GraphComponent,
  type: LayoutType,
  options: LayoutOptions = {}
): Promise<void> {
  const { duration = '600ms', animate = true } = options;

  if (graphComponent.graph.nodes.size === 0) {
    return;
  }

  const layout = getLayoutAlgorithm(type);

  if (!animate) {
    graphComponent.graph.applyLayout(layout);
    graphComponent.fitGraphBounds();
    return;
  }

  const executor = new LayoutExecutor({
    graphComponent,
    layout,
    animationDuration: duration,
    animateViewport: true,
    easedAnimation: true,
    allowUserInteraction: false
  });

  await executor.start();
}