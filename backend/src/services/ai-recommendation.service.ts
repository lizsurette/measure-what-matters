import type { Metric } from '../models/metric';

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  description: string;
  estimated_impact: 'high' | 'medium' | 'low';
  implementation_effort: 'high' | 'medium' | 'low';
  related_metrics: string[];
}

export interface MetricRecommendations {
  metric_id: string;
  current_status: 'green' | 'yellow' | 'red';
  recommendations: Recommendation[];
}

export class AIRecommendationService {

  async generateRecommendations(metric: Metric): Promise<MetricRecommendations> {
    // In a real implementation, this would call an AI service (OpenAI, etc.)
    // For now, we'll use rule-based recommendations

    const recommendations: Recommendation[] = [];
    const performanceRatio = metric.value / metric.target;

    // Generate recommendations based on metric health and category
    if (metric.healthStatus === 'red') {
      recommendations.push(...this.getCriticalRecommendations(metric, performanceRatio));
    } else if (metric.healthStatus === 'yellow') {
      recommendations.push(...this.getWarningRecommendations(metric, performanceRatio));
    }

    return {
      metric_id: metric.id,
      current_status: metric.healthStatus,
      recommendations
    };
  }

  private getCriticalRecommendations(metric: Metric, performanceRatio: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    switch (metric.category.toLowerCase()) {
      case 'business value':
        if (metric.name.toLowerCase().includes('revenue')) {
          recommendations.push({
            priority: 'high',
            action: 'Implement revenue recovery plan',
            description: `Revenue is ${(100 - performanceRatio * 100).toFixed(1)}% below target. Consider price optimization, upselling campaigns, or market expansion.`,
            estimated_impact: 'high',
            implementation_effort: 'high',
            related_metrics: ['customer-acquisition', 'customer-lifetime-value']
          });
        }
        break;

      case 'quality':
        if (metric.name.toLowerCase().includes('bug')) {
          recommendations.push({
            priority: 'high',
            action: 'Immediate bug triage and fixing sprint',
            description: `Bug rate is critically high at ${metric.value}${metric.unit}. Implement emergency bug fixing sprint and improve testing processes.`,
            estimated_impact: 'high',
            implementation_effort: 'medium',
            related_metrics: ['uptime', 'response-time']
          });
        }
        break;

      case 'efficiency':
        recommendations.push({
          priority: 'high',
          action: 'Process optimization initiative',
          description: `${metric.name} is significantly below target. Review and optimize current processes, consider automation opportunities.`,
          estimated_impact: 'high',
          implementation_effort: 'medium',
          related_metrics: []
        });
        break;

      default:
        recommendations.push({
          priority: 'high',
          action: `Urgent attention required for ${metric.name}`,
          description: `This metric is critically below target (${(performanceRatio * 100).toFixed(1)}% of target). Immediate investigation and action required.`,
          estimated_impact: 'high',
          implementation_effort: 'medium',
          related_metrics: []
        });
    }

    return recommendations;
  }

  private getWarningRecommendations(metric: Metric, performanceRatio: number): Recommendation[] {
    const recommendations: Recommendation[] = [];

    switch (metric.category.toLowerCase()) {
      case 'business value':
        recommendations.push({
          priority: 'medium',
          action: 'Optimize business processes',
          description: `${metric.name} is below target. Consider process improvements, team training, or strategy adjustments.`,
          estimated_impact: 'medium',
          implementation_effort: 'medium',
          related_metrics: []
        });
        break;

      case 'quality':
        recommendations.push({
          priority: 'medium',
          action: 'Enhance quality assurance',
          description: `Quality metrics show room for improvement. Consider additional testing, code reviews, or quality training.`,
          estimated_impact: 'medium',
          implementation_effort: 'low',
          related_metrics: []
        });
        break;

      case 'efficiency':
        recommendations.push({
          priority: 'medium',
          action: 'Streamline workflow processes',
          description: `Efficiency can be improved. Look for bottlenecks, automate repetitive tasks, or optimize team workflows.`,
          estimated_impact: 'medium',
          implementation_effort: 'low',
          related_metrics: []
        });
        break;

      case 'engagement':
        recommendations.push({
          priority: 'medium',
          action: 'Boost user engagement',
          description: `User engagement could be higher. Consider feature improvements, user experience enhancements, or engagement campaigns.`,
          estimated_impact: 'medium',
          implementation_effort: 'medium',
          related_metrics: []
        });
        break;

      case 'progress':
        recommendations.push({
          priority: 'medium',
          action: 'Accelerate delivery pace',
          description: `Progress metrics indicate potential for improvement. Review sprint planning, remove blockers, or optimize development processes.`,
          estimated_impact: 'medium',
          implementation_effort: 'medium',
          related_metrics: []
        });
        break;

      default:
        recommendations.push({
          priority: 'medium',
          action: `Monitor and improve ${metric.name}`,
          description: `This metric is slightly below target (${(performanceRatio * 100).toFixed(1)}% of target). Monitor closely and consider gradual improvements.`,
          estimated_impact: 'medium',
          implementation_effort: 'low',
          related_metrics: []
        });
    }

    return recommendations;
  }

  async generateBulkRecommendations(metrics: Metric[]): Promise<MetricRecommendations[]> {
    const recommendations = await Promise.all(
      metrics
        .filter(metric => metric.healthStatus !== 'green')
        .map(metric => this.generateRecommendations(metric))
    );

    return recommendations;
  }

  async generateCategoryRecommendations(categoryName: string, metrics: Metric[]): Promise<Recommendation[]> {
    const categoryMetrics = metrics.filter(m => m.category.toLowerCase() === categoryName.toLowerCase());
    const problematicMetrics = categoryMetrics.filter(m => m.healthStatus !== 'green');

    if (problematicMetrics.length === 0) {
      return [];
    }

    // Generate category-level recommendations
    const recommendations: Recommendation[] = [];

    if (problematicMetrics.length / categoryMetrics.length > 0.5) {
      recommendations.push({
        priority: 'high',
        action: `Comprehensive ${categoryName} improvement plan`,
        description: `Multiple ${categoryName.toLowerCase()} metrics are below target. Consider a comprehensive improvement initiative.`,
        estimated_impact: 'high',
        implementation_effort: 'high',
        related_metrics: problematicMetrics.map(m => m.id)
      });
    }

    return recommendations;
  }
}