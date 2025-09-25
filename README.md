# Measure What Matters Dashboard

A comprehensive product health monitoring dashboard. This tool helps teams track key metrics across Business Value, Quality, Efficiency, Engagement, and Progress categories.

## ✨ Features

- **📊 Real-time Metrics Dashboard** - Monitor 25+ key product health metrics
- **📈 Interactive Visualizations** - Sparklines, progress bars, and trend charts
- **🔍 Smart Status Indicators** - Color-coded health badges with threshold-based alerting
- **⚡ Mock Data Support** - Built-in fallback data for development and demos

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/measure-what-matters.git
   cd measure-what-matters
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in your terminal)

## 📋 Available Metrics

### Business Value
- Net Promoter Score (NPS)
- Revenue Growth
- Customer Onboarding Success
- Service Component Reuse
- Super Fans Rate

### Quality
- Production Defects by Severity
- Incident Response Time
- Impact Events
- Open CVEs
- Deployment Failure & Rollback Rate

### Efficiency
- Delivery Throughput
- Story Points Completed
- Cycle Time & Lead Time
- Cost per Epic
- Energy Consumption (Sustainability)

### Engagement
- Culture Change Indicators
- Developer Experience & Satisfaction
- Customer Experience & Satisfaction
- Team Sentiment (Mood Marbles)
- Commit Pattern Engagement

### Progress
- Rework & Technical Debt Trends
- Test Automation Trends
- Velocity Trends Across Sprints
- Code Activity Trends
- Pull Request Size & Review Time

## 🏗️ Architecture

```
measure-what-matters/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── charts/      # Chart components (D3, Recharts)
│   │   │   ├── filters/     # Time range and product filters
│   │   │   ├── layout/      # Layout components
│   │   │   ├── metrics/     # Metric display components
│   │   │   └── recommendations/ # AI recommendations
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API services and mock data
│   │   ├── styles/         # Tailwind CSS styles
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Future API implementation
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Adding New Metrics

1. **Define the metric** in `src/services/api.service.ts`:
   ```typescript
   {
     id: 'your-metric-id',
     name: 'Your Metric Name',
     description: 'Description of what this metric measures',
     value: 42,
     unit: 'units',
     target: 50,
     healthStatus: 'green',
     category: 'Business Value',
     // ... additional properties
   }
   ```

2. **Configure display options**:
   - `chartType`: 'progress', 'sparkline', 'trend', 'donut', or 'clean'
   - `reverseIsGood`: true for metrics where lower is better (costs, defects)
   - `trendData`: Array of historical values for visualization

## 🤝 Contributing

Contributions are welcomed! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes: `npm test`
5. Commit your changes: `git commit -m "Add your feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Backend API implementation
- [ ] Real-time data integration
- [ ] Advanced analytics and forecasting

---

Built with ❤️ using React, Next.js, TypeScript, and Tailwind CSS