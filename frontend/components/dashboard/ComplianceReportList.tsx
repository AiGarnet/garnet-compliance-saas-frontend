"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle, ArrowUpDown, AlertTriangle, Loader2, Download, ExternalLink, FileText, Award, Shield } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterPills } from '@/components/ui/FilterPills';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';

// Enhanced report interface
export interface ComplianceReport {
  id: string;
  name: string;
  date: string;
  description: string;
  fileSize: string;
  fileType: string;
  category?: 'Certification' | 'Attestation' | 'Policy' | 'Statement' | 'Other' | 'Questionnaire';
}

export interface ComplianceReportListProps {
  reports: ComplianceReport[];
  className?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

type SortField = 'name' | 'date' | 'fileType' | 'fileSize' | 'category';
type SortDirection = 'asc' | 'desc';

// Helper function to convert fileSize string to bytes for sorting
const fileSizeToBytes = (fileSize: string): number => {
  if (fileSize === 'N/A') return 0;
  const size = parseFloat(fileSize);
  if (fileSize.includes('KB')) return size * 1024;
  if (fileSize.includes('MB')) return size * 1024 * 1024;
  if (fileSize.includes('GB')) return size * 1024 * 1024 * 1024;
  return size;
};

// Helper function to get category icon
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Certification':
      return Award;
    case 'Policy':
    case 'Statement':
      return Shield;
    case 'Questionnaire':
      return FileText;
    default:
      return FileText;
  }
};

// Helper function to get category color
const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Certification':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'Policy':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    case 'Statement':
      return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
    case 'Questionnaire':
      return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  }
};

export function ComplianceReportList({ 
  reports: initialReports, 
  className,
  isLoading = false,
  error = '',
  onRetry
}: ComplianceReportListProps) {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // State for filtering
  const [categoryFilter, setCategoryFilter] = useState<ComplianceReport['category'] | 'All'>('All');
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter and sort reports based on current state
  const filteredAndSortedReports = useMemo(() => {
    if (!initialReports) return [];
    
    // Apply category filter
    let result = [...initialReports];
    
    if (categoryFilter !== 'All') {
      result = result.filter(r => r.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(lowercaseSearch) || 
        r.description.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply sorting
    return result.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      } else if (sortField === 'fileType') {
        return sortDirection === 'asc'
          ? a.fileType.localeCompare(b.fileType)
          : b.fileType.localeCompare(a.fileType);
      } else if (sortField === 'fileSize') {
        const sizeA = fileSizeToBytes(a.fileSize);
        const sizeB = fileSizeToBytes(b.fileSize);
        return sortDirection === 'asc'
          ? sizeA - sizeB
          : sizeB - sizeA;
      } else if (sortField === 'category') {
        const catA = a.category || 'Other';
        const catB = b.category || 'Other';
        return sortDirection === 'asc'
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      }
      return 0;
    });
  }, [initialReports, categoryFilter, searchTerm, sortField, sortDirection]);
  
  // Render filter pills
  const renderFilterPills = () => {
    const categories: ('All' | 'Certification' | 'Attestation' | 'Policy' | 'Statement' | 'Other' | 'Questionnaire')[] = 
      ['All', 'Certification', 'Attestation', 'Policy', 'Statement', 'Questionnaire', 'Other'];
    
    return (
      <FilterPills<'All' | 'Certification' | 'Attestation' | 'Policy' | 'Statement' | 'Other' | 'Questionnaire'>
        options={categories}
        selectedOption={categoryFilter || 'All'}
        onChange={(option) => setCategoryFilter(option === 'All' ? 'All' : option)}
        className="mb-4"
        label="Filter reports by category"
      />
    );
  };

  // Render search bar
  const renderSearchBar = () => {
    return (
      <SearchBar
        id="compliance-report-search"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search reports by name or description..."
        className="mb-4"
        label="Search compliance reports"
      />
    );
  };

  // Render different states
  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 lg:py-16" aria-live="polite">
          <div className="relative mb-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="absolute inset-0 h-10 w-10 rounded-full bg-primary/20 animate-pulse"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading compliance reports...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Please wait while we fetch the latest data</p>
        </div>
      );
    }
    
    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 lg:py-16 text-center" aria-live="assertive">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Reports</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">{error || 'Unable to load compliance reports.'}</p>
          {onRetry && (
            <button 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-200"
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
        </div>
      );
    }
    
    // Empty state
    if (filteredAndSortedReports.length === 0) {
      // If no reports at all
      if (initialReports.length === 0 && !searchTerm && categoryFilter === 'All') {
        return (
          <div 
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 lg:p-16 flex flex-col items-center justify-center"
            aria-live="polite"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reports Available</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-2">No compliance reports have been uploaded yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">Upload your first compliance report to get started →</p>
          </div>
        );
      }
      
      // If no reports after filtering/searching
      return (
        <div 
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 lg:p-16 flex flex-col items-center justify-center"
          aria-live="polite"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Matching Reports</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">No reports match your current filters or search terms.</p>
          <button 
            className="text-primary hover:text-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg px-3 py-2 transition-colors duration-200"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('All');
            }}
          >
            Clear all filters
          </button>
        </div>
      );
    }
    
    // Report list as table for desktop and cards for mobile
    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-1/4"
                  onClick={() => handleSort('name')}
                  aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-1/6"
                  onClick={() => handleSort('date')}
                  aria-sort={sortField === 'date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-1/6"
                  onClick={() => handleSort('category')}
                  aria-sort={sortField === 'category' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-1/4">Description</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-1/6"
                  onClick={() => handleSort('fileSize')}
                  aria-sort={sortField === 'fileSize' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center">
                    File Info
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-1/6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedReports.map((report, index) => {
                const CategoryIcon = getCategoryIcon(report.category);
                return (
                  <TableRow 
                    key={report.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className={`p-1.5 rounded-lg mr-3 ${getCategoryColor(report.category)}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{report.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">{report.date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(report.category)}`}>
                        {report.category || 'Other'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                      <p className="truncate" title={report.description}>{report.description}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span>{report.fileSize}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{report.fileType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-primary hover:text-primary/80 transition-colors flex items-center text-sm font-medium px-2 py-1 rounded-md hover:bg-primary/5">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors flex items-center text-sm px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Preview
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden">
          <ul className="space-y-4">
            {filteredAndSortedReports.map((report, index) => {
              const CategoryIcon = getCategoryIcon(report.category);
              return (
                <li 
                  key={report.id}
                  className="bg-white dark:bg-card-bg p-4 rounded-xl shadow-sm border border-gray-200 dark:border-card-border hover:shadow-md transition-shadow duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className={`p-1.5 rounded-lg mr-3 flex-shrink-0 ${getCategoryColor(report.category)}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-white truncate">{report.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{report.date}</p>
                      </div>
                    </div>
                  </div>
                  
                  {report.category && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${getCategoryColor(report.category)}`}>
                      {report.category}
                    </span>
                  )}
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">{report.description}</p>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>{report.fileSize}</div>
                      <div className="text-xs">{report.fileType}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="text-primary hover:text-primary/80 font-medium text-sm flex items-center px-2 py-1 rounded-md hover:bg-primary/5 transition-colors">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm flex items-center px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </>
    );
  };

  return (
    <section 
      aria-label="Compliance reports" 
      className={cn(
        "bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border p-4 md:p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <div className="p-2 bg-primary/10 rounded-xl mr-3">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Compliance Reports</h2>
        </div>
        <button 
          className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Report
        </button>
      </div>

      {renderSearchBar()}
      {renderFilterPills()}
      {renderContent()}
    </section>
  );
} 