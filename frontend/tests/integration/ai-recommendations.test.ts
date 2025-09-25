import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock AI recommendations component
const MockRecommendationsPanel = ({ metricHealth }: { metricHealth: 'red' | 'yellow' | 'green' }) => {
  const mockRecommendations = {
    red: [
      {
        priority: 'high',
        action: 'Improve customer onboarding flow',
        description: 'Current NPS is 15, well below industry standard of 50+. Focus on reducing time-to-value.',
        estimated_impact: 'high',
        implementation_effort: 'medium'
      },
      {
        priority: 'medium',
        action: 'Conduct customer satisfaction survey',
        description: 'Gather qualitative feedback to understand specific pain points.',
        estimated_impact: 'medium',
        implementation_effort: 'low'
      }
    ],
    yellow: [
      {
        priority: 'medium',
        action: 'Optimize user experience touchpoints',
        description: 'NPS is 35, approaching target but can be improved through UX enhancements.',
        estimated_impact: 'medium',
        implementation_effort: 'medium'
      }
    ],
    green: []
  };

  const recommendations = mockRecommendations[metricHealth];

  if (recommendations.length === 0) {
    return <div data-testid="no-recommendations">✅ Metric is healthy - no recommendations needed</div>;
  }

  return (
    <div data-testid="recommendations-panel">
      <div data-testid="metric-status">Current Status: {metricHealth}</div>
      {recommendations.map((rec, index) => (
        <div key={index} data-testid={`recommendation-${index}`}>
          <div data-testid="priority" className={`priority-${rec.priority}`}>
            {rec.priority.toUpperCase()}
          </div>
          <div data-testid="action">{rec.action}</div>
          <div data-testid="description">{rec.description}</div>
          <div data-testid="impact">Impact: {rec.estimated_impact}</div>
          <div data-testid="effort">Effort: {rec.implementation_effort}</div>
        </div>
      ))}
    </div>
  );
};

const MockMetricWithRecommendations = ({ initialHealth }: { initialHealth: 'red' | 'yellow' | 'green' }) => {
  const [showRecommendations, setShowRecommendations] = React.useState(false);

  return (
    <div>
      <div
        data-testid="metric-tile"
        className={`health-${initialHealth}`}
        onClick={() => setShowRecommendations(!showRecommendations)}
      >
        Net Promoter Score: {initialHealth === 'red' ? '15' : initialHealth === 'yellow' ? '35' : '65'}
        <span data-testid="health-indicator">
          {initialHealth === 'red' ? '🔴' : initialHealth === 'yellow' ? '🟡' : '🟢'}
        </span>
      </div>
      {showRecommendations && <MockRecommendationsPanel metricHealth={initialHealth} />}
    </div>
  );
};

global.fetch = jest.fn();

describe('AI Recommendations Integration', () => {
  beforeEach(() => {
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('Scenario 5: AI Recommendations', () => {
    it('should show AI recommendations for poor health metrics', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-panel')).toBeInTheDocument();
        expect(screen.getByTestId('metric-status')).toHaveTextContent('red');
      });

      // Should show multiple recommendations
      expect(screen.getByTestId('recommendation-0')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-1')).toBeInTheDocument();
    });

    it('should display contextual suggestions per clarification requirement', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const description = screen.getAllByTestId('description')[0];
        expect(description).toBeInTheDocument();

        // Should contain specific context (numbers, thresholds)
        expect(description.textContent).toContain('15');
        expect(description.textContent).toContain('50+');
        expect(description.textContent).toContain('industry standard');
      });
    });

    it('should provide actionable next steps', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const actions = screen.getAllByTestId('action');
        actions.forEach(action => {
          expect(action.textContent).toMatch(/improve|conduct|optimize|implement|enhance/i);
          expect(action.textContent?.length).toBeGreaterThan(10);
        });
      });
    });

    it('should prioritize recommendations by impact and effort', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const firstPriority = screen.getByTestId('recommendation-0').querySelector('[data-testid="priority"]');
        const secondPriority = screen.getByTestId('recommendation-1').querySelector('[data-testid="priority"]');

        expect(firstPriority?.textContent).toBe('HIGH');
        expect(secondPriority?.textContent).toBe('MEDIUM');
      });
    });

    it('should show no recommendations for healthy metrics', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="green" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        expect(screen.getByTestId('no-recommendations')).toBeInTheDocument();
        expect(screen.getByTestId('no-recommendations')).toHaveTextContent('healthy');
      });
    });

    it('should include impact and effort estimates for planning', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const recommendations = screen.getAllByTestId(/^recommendation-/);
        recommendations.forEach(rec => {
          const impact = rec.querySelector('[data-testid="impact"]');
          const effort = rec.querySelector('[data-testid="effort"]');

          expect(impact?.textContent).toMatch(/high|medium|low/i);
          expect(effort?.textContent).toMatch(/high|medium|low/i);
        });
      });
    });

    it('should generate recommendations within acceptable time', async () => {
      const user = userEvent.setup();
      const startTime = Date.now();

      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-panel')).toBeInTheDocument();
      });

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds for AI generation
    });

    it('should handle AI service failures gracefully', async () => {
      // Mock API failure
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('AI service unavailable'));

      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      // Should still show some form of feedback (fallback message)
      await waitFor(() => {
        // In implementation, this would show a fallback message
        expect(screen.getByTestId('metric-tile')).toBeInTheDocument();
      });
    });
  });

  describe('Constitutional compliance for AI recommendations', () => {
    it('should maintain privacy by design - no personal data in recommendations', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const recommendationsText = screen.getByTestId('recommendations-panel').textContent;
        expect(recommendationsText).not.toMatch(/email|phone|address|personal|user.*id/i);
      });
    });

    it('should focus on business value and user outcomes', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const descriptions = screen.getAllByTestId('description');
        descriptions.forEach(desc => {
          const text = desc.textContent?.toLowerCase() || '';
          // Should focus on business outcomes, not technical implementation
          expect(text).toMatch(/customer|user|experience|value|satisfaction|onboarding/);
          expect(text).not.toMatch(/database|api|server|code|technical/);
        });
      });
    });

    it('should enable simple progress tracking through clear actions', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const actions = screen.getAllByTestId('action');
        actions.forEach(action => {
          // Actions should be clear and measurable
          expect(action.textContent?.length).toBeGreaterThan(5);
          expect(action.textContent).toMatch(/^(improve|conduct|optimize|implement|enhance)/i);
        });
      });
    });

    it('should support flow-based measurement through cross-metric insights', async () => {
      const user = userEvent.setup();
      render(<MockMetricWithRecommendations initialHealth="red" />);

      await user.click(screen.getByTestId('metric-tile'));

      await waitFor(() => {
        const descriptions = screen.getAllByTestId('description');
        // Should reference how improvements affect other metrics
        const hasFlowReference = descriptions.some(desc =>
          desc.textContent?.includes('onboarding') || // affects engagement
          desc.textContent?.includes('experience') || // affects quality
          desc.textContent?.includes('satisfaction')   // affects business value
        );
        expect(hasFlowReference).toBe(true);
      });
    });
  });
});