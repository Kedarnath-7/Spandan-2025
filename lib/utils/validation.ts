// Enhanced validation utilities for registration form

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FieldValidationResult {
  isValid: boolean
  error?: string
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced email validation with detailed error messages
export const validateEmailDetailed = (email: string): FieldValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  return { isValid: true }
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

// Enhanced phone validation with detailed error messages
export const validatePhoneDetailed = (phone: string): FieldValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number (6-9 starting)' }
  }
  
  return { isValid: true }
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
}

// Enhanced name validation with detailed error messages
export const validateNameDetailed = (name: string): FieldValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' }
  }
  
  // Check for only letters, spaces, and common name characters
  const nameRegex = /^[a-zA-Z\s.''-]+$/
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Name can only contain letters, spaces, and common punctuation' }
  }
  
  return { isValid: true }
}

export function validateCollege(college: string): boolean {
  return college.trim().length >= 2;
}

// Enhanced college validation with detailed error messages
export const validateCollegeDetailed = (college: string): FieldValidationResult => {
  if (!college.trim()) {
    return { isValid: false, error: 'College name is required' }
  }
  
  if (college.trim().length < 3) {
    return { isValid: false, error: 'College name must be at least 3 characters long' }
  }
  
  return { isValid: true }
}

// College location validation
export const validateCollegeLocation = (location: string): FieldValidationResult => {
  if (!location.trim()) {
    return { isValid: false, error: 'College location is required' }
  }
  
  if (location.trim().length < 2) {
    return { isValid: false, error: 'College location must be at least 2 characters long' }
  }
  
  return { isValid: true }
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

// Enhanced member validation functions for registration
export const validateRequiredFields = (member: any): ValidationResult => {
  const errors: string[] = []
  
  const nameValidation = validateNameDetailed(member.name)
  if (!nameValidation.isValid) errors.push(nameValidation.error!)
  
  const emailValidation = validateEmailDetailed(member.email)
  if (!emailValidation.isValid) errors.push(emailValidation.error!)
  
  const collegeValidation = validateCollegeDetailed(member.college)
  if (!collegeValidation.isValid) errors.push(collegeValidation.error!)
  
  const phoneValidation = validatePhoneDetailed(member.phone)
  if (!phoneValidation.isValid) errors.push(phoneValidation.error!)
  
  const locationValidation = validateCollegeLocation(member.collegeLocation)
  if (!locationValidation.isValid) errors.push(locationValidation.error!)
  
  // Check if member has selected a tier or pass
  if (member.selectionType === 'tier' && !member.tier) {
    errors.push('Please select a delegate tier')
  }
  
  if (member.selectionType === 'pass' && !member.passType) {
    errors.push('Please select an event pass')
  }
  
  if (member.selectionType === 'pass' && member.passType === 'Nexus Forum' && !member.passTier) {
    errors.push('Please select a tier for Nexus Forum pass')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate all members in a group
export const validateAllMembers = (members: any[]): ValidationResult => {
  const allErrors: string[] = []
  
  members.forEach((member, index) => {
    const memberValidation = validateRequiredFields(member)
    if (!memberValidation.isValid) {
      memberValidation.errors.forEach(error => {
        allErrors.push(`Member ${index + 1}: ${error}`)
      })
    }
  })
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

// Enhanced transaction ID validation
export const validateTransactionIdDetailed = (transactionId: string): FieldValidationResult => {
  if (!transactionId.trim()) {
    return { isValid: false, error: 'Transaction ID is required' }
  }
  
  // Transaction IDs are typically 8-50 characters long and alphanumeric
  if (transactionId.trim().length < 8) {
    return { isValid: false, error: 'Transaction ID must be at least 8 characters long' }
  }
  
  if (transactionId.trim().length > 50) {
    return { isValid: false, error: 'Transaction ID cannot be more than 50 characters long' }
  }
  
  return { isValid: true }
}