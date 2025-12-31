/**
 * Calculates the difference in days between two dates (midnight-normalized).
 */
export function getDaysDifference(date1: Date, date2: Date): number {
    const normalizedDate1 = new Date(date1);
    const normalizedDate2 = new Date(date2);
    
    normalizedDate1.setHours(0, 0, 0, 0);
    normalizedDate2.setHours(0, 0, 0, 0);
    
    const diffTime = normalizedDate1.getTime() - normalizedDate2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the number of months between today and the due date
 */
export function calculateMonthsUntilDue(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const yearDiff = due.getFullYear() - today.getFullYear();
    const monthDiff = due.getMonth() - today.getMonth();
    const dayDiff = due.getDate() - today.getDate();
    
    // Calculate total months, rounding up if there are any days
    let totalMonths = yearDiff * 12 + monthDiff;
    if (dayDiff > 0) {
        totalMonths += 1;
    }
    
    return Math.max(0, totalMonths);
}