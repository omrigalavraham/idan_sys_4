/**
 * Phone number validation utilities
 */
export const phonePattern = /^(\d{10}|\d{3}-\d{7})$/;
export const validatePhoneNumber = (phone) => {
    return phonePattern.test(phone);
};
export const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    // Format as xxx-xxxxxxx if 10 digits
    if (cleanPhone.length === 10) {
        return `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`;
    }
    return cleanPhone;
};
export const cleanPhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');
};
