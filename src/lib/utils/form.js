/**
 * Form validation utilities for Chatnest
 */

export function validateFullName(fullname) {
    const nameRegex = /^[A-Za-z]+\s+[A-Za-z]+(\s+[A-Za-z]+)?$/;
    return nameRegex.test(String(fullname || '').trim());
}

export function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email || '').trim());
}

export function validatePhoneNumber(phone) {
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    return cleanedPhone.length >= 7 && cleanedPhone.length <= 20;
}
