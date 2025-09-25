# Data Model: Product Health Dashboard

## Core Entities

### Metric
**Purpose**: Core measurement entity representing individual metrics within the Forrester framework

**Fields**:
- `id`: UUID (Primary Key)
- `name`: String (e.g., "Net Promoter Score", "Deployment Failures")
- `category_id`: UUID (Foreign Key to MetricCategory)
- `value`: Decimal (Current metric value)
- `unit`: String (e.g., "percentage", "count", "milliseconds")
- `calculation_method`: Text (Formula or algorithm description)
- `data_source_id`: UUID (Foreign Key to DataSource)
- `health_status`: Enum ('red', 'yellow', 'green')
- `is_leading_indicator`: Boolean (True for predictive metrics)
- `industry_threshold_low`: Decimal (Red threshold)
- `industry_threshold_medium`: Decimal (Yellow threshold)
- `industry_threshold_high`: Decimal (Green threshold)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `last_calculated_at`: Timestamp

**Relationships**:
- Belongs to one MetricCategory
- Has one DataSource
- Has many TimeSeriesData points
- Has many CalculationSteps

**Validation Rules**:
- name must be unique within category
- value must be non-negative for count-based metrics
- thresholds must be ordered: low < medium < high
- calculation_method must be non-empty for calculated metrics

### MetricCategory
**Purpose**: Forrester MAD framework categories grouping related metrics

**Fields**:
- `id`: UUID (Primary Key)
- `name`: String ('Business Value', 'Quality', 'Efficiency', 'Engagement', 'Progress')
- `display_order`: Integer (1-5 for positioning)
- `description`: Text
- `color_scheme`: JSON (Theme colors for UI)
- `is_central`: Boolean (True only for Business Value)

**Relationships**:
- Has many Metrics

**Validation Rules**:
- name must be one of the five Forrester categories
- display_order must be unique
- is_central can only be true for 'Business Value'

### DataSource
**Purpose**: Origin and collection method for metric data

**Fields**:
- `id`: UUID (Primary Key)
- `name`: String (e.g., "GitHub API", "Jira Integration", "Manual Input")
- `type`: Enum ('api', 'database', 'manual', 'calculated')
- `connection_config`: JSON (API endpoints, credentials reference)
- `collection_frequency`: Enum ('manual', 'hourly', 'daily', 'weekly')
- `last_successful_fetch`: Timestamp
- `is_active`: Boolean
- `retry_count`: Integer
- `error_message`: Text (Last error if any)

**Relationships**:
- Has many Metrics

**Validation Rules**:
- connection_config required for 'api' and 'database' types
- collection_frequency must align with daily update requirement
- retry_count must be non-negative

### TimeSeriesData
**Purpose**: Historical metric values for trend analysis

**Fields**:
- `id`: UUID (Primary Key)
- `metric_id`: UUID (Foreign Key to Metric)
- `value`: Decimal
- `timestamp`: Timestamp
- `is_estimated`: Boolean (True for trend-based estimates)
- `data_quality_score`: Decimal (0.0-1.0)

**Relationships**:
- Belongs to one Metric

**Validation Rules**:
- timestamp must be unique per metric_id
- data_quality_score must be between 0.0 and 1.0
- is_estimated true only when actual data unavailable

### CalculationMethod
**Purpose**: Detailed steps for deriving calculated metrics

**Fields**:
- `id`: UUID (Primary Key)
- `metric_id`: UUID (Foreign Key to Metric)
- `step_number`: Integer
- `description`: Text
- `formula`: Text (Mathematical expression)
- `input_metrics`: JSON Array (Referenced metric IDs)
- `transformation_type`: Enum ('sum', 'average', 'ratio', 'custom')

**Relationships**:
- Belongs to one Metric

**Validation Rules**:
- step_number must be sequential within metric
- formula required for 'custom' transformation_type
- input_metrics must reference valid metric IDs

### HealthIndicator
**Purpose**: Visual status representation with threshold mapping

**Fields**:
- `id`: UUID (Primary Key)
- `metric_id`: UUID (Foreign Key to Metric)
- `status`: Enum ('red', 'yellow', 'green')
- `threshold_applied`: Decimal (Actual threshold value used)
- `status_reason`: Text (Explanation of status determination)
- `calculated_at`: Timestamp

**Relationships**:
- Belongs to one Metric

**Validation Rules**:
- status must align with metric value vs thresholds
- threshold_applied must match one of metric's industry thresholds
- calculated_at must not be in future

### Dashboard
**Purpose**: User interface configuration and layout

**Fields**:
- `id`: UUID (Primary Key)
- `name`: String
- `layout_config`: JSON (Widget positions, sizes)
- `filter_settings`: JSON (Time ranges, category selections)
- `refresh_interval`: Integer (Seconds)
- `is_default`: Boolean
- `created_by`: String (User identifier)

**Relationships**:
- Has many DashboardWidgets

**Validation Rules**:
- refresh_interval must be >= 3600 (1 hour minimum per daily update requirement)
- only one dashboard can have is_default = true per user

### MetricOverlay
**Purpose**: Interactive information panels for calculation transparency

**Fields**:
- `id`: UUID (Primary Key)
- `metric_id`: UUID (Foreign Key to Metric)
- `overlay_type`: Enum ('calculation', 'data_source', 'trend_analysis')
- `content`: JSON (Structured overlay information)
- `display_config`: JSON (Positioning, styling)

**Relationships**:
- Belongs to one Metric

**Validation Rules**:
- content structure must match overlay_type schema
- display_config must include required positioning fields

## Entity Relationships

### Primary Relationships
```
MetricCategory (1) ← (many) Metric
DataSource (1) ← (many) Metric
Metric (1) ← (many) TimeSeriesData
Metric (1) ← (many) CalculationMethod
Metric (1) ← (1) HealthIndicator
Metric (1) ← (many) MetricOverlay
Dashboard (1) ← (many) DashboardWidget
```

### Cross-Category Correlations
- Business Value metrics can reference other category metrics in calculations
- Leading indicators in any category predict outcome metrics
- Engagement metrics influence all other categories per Forrester framework

## State Transitions

### Metric Health Status
```
Initial → green (when first calculated)
green → yellow (when crossing medium threshold)
yellow → red (when crossing low threshold)
red → yellow (when improving above low threshold)
yellow → green (when improving above medium threshold)
```

### Data Source Status
```
inactive → active (when first configured)
active → error (when fetch fails)
error → active (when fetch succeeds)
active → inactive (when manually disabled)
```

## Performance Considerations

### Indexing Strategy
- `metric_id, timestamp` composite index on TimeSeriesData
- `category_id` index on Metric for category filtering
- `last_calculated_at` index for finding stale metrics
- `is_leading_indicator` index for correlation queries

### Data Retention
- TimeSeriesData: 2 years rolling retention
- CalculationMethod: Permanent retention
- HealthIndicator: 90 days rolling retention
- MetricOverlay: Permanent retention (configuration data)

### Caching Strategy
- Current metric values: Redis cache, 1-hour TTL
- Last known good values: Redis permanent storage per clarification
- Dashboard configurations: Application memory cache
- Threshold configurations: Application startup cache