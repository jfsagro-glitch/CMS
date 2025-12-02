export type AppraisalReviewStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface AppraisalReview {
  id: string;
  status: AppraisalReviewStatus;
  createdAt: string;
  updatedAt: string;

  // Header Info
  appraiserName: string;
  hasRecommendation: boolean;
  reportName: string;
  reportNumber: string;
  appraisalDate: string | null;
  appraisalPurpose: string;
  valueType: string; // Default: 'Рыночная стоимость'
  marketValueWithVat: number | null;
  
  // Description
  objectDescription: string;

  // Compliance
  compliance135FZ: 'compliant' | 'not_compliant' | 'partial';
  complianceNote: string;

  // Comparative Approach
  comparativeMethodologyValid: string;
  comparativeErrors: string;
  comparativeConclusion: string;

  // Cost Approach
  costMethodologyValid: string;
  costErrors: string;
  costConclusion: string;

  // Income Approach
  incomeMethodologyValid: string;
  incomeErrors: string;
  incomeConclusion: string;

  // Reconciliation
  reconciliationWeightsJustification: string;
  
  // Final Conclusion
  marketValueCorrectness: string;
  marketCorrespondence: boolean;

  // Footer
  reviewDate: string | null;
  reviewerName: string;
  reviewerPosition: string;
}

