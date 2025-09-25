# Measure What Matters Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-23

## Active Technologies
- TypeScript 5.0+ / Node.js 18+ + React 18, Next.js 14, D3.js for visualizations, Recharts for charts (001-product-health-dashboard)

## Project Structure
```
backend/
frontend/
tests/
```

## Commands
npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style
TypeScript 5.0+ / Node.js 18+: Follow standard conventions

## Recent Changes
- 001-product-health-dashboard: Added TypeScript 5.0+ / Node.js 18+ + React 18, Next.js 14, D3.js for visualizations, Recharts for charts
- Applied Red Hat brand guidelines throughout UI components
- Updated all metric categories to match spec requirements (FR-006 to FR-030)
- Implemented AI-based recommendations system with per-metric suggestions
- Removed unnecessary navigation and footer elements for focused dashboard design
- Repository cleanup: Removed unused dependencies (axios, swr, lucide-react, clsx), unused files (dashboard.context), and simplified revenue metric visualization to clean status badge
- Streamlined API service data structure by removing excessive mock data

## Brand Guidelines
- **Primary Color**: Red Hat Red (#ee0000) for critical indicators and primary actions
- **Color Palette**: Full Red Hat brand colors available in Tailwind config
- **Design Principles**: Generous white space, restrained color usage, clean typography
- **Background**: Subtle contrast (#fafafa) with white cards for optimal readability

## Key Implementation Details
- **Metrics**: All 25 metrics across 5 categories align with MAD framework spec requirements
- **AI Recommendations**: Context-specific suggestions with priority levels, impact estimates, and effort calculations
- **Mock Data**: Comprehensive fallback system when backend APIs are unavailable
- **Navigation**: Single-purpose dashboard interface without distracting navigation elements

## Development Server
- Frontend runs on port 3003 (auto-assigned due to port conflicts)
- Hot reload enabled for real-time development
- Mock data provides full functionality without backend dependencies

<!-- MANUAL ADDITIONS START -->

## Custom Metric Implementations

### Customer Onboarding Success Metric
- **Main Metric**: 67% completion rate (not composite score) - shows % of users completing core onboarding steps
- **Chart Type**: `onboarding-funnel` - displays 5-step funnel with color-coded completion rates
- **Status Label**: "complete onboarding" (neutral gray, descriptive)
- **Subtitle**: Shows TTV in days (2.3d) + 30-day retention %
- **Data Structure**: `onboardingData` with components (timeToValue, featureAdoption, earlyRetention), funnel steps, and supportMetrics
- **Detailed View**: OnboardingAnalyticsChart.tsx - comprehensive breakdown with funnel visualization, component scores, and insights

### Revenue Growth Metric
- **Chart Type**: `clean-status` - simple "108% of target" badge
- **Status Label**: Performance-based (On Target, Excellent, etc.)
- **Data Structure**: `revenueData` with current metrics, benchmarks, segments, channels, forecast

### Chart Component Architecture
- **MiniChart.tsx**: Supports multiple chart types including onboarding-funnel, clean-status, nps-breakdown
- **MetricOverlay.tsx**: Metric-specific detailed views with specialized charts
- **Pattern**: Each complex metric has dedicated analytics chart component for detailed view

### Service Adoption Rate Metric (Renamed from Service Component Reuse)
- **Business Focus**: Renamed to "Service Adoption Rate" - measures customer usage of available service components
- **Chart Type**: `service-adoption` - mini grid showing top 6 services with color-coded adoption rates
- **Enhanced Context**: Subtitle shows "12 of 15 services used • Target: 75%"
- **Data Structure**: `serviceAdoptionData` with comprehensive service breakdown, customer segments, revenue impact, and adoption trends
- **Detailed View**: ServiceAdoptionAnalyticsChart.tsx with 5 tabs:
  - **Portfolio Matrix**: Services plotted by adoption vs engagement (quadrant analysis)
  - **Customer Segments**: Enterprise/Mid-Market/SMB adoption patterns
  - **Service Journey**: Discovery → Trial → Adoption → Mastery funnel
  - **Timeline**: Monthly progression and service performance breakdown
- **Industry Best Practices**: Follows patterns from Salesforce, AWS, Stripe for service portfolio health

### Super Fans Rate Metric (Enhanced Multi-Dimensional Analysis)
- **Dashboard Enhancement**: `fan-segmentation` chart showing 16% Super Fans, 23% Power Users, 31% Engaged, 30% Casual
- **Rich Context**: Subtitle shows "23% power users, 31% engaged • Target: 15%"
- **Header Context**: "16% highly engaged users" with business impact ("Generate 170% more revenue")
- **Data Structure**: `superFanData` with fan segmentation, business impact, behavior metrics, conversion funnel, monthly progression
- **Detailed View**: SuperFanAnalyticsChart.tsx with story-driven design:
  - **Hero Statement**: "16% of users generate 42% of revenue"
  - **Segmentation Cards**: Color-coded value labels (HIGHEST VALUE, HIGH VALUE, GROWING, OPPORTUNITY)
  - **Business Impact**: Revenue contribution, referral rates, support costs, retention analysis
  - **Behavior Patterns**: Heatmap of session length, feature adoption, community engagement
  - **Conversion Funnel**: User journey from new → active → engaged → power → super fans
- **Executive-Friendly**: Story-first approach with actionable insights and growth recommendations

### Trend Display Logic
- **Arrow Icons**: Shows up/down arrows for all non-zero changes (fixed from previous down-only logic)
- **Reverse Metrics**: Support for metrics where down=good via `reverseIsGood` property
- **Color Coding**: Red for bad trends, green for good trends, respecting metric direction

<!-- MANUAL ADDITIONS END -->