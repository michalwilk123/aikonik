import type { Access, FieldAccess } from "payload";

export const isAdmin: Access = ({ req }) => req.user?.role === "admin";
export const isStaff: Access = ({ req }) =>
  req.user?.role === "admin" || req.user?.role === "cms";
export const adminField: FieldAccess = ({ req }) => req.user?.role === "admin";

export const adminOrSelf: Access = ({ req }) => {
  if (req.user?.role === "admin") return true;
  if (req.user?.role === "cms") return { id: { equals: req.user.id } };
  return false;
};

export const ownSettingsField: FieldAccess = ({ req, id }) =>
  req.user?.role === "admin" ||
  (req.user?.role === "cms" && String(req.user.id) === String(id));

// Collection access protects direct API reads as well as filtered CMS lists.
export const assignedStaff: Access = ({ req }) => {
  if (req.user?.role === "admin") return true;
  if (req.user?.role === "cms") return { assignedTo: { equals: req.user.id } };
  return false;
};
