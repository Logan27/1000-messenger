import { useState } from 'react';
import { Modal } from './Modal';

/**
 * Example usage of the Modal component
 * This file demonstrates various Modal configurations
 */
export const ModalExamples = () => {
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLargeModalOpen, setIsLargeModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold mb-8">Modal Component Examples</h1>

      {/* Simple Modal Example */}
      <div>
        <button
          onClick={() => setIsSimpleModalOpen(true)}
          className="btn-primary"
        >
          Open Simple Modal
        </button>
        <Modal
          isOpen={isSimpleModalOpen}
          onClose={() => setIsSimpleModalOpen(false)}
          title="Simple Modal"
        >
          <p>This is a simple modal with just a title and content.</p>
          <p className="mt-2">Press Escape or click outside to close.</p>
        </Modal>
      </div>

      {/* Confirmation Modal Example */}
      <div>
        <button
          onClick={() => setIsConfirmModalOpen(true)}
          className="btn-primary"
        >
          Open Confirmation Modal
        </button>
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Delete Confirmation"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Deleted!');
                  setIsConfirmModalOpen(false);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          }
        >
          <p>Are you sure you want to delete this item?</p>
          <p className="mt-2 text-sm text-gray-600">
            This action cannot be undone.
          </p>
        </Modal>
      </div>

      {/* Form Modal Example */}
      <div>
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="btn-primary"
        >
          Open Form Modal
        </button>
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title="Create New Group"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Group created!');
                  setIsFormModalOpen(false);
                }}
                className="btn-primary"
              >
                Create Group
              </button>
            </div>
          }
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Group Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter group name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Enter group description"
              />
            </div>
          </form>
        </Modal>
      </div>

      {/* Large Modal Example */}
      <div>
        <button
          onClick={() => setIsLargeModalOpen(true)}
          className="btn-primary"
        >
          Open Large Modal
        </button>
        <Modal
          isOpen={isLargeModalOpen}
          onClose={() => setIsLargeModalOpen(false)}
          title="Large Modal with Scroll"
          size="xl"
        >
          <div className="space-y-4">
            <p>This is a large modal that demonstrates scrolling behavior.</p>
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={i} className="text-gray-700">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            ))}
          </div>
        </Modal>
      </div>
    </div>
  );
};
