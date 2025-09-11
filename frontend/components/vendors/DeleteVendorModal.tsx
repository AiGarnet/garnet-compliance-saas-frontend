import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteVendorModalProps {
  vendorName: string | null;
  vendorId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (vendorId: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeleteVendorModal({ 
  vendorName, 
  vendorId, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: DeleteVendorModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (!vendorId || confirmText !== vendorName) return;

    setIsDeleting(true);
    try {
      await onConfirm(vendorId);
      onClose();
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
      setConfirmText('');
    }
  };

  if (!isOpen || !vendorName || !vendorId) return null;

  const isConfirmDisabled = confirmText !== vendorName || isDeleting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-red-600 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete Client
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-gray-800 text-center mb-2">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-red-600">{vendorName}</span>?
            </p>
            <p className="text-sm text-gray-600 text-center mb-4">
              This action cannot be undone. All associated data will be permanently deleted.
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-semibold text-red-600">{vendorName}</span> to confirm deletion:
            </label>
            <input
              type="text"
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder={vendorName}
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isConfirmDisabled}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Client
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 