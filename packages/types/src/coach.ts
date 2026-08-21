export interface Coach {
  id: string;
  userId: string;
  clubName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
