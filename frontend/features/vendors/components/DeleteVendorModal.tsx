import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteVendorModalProps {
  isOpen: boolean;
  vendorName: string;
  vendorId: string;
  onClose: () => void;
  onConfirm: (vendorId: string) => Promise<void>;
}

export function DeleteVendorModal({ 
  isOpen, 
  vendorName, 
  vendorId, 
  onClose, 
  onConfirm 
}: DeleteVendorModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const isConfirmValid = confirmText === 'CONFIRM';

  const handleConfirm = async () => {
    if (!isConfirmValid) {
      setError('Please type "CONFIRM" exactly as shown');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onConfirm(vendorId);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete vendor');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConfirmValid && !isDeleting) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          aria-hidden="true"
          onClick={!isDeleting ? handleClose : undefined}
        />

        {/* Modal panel */}
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Delete Vendor
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{vendorName}</strong>? This action cannot be undone.
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      To confirm, type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-red-600">CONFIRM</span> in the box below:
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => {
                        setConfirmText(e.target.value);
                        if (error) setError('');
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type CONFIRM here"
                      disabled={isDeleting}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } ${isDeleting ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      autoFocus
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={!isDeleting ? handleClose : undefined}
                disabled={isDeleting}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                isConfirmValid && !isDeleting
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Vendor'
              )}
            </button>
            <button
              type="button"
              onClick={!isDeleting ? handleClose : undefined}
              disabled={isDeleting}
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                isDeleting ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
