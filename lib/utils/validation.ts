export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePhone(phone: string): boolean {
  // Indian phone number validation (10 digits, starting with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
}

export function validateCollege(college: string): boolean {
  return college.trim().length >= 2;
}

export function validateTransactionId(transactionId: string): boolean {
  // Transaction ID should be between 8-50 characters
  return transactionId.length >= 8 && transactionId.length <= 50;
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file type - only images allowed
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'File must be a JPEG or PNG image' 
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: 'File size must be less than 5MB' 
    };
  }

  return { isValid: true };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateRegistrationForm(data: {
  name: string;
  email: string;
  phone: string;
  college: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!validateName(data.name)) {
    errors.name = 'Name must be at least 2 characters and contain only letters';
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid 10-digit Indian phone number';
  }

  if (!validateCollege(data.college)) {
    errors.college = 'College name must be at least 2 characters';
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors.join('. ');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateDelegateRegistration(data: {
  tier: string;
  transactionId: string;
  paymentScreenshot: File | null;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const validTiers = ['Tier 1', 'Tier 2', 'Tier 3', 'Lit Pass'];
  if (!validTiers.includes(data.tier)) {
    errors.tier = 'Please select a valid tier';
  }

  if (!validateTransactionId(data.transactionId)) {
    errors.transactionId = 'Transaction ID must be between 8-50 characters';
  }

  if (!data.paymentScreenshot) {
    errors.paymentScreenshot = 'Payment screenshot is required';
  } else {
    const fileValidation = validateFile(data.paymentScreenshot);
    if (!fileValidation.isValid) {
      errors.paymentScreenshot = fileValidation.error!;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateEventRegistration(data: {
  eventIds: string[];
  transactionId: string;
  paymentScreenshot: File | null;
  delegateId?: string;
  requiresDelegateId: boolean;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.eventIds.length === 0) {
    errors.events = 'Please select at least one event';
  }

  if (!validateTransactionId(data.transactionId)) {
    errors.transactionId = 'Transaction ID must be between 8-50 characters';
  }

  if (!data.paymentScreenshot) {
    errors.paymentScreenshot = 'Payment screenshot is required';
  } else {
    const fileValidation = validateFile(data.paymentScreenshot);
    if (!fileValidation.isValid) {
      errors.paymentScreenshot = fileValidation.error!;
    }
  }

  if (data.requiresDelegateId && !data.delegateId) {
    errors.delegateId = 'Delegate ID is required for selected events';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Legacy exports for backward compatibility
export const validateEmail2 = validateEmail;
export const validatePhone2 = validatePhone;
export const validateFile2 = validateFile;
export const validateTransactionId2 = validateTransactionId;