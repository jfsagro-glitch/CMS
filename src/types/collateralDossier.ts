export interface CollateralFolder {
  id: string;
  path: string[];
  description?: string;
}

export interface CollateralDocument {
  id: string;
  reference: string;
  borrower?: string | null;
  pledger?: string | null;
  inn?: string | number | null;
  docType: string;
  folderId: string;
  folderPath: string[];
  description?: string;
  status: string;
  statusColor?: string;
  fileName: string;
  lastUpdated: string;
  responsible: string;
  size: string;
}

export interface CollateralDossierPayload {
  folders: CollateralFolder[];
  documents: CollateralDocument[];
}

