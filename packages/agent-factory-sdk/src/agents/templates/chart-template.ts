import type { ChartType, ChartConfig } from '../types/chart.types';
import { getChartColors } from '../config/chart-colors';
import { SUPPORTED_CHARTS } from '../config/supported-charts';

/**
 * Generic chart template structure applicable to all chart types
 */
export interface GenericChartTemplate {
  chartType: ChartType;
  data: Array<Record<string, unknown>>;
  config: {
    colors: string[];
    labels?: Record<string, string>;
    // Bar/Line specific
    xKey?: string;
    yKey?: string;
    // Pie specific
    nameKey?: string;
    valueKey?: string;
    // Additional chart-specific config
    [key: string]: unknown;
  };
}

/**
 * Default color schemes for each chart type
 * @deprecated Use getChartColors() from chart-colors config instead
 */
export const DEFAULT_CHART_COLORS: Record<ChartType, string[]> = {
  bar: getChartColors('bar'),
  line: getChartColors('line'),
  pie: getChartColors('pie'),
};

/**
 * Chart type selection criteria guidelines
 * @deprecated Use SUPPORTED_CHARTS from supported-charts config instead
 */
export const CHART_TYPE_CRITERIA = {
  bar: {
    description: SUPPORTED_CHARTS.bar.description,
    indicators: SUPPORTED_CHARTS.bar.indicators,
  },
  line: {
    description: SUPPORTED_CHARTS.line.description,
    indicators: SUPPORTED_CHARTS.line.indicators,
  },
  pie: {
    description: SUPPORTED_CHARTS.pie.description,
    indicators: SUPPORTED_CHARTS.pie.indicators,
  },
} as const;

/**
 * Data transformation guidelines for each chart type
 * @deprecated Use SUPPORTED_CHARTS from supported-charts config instead
 */
export const CHART_DATA_FORMAT: Record<
  ChartType,
  { format: string; example: unknown }
> = {
  bar: {
    format: SUPPORTED_CHARTS.bar.dataFormat.description,
    example: SUPPORTED_CHARTS.bar.dataFormat.example,
  },
  line: {
    format: SUPPORTED_CHARTS.line.dataFormat.description,
    example: SUPPORTED_CHARTS.line.dataFormat.example,
  },
  pie: {
    format: SUPPORTED_CHARTS.pie.dataFormat.description,
    example: SUPPORTED_CHARTS.pie.dataFormat.example,
  },
};

