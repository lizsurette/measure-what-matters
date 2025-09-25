import { PrismaClient, Dashboard } from '@prisma/client';

export class DashboardModel {
  constructor(private prisma: PrismaClient) {}

  async getDefaultConfig(): Promise<{
    layout: {
      grid_columns: number;
      category_positions: Record<string, {
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    };
    filters: {
      default_time_range: string;
      visible_categories: string[];
    };
    refresh_settings: {
      auto_refresh: boolean;
      interval_seconds: number;
    };
  }> {
    const dashboard = await this.prisma.dashboard.findFirst({
      where: { isDefault: true }
    });

    if (!dashboard) {
      throw new Error('No default dashboard configuration found');
    }

    return {
      layout: dashboard.layoutConfig as any,
      filters: dashboard.filterSettings as any,
      refresh_settings: {
        auto_refresh: true,
        interval_seconds: dashboard.refreshInterval
      }
    };
  }

  async create(data: {
    name: string;
    layoutConfig: any;
    filterSettings: any;
    refreshInterval: number;
    createdBy: string;
    isDefault?: boolean;
  }): Promise<Dashboard> {
    // Ensure only one default dashboard
    if (data.isDefault) {
      await this.prisma.dashboard.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return this.prisma.dashboard.create({
      data
    });
  }

  async findByUser(createdBy: string): Promise<Dashboard[]> {
    return this.prisma.dashboard.findMany({
      where: { createdBy },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
  }

  async updateLayout(id: string, layoutConfig: any): Promise<Dashboard> {
    return this.prisma.dashboard.update({
      where: { id },
      data: {
        layoutConfig,
        updatedAt: new Date()
      }
    });
  }
}