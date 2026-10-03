import type { Access, FieldAccess } from "payload";

export const isAdmin: Access = ({ req }) => req.user?.role === "admin";
export const isStaff: Access = ({ req }) =>
  req.user?.role === "admin" || req.user?.role === "cms";
export const adminField: FieldAccess = ({ req }) => req.user?.role === "admin";
