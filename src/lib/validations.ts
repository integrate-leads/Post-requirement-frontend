// Validation utilities for form fields

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email must be less than 254 characters' };
  }
  
  // Must contain at least one @ and one .
  const atCount = (email.match(/@/g) || []).length;
  const dotCount = (email.match(/\./g) || []).length;
  
  if (atCount === 0) {
    return { isValid: false, error: 'Email must contain @' };
  }
  
  if (dotCount === 0) {
    return { isValid: false, error: 'Email must contain a dot (.)' };
  }
  
  // Standard email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true, error: '' };
};

// Phone number validation (for 10-digit phone numbers)
export const validatePhone = (phone: string, countryCode?: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (countryCode === '+91') {
    // India: 10 digits
    if (digitsOnly.length !== 10) {
      return { isValid: false, error: 'Phone number must be 10 digits' };
    }
    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      return { isValid: false, error: 'Invalid Indian phone number' };
    }
  } else if (countryCode === '+1') {
    // USA: 10 digits
    if (digitsOnly.length !== 10) {
      return { isValid: false, error: 'Phone number must be 10 digits' };
    }
  } else {
    // Default: 7-15 digits
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return { isValid: false, error: 'Phone number must be 7-15 digits' };
    }
  }
  
  return { isValid: true, error: '' };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }
  
  // Only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true, error: '' };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true, error: '' };
};

// Company name validation
export const validateCompanyName = (company: string): ValidationResult => {
  if (!company.trim()) {
    return { isValid: false, error: 'Company name is required' };
  }
  
  if (company.length < 2) {
    return { isValid: false, error: 'Company name must be at least 2 characters' };
  }
  
  if (company.length > 200) {
    return { isValid: false, error: 'Company name must be less than 200 characters' };
  }
  
  return { isValid: true, error: '' };
};

// Website URL validation
export const validateWebsite = (url: string): ValidationResult => {
  if (!url.trim()) {
    return { isValid: true, error: '' }; // Optional field
  }
  
  if (url.length > 500) {
    return { isValid: false, error: 'URL must be less than 500 characters' };
  }
  
  // Basic URL pattern
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
  if (!urlRegex.test(url)) {
    return { isValid: false, error: 'Please enter a valid website URL' };
  }
  
  return { isValid: true, error: '' };
};

// Text area / description validation
export const validateDescription = (text: string, minLength = 0, maxLength = 5000): ValidationResult => {
  if (minLength > 0 && (!text.trim() || text.trim().length < minLength)) {
    return { isValid: false, error: `Must be at least ${minLength} characters` };
  }
  
  if (text.length > maxLength) {
    return { isValid: false, error: `Must be less than ${maxLength} characters` };
  }
  
  return { isValid: true, error: '' };
};

// Job title validation
export const validateJobTitle = (title: string): ValidationResult => {
  if (!title.trim()) {
    return { isValid: false, error: 'Job title is required' };
  }
  
  if (title.length < 3) {
    return { isValid: false, error: 'Job title must be at least 3 characters' };
  }
  
  if (title.length > 200) {
    return { isValid: false, error: 'Job title must be less than 200 characters' };
  }
  
  return { isValid: true, error: '' };
};

// Pay rate validation
export const validatePayRate = (rate: string): ValidationResult => {
  if (!rate.trim()) {
    return { isValid: true, error: '' }; // Optional
  }
  
  if (rate.length > 100) {
    return { isValid: false, error: 'Pay rate must be less than 100 characters' };
  }
  
  return { isValid: true, error: '' };
};

// Postal address validation
export const validateAddress = (address: string): ValidationResult => {
  if (!address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }
  
  if (address.length < 10) {
    return { isValid: false, error: 'Please enter a complete address' };
  }
  
  if (address.length > 500) {
    return { isValid: false, error: 'Address must be less than 500 characters' };
  }
  
  return { isValid: true, error: '' };
};
