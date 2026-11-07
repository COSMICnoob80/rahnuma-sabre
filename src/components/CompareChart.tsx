/**
 * CompareChart — normalized multi-series line chart.
 *
 * Pure geometry lives in src/utils/compareChart.ts. This component only draws:
 * three grid lines, y-index labels, one colored path per series and coarse UTC
 * date labels along the bottom. A null render when nothing arrived keeps the
 * feed-unavailable state in the screen.
 */

import React from 'react';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import { DEFAULT_CHART_PAD, chartGeometry } from '../utils/compareChart';
import type { CompareSeries } from '../utils/compareChart';

const MONO_FONT = 'monospace';

interface CompareChartProps {
  series: CompareSeries[];
  width: number;
  height: number;
}

export function CompareChart({ series, width, height }: CompareChartProps) {
  const geometry = chartGeometry(series, width, height);
  if (geometry.lines.length === 0) return null;

  const right = width - DEFAULT_CHART_PAD.right;
  const labelBottom = height - 6;

  return (
    <Svg width={width} height={height}>
      {geometry.gridY.map((grid, index) => (
        <Line
          key={`grid-${index}`}
          x1={DEFAULT_CHART_PAD.left}
          y1={grid.y}
          x2={right}
          y2={grid.y}
          stroke={colors.border}
          strokeWidth={1}
        />
      ))}
      {geometry.gridY.map((grid, index) => (
        <SvgText
          key={`ylabel-${index}`}
          x={2}
          y={grid.y - 2}
          fill={colors.textMuted}
          fontSize={8}
          fontFamily={MONO_FONT}
        >
          {grid.value.toFixed(0)}
        </SvgText>
      ))}
      {geometry.lines.map((line) => (
        <Path
          key={line.symbol}
          d={line.path}
          stroke={line.color}
          strokeWidth={2}
          fill="none"
        />
      ))}
      {geometry.ticksX.map((tick, index) => (
        <SvgText
          key={`xlabel-${index}`}
          x={tick.x}
          y={labelBottom}
          fill={colors.textMuted}
          fontSize={8}
          fontFamily={MONO_FONT}
          textAnchor="middle"
        >
          {tick.label}
        </SvgText>
      ))}
    </Svg>
  );
}
