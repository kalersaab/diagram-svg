import { defaults } from '../defaults';

export const yfilesEndpoint = {
  getYFilesModels: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/yfiles-models',
    },
  },

  getYFilesModel: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/yfiles-models/:id',
    },
  },

  createYFilesModel: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/yfiles-models',
    },
  },

  updateYFilesModel: {
    v1: {
      ...defaults.methods.PUT,
      ...defaults.versions.v1,
      uri: '/yfiles-models/:id',
    },
  },

  deleteYFilesModel: {
    v1: {
      ...defaults.methods.DELETE,
      ...defaults.versions.v1,
      uri: '/yfiles-models/:id',
    },
  },
};
