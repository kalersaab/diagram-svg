import { defaults } from '../defaults';

export const user = {
  /** POST /signup */
  signup: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/signup',
    },
  },

  /** POST /login */
  login: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/login',
    },
  },

  /** POST /logout */
  logout: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/logout',
    },
  },

  /** GET /users */
  getUsers: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/users',
    },
  },

  /** GET /users/:id */
  getUserById: {
    v1: {
      ...defaults.methods.GET,
      ...defaults.versions.v1,
      uri: '/users/:id',
    },
  },

  /** POST /users */
  createUser: {
    v1: {
      ...defaults.methods.POST,
      ...defaults.versions.v1,
      uri: '/users',
    },
  },

  /** PUT /users/:id */
  updateUser: {
    v1: {
      ...defaults.methods.PUT,
      ...defaults.versions.v1,
      uri: '/users/:id',
    },
  },

  /** DELETE /users/:id */
  deleteUser: {
    v1: {
      ...defaults.methods.DELETE,
      ...defaults.versions.v1,
      uri: '/users/:id',
    },
  },
};
