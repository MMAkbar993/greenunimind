import React from 'react';
import { AnalyticsFilters } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Grid, Layout } from 'lucide-react';

interface CustomDashboardProps {
  filters: AnalyticsFilters;
}

const CustomDashboard: React.FC<CustomDashboardProps> = ({ filters }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Dashboard</h2>
          <p className="text-gray-600">Create and customize your analytics widgets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Layout className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Widget Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Grid className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Custom Dashboard Builder</p>
              <p className="text-sm">Drag and drop widgets to create your custom dashboard</p>
              <Button className="mt-4">
                <Settings className="h-4 w-4 mr-2" />
                Configure Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomDashboard;
