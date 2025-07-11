import React, { useState, useEffect } from 'react';
import { X, Download, Copy, ZoomIn, ZoomOut, Type, FileText, CheckCircle, Search } from 'lucide-react';

interface TextFileViewerProps {
  file?: File;
  url?: string;
  filename?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TextFileViewer({ file, url, filename, isOpen, onClose }: TextFileViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontFamily, setFontFamily] = useState<'mono' | 'sans' | 'serif'>('mono');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [wrapLines, setWrapLines] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isOpen && (file || url)) {
      loadContent();
    }
  }, [isOpen, file, url]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let textContent = '';

      if (file) {
        textContent = await readFileAsText(file);
      } else if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        textContent = await response.text();
      }

      setContent(textContent);
    } catch (err: any) {
      setError(err.message || 'Failed to load file content');
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || file?.name || 'document.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const highlightSearchTerm = (text: string, term: string): string => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fef3c7; color: #92400e; padding: 0 2px; border-radius: 2px;">$1</mark>');
  };

  const getProcessedContent = (): string => {
    let processedContent = content;
    
    if (searchTerm.trim()) {
      processedContent = highlightSearchTerm(processedContent, searchTerm);
    }
    
    return processedContent;
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'mono': return 'font-mono';
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      default: return 'font-mono';
    }
  };

  const getThemeClasses = () => {
    if (theme === 'dark') {
      return {
        container: 'bg-gray-900 text-gray-100',
        content: 'bg-gray-800 text-gray-100 border-gray-700',
        header: 'bg-gray-800 border-gray-700',
        controls: 'bg-gray-700'
      };
    }
    return {
      container: 'bg-white text-gray-900',
      content: 'bg-white text-gray-900 border-gray-300',
      header: 'bg-gray-50 border-gray-200',
      controls: 'bg-gray-100'
    };
  };

  const lines = content.split('\n');
  const themeClasses = getThemeClasses();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden ${themeClasses.container}`}>
        {/* Header */}
        <div className={`p-4 border-b ${themeClasses.header}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">
                  {filename || file?.name || 'Text File'}
                </h2>
                <p className="text-sm text-gray-500">
                  {content.length.toLocaleString()} characters • {lines.length.toLocaleString()} lines
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-colors ${
                  copySuccess 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Copy to clipboard"
              >
                {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className={`mt-4 p-3 rounded-lg ${themeClasses.controls}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Font Size */}
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4 text-gray-500" />
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className="p-1 rounded bg-white border hover:bg-gray-50"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  className="p-1 rounded bg-white border hover:bg-gray-50"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>

              {/* Font Family */}
              <div className="flex items-center space-x-2">
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as 'mono' | 'sans' | 'serif')}
                  className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="mono">Monospace</option>
                  <option value="sans">Sans Serif</option>
                  <option value="serif">Serif</option>
                </select>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={wrapLines}
                    onChange={(e) => setWrapLines(e.target.checked)}
                    className="rounded"
                  />
                  <span>Wrap</span>
                </label>
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="rounded"
                  />
                  <span>Lines</span>
                </label>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="text-sm px-2 py-1 rounded border hover:bg-opacity-50"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading file content...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-red-600">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Failed to load file</p>
                <p className="text-sm text-gray-500 mt-2">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className={`${themeClasses.content} border-0`}>
                {showLineNumbers ? (
                  <div className="flex">
                    {/* Line Numbers */}
                    <div className={`flex-shrink-0 p-4 text-right border-r ${themeClasses.content} select-none`}>
                      <pre 
                        className="text-gray-400 text-sm"
                        style={{ 
                          fontSize: `${fontSize}px`, 
                          lineHeight 
                        }}
                      >
                        {lines.map((_, index) => (
                          <div key={index}>{index + 1}</div>
                        ))}
                      </pre>
                    </div>
                    
                    {/* Content with line numbers */}
                    <div className="flex-1 p-4">
                      <pre
                        className={`${getFontFamilyClass()} ${wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'} overflow-x-auto`}
                        style={{ 
                          fontSize: `${fontSize}px`, 
                          lineHeight 
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: getProcessedContent() 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Content without line numbers */
                  <pre
                    className={`p-4 ${getFontFamilyClass()} ${wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'} overflow-x-auto`}
                    style={{ 
                      fontSize: `${fontSize}px`, 
                      lineHeight 
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: getProcessedContent() 
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t ${themeClasses.header} text-center`}>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {searchTerm && (
                <span>
                  Search results for "{searchTerm}" • {
                    (content.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
                  } matches
                </span>
              )}
            </div>
            <div>
              Press Ctrl+F to search • ESC to close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 