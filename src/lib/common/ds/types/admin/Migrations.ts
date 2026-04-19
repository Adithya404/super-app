export interface Migrations {
  id: number;
  name: string;
  checksum: string;
  appliedAt?: Date;
}
