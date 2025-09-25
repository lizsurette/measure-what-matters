import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { FlowChart } from './FlowChart';
import { StackedFlowChart } from './StackedFlowChart';

// Clean Status Badge - minimal status indicator
function CleanStatusBadge({ revenueData, healthStatus }: { revenueData?: any; healthStatus: 'green' | 'yellow' | 'red' }) {
  if (!revenueData?.current?.targetPerformance) return null;

  const percentage = revenueData.current.targetPerformance;
  const badgeColor = percentage >= 100 ? 'bg-green-100 text-green-800' :
                     percentage >= 90 ? 'bg-yellow-100 text-yellow-800' :
                     'bg-red-100 text-red-800';

  return (
    <div className="w-full h-6 flex items-center justify-center">
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor} min-w-max`}>
        {percentage}% of target
      </span>
    </div>
  );
}

// Onboarding Funnel - shows completion steps as mini bars
function OnboardingFunnel({ onboardingData }: { onboardingData?: any }) {
  if (!onboardingData?.funnel) return null;

  const steps = [
    { key: 'accountSetup', value: onboardingData.funnel.accountSetup },
    { key: 'profileCompletion', value: onboardingData.funnel.profileCompletion },
    { key: 'firstDataImport', value: onboardingData.funnel.firstDataImport },
    { key: 'firstDashboard', value: onboardingData.funnel.firstDashboard },
    { key: 'shareCollaborate', value: onboardingData.funnel.shareCollaborate }
  ];

  const maxHeight = 20; // pixels

  return (
    <div className="w-full h-6 flex items-end justify-between space-x-1">
      {steps.map((step, index) => {
        const height = (step.value / 100) * maxHeight;
        const color = step.value >= 80 ? '#10b981' :
                     step.value >= 60 ? '#f59e0b' : '#ef4444';

        return (
          <div
            key={step.key}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${Math.max(height, 3)}px`,
              backgroundColor: color,
              opacity: 0.8
            }}
            title={`Step ${index + 1}: ${step.value}%`}
          />
        );
      })}
    </div>
  );
}

// NPS Breakdown Bar Component
function NPSBreakdownBar({ npsData }: { npsData?: any }) {
  if (!npsData?.currentBreakdown) return null;

  const { promoters, passives, detractors } = npsData.currentBreakdown;

  return (
    <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
      {/* Promoters (Light Green) */}
      <div
        className="h-full bg-green-200 flex items-center justify-center"
        style={{ width: `${promoters}%` }}
      >
        {promoters > 15 && (
          <span className="text-xs font-medium text-green-800">
            {promoters > 30 ? `Promoters ${promoters}%` : `${promoters}%`}
          </span>
        )}
      </div>

      {/* Passives (Light Yellow) */}
      <div
        className="h-full bg-yellow-200 flex items-center justify-center"
        style={{ width: `${passives}%` }}
      >
        {passives > 15 && (
          <span className="text-xs font-medium text-yellow-800">
            {passives > 25 ? `Passives ${passives}%` : `${passives}%`}
          </span>
        )}
      </div>

      {/* Detractors (Light Red) */}
      <div
        className="h-full bg-red-200 flex items-center justify-center"
        style={{ width: `${detractors}%` }}
      >
        {detractors > 10 && (
          <span className="text-xs font-medium text-red-800">
            {detractors > 20 ? `Detractors ${detractors}%` : `${detractors}%`}
          </span>
        )}
      </div>
    </div>
  );
}

// Service Adoption Grid - shows top services with adoption rates
function ServiceAdoptionGrid({ serviceAdoptionData }: { serviceAdoptionData?: any }) {
  if (!serviceAdoptionData?.serviceBreakdown) return null;

  // Take top 6 services for mini view
  const topServices = serviceAdoptionData.serviceBreakdown.slice(0, 6);

  return (
    <div className="w-full h-6 grid grid-cols-6 gap-1">
      {topServices.map((service: any, index: number) => {
        const height = (service.adoption / 100) * 20; // Max 20px height
        const color = service.adoption >= 80 ? '#10b981' :
                     service.adoption >= 60 ? '#f59e0b' :
                     service.adoption >= 40 ? '#f97316' : '#ef4444';

        return (
          <div
            key={service.name}
            className="flex flex-col justify-end h-full"
            title={`${service.name}: ${service.adoption}%`}
          >
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${Math.max(height, 3)}px`,
                backgroundColor: color,
                opacity: 0.8
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Fan Segmentation Mini - shows super fans vs other user segments
function FanSegmentationMini({ superFanData }: { superFanData?: any }) {
  if (!superFanData?.fanSegmentation) return null;

  const segments = [
    { key: 'superFans', label: 'Super Fans', color: '#10b981' },
    { key: 'powerUsers', label: 'Power Users', color: '#f59e0b' },
    { key: 'engagedUsers', label: 'Engaged', color: '#3b82f6' },
    { key: 'casualUsers', label: 'Casual', color: '#e5e7eb' }
  ];

  return (
    <div className="w-full h-6 flex rounded overflow-hidden">
      {segments.map((segment) => {
        const data = superFanData.fanSegmentation[segment.key];
        const width = data.percentage;

        return (
          <div
            key={segment.key}
            className="h-full flex items-center justify-center text-xs font-medium text-white"
            style={{
              width: `${width}%`,
              backgroundColor: segment.color,
              minWidth: width > 15 ? 'auto' : '2px'
            }}
            title={`${segment.label}: ${width}% (${data.count.toLocaleString()} users)`}
          >
            {width > 18 && `${width}%`}
          </div>
        );
      })}
    </div>
  );
}

// Defect Severity Breakdown - shows defects by severity level
function DefectSeverityBreakdown({ defectsData }: { defectsData?: any }) {
  if (!defectsData?.current) return null;

  const { critical, high, medium, low, total } = defectsData.current;

  const severities = [
    { key: 'critical', count: critical, color: '#dc2626', label: 'Critical' },
    { key: 'high', count: high, color: '#ea580c', label: 'High' },
    { key: 'medium', count: medium, color: '#f59e0b', label: 'Medium' },
    { key: 'low', count: low, color: '#84cc16', label: 'Low' }
  ];

  return (
    <div className="w-full h-6 flex gap-1">
      {severities.map((severity) => {
        const width = (severity.count / total) * 100;
        const barWidth = Math.max(width, 3); // Minimum 3% width for visibility

        return (
          <div
            key={severity.key}
            className="h-full rounded-sm flex items-center justify-center transition-all"
            style={{
              width: `${barWidth}%`,
              backgroundColor: severity.color,
              opacity: 0.9
            }}
            title={`${severity.label}: ${severity.count} defects`}
          >
            {width > 12 && (
              <span className="text-xs font-medium text-white">
                {severity.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MiniChartProps {
  type: 'progress' | 'sparkline' | 'donut' | 'trend' | 'clean' | 'flow-chart' | 'stacked-flow' | 'nps-breakdown' | 'clean-status' | 'onboarding-funnel' | 'service-adoption' | 'fan-segmentation' | 'defect-severity';
  value: number;
  target: number;
  healthStatus: 'green' | 'yellow' | 'red';
  data?: number[]; // For sparkline/trend charts
  unit?: string;
  flowData?: any; // For flow chart data
  npsData?: any; // For NPS breakdown data
  revenueData?: any; // For revenue data
  onboardingData?: any; // For onboarding funnel data
  serviceAdoptionData?: any; // For service adoption data
  superFanData?: any; // For super fan data
  defectsData?: any; // For defect severity data
}

interface D3TrendChartProps {
  data?: number[];
  color: string;
}

function D3TrendChart({ data, color }: D3TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const width = 100;
    const height = 24;
    const margin = { top: 4, right: 5, bottom: 4, left: 5 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data) as [number, number])
      .range([innerHeight, 0]);

    // Create line generator with curve interpolation
    const line = d3.line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveCardinal.tension(0.3)); // Smooth curve

    // Add the line path
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", line);

  }, [data, color]);

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-8 flex items-center">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
      />
    </div>
  );
}

export function MiniChart({ type, value, target, healthStatus, data, unit, flowData, npsData, revenueData, onboardingData, serviceAdoptionData, superFanData, defectsData }: MiniChartProps) {
  const getColor = () => {
    switch (healthStatus) {
      case 'green': return '#10b981'; // green-500
      case 'yellow': return '#f97316'; // orange-500 to match progress bars
      case 'red': return '#ee0000'; // red-hat-50
    }
  };

  const percentage = Math.min((value / target) * 100, 100);

  switch (type) {
    case 'progress':
      return (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: getColor()
            }}
          />
        </div>
      );

    case 'sparkline':
      if (!data || data.length === 0) return null;
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;

      return (
        <div className="w-full h-6 flex items-end gap-0.5">
          {data.map((point, index) => {
            const height = ((point - min) / range) * 100;
            return (
              <div
                key={index}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.max(height, 15)}%`,
                  backgroundColor: getColor(),
                  opacity: index === data.length - 1 ? 1 : 0.7
                }}
              />
            );
          })}
        </div>
      );

    case 'donut':
      const circumference = 2 * Math.PI * 20;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

      return (
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke={getColor()}
              strokeWidth="4"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900">
              {Math.round(value)}
            </span>
          </div>
        </div>
      );

    case 'trend':
      return <D3TrendChart data={data} color={getColor()} />;

    case 'clean':
      return null; // No chart visualization, just clean numbers

    case 'flow-chart':
      return flowData ? <FlowChart data={flowData} healthStatus={healthStatus} /> : null;

    case 'stacked-flow':
      return flowData ? <StackedFlowChart data={flowData} healthStatus={healthStatus} /> : null;

    case 'nps-breakdown':
      return <NPSBreakdownBar npsData={npsData} />;

    case 'clean-status':
      return <CleanStatusBadge revenueData={revenueData} healthStatus={healthStatus} />;

    case 'onboarding-funnel':
      return <OnboardingFunnel onboardingData={onboardingData} />;

    case 'service-adoption':
      return <ServiceAdoptionGrid serviceAdoptionData={serviceAdoptionData} />;

    case 'fan-segmentation':
      return <FanSegmentationMini superFanData={superFanData} />;

    case 'defect-severity':
      return <DefectSeverityBreakdown defectsData={defectsData} />;

    default:
      return null;
  }
}