/**
 * recharts-compat.ts
 *
 * Recharts v2 ships class components whose TypeScript definitions conflict
 * with React 19's strict JSX FC element types. All casts are centralised here
 * so individual component files stay clean.
 *
 * Usage: import { BarChart, XAxis, ... } from "@/lib/recharts-compat";
 */
import * as RC from "recharts";
import type React from "react";

type RCProps = Record<string, any>;

export const AreaChart = RC.AreaChart as unknown as React.FC<RCProps>;
export const Area = RC.Area as unknown as React.FC<RCProps>;
export const BarChart = RC.BarChart as unknown as React.FC<RCProps>;
export const Bar = RC.Bar as unknown as React.FC<RCProps>;
export const LineChart = RC.LineChart as unknown as React.FC<RCProps>;
export const Line = RC.Line as unknown as React.FC<RCProps>;
export const PieChart = RC.PieChart as unknown as React.FC<RCProps>;
export const Pie = RC.Pie as unknown as React.FC<RCProps>;
export const Cell = RC.Cell as unknown as React.FC<RCProps>;
export const XAxis = RC.XAxis as unknown as React.FC<RCProps>;
export const YAxis = RC.YAxis as unknown as React.FC<RCProps>;
export const CartesianGrid = RC.CartesianGrid as unknown as React.FC<RCProps>;
export const Tooltip = RC.Tooltip as unknown as React.FC<RCProps>;
export const Legend = RC.Legend as unknown as React.FC<RCProps>;
export const ReferenceLine = RC.ReferenceLine as unknown as React.FC<RCProps>;
export const ResponsiveContainer = RC.ResponsiveContainer as unknown as React.FC<{
    width: string | number;
    height: number;
    children?: React.ReactNode;
}>;
