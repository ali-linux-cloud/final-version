import { useState, useEffect } from 'react';
import { Check, X, Loader } from 'lucide-react';
import type { SubscriptionRequest } from '../../types/auth';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import toast from '../../utils/toast';
import { format } from 'date-fns';

interface ProcessingState {
  [key: string]: boolean;
}

export default function SubscriptionRequests() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<ProcessingState>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      await fetchRequests();
    };
    
    fetchData();
    
    // Cleanup function
    return () => {
      setRequests([]);
      setProcessing({});
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('status', 'pending')
        .order('submission_date', { ascending: false }) as { data: SubscriptionRequest[] | null, error: Error | null };

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load subscription requests');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (request: SubscriptionRequest, approved: boolean) => {
    const userId = request.user_id;
    if (processing[userId]) return;
    
    try {
      setProcessing(prev => ({ ...prev, [userId]: true }));

      const { error } = await supabaseAdmin.rpc('process_subscription_request', {
        p_user_id: userId,
        p_approved: approved,
        p_plan_type: request.plan_type
      });

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.user_id !== userId));
      toast.success(`Subscription request ${approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error processing request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
      toast.error(errorMessage);
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleImageError = (userId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(userId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-6">Subscription Requests</h2>
      
      {requests.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No pending subscription requests</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.user_id}
              className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-white font-medium">{request.user_name}</h3>
                <p className="text-gray-400 text-sm">{request.user_email}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      {request.plan_type}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Submitted: {format(new Date(request.submission_date), 'PPp')}
                  </p>
                  {request.receipt_image && !imageLoadErrors.has(request.user_id) ? (
                    <a
                      href={request.receipt_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                      onError={() => handleImageError(request.user_id)}
                    >
                      View Receipt 
                    </a>
                  ) : (
                    <p className="text-red-400 text-sm">Receipt unavailable</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(request, true)}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={processing[request.user_id]}
                  title="Approve request"
                >
                  {processing[request.user_id] ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => handleVerify(request, false)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={processing[request.user_id]}
                  title="Reject request"
                >
                  {processing[request.user_id] ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}