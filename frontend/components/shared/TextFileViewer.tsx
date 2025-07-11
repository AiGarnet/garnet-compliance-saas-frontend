"use client";

import React, { useState, useEffect } from 'react';
import { X, Download, Copy, CheckCircle, FileText, Printer } from 'lucide-react';

interface TextFileViewerProps {
  url: string;
  filename: string;
  onClose: () => void;
  isOpen: boolean;
}

export function TextFileViewer({ url, filename, onClose, isOpen }: TextFileViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && url) {
      loadFileContent();
    }
  }, [isOpen, url]);

  const loadFileContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load file content');
      }
      
      const text = await response.text();
      setContent(text);
    } catch (error: any) {
      console.error('Error loading file:', error);
      setError(error.message || 'Failed to load file content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #374151;
              margin: 40px;
              max-width: 800px;
            }
            h1, h2, h3 { color: #1f2937; }
            pre { background: #f9fafb; padding: 1rem; border-radius: 6px; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
            .filename { color: #6b7280; font-size: 0.875rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename}</h1>
            <div class="filename">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          <pre>${content}</pre>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers (lines with === or --- underlines)
      if (trimmedLine.match(/^=+$/) || trimmedLine.match(/^-+$/)) {
        return (
          <div key={index} className="border-b-2 border-gray-300 my-2" />
        );
      }
      
      // Section headers (lines that look like titles)
      if (trimmedLine.length > 0 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100) {
        return (
          <h3 key={index} className="text-lg font-bold text-gray-900 mt-6 mb-3">
            {trimmedLine}
          </h3>
        );
      }
      
      // Bullet points
      if (trimmedLine.match(/^[•\-\*]\s/)) {
        return (
          <div key={index} className="ml-4 mb-2 flex items-start">
            <span className="text-blue-600 mr-2 mt-1">•</span>
            <span>{trimmedLine.substring(2)}</span>
          </div>
        );
      }
      
      // Numbered lists
      if (trimmedLine.match(/^\d+\.\s/)) {
        return (
          <div key={index} className="ml-4 mb-2 flex items-start">
            <span className="text-blue-600 mr-2 font-medium">{trimmedLine.match(/^\d+\./)?.[0]}</span>
            <span>{trimmedLine.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      
      // Empty lines for spacing
      if (trimmedLine.length === 0) {
        return <div key={index} className="h-3" />;
      }
      
      // Bold text with **
      const formattedLine = line.split(/(\*\*.*?\*\*)/).map((part, partIndex) => 
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={partIndex} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      );
      
      // Regular paragraphs
      return (
        <p key={index} className="mb-3 text-gray-800 leading-relaxed">
          {formattedLine}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{filename}</h2>
              <p className="text-sm text-gray-500">Text Document Viewer</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print document"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy content"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load</h3>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={loadFileContent}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="prose prose-lg max-w-none">
                    {formatContent(content)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {content && (
                <span>{content.split('\n').length} lines • {content.length} characters</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {copied && (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied to clipboard
                </span>
              )}
              <span>Use Ctrl+F to search within document</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 