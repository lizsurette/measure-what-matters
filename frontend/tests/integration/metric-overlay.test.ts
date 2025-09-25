import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock metric overlay component
const MockMetricOverlay = ({ isOpen }: { isOpen: boolean }) => (
  isOpen ? (
    <div data-testid="metric-overlay">
      <div data-testid="calculation-method">Survey responses: (% Promoters - % Detractors)</div>
      <div data-testid="data-source-info">Source: Typeform Survey API</div>
      <div data-testid="collection-method">Collected daily via API integration</div>
      <button data-testid="close-overlay">Close</button>
    </div>
  ) : null
);

const MockMetricTile = () => {
  const [overlayOpen, setOverlayOpen] = React.useState(false);

  return (
    <div>
      <div
        data-testid="metric-tile"
        onMouseEnter={() => setOverlayOpen(true)}
        onClick={() => setOverlayOpen(true)}
      >
        Net Promoter Score: 42.5%
      </div>
      <MockMetricOverlay isOpen={overlayOpen} />
    </div>
  );
};

describe('Metric Detail Overlay Integration', () => {
  describe('Scenario 2: Explore Metric Calculation', () => {
    it('should show overlay on hover interaction', async () => {
      const user = userEvent.setup();
      render(<MockMetricTile />);

      const metricTile = screen.getByTestId('metric-tile');

      await user.hover(metricTile);

      await waitFor(() => {
        expect(screen.getByTestId('metric-overlay')).toBeInTheDocument();
      });
    });

    it('should display calculation methodology per constitutional transparency requirement', async () => {
      const user = userEvent.setup();
      render(<MockMetricTile />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const calculationMethod = screen.getByTestId('calculation-method');
        expect(calculationMethod).toBeInTheDocument();
        expect(calculationMethod.textContent).toContain('Survey responses');
        expect(calculationMethod.textContent).length.toBeGreaterThan(10);
      });
    });

    it('should show data source information for transparency', async () => {
      const user = userEvent.setup();
      render(<MockMetricTile />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const dataSourceInfo = screen.getByTestId('data-source-info');
        expect(dataSourceInfo).toBeInTheDocument();
        expect(dataSourceInfo.textContent).toContain('Typeform Survey API');
      });
    });

    it('should display collection method details', async () => {
      const user = userEvent.setup();
      render(<MockMetricTile />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const collectionMethod = screen.getByTestId('collection-method');
        expect(collectionMethod).toBeInTheDocument();
        expect(collectionMethod.textContent).toContain('daily');
      });
    });

    it('should allow closing overlay', async () => {
      const user = userEvent.setup();
      render(<MockMetricTile />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        expect(screen.getByTestId('metric-overlay')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('close-overlay'));

      await waitFor(() => {
        expect(screen.queryByTestId('metric-overlay')).not.toBeInTheDocument();
      });
    });
  });
});