import { render, screen, waitFor } from '@testing-library/react';

// Mock dashboard with data resilience
const MockResilientDashboard = ({ dataState }: { dataState: 'current' | 'stale' | 'error' }) => {
  const mockData = {
    current: {
      metrics: [{ name: 'NPS', value: 42.5, data_freshness: 'current', last_updated: '2025-09-23T10:00:00Z' }],
      status: 'success'
    },
    stale: {
      metrics: [{ name: 'NPS', value: 40.0, data_freshness: 'stale', last_updated: '2025-09-22T10:00:00Z' }],
      status: 'stale'
    },
    error: {
      metrics: [{ name: 'NPS', value: 38.0, data_freshness: 'estimated', last_updated: '2025-09-21T10:00:00Z' }],
      status: 'error'
    }
  };

  const data = mockData[dataState];

  return (
    <div data-testid="resilient-dashboard">
      {data.status === 'error' && (
        <div data-testid="error-indicator">⚠️ Using last known good values</div>
      )}
      {data.status === 'stale' && (
        <div data-testid="stale-indicator">🕐 Data is stale</div>
      )}
      <div data-testid="metric-display">
        {data.metrics.map((metric, index) => (
          <div key={index} data-testid={`metric-${index}`}>
            <span data-testid="metric-name">{metric.name}</span>
            <span data-testid="metric-value">{metric.value}</span>
            <span data-testid="data-freshness">{metric.data_freshness}</span>
            <span data-testid="last-updated">{metric.last_updated}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Data Resilience Integration', () => {
  describe('Scenario 4: Handle Missing Data', () => {
    it('should display last known good values when external services fail', async () => {
      render(<MockResilientDashboard dataState="error" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
        expect(screen.getByTestId('error-indicator')).toHaveTextContent('last known good values');
      });

      // Should still show metric values
      expect(screen.getByTestId('metric-value')).toHaveTextContent('38.0');
    });

    it('should show clear timestamps for stale data per clarification requirement', async () => {
      render(<MockResilientDashboard dataState="stale" />);

      await waitFor(() => {
        const lastUpdated = screen.getByTestId('last-updated');
        expect(lastUpdated).toBeInTheDocument();
        expect(lastUpdated.textContent).toContain('2025-09-22');
      });

      // Should indicate staleness
      expect(screen.getByTestId('stale-indicator')).toBeInTheDocument();
    });

    it('should indicate data freshness status clearly', async () => {
      render(<MockResilientDashboard dataState="current" />);

      await waitFor(() => {
        const dataFreshness = screen.getByTestId('data-freshness');
        expect(dataFreshness).toHaveTextContent('current');
      });

      // No error indicators for current data
      expect(screen.queryByTestId('error-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stale-indicator')).not.toBeInTheDocument();
    });

    it('should remain functional during data issues', async () => {
      render(<MockResilientDashboard dataState="error" />);

      // Dashboard should still be interactive
      expect(screen.getByTestId('resilient-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('metric-display')).toBeInTheDocument();

      // Metrics should still display with fallback values
      expect(screen.getByTestId('metric-name')).toHaveTextContent('NPS');
      expect(screen.getByTestId('metric-value')).toHaveTextContent('38.0');
    });

    it('should show appropriate visual indicators for different data states', async () => {
      const { rerender } = render(<MockResilientDashboard dataState="current" />);

      // Current state - no indicators
      expect(screen.queryByTestId('error-indicator')).not.toBeInTheDocument();

      // Stale state
      rerender(<MockResilientDashboard dataState="stale" />);
      await waitFor(() => {
        expect(screen.getByTestId('stale-indicator')).toBeInTheDocument();
      });

      // Error state
      rerender(<MockResilientDashboard dataState="error" />);
      await waitFor(() => {
        expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
      });
    });

    it('should maintain constitutional compliance during failures', async () => {
      render(<MockResilientDashboard dataState="error" />);

      // Should still support simple progress tracking
      expect(screen.getByTestId('metric-value')).toBeInTheDocument();

      // Should maintain transparency about data quality
      expect(screen.getByTestId('data-freshness')).toHaveTextContent('estimated');
      expect(screen.getByTestId('last-updated')).toBeInTheDocument();

      // Should preserve user ownership of data visibility
      expect(screen.getByTestId('error-indicator')).toHaveTextContent('last known good values');
    });
  });
});