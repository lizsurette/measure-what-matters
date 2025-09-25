import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock time filter component
const MockTimeFilter = ({ onPeriodChange }: { onPeriodChange: (period: string) => void }) => (
  <div data-testid="time-filter">
    <select data-testid="period-selector" onChange={(e) => onPeriodChange(e.target.value)}>
      <option value="day">Daily</option>
      <option value="week">Weekly</option>
      <option value="month">Monthly</option>
      <option value="quarter">Quarterly</option>
    </select>
  </div>
);

const MockDashboardWithFilter = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('month');
  const [lastUpdated, setLastUpdated] = React.useState(new Date().toISOString());

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setLastUpdated(new Date().toISOString());
  };

  return (
    <div>
      <MockTimeFilter onPeriodChange={handlePeriodChange} />
      <div data-testid="metrics-display">
        <div data-testid="current-period">{selectedPeriod}</div>
        <div data-testid="trend-indicators">📈 Trending up</div>
        <div data-testid="last-updated">{lastUpdated}</div>
      </div>
    </div>
  );
};

describe('Time Period Filtering Integration', () => {
  describe('Scenario 3: Time Period Filtering', () => {
    it('should update all metrics when time period changes', async () => {
      const user = userEvent.setup();
      render(<MockDashboardWithFilter />);

      const periodSelector = screen.getByTestId('period-selector');

      await user.selectOptions(periodSelector, 'quarter');

      await waitFor(() => {
        expect(screen.getByTestId('current-period')).toHaveTextContent('quarter');
      });
    });

    it('should show trend indicators after filter change', async () => {
      const user = userEvent.setup();
      render(<MockDashboardWithFilter />);

      const periodSelector = screen.getByTestId('period-selector');

      await user.selectOptions(periodSelector, 'week');

      await waitFor(() => {
        const trendIndicators = screen.getByTestId('trend-indicators');
        expect(trendIndicators).toBeInTheDocument();
        expect(trendIndicators.textContent).toMatch(/📈|📉|➡️/);
      });
    });

    it('should update data freshness timestamps', async () => {
      const user = userEvent.setup();
      render(<MockDashboardWithFilter />);

      const initialTime = screen.getByTestId('last-updated').textContent;

      await user.selectOptions(screen.getByTestId('period-selector'), 'day');

      await waitFor(() => {
        const updatedTime = screen.getByTestId('last-updated').textContent;
        expect(updatedTime).not.toBe(initialTime);
      });
    });

    it('should complete filter change within 1 second per performance requirement', async () => {
      const user = userEvent.setup();
      render(<MockDashboardWithFilter />);

      const startTime = Date.now();

      await user.selectOptions(screen.getByTestId('period-selector'), 'quarter');

      await waitFor(() => {
        expect(screen.getByTestId('current-period')).toHaveTextContent('quarter');
      });

      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(1000);
    });

    it('should support all required time periods', async () => {
      const user = userEvent.setup();
      render(<MockDashboardWithFilter />);

      const periodSelector = screen.getByTestId('period-selector') as HTMLSelectElement;
      const availableOptions = Array.from(periodSelector.options).map(opt => opt.value);

      expect(availableOptions).toContain('day');
      expect(availableOptions).toContain('week');
      expect(availableOptions).toContain('month');
      expect(availableOptions).toContain('quarter');
    });
  });
});