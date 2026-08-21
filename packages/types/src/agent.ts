export interface Agent {
  id: string;
  userId: string;
  agency?: string | null;
  license?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
