// src/lib/common/ds/defaults.ts
import type { Access, Attribute, CalculatedAttribute, DataSource } from "./types";

export const DefaultAttribute: Partial<Attribute> = {
  optional: true,
  primary: false,
};

export const DefaultCalculatedAttribute: Partial<CalculatedAttribute> = {
  optional: true,
  isCalculated: true,
};

export const DefaultFullAccess: Access = {
  roleCode: "",
  type: "Full",
};

export const DefaultReadOnlyAccess: Access = {
  roleCode: "",
  type: "ReadOnly",
};

export const DefaultDataSource: Partial<DataSource> = {
  attributes: [],
  access: [],
};
