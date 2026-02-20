/**
 * Authorization Middleware
 * Middleware d'autorisation basé sur les rôles et permissions
 * 
 * Usage:
 * app.post("/api/orders", authenticate, authorize("orders", "create"), createOrder);
 */

import { Request, Response, NextFunction } from "express";
import { UserRole, ROLE_PERMISSIONS, Permission } from "@shared/types";

// Déclaration pour les types Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        entityId?: string;
        entityRole?: string;
      };
    }
  }
}

/**
 * Vérifier si un rôle a une permission spécifique
 */
export function hasPermission(
  role: UserRole,
  resource: string,
  action: "create" | "read" | "update" | "delete" | "execute"
): boolean {
  const roleDef = ROLE_PERMISSIONS[role];
  
  if (!roleDef) {
    console.warn(`[AUTH] Role not found: ${role}`);
    return false;
  }

  // Vérifier les permissions directes
  const hasDirectPermission = roleDef.permissions.some(perm => {
    if (perm.resource === "*") return true; // Super admin
    if (perm.resource !== resource) return false;
    return perm.actions.includes(action);
  });

  if (hasDirectPermission) return true;

  // Vérifier les permissions héritées
  if (roleDef.inheritedFrom) {
    for (const inheritedRole of roleDef.inheritedFrom) {
      if (hasPermission(inheritedRole, resource, action)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Middleware d'autorisation
 * @param resource - La ressource à protéger (ex: "orders", "products")
 * @param action - L'action requise (create, read, update, delete, execute)
 */
export function authorize(
  resource: string,
  action: "create" | "read" | "update" | "delete" | "execute"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const hasAccess = hasPermission(user.role, resource, action);

    if (!hasAccess) {
      console.warn(`[AUTH] Access denied: ${user.email} (${user.role}) tried to ${action} ${resource}`);
      return res.status(403).json({
        error: "Forbidden",
        message: `You don't have permission to ${action} ${resource}`,
        requiredRole: getRequiredRole(resource, action),
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier plusieurs permissions (OR logic)
 */
export function authorizeAny(
  permissions: Array<{ resource: string; action: "create" | "read" | "update" | "delete" | "execute" }>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const hasAnyPermission = permissions.some(perm =>
      hasPermission(user.role, perm.resource, perm.action)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have the required permissions",
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier plusieurs permissions (AND logic)
 */
export function authorizeAll(
  permissions: Array<{ resource: string; action: "create" | "read" | "update" | "delete" | "execute" }>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const hasAllPermissions = permissions.every(perm =>
      hasPermission(user.role, perm.resource, perm.action)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have all the required permissions",
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier un rôle spécifique
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of these roles: ${roles.join(", ")}`,
        yourRole: user.role,
      });
    }

    next();
  };
}

/**
 * Middleware pour vérifier qu'un utilisateur peut accéder à une entité spécifique
 */
export function authorizeEntity() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Super admin peut tout accéder
    if (user.role === "super_admin") {
      return next();
    }

    // Vérifier que l'entityId correspond
    const requestedEntityId = req.params.entityId || req.body.entityId || req.query.entityId;
    
    if (requestedEntityId && user.entityId && requestedEntityId !== user.entityId) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only access your own entity",
      });
    }

    next();
  };
}

/**
 * Obtenir le rôle minimum requis pour une action
 */
function getRequiredRole(
  resource: string,
  action: "create" | "read" | "update" | "delete" | "execute"
): UserRole | string {
  // Chercher le rôle avec le moins de permissions qui a accès
  const roles: UserRole[] = Object.keys(ROLE_PERMISSIONS) as UserRole[];
  
  for (const role of roles) {
    if (hasPermission(role, resource, action)) {
      return role;
    }
  }
  
  return "super_admin";
}

/**
 * Helper pour vérifier les permissions côté client/service
 */
export function can(
  role: UserRole,
  resource: string,
  action: "create" | "read" | "update" | "delete" | "execute"
): boolean {
  return hasPermission(role, resource, action);
}

/**
 * Middleware pour ressources spécifiques (par ID)
 */
export function authorizeResource(
  resource: string,
  action: "create" | "read" | "update" | "delete" | "execute",
  getIdFromRequest: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Super admin passe toujours
    if (user.role === "super_admin") {
      return next();
    }

    // Vérification de base
    if (!hasPermission(user.role, resource, action)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // TODO: Ajouter des vérifications de propriété si nécessaire
    // Ex: Vérifier que l'utilisateur possède la ressource
    const resourceId = getIdFromRequest(req);
    
    // Logique de vérification de propriété à implémenter selon la ressource
    next();
  };
}

/**
 * Middleware pour limiter les champs modifiables selon le rôle
 */
export function restrictFields(allowedFieldsByRole: Partial<Record<UserRole, string[]>>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allowedFields = allowedFieldsByRole[user.role] || allowedFieldsByRole.super_admin || [];

    if (allowedFields.length === 0 || allowedFields.includes("*")) {
      return next();
    }

    const body = req.body;
    const forbiddenFields = Object.keys(body).filter(key => !allowedFields.includes(key));

    if (forbiddenFields.length > 0) {
      return res.status(403).json({
        error: "Forbidden",
        message: `You cannot modify these fields: ${forbiddenFields.join(", ")}`,
        allowedFields,
      });
    }

    next();
  };
}
