import { cacheService } from './cache.service';
import type { DataSource } from '../models/data-source';

export interface DataCollectionResult {
  success: boolean;
  dataPoints: number;
  errors: string[];
  duration: number;
  lastSync: string;
}

export interface MetricDataPoint {
  metricId: string;
  value: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export class DataCollectionService {
  private collectors = new Map<string, DataCollector>();

  constructor() {
    this.registerDefaultCollectors();
  }

  private registerDefaultCollectors(): void {
    // Register built-in data collectors
    this.collectors.set('github', new GitHubCollector());
    this.collectors.set('jira', new JiraCollector());
    this.collectors.set('analytics', new AnalyticsCollector());
    this.collectors.set('ci-cd', new CICDCollector());
    this.collectors.set('database', new DatabaseCollector());
  }

  async collectFromSource(source: DataSource): Promise<DataCollectionResult> {
    const startTime = Date.now();
    const collector = this.collectors.get(source.type);

    if (!collector) {
      return {
        success: false,
        dataPoints: 0,
        errors: [`No collector found for source type: ${source.type}`],
        duration: Date.now() - startTime,
        lastSync: new Date().toISOString()
      };
    }

    try {
      const dataPoints = await collector.collect(source);
      const duration = Date.now() - startTime;

      // Cache the collected data
      const cacheKey = `data_collection:${source.id}:${new Date().toDateString()}`;
      cacheService.set(cacheKey, dataPoints, 24 * 60 * 60 * 1000); // 24 hours

      return {
        success: true,
        dataPoints: dataPoints.length,
        errors: [],
        duration,
        lastSync: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        dataPoints: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime,
        lastSync: new Date().toISOString()
      };
    }
  }

  async collectFromAllSources(sources: DataSource[]): Promise<Map<string, DataCollectionResult>> {
    const results = new Map<string, DataCollectionResult>();

    // Collect from all sources in parallel
    const promises = sources.map(async (source) => {
      const result = await this.collectFromSource(source);
      results.set(source.id, result);
      return { source, result };
    });

    await Promise.all(promises);
    return results;
  }

  async getHistoricalData(sourceId: string, days: number = 30): Promise<MetricDataPoint[]> {
    const cacheKey = `historical_data:${sourceId}:${days}d`;
    const cached = cacheService.get<MetricDataPoint[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // In a real implementation, this would query the database
    // For now, generate mock historical data
    const data = this.generateMockHistoricalData(sourceId, days);
    cacheService.set(cacheKey, data, 60 * 60 * 1000); // 1 hour cache

    return data;
  }

  private generateMockHistoricalData(sourceId: string, days: number): MetricDataPoint[] {
    const data: MetricDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic mock data based on source type
      const baseValue = Math.random() * 100;
      const seasonalVariation = Math.sin((i / 7) * Math.PI) * 10;
      const noise = (Math.random() - 0.5) * 5;

      data.push({
        metricId: `metric_${sourceId}`,
        value: Math.max(0, baseValue + seasonalVariation + noise),
        timestamp: date,
        source: sourceId,
        metadata: {
          collected_at: new Date().toISOString(),
          collection_method: 'automated'
        }
      });
    }

    return data;
  }

  getCollectorTypes(): string[] {
    return Array.from(this.collectors.keys());
  }

  getCollectorStatus(): Record<string, { available: boolean; lastUsed?: string }> {
    const status: Record<string, { available: boolean; lastUsed?: string }> = {};

    for (const [type, collector] of this.collectors) {
      status[type] = {
        available: true,
        lastUsed: collector.getLastUsed()
      };
    }

    return status;
  }
}

// Abstract base class for data collectors
abstract class DataCollector {
  protected lastUsed?: string;

  abstract collect(source: DataSource): Promise<MetricDataPoint[]>;

  getLastUsed(): string | undefined {
    return this.lastUsed;
  }

  protected updateLastUsed(): void {
    this.lastUsed = new Date().toISOString();
  }
}

// Specific collector implementations
class GitHubCollector extends DataCollector {
  async collect(source: DataSource): Promise<MetricDataPoint[]> {
    this.updateLastUsed();

    // Mock GitHub data collection
    return [
      {
        metricId: 'deployment-frequency',
        value: Math.floor(Math.random() * 20) + 5,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          repository: source.config?.repository || 'unknown',
          branch: 'main'
        }
      },
      {
        metricId: 'lead-time',
        value: Math.random() * 4 + 1,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          unit: 'hours'
        }
      }
    ];
  }
}

class JiraCollector extends DataCollector {
  async collect(source: DataSource): Promise<MetricDataPoint[]> {
    this.updateLastUsed();

    return [
      {
        metricId: 'velocity',
        value: Math.floor(Math.random() * 30) + 30,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          sprint: 'current',
          team: source.config?.team || 'default'
        }
      },
      {
        metricId: 'bug-rate',
        value: Math.random() * 10 + 2,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          priority: 'all'
        }
      }
    ];
  }
}

class AnalyticsCollector extends DataCollector {
  async collect(source: DataSource): Promise<MetricDataPoint[]> {
    this.updateLastUsed();

    return [
      {
        metricId: 'daily-active-users',
        value: Math.floor(Math.random() * 2000) + 7000,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          platform: 'web'
        }
      },
      {
        metricId: 'session-duration',
        value: Math.random() * 10 + 15,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          unit: 'minutes'
        }
      }
    ];
  }
}

class CICDCollector extends DataCollector {
  async collect(source: DataSource): Promise<MetricDataPoint[]> {
    this.updateLastUsed();

    return [
      {
        metricId: 'deployment-frequency',
        value: Math.floor(Math.random() * 15) + 8,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          pipeline: source.config?.pipeline || 'main'
        }
      },
      {
        metricId: 'uptime',
        value: 98 + Math.random() * 2,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          service: 'production'
        }
      }
    ];
  }
}

class DatabaseCollector extends DataCollector {
  async collect(source: DataSource): Promise<MetricDataPoint[]> {
    this.updateLastUsed();

    return [
      {
        metricId: 'response-time',
        value: Math.random() * 100 + 150,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          endpoint: 'api_average'
        }
      },
      {
        metricId: 'customer-acquisition',
        value: Math.floor(Math.random() * 50) + 120,
        timestamp: new Date(),
        source: source.id,
        metadata: {
          period: 'daily'
        }
      }
    ];
  }
}

// Singleton instance
export const dataCollectionService = new DataCollectionService();