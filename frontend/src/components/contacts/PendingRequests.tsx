import { useEffect, useState } from 'react';
import { ContactRequest } from './ContactRequest';
import { apiService, type Contact } from '../../services/api.service';

export const PendingRequests = () => {
  const [requests, setRequests] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getPendingRequests();
      setRequests(data);
    } catch (err) {
      setError('Failed to load pending requests');
      console.error('Error loading pending requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (contactId: string) => {
    try {
      await apiService.acceptContactRequest(contactId);
      setRequests(prev => prev.filter(req => req.id !== contactId));
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleReject = async (contactId: string) => {
    try {
      await apiService.rejectContactRequest(contactId);
      setRequests(prev => prev.filter(req => req.id !== contactId));
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Pending Requests
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Pending Requests
        </h2>
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Pending Requests {requests.length > 0 && `(${requests.length})`}
        </h2>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No pending requests
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map(request => (
            <ContactRequest
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};
