"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Clock, CheckCircle, AlertCircle, Calendar, Building, Tag, Code, FileText } from 'lucide-react';
import { safeMap } from '@/lib/utils/arrayUtils';

export interface VendorWorkFormData {
  projectName: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  startDate: string;
  endDate: string;
  clientName: string;
  technologies: string[];
  category: string;
  shareToTrustPortal: boolean;
  evidenceFiles: string[];
  questionnaireAnswers: string[];
  isDraft: boolean;
}

interface VendorWorkFormProps {
  initialData?: Partial<VendorWorkFormData>;
  onSubmit: (data: VendorWorkFormData) => Promise<void>;
  onSave?: (data: VendorWorkFormData) => Promise<void>;
  isEditing?: boolean;
  autoSave?: boolean;
  vendorId: string;
}

export const VendorWorkForm: React.FC<VendorWorkFormProps> = ({
  initialData,
  onSubmit,
  onSave,
  isEditing = false,
  autoSave = true,
  vendorId
}) => {
  const [formData, setFormData] = useState<VendorWorkFormData>({
    projectName: '',
    description: '',
    status: 'Completed',
    startDate: '',
    endDate: '',
    clientName: '',
    technologies: [],
    category: '',
    shareToTrustPortal: false,
    evidenceFiles: [],
    questionnaireAnswers: [],
    isDraft: false,
    ...initialData
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [newTechnology, setNewTechnology] = useState('');

  // Auto-save functionality
  const autoSaveData = useCallback(async () => {
    if (!autoSave || !onSave || !formData.projectName.trim()) return;

    try {
      setIsSaving(true);
      const draftData = { ...formData, isDraft: true };
      await onSave(draftData);
      const now = new Date();
      setLastSaved(now);
      setSaveMessage(`Saved successfully at ${now.toLocaleTimeString()}`);
      
      // Clear save message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveMessage('Auto-save failed');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [formData, autoSave, onSave]);

  // Auto-save on form changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSaveData();
    }, 2000); // 2 second delay

    return () => clearTimeout(timeoutId);
  }, [formData, autoSaveData]);

  const handleInputChange = (field: keyof VendorWorkFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }));
      setNewTechnology('');
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const handleManualSave = async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      const draftData = { ...formData, isDraft: true };
      await onSave(draftData);
      const now = new Date();
      setLastSaved(now);
      setSaveMessage(`Manually saved at ${now.toLocaleTimeString()}`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Manual save failed:', error);
      setSaveMessage('Save failed');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectName.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const finalData = { ...formData, isDraft: false };
      await onSubmit(finalData);
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditing ? 'Edit Work Submission' : 'Add New Work'}
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Save Status */}
          {saveMessage && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              {saveMessage}
            </div>
          )}
          
          {isSaving && (
            <div className="flex items-center text-sm text-blue-600">
              <Clock className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </div>
          )}

          {/* Manual Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter project name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe the project details, scope, and deliverables"
          />
        </div>

        {/* Status and Dates Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Planned">Planned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Client and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="inline h-4 w-4 mr-1" />
              Client Name
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Client or company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Web Development, Mobile App, etc."
            />
          </div>
        </div>

        {/* Technologies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Code className="inline h-4 w-4 mr-1" />
            Technologies Used
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {safeMap(formData.technologies, (tech: string, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => handleRemoveTechnology(tech)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTechnology}
              onChange={(e) => setNewTechnology(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnology())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add technology (e.g., React, Node.js)"
            />
            <button
              type="button"
              onClick={handleAddTechnology}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Share to Trust Portal */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <input
            type="checkbox"
            id="shareToTrustPortal"
            checked={formData.shareToTrustPortal}
            onChange={(e) => handleInputChange('shareToTrustPortal', e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="shareToTrustPortal" className="text-sm font-medium text-gray-700">
            <FileText className="inline h-4 w-4 mr-1" />
            Share this work on Trust Portal
          </label>
          <div className="text-xs text-gray-500">
            (Only completed work will be visible to enterprises)
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !formData.projectName.trim()}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Work' : 'Create Work'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 