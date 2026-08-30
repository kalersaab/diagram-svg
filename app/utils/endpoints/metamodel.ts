import { defaults } from '../defaults';

export const metamodel = {

  getMetamodels: {
    v1: { ...defaults.methods.GET, ...defaults.versions.v1, uri: '/metamodels' },
  },
  getMetamodelById: {
    v1: { ...defaults.methods.GET, ...defaults.versions.v1, uri: '/metamodels/:id' },
  },
  createMetamodel: {
    v1: { ...defaults.methods.POST, ...defaults.versions.v1, uri: '/metamodels' },
  },
  updateMetamodel: {
    v1: { ...defaults.methods.PUT, ...defaults.versions.v1, uri: '/metamodels/:id' },
  },
  deleteMetamodel: {
    v1: { ...defaults.methods.DELETE, ...defaults.versions.v1, uri: '/metamodels/:id' },
  },

  addObjectType: {
    v1: { ...defaults.methods.POST, ...defaults.versions.v1, uri: '/metamodels/:id/object-types' },
  },
  updateObjectType: {
    v1: { ...defaults.methods.PUT, ...defaults.versions.v1, uri: '/metamodels/:id/object-types/:objectTypeId' },
  },
  deleteObjectType: {
    v1: { ...defaults.methods.DELETE, ...defaults.versions.v1, uri: '/metamodels/:id/object-types/:objectTypeId' },
  },

  addRelationshipType: {
    v1: { ...defaults.methods.POST, ...defaults.versions.v1, uri: '/metamodels/:id/relationship-types' },
  },
  updateRelationshipType: {
    v1: { ...defaults.methods.PUT, ...defaults.versions.v1, uri: '/metamodels/:id/relationship-types/:relationshipTypeId' },
  },
  deleteRelationshipType: {
    v1: { ...defaults.methods.DELETE, ...defaults.versions.v1, uri: '/metamodels/:id/relationship-types/:relationshipTypeId' },
  },
};