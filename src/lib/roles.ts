// lib/roles.ts
import { authPool } from "@/lib/db";

export type UserRole = {
  role: string;
  role_code: string;
  app: string;
};

export async function getUserRoles(email: string): Promise<UserRole[]> {
  const { rows } = await authPool.query(
    `SELECT r.role, r.role_code, r.app
     FROM "super".user_roles ur
     JOIN "super".roles r ON r.role_code = ur.role_code
     WHERE ur.email = $1
       AND (ur.end_date IS NULL OR ur.end_date > CURRENT_DATE)
       AND (r.end_date  IS NULL OR r.end_date  > CURRENT_DATE)
       AND ur.start_date <= CURRENT_DATE
       AND r.start_date  <= CURRENT_DATE`,
    [email],
  );
  return rows;
}

export async function getUserRolesForApp(email: string, app: string): Promise<string[]> {
  const { rows } = await authPool.query(
    `SELECT r.role_code
     FROM "super".user_roles ur
     JOIN "super".roles r ON r.role_code = ur.role_code
     WHERE ur.email = $1
       AND r.app = $2
       AND (ur.end_date IS NULL OR ur.end_date > CURRENT_DATE)
       AND (r.end_date  IS NULL OR r.end_date  > CURRENT_DATE)
       AND ur.start_date <= CURRENT_DATE
       AND r.start_date  <= CURRENT_DATE`,
    [email, app],
  );
  return rows.map((r) => r.role_code);
}

export async function hasRole(email: string, role_code: string): Promise<boolean> {
  const { rows } = await authPool.query(
    `SELECT 1
     FROM "super".user_roles ur
     JOIN "super".roles r ON r.role_code = ur.role_code
     WHERE ur.email = $1
       AND ur.role_code = $2
       AND (ur.end_date IS NULL OR ur.end_date > CURRENT_DATE)
       AND (r.end_date  IS NULL OR r.end_date  > CURRENT_DATE)
       AND ur.start_date <= CURRENT_DATE
       AND r.start_date  <= CURRENT_DATE
     LIMIT 1`,
    [email, role_code],
  );
  return rows.length > 0;
}
