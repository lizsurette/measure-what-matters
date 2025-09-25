# Contributing to Measure What Matters

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/measure-what-matters.git
   cd measure-what-matters
   ```
3. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the GitHub issue template
- Include steps to reproduce
- Provide browser/environment details
- Include screenshots if applicable

### ✨ Feature Requests
- Describe the feature and its use case
- Explain why it would be valuable
- Consider implementation approach

### 📊 Adding New Metrics
New metrics are welcomed! Here's how to add them:

1. **Add metric definition** in `src/services/api.service.ts`:
   ```typescript
   {
     id: 'unique-metric-id',
     name: 'Metric Display Name',
     description: 'Clear description of what this measures',
     value: 42,
     unit: 'units', // or '%', 'ms', 'defects', etc.
     target: 50,
     healthStatus: 'green', // 'green', 'yellow', 'red'
     category: 'Business Value', // see categories below
     calculation_method: 'How this metric is calculated',
     last_updated: new Date().toISOString(),
     trend: 'up', // 'up', 'down', 'stable'
     change_percent: 2.5,
     chartType: 'sparkline', // see chart types below
     trendData: [30, 35, 40, 42], // historical data
     reverseIsGood: false // true if lower values are better
   }
   ```

2. **Metric Categories**:
   - `Business Value`: Revenue, NPS, customer metrics
   - `Quality`: Defects, incidents, security
   - `Efficiency`: Throughput, costs, performance
   - `Engagement`: Team sentiment, satisfaction
   - `Progress`: Development velocity, technical debt

3. **Chart Types**:
   - `progress`: Horizontal progress bar
   - `sparkline`: Small bar chart showing trend
   - `trend`: Smooth line chart
   - `donut`: Circular progress indicator
   - `clean`: No visualization, just numbers

### 🎨 UI/UX Improvements
- Use existing Tailwind classes when possible
- Ensure responsive design (mobile-friendly)
- Maintain accessibility standards

### 🧪 Testing
- Write tests for new features
- Ensure existing tests pass: `npm test`
- Test on multiple browsers

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic

### Component Structure
```typescript
// Component props interface
interface ComponentProps {
  required: string;
  optional?: number;
}

// Main component
export function Component({ required, optional = 0 }: ComponentProps) {
  // Component logic
  return <div>...</div>;
}
```

### Naming Conventions
- **Components**: PascalCase (`MetricTile.tsx`)
- **Files**: kebab-case (`metric-tile.tsx`) or PascalCase for components
- **Variables**: camelCase (`metricData`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIME_RANGE`)

### Git Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/metric-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make focused commits**:
   ```bash
   git add .
   git commit -m "Add new customer satisfaction metric

   - Implements thumbs up/down feedback tracking
   - Adds percentage-based satisfaction display
   - Includes trend visualization"
   ```

3. **Keep branches up to date**:
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/metric-name
   git rebase main
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/metric-name
   ```

### Pull Request Guidelines

- **Title**: Clear, descriptive summary
- **Description**:
  - What changes were made
  - Why they were needed
  - How to test them
- **Screenshots**: Include for UI changes
- **Link Issues**: Reference related issues
- **Small PRs**: Keep changes focused and reviewable

## 🏗️ Architecture Notes

### File Organization
```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components
│   ├── filters/        # Filter components
│   ├── layout/         # Layout components
│   ├── metrics/        # Metric display components
│   └── recommendations/ # AI recommendations
├── pages/              # Next.js pages
├── services/           # API services and data
├── styles/             # Global styles
└── types/              # TypeScript definitions
```

### State Management
- Use React hooks for component state
- Props drilling for simple data flow
- Consider Context API for deeply nested data

### Styling
- Tailwind CSS for all styling
- Follow Red Hat color palette
- Responsive design patterns
- Consistent spacing and typography

## 🔍 Testing Strategy

### What to Test
- New metric calculations
- Component rendering
- User interactions
- Responsive behavior
- Error handling

### Testing Tools
- Jest for unit tests
- React Testing Library for component tests
- Manual testing for UI/UX

## 📝 Documentation

### Code Documentation
- JSDoc comments for complex functions
- README updates for new features
- Type definitions for new interfaces

### User Documentation
- Update README for new features
- Include examples in contributing guide
- Document configuration options

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Measure What Matters better! 🚀