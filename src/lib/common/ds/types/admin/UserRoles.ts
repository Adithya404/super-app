export interface UserRoles {
  email: string;
  roleCode: string;
  /** Joined from roles.role when available */
  roleName?: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  createdAt?: Date | string;
}
