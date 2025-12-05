'use client';

import * as React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../../../shadcn/chart';
import { getColors } from './chart-utils';
import { ChartContext } from './chart-wrapper';

export interface BarChartConfig {
  chartType: 'bar';
  data: Array<Record<string, unknown>>;
  config: {
    colors: string[];
    labels?: Record<string, string>;
    xKey?: string;
    yKey?: string;
  };
}

export interface BarChartProps {
  chartConfig: BarChartConfig;
}

export function BarChart({ chartConfig }: BarChartProps) {
  const { data, config } = chartConfig;
  const { xKey = 'name', yKey = 'value', colors, labels } = config;
  const { showAxisLabels } = React.useContext(ChartContext);

  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm text-center">
        No data available for chart
      </div>
    );
  }

  // Get colors (chart generation now uses direct hex colors)
  const chartColors = React.useMemo(
    () => getColors(colors),
    [colors],
  );

  // Create chart config for ChartContainer
  // ChartContainer uses this config to generate CSS variables (--color-${key})
  // which are used by ChartTooltipContent for consistent theming
  const chartConfigForContainer = React.useMemo(() => {
    const configObj: Record<string, { label?: string; color?: string }> = {};
    if (yKey) {
      configObj[yKey] = {
        label: labels?.[yKey] || labels?.value || 'Value',
        color: chartColors[0],
      };
    }
    return configObj;
  }, [yKey, chartColors, labels]);

  // Get axis labels
  const xAxisLabel = labels?.[xKey] || labels?.name || xKey;
  const yAxisLabel = labels?.[yKey] || labels?.value || 'Value';

  // Recharts color usage:
  // - Bar component uses `fill` prop for bar color
  // - For single series, we use the first color from the config
  return (
    <ChartContainer config={chartConfigForContainer}>
      <RechartsBarChart data={data} key={`bar-${showAxisLabels}`}>
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={showAxisLabels}
          tickMargin={8}
        >
          {showAxisLabels ? (
            <Label
              key="x-label"
              value={xAxisLabel}
              position="insideBottom"
              offset={-5}
              style={{ textAnchor: 'middle', fill: 'currentColor' }}
            />
          ) : null}
        </XAxis>
        <YAxis
          tickLine={false}
          axisLine={showAxisLabels}
          tickMargin={8}
        >
          {showAxisLabels ? (
            <Label
              key="y-label"
              value={yAxisLabel}
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', fill: 'currentColor' }}
            />
          ) : null}
        </YAxis>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey={yKey} fill={chartColors[0]} />
      </RechartsBarChart>
    </ChartContainer>
  );
}

