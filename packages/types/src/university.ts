export interface University {
  id: string;
  userId: string;
  name: string;
  country: string;
  city?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
