export interface InsuranceRecord {
  policyNumber: string;
  insuranceType: string;
  insuredAmount: number | string | null;
  premium: number | string | null;
  startDate: string | null;
  endDate: string | null;
  insurer: string;
  status: string;
  insured: string | null;
  contractNumber: string | null;
  reference: string | number | null;
}


