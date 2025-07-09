/**
 * Payment Configuration
 * Configure UPI details and payment settings here
 */

export const PAYMENT_CONFIG = {
  // UPI Configuration
  upiId: 'spandan2025@paytm', // Change this to your actual UPI ID
  merchantName: 'SPANDAN 2025',
  merchantCode: 'SPANDAN2025',
  
  // Payment Settings
  currency: 'INR',
  
  // QR Code Configuration
  qrCodeSize: 256,
  qrCodeErrorCorrectionLevel: 'M' as const,
  
  // Transaction Settings
  transactionIdPrefix: 'SPD25',
  
  // Payment Methods
  methods: {
    upiDeepLink: true,
    qrCode: true,
    manualEntry: true,
  },
} as const;

/**
 * Generate UPI deep link for mobile payments
 */
export const generateUPILink = (amount: number, orderId: string, note?: string): string => {
  const params = new URLSearchParams({
    pa: PAYMENT_CONFIG.upiId,
    pn: PAYMENT_CONFIG.merchantName,
    am: amount.toString(),
    cu: PAYMENT_CONFIG.currency,
    tn: note || `${PAYMENT_CONFIG.merchantCode}-${orderId}`,
  });
  
  return `upi://pay?${params.toString()}`;
};

/**
 * Generate UPI QR code data
 */
export const generateQRData = (amount: number, orderId: string, note?: string): string => {
  const params = new URLSearchParams({
    pa: PAYMENT_CONFIG.upiId,
    pn: PAYMENT_CONFIG.merchantName,
    am: amount.toString(),
    cu: PAYMENT_CONFIG.currency,
    tn: note || `${PAYMENT_CONFIG.merchantCode}-${orderId}`,
  });
  
  return `upi://pay?${params.toString()}`;
};

/**
 * Generate transaction ID
 */
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${PAYMENT_CONFIG.transactionIdPrefix}${timestamp}${random}`;
};
