/**
 * Scanner Types
 *
 * TypeScript types for barcode/QR code scanning functionality
 */

/**
 * Supported barcode types for scanning
 */
export type BarcodeType =
  | 'QR_CODE'
  | 'EAN_13'
  | 'EAN_8'
  | 'CODE_128'
  | 'CODE_39'
  | 'CODE_93'
  | 'UPC_E'
  | 'UPC_A'
  | 'ITF'
  | 'ITF_14'
  | 'PDF_417'
  | 'AZTEC'
  | 'DATA_MATRIX';

/**
 * Result from a successful barcode scan
 */
export interface ScanResult {
  /** The decoded barcode data */
  data: string;
  /** The type of barcode that was scanned */
  type: BarcodeType;
  /** Optional bounding box information */
  bounds?: {
    width: number;
    height: number;
    origin: { x: number; y: number };
  };
}

/**
 * Validation result for scanned data
 */
export interface ScanValidationResult {
  /** Whether the scanned data is valid */
  valid: boolean;
  /** Optional error message if validation failed */
  error?: string;
}

/**
 * Scanner configuration options
 */
export interface ScannerConfig {
  /** Title shown in scanner overlay */
  title?: string;
  /** Subtitle/instructions shown in scanner overlay */
  subtitle?: string;
  /** Barcode types to scan for */
  barcodeTypes?: BarcodeType[];
  /** Camera to use (back or front) */
  cameraType?: 'back' | 'front';
  /** Icon to show for scanner button */
  scannerIcon?: string;
  /** Custom permission rationale message */
  permissionRationale?: string;
}
