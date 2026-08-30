import { defaults } from '../defaults';

export const user = {
  signup: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/signup',
    },
  },

  login: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/login',
    },
  },

  logout: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/logout',
    },
  },

  getUsers: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/users',
    },
  },

  getUserById: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/users/:id',
    },
  },

  createUser: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/users',
    },
  },

  updateUser: {
    v1: {
      ...defaults.methods.PUT,
      ...defaults.versions.v1,
      uri: '/users/:id',
    },
  },

  deleteUser: {
    v1: {
      ...defaults.methods.DELETE,
      ...defaults.versions.v1,
      uri: '/users/:id',
    },
  },
};