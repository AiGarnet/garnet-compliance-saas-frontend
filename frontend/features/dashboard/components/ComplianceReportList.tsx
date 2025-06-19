"use client";

import React, { useState } from "react";
import { Download, ExternalLink, FileText, Shield, Award, AlertTriangle, Search, Filter, Calendar, Tag, ChevronDown, Eye, Clock, CheckCircle2 } from "lucide-react";

export interface ComplianceReport {
  id: string;
  name: string;
  date: string;
  description: string;
  fileSize: string;
  fileType: string;
  category: 'Certification' | 'Policy' | 'Report' | 'Audit' | 'Questionnaire' | 'Evidence' | 'Other';
}

interface ComplianceReportListProps {
  reports: ComplianceReport[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
}

const getCategoryIcon = (category: ComplianceReport['category']) => {
  switch (category) {
    case 'Certification': return Award;
    case 'Policy': return Shield;
    case 'Report': return FileText;
    case 'Audit': return CheckCircle2;
    case 'Questionnaire': return FileText;
    case 'Evidence': return FileText;
    default: return FileText;
  }
};

const getCategoryColor = (category: ComplianceReport['category']) => {
  switch (category) {
    case 'Certification': return 'bg-green-100 text-green-800 border-green-200';
    case 'Policy': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Report': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Audit': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Questionnaire': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Evidence': return 'bg-teal-100 text-teal-800 border-teal-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const ComplianceReportList: React.FC<ComplianceReportListProps> = ({
  reports,
  isLoading,
  error,
  onRetry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(reports.map(r => r.category)))];

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-gray-400" />
        </div>
        <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse"></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {searchTerm || selectedCategory !== 'all' ? 'No Matching Reports Found' : 'No Compliance Reports Available'}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {searchTerm || selectedCategory !== 'all' 
          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
          : 'This vendor hasn\'t uploaded any compliance reports yet.'
        }
      </p>
      {(searchTerm || selectedCategory !== 'all') && (
        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
          }}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
        >
          Clear Filters
        </button>
      )}
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-12 animate-fade-in">
      <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        Unable to Load Reports
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {error || 'There was an error loading the compliance reports. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
      >
        Try Again
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-primary/10 rounded-xl mr-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Compliance Reports</h2>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-primary/10 rounded-xl mr-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Compliance Reports</h2>
        </div>
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-xl mr-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Compliance Reports</h2>
              <p className="text-sm text-gray-600 mt-1">
                {reports.length} {reports.length === 1 ? 'document' : 'documents'} available
                {filteredReports.length !== reports.length && ` (${filteredReports.length} shown)`}
              </p>
            </div>
          </div>
          
          {reports.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 w-full sm:w-64"
                />
              </div>
              
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white min-w-[120px] justify-between"
                >
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedCategory === 'all' ? 'All Types' : selectedCategory}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors duration-150 ${
                            selectedCategory === category ? 'bg-blue-50 text-primary font-medium' : 'text-gray-700'
                          }`}
                        >
                          {category === 'all' ? 'All Types' : category}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="p-6">
        {filteredReports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report, index) => {
              const IconComponent = getCategoryIcon(report.category);
              const categoryColor = getCategoryColor(report.category);
              
              return (
                <div
                  key={report.id}
                  className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-primary/30 hover:bg-blue-50/30 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0 p-3 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl group-hover:scale-105 transition-transform duration-200">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200 truncate">
                            {report.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                            {report.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {report.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span>{report.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1.5" />
                            <span>{report.fileType}</span>
                          </div>
                          {report.fileSize !== "N/A" && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1.5" />
                              <span>{report.fileSize}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-primary/30 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 group/btn">
                        <Eye className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform duration-200" />
                        View
                      </button>
                      
                      {report.fileSize !== "N/A" && (
                        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary border border-primary rounded-lg hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 group/btn">
                          <Download className="h-4 w-4 mr-1.5 group-hover/btn:scale-110 transition-transform duration-200" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}; 
