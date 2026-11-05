import { colomboDay, periodRange } from './finance';

export type PerformanceSummary = {
  revenue_minor: number; completed_count: number; adjustments_minor: number;
  average_sale_minor: number | null; average_minutes: number | null;
};
export type PerformanceBarber = {
  id: string; display_name: string; photo_url: string | null; salon_id: string; salon_name: string; archived_at: string | null;
  revenue_minor: number; completed_count: number; previous_revenue_minor: number; previous_completed_count: number;
  average_sale_minor: number | null; average_minutes: number | null; rating: number | null; review_count: number;
};
export type PerformanceBucket = { day: string; until?: string; revenue_minor: number; completed_count: number };
export type PerformanceReport = {
  observed_at: string; today: string; from: string; to: string; comparison_from: string; comparison_to: string;
  summary: PerformanceSummary; previous: PerformanceSummary;
  salons: { id: string; name: string; archived: boolean }[];
  daily: PerformanceBucket[]; weekly: PerformanceBucket[]; team: PerformanceBarber[];
};
export function performanceRange(period: 'today' | 'week' | 'month') {
  const today = colomboDay(); return { from: periodRange(period, today).from, to: today };
}
export function shortDay(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
}
export function dateSpan(from: string, to: string) {
  return from === to ? shortDay(from) : `${shortDay(from)} – ${shortDay(to)}`;
}
export function comparison(current: number, previous: number) {
  if (previous <= 0) return previous === 0 ? 'No previous revenue' : 'Previous period had net corrections';
  const percent = (current - previous) / previous * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}% vs previous period`;
}
