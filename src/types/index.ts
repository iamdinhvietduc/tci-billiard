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

export interface Game {
  id: number;
  table_id: number;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled';
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  game_id: number;
  user_id: number;
  is_winner: boolean;
  amount_to_pay: number;
  has_paid: boolean;
  payment_method?: string;
  paid_at?: string;
}

export interface Table {
  id: number;
  name: string;
  type: string;
  status: 'available' | 'occupied';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  payment_qr?: string;
  created_at?: string;
  updated_at?: string;
} 