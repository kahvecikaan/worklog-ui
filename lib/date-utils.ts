import { 
    eachDayOfInterval, 
    isWeekend, 
    parseISO,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    format,
    isValid,
    isEqual,
    isSameMonth,
    isSameYear
  } from 'date-fns';
  
  export const HOURS_PER_DAY = 8;
  export const HOURS_PER_WEEK = 40;
  
  /**
   * Calculate the number of working days (excluding weekends) between two dates
   */
  export function calculateWorkingDays(startDate: string, endDate: string): number {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
  
    // Get all days in the interval
    const allDays = eachDayOfInterval({ start, end });
  
    // Filter out weekends
    const workingDays = allDays.filter((day) => !isWeekend(day));
  
    return workingDays.length;
  }
  
  /**
   * Calculate expected work hours based on working days
   */
  export function calculateExpectedHours(startDate: string, endDate: string): number {
    const workingDays = calculateWorkingDays(startDate, endDate);
    return workingDays * HOURS_PER_DAY;
  }
  
  /**
   * Calculate utilization rate as a percentage
   */
  export function calculateUtilizationRate(actualHours: number, expectedHours: number): number {
    if (expectedHours <= 0) return 0;
    return Math.min(100, (actualHours / expectedHours) * 100);
  }
  
  /**
   * Get color class based on utilization rate
   */
  export function getUtilizationColor(rate: number): string {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-blue-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  }
  
  /**
   * Get progress bar color class based on utilization rate
   */
  export function getProgressBarColor(rate: number): string {
    if (rate >= 90) return "bg-green-600";
    if (rate >= 70) return "bg-blue-600";
    if (rate >= 50) return "bg-yellow-600";
    return "bg-red-600";
  }
  
  /**
   * Get date range for a period filter
   */
  export function getDateRangeForPeriod(period: 'week' | 'month', baseDate: Date = new Date()) {
    switch (period) {
      case 'week':
        return {
          startDate: format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'month':
        return {
          startDate: format(startOfMonth(baseDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(baseDate), 'yyyy-MM-dd')
        };
      default:
        throw new Error(`Invalid period: ${period}`);
    }
  }

  export function isValidDateString(dateStr: string | null) : boolean {
    if(!dateStr) return false;
    const date = parseISO(dateStr);
    return isValid(date);
  }

 /**
  * Format a date range into a human-readable period description
  * @param startDate - ISO date string for start date
  * @param endDate - ISO date string for end date
  * @returns Formatted period string (e.g., "This Week", "Jan 15 - Feb 28, 2025")
  */
 export const formatPeriodDescription = (startDate: string, endDate: string): string => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const now = new Date();
    
    // Check if it's the current week
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    if (isEqual(start, currentWeekStart) && isEqual(end, currentWeekEnd)) {
      return "This Week";
    }
    
    // Check if it's the current month
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    if (isEqual(start, currentMonthStart) && isEqual(end, currentMonthEnd)) {
      return "This Month";
    }
    
    // Format custom date ranges
    if (isSameYear(start, end)) {
      if (isSameMonth(start, end)) {
        // Same month and year: "Jan 15 - 22, 2025"
        return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
      } else {
        // Same year, different months: "Jan 15 - Feb 28, 2025"
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      }
    } else {
      // Different years: "Dec 25, 2024 - Jan 5, 2025"
      return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
    }
  };