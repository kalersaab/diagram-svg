import { defaults } from '../defaults';

export const diagram = {
  getDiagrams: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/diagrams',
    },
  },

  getDiagram: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/diagrams/:id',
    },
  },

  createDiagram: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/diagrams',
    },
  },

  updateDiagram: {
    v1: {
      ...defaults.methods.PUT,
      ...defaults.versions.v1,
      uri: '/diagrams/:id',
    },
  },

  deleteDiagram: {
    v1: {
      ...defaults.methods.DELETE,
      ...defaults.versions.v1,
      uri: '/diagrams/:id',
    },
  },
};
