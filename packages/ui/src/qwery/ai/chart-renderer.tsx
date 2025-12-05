'use client';

import * as React from 'react';
import { BarChart } from './charts/bar-chart';
import { LineChart } from './charts/line-chart';
import { PieChart } from './charts/pie-chart';

import { ChartWrapper } from './charts/chart-wrapper';

export interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie';
  title?: string;
  data: Array<Record<string, unknown>>;
  config: {
    colors: string[];
    labels?: Record<string, string>;
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;
  };
}

export interface ChartRendererProps {
  chartConfig: ChartConfig;
}

/**
 * Generic chart renderer that accepts LLM output and renders the appropriate chart component
 * Wrapped with title, download, and copy functionality
 */
export function ChartRenderer({ chartConfig }: ChartRendererProps) {
  const { chartType, title } = chartConfig;
  const chartRef = React.useRef<HTMLDivElement>(null);

  const chartComponent = (() => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart
            chartConfig={
              chartConfig as {
                chartType: 'bar';
                data: Array<Record<string, unknown>>;
                config: {
                  colors: string[];
                  labels?: Record<string, string>;
                  xKey?: string;
                  yKey?: string;
                };
              }
            }
          />
        );
      case 'line':
        return (
          <LineChart
            chartConfig={
              chartConfig as {
                chartType: 'line';
                data: Array<Record<string, unknown>>;
                config: {
                  colors: string[];
                  labels?: Record<string, string>;
                  xKey?: string;
                  yKey?: string;
                };
              }
            }
          />
        );
      case 'pie':
        return (
          <PieChart
            chartConfig={
              chartConfig as {
                chartType: 'pie';
                data: Array<Record<string, unknown>>;
                config: {
                  colors: string[];
                  labels?: Record<string, string>;
                  nameKey?: string;
                  valueKey?: string;
                };
              }
            }
          />
        );
      default:
        return (
          <div className="text-muted-foreground p-4 text-sm">
            Unsupported chart type: {chartType}
          </div>
        );
    }
  })();

  return (
    <ChartWrapper
      title={title}
      chartRef={chartRef as React.RefObject<HTMLDivElement>}
    >
      {chartComponent}
    </ChartWrapper>
  );
}

