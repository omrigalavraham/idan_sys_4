/**
 * Date utilities
 * Provides consistent date handling across the application
 */
import { format, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
/**
 * Format date for display
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 'תאריך לא תקין';
        }
        return format(dateObj, formatStr, { locale: he });
    }
    catch (error) {
        console.error('Error formatting date:', error);
        return 'תאריך לא תקין';
    }
};
/**
 * Format date and time for display
 */
export const formatDateTime = (date) => {
    return formatDate(date, 'dd/MM/yyyy HH:mm');
};
/**
 * Format time for display
 */
export const formatTime = (date) => {
    return formatDate(date, 'HH:mm');
};
/**
 * Create a local date time from date and time strings
 */
export const createLocalDateTime = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};
/**
 * Create simple ISO string from date
 */
export const createSimpleISOString = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj.toISOString();
};
/**
 * Parse simple ISO string (handles both full ISO and simple date strings)
 */
export const parseSimpleISOString = (dateStr) => {
    // If it's already a full ISO string, parse it directly
    if (dateStr.includes('T')) {
        return parseISO(dateStr);
    }
    // If it's just a date string, add time
    const date = new Date(dateStr);
    if (isValid(date)) {
        return date;
    }
    // Fallback to current date
    return new Date();
};
/**
 * Convert Israel time to UTC
 */
export const israelTimeToUtc = (israelDate) => {
    // Israel is UTC+2 (or UTC+3 during daylight saving time)
    // For simplicity, we'll use UTC+2
    const utcDate = new Date(israelDate.getTime() - (2 * 60 * 60 * 1000));
    return utcDate;
};
/**
 * Convert UTC to Israel time
 */
export const utcToIsraelTime = (utcDate) => {
    // Israel is UTC+2 (or UTC+3 during daylight saving time)
    // For simplicity, we'll use UTC+2
    const israelDate = new Date(utcDate.getTime() + (2 * 60 * 60 * 1000));
    return israelDate;
};
/**
 * Get current date in Israel timezone
 */
export const getCurrentIsraelDate = () => {
    const now = new Date();
    return utcToIsraelTime(now);
};
/**
 * Check if date is today
 */
export const isToday = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    return dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear();
};
/**
 * Check if date is in the past
 */
export const isPast = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj < new Date();
};
/**
 * Check if date is in the future
 */
export const isFuture = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj > new Date();
};
/**
 * Add days to a date
 */
export const addDays = (date, days) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
};
/**
 * Get start of day
 */
export const startOfDay = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const result = new Date(dateObj);
    result.setHours(0, 0, 0, 0);
    return result;
};
/**
 * Get end of day
 */
export const endOfDay = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const result = new Date(dateObj);
    result.setHours(23, 59, 59, 999);
    return result;
};
