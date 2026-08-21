export type MembershipTier = 'FREE' | 'PREMIUM' | 'SCOUT' | 'CLUB';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Membership {
  id: string;
  userId: string;
  tier: MembershipTier;
  startsAt: Date;
  endsAt?: Date | null;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
