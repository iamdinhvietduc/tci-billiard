export interface Member {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  payment_qr?: string;
  created_at?: string;
}

export interface BilliardTrip {
  id: string;
  date: string;
  total_amount: number;
  payer_id: string;
  status: 'active' | 'cancelled';
  created_at: string;
  participants: string[];
  payments: { [key: string]: boolean };
  table_number?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  organizer?: string;
}

export interface TripParticipant {
  trip_id: string;
  member_id: string;
  has_paid: boolean;
  created_at: string;
}

export interface Expense {
  tripId: string;
  memberId: string;
  amount: number;
  paid: boolean;
  paymentMethod?: 'cash' | 'bank_transfer' | 'momo' | 'zalo_pay';
  paymentDate?: string;
} 