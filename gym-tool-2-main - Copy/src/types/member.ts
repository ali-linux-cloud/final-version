export interface RenewalHistory {
  date: string;
  duration: number;
  price: number;
  startDate: string;
  endDate: string;
}

export interface Member {
  id: string;
  name: string;
  phoneNumber?: string;
  startDate: string;
  endDate: string;
  duration: number;
  price: number;
  renewalHistory: RenewalHistory[];
}

export type MemberFormData = Omit<Member, 'id' | 'endDate' | 'renewalHistory'>;