/**
 * Form validation utilities for Chatnest
 */

export function validateFullName(fullname: string): boolean {
    const nameRegex = /^[A-Za-z]+\s+[A-Za-z]+(\s+[A-Za-z]+)?$/;
    return nameRegex.test(String(fullname || '').trim());
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email || '').trim());
}

export function validatePhoneNumber(phone: string): boolean {
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    return cleanedPhone.length >= 7 && cleanedPhone.length <= 20;
}
