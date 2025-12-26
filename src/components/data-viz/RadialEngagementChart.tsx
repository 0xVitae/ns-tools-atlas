import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { EngagementData, AppEngagement, CategoryEngagement } from "@/types/engagement";

interface RadialEngagementChartProps {
  data: EngagementData;
  width?: number;
  height?: number;
  onAppHover?: (app: AppEngagement | null, category: CategoryEngagement | null) => void;
  onAppClick?: (app: AppEngagement, category: CategoryEngagement) => void;
}

// Convert polar coordinates to cartesian
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

// Generate SVG arc path
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// Generate sector path (pie slice)
function describeSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `
    M ${outerStart.x} ${outerStart.y}
    A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
    Z
  `;
}

export default function RadialEngagementChart({
  data,
  width = 800,
  height = 800,
  onAppHover,
  onAppClick,
}: RadialEngagementChartProps) {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const cx = width / 2;
  const cy = height / 2;
  const innerRadius = 80;
  const outerRadius = Math.min(width, height) / 2 - 60;
  const categoryGap = 2; // degrees between categories

  // Calculate layout
  const layout = useMemo(() => {
    const totalCategories = data.categories.length;
    const totalAngle = 360 - categoryGap * totalCategories;
    const anglePerCategory = totalAngle / totalCategories;

    let currentAngle = 0;

    return data.categories.map((category) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + anglePerCategory;
      currentAngle = endAngle + categoryGap;

      // Calculate app arcs within category
      const appCount = category.apps.length;
      const appAngleRange = anglePerCategory - 4; // padding inside category
      const appStartAngle = startAngle + 2;

      const appArcs = category.apps.map((app, appIndex) => {
        const appAngleStart = appStartAngle + (appIndex * appAngleRange) / appCount;
        const appAngleEnd = appStartAngle + ((appIndex + 1) * appAngleRange) / appCount - 1;

        // Calculate radius based on engagement score
        const scoreRadius = innerRadius + 20 + ((outerRadius - innerRadius - 30) * app.engagementScore) / 100;

        return {
          app,
          startAngle: appAngleStart,
          endAngle: appAngleEnd,
          innerRadius: innerRadius + 15,
          outerRadius: scoreRadius,
        };
      });

      // Label position (middle of sector, outside)
      const labelAngle = (startAngle + endAngle) / 2;
      const labelPos = polarToCartesian(cx, cy, outerRadius + 30, labelAngle);

      return {
        category,
        startAngle,
        endAngle,
        appArcs,
        labelPos,
        labelAngle,
      };
    });
  }, [data, cx, cy, innerRadius, outerRadius]);

  const handleAppHover = (app: AppEngagement | null, category: CategoryEngagement | null) => {
    setHoveredApp(app?.id || null);
    onAppHover?.(app, category);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ maxWidth: width, maxHeight: height }}
    >
      {/* Decorative guide circles */}
      <g className="guide-rings" opacity={0.15}>
        {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={innerRadius + (outerRadius - innerRadius) * ratio}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
      </g>

      {/* Category sectors and app arcs */}
      {layout.map(({ category, startAngle, endAngle, appArcs, labelPos, labelAngle }) => (
        <g key={category.id}>
          {/* Category background sector */}
          <motion.path
            d={describeSector(cx, cy, innerRadius + 10, outerRadius, startAngle, endAngle)}
            fill={category.color}
            opacity={0.08}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ duration: 0.5 }}
          />

          {/* Sector divider line */}
          <line
            x1={polarToCartesian(cx, cy, innerRadius + 5, startAngle).x}
            y1={polarToCartesian(cx, cy, innerRadius + 5, startAngle).y}
            x2={polarToCartesian(cx, cy, outerRadius + 5, startAngle).x}
            y2={polarToCartesian(cx, cy, outerRadius + 5, startAngle).y}
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          {/* App engagement arcs */}
          {appArcs.map(({ app, startAngle: appStart, endAngle: appEnd, innerRadius: appInner, outerRadius: appOuter }) => (
            <motion.path
              key={app.id}
              d={describeSector(cx, cy, appInner, appOuter, appStart, appEnd)}
              fill={app.color}
              opacity={hoveredApp === app.id ? 1 : 0.85}
              stroke={hoveredApp === app.id ? "#1e293b" : "white"}
              strokeWidth={hoveredApp === app.id ? 2 : 1}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: hoveredApp === app.id ? 1 : 0.85 }}
              transition={{ duration: 0.6, delay: Math.random() * 0.3 }}
              style={{ cursor: "pointer", transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => handleAppHover(app, category)}
              onMouseLeave={() => handleAppHover(null, null)}
              onClick={() => onAppClick?.(app, category)}
            />
          ))}

          {/* App icons/emojis */}
          {appArcs.map(({ app, startAngle: appStart, endAngle: appEnd, outerRadius: appOuter }) => {
            const iconAngle = (appStart + appEnd) / 2;
            const iconPos = polarToCartesian(cx, cy, appOuter + 15, iconAngle);
            return (
              <motion.text
                key={`icon-${app.id}`}
                x={iconPos.x}
                y={iconPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm pointer-events-none select-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                {app.icon}
              </motion.text>
            );
          })}

          {/* Category label */}
          <motion.text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor={labelAngle > 90 && labelAngle < 270 ? "end" : "start"}
            dominantBaseline="middle"
            className="text-xs font-semibold fill-slate-600 pointer-events-none"
            transform={
              labelAngle > 90 && labelAngle < 270
                ? `rotate(${labelAngle + 180}, ${labelPos.x}, ${labelPos.y})`
                : `rotate(${labelAngle}, ${labelPos.x}, ${labelPos.y})`
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {category.name}
          </motion.text>
        </g>
      ))}

      {/* Center circle with stats */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={innerRadius}
        fill="white"
        stroke="#e2e8f0"
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      />

      {/* Center content - NS Logo + single stat */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* NS Logo SVG */}
        <svg
          x={cx - 25}
          y={cy - 30}
          width="50"
          height="34"
          viewBox="0 0 30 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.04883 0C14.4015 1.58136e-05 18.0466 0.857342 21.4111 0.857422C24.5739 0.857419 26.8592 0.730968 29.0273 0.478516C29.2469 0.453142 29.4413 0.621298 29.4414 0.838867V19.2832C29.4411 19.4516 29.323 19.5976 29.1543 19.626C27.6623 19.8749 24.1475 20 21.4111 20C18.4798 19.9999 14.1466 19.1426 9.55859 19.1426C5.14747 19.1426 2.72034 19.3956 0.432617 19.7822C0.207077 19.8203 0.000341557 19.6499 0 19.4248V1.0332C3.69636e-05 0.851129 0.136849 0.697243 0.320312 0.673828C2.56107 0.389876 5.35291 0 9.04883 0ZM13.4951 8.76074C11.9493 8.65328 10.6111 8.66895 9.43164 8.66895V11.1475C10.2548 11.1475 11.7426 11.1495 13.4922 11.2998C13.4903 13.3072 13.492 15.0743 13.5088 15.4326C14.1458 15.5754 14.5286 15.5754 15.791 15.8018V11.5508C17.549 11.7554 18.8433 11.8613 20.1377 11.8613V9.29004C18.7357 9.29004 17.6985 9.187 15.791 8.98242V4.79199C15.7758 4.78999 14.1434 4.57627 13.5088 4.57617C13.5086 4.61678 13.5007 6.53989 13.4951 8.76074Z"
            fill="#1e293b"
          />
        </svg>
        {/* Single stat below logo */}
        <text
          x={cx}
          y={cy + 25}
          textAnchor="middle"
          className="text-sm font-bold fill-slate-800"
        >
          {data.totalMetrics.totalApps} apps
        </text>
      </motion.g>

      {/* Legend indicators around outer edge */}
      <g className="legend-dots">
        {layout.map(({ category }, i) => {
          const angle = -90 + (i * 360) / layout.length;
          const pos = polarToCartesian(cx, cy, outerRadius + 55, angle + 180 / layout.length);
          return (
            <motion.circle
              key={`legend-${category.id}`}
              cx={pos.x}
              cy={pos.y}
              r={4}
              fill={category.color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
            />
          );
        })}
      </g>
    </svg>
  );
}
