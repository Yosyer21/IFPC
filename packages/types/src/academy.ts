export interface Academy {
  id: string;
  name: string;
  clubId?: string | null;
  country: string;
  city?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
