import { 
    eachDayOfInterval, 
    isWeekend, 
    parseISO,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    format
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