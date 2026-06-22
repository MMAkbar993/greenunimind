import { ExportOptions } from '@/types/analytics';

// CSV Export Utility
export const exportToCSV = (data: any[], filename: string = 'export.csv') => {
  if (!data.length) {
    throw new Error('No data to export');
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

// JSON Export Utility
export const exportToJSON = (data: any, filename: string = 'export.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename);
};

// Excel Export Utility (simplified - in production, use a library like xlsx)
export const exportToExcel = (data: any[], filename: string = 'export.xlsx') => {
  // This is a simplified version. In production, use libraries like 'xlsx' or 'exceljs'
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  downloadBlob(blob, filename);
};

// PDF Export Utility (requires jsPDF library)
export const exportToPDF = async (
  data: any[], 
  title: string = 'Export Report',
  filename: string = 'export.pdf'
) => {
  // This would require jsPDF library in production
  // For now, we'll create a simple HTML-to-PDF conversion
  const htmlContent = generateHTMLReport(data, title);
  
  // In production, use jsPDF or similar library
  console.log('PDF export would be implemented with jsPDF library');
  console.log('HTML content:', htmlContent);
  
  // Fallback to HTML download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, filename.replace('.pdf', '.html'));
};

// Helper function to download blob
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Helper function to convert data to CSV
const convertToCSV = (data: any[]): string => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

// Helper function to generate HTML report
const generateHTMLReport = (data: any[], title: string): string => {
  if (!data.length) return '<html><body><h1>No data to export</h1></body></html>';
  
  const headers = Object.keys(data[0]);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .export-info { margin-bottom: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="export-info">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total records: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `<td>${row[header] ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

// Advanced export function with options
export const exportData = async (
  data: any[],
  options: ExportOptions
) => {
  const { format, includeCharts, includeRawData, dateRange, filters, sections, customFields } = options;
  
  // Filter data based on date range if provided
  let filteredData = data;
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    filteredData = data.filter(item => {
      const itemDate = new Date(item.createdAt || item.date || item.timestamp);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  
  // Apply additional filters
  if (filters) {
    // Apply custom filtering logic based on the filters object
    // This would be specific to your data structure
  }
  
  // Select only specified sections/fields
  if (customFields && customFields.length > 0) {
    filteredData = filteredData.map(item => {
      const filteredItem: any = {};
      customFields.forEach(field => {
        if (item.hasOwnProperty(field)) {
          filteredItem[field] = item[field];
        }
      });
      return filteredItem;
    });
  }
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `export_${timestamp}`;
  
  // Export based on format
  switch (format) {
    case 'csv':
      exportToCSV(filteredData, `${baseFilename}.csv`);
      break;
    case 'excel':
      exportToExcel(filteredData, `${baseFilename}.xlsx`);
      break;
    case 'pdf':
      await exportToPDF(filteredData, 'Analytics Report', `${baseFilename}.pdf`);
      break;
    case 'json':
      exportToJSON({
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: filteredData.length,
          filters: filters,
          dateRange: dateRange
        },
        data: filteredData
      }, `${baseFilename}.json`);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

// Utility to format data for export
export const formatDataForExport = (data: any[], type: 'analytics' | 'messages' | 'students') => {
  switch (type) {
    case 'analytics':
      return data.map(item => ({
        Date: item.date || item.createdAt,
        Metric: item.metric || item.name,
        Value: item.value || item.count,
        Change: item.change || item.growth,
        Category: item.category || item.type
      }));
      
    case 'messages':
      return data.map(item => ({
        Date: item.createdAt,
        From: item.sender?.name || 'Unknown',
        To: item.recipient?.name || 'Unknown',
        Subject: item.subject,
        Type: item.messageType,
        Priority: item.priority,
        Status: item.status,
        'Read Status': item.isRead ? 'Read' : 'Unread'
      }));
      
    case 'students':
      return data.map(item => ({
        Name: item.studentName || item.name,
        Email: item.studentEmail || item.email,
        'Enrollment Date': item.enrollmentDate,
        'Last Active': item.lastActiveDate,
        'Engagement Score': item.engagementScore,
        'Courses Enrolled': item.coursesEnrolled,
        'Courses Completed': item.coursesCompleted,
        'Average Progress': `${item.averageProgress}%`,
        'Total Study Time': `${Math.round(item.totalTimeSpent / 60)}h`
      }));
      
    default:
      return data;
  }
};

// Utility to validate export data
export const validateExportData = (data: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }
  
  if (data.length === 0) {
    errors.push('No data to export');
    return { isValid: false, errors };
  }
  
  // Check if all items have consistent structure
  const firstItemKeys = Object.keys(data[0]);
  const inconsistentItems = data.filter(item => {
    const itemKeys = Object.keys(item);
    return itemKeys.length !== firstItemKeys.length || 
           !firstItemKeys.every(key => itemKeys.includes(key));
  });
  
  if (inconsistentItems.length > 0) {
    errors.push(`${inconsistentItems.length} items have inconsistent structure`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
