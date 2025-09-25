import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MetricCategoryCard } from '../components/metrics/MetricCategoryCard';
import { TimeRangeFilter } from '../components/filters/TimeRangeFilter';
import { ProductFilter } from '../components/filters/ProductFilter';
import { RecommendationsPanel } from '../components/recommendations/RecommendationsPanel';
import { apiService } from '../services/api.service';
import type { MetricCategory, DashboardConfig } from '../types';

export default function Dashboard() {
  const [categories, setCategories] = useState<MetricCategory[]>([]);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const [selectedProduct, setSelectedProduct] = useState('ansible');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange, selectedProduct]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories and config in parallel
      const [categoriesData, configData] = await Promise.all([
        apiService.getCategories(),
        apiService.getDashboardConfig()
      ]);

      setCategories(categoriesData);
      setConfig(configData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

  const handleProductChange = (newProduct: string) => {
    setSelectedProduct(newProduct);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-64 p-8">
          <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Product Health Dashboard - Measure What Matters</title>
        <meta name="description" content="Monitor your product health with MAD metrics framework" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-gray-900">Product Health Dashboard</h1>
            <div className="flex items-center gap-3">
              <ProductFilter
                value={selectedProduct}
                onChange={handleProductChange}
              />
              <TimeRangeFilter
                value={timeRange}
                onChange={handleTimeRangeChange}
              />
              {config?.lastUpdated && (
                <div className="text-sm text-gray-500 ml-2">
                  Last updated: {new Date(config.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          </div>


          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metric Categories */}
          {!loading && categories.length > 0 && (
            <div className="space-y-6">
              {categories.map((category) => (
                <MetricCategoryCard
                  key={category.id}
                  category={category}
                  timeRange={timeRange}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && categories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No metrics available</div>
              <p className="text-gray-400 mt-2">
                Configure your data sources to start monitoring metrics
              </p>
            </div>
          )}

          {/* Recommendations Panel */}
          {!loading && categories.length > 0 && (
            <RecommendationsPanel categories={categories} />
          )}
        </div>
      </DashboardLayout>
    </>
  );
}