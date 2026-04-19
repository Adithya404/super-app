export interface Roles {
  id: string;
  role: string;
  roleCode: string;
  description?: string;
  app: string;
  startDate: Date;
  endDate?: Date;
  createdAt?: Date;
}
