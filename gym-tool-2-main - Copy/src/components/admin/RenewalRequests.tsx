import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import type { RenewalRequest } from '../../types/auth';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import toast from '../../utils/toast';
import { format } from 'date-fns';
import type { Database } from '../../types/supabase';

type DbRenewalRequest = Database['public']['Tables']['renewal_requests']['Row'];
type DbUser = Database['public']['Tables']['users']['Row'];

type RenewalRequestWithUser = DbRenewalRequest & {
  user: Pick<DbUser, 'name' | 'email'>;
};

export default function RenewalRequests() {
  const [requests, setRequests] = useState<RenewalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRenewalRequests();
  }, []);

  const fetchRenewalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('renewal_requests')
        .select(`
          id,
          user_id,
          user:users!renewal_requests_user_id_fkey (
            name,
            email
          ),
          plan_type,
          receipt_image,
          submission_date,
          status
        `)
        .eq('status', 'pending')
        .order('submission_date', { ascending: false })
        .returns<RenewalRequestWithUser[]>();

      if (error) throw error;

      if (!data) {
        setRequests([]);
        return;
      }

      const mappedRequests: RenewalRequest[] = data.map((req) => ({
        id: req.id,
        user_id: req.user_id,
        user_name: req.user.name,
        user_email: req.user.email,
        plan_type: req.plan_type as 'monthly' | 'yearly' | 'lifetime',
        receipt_image: req.receipt_image || '',
        submission_date: req.submission_date,
        status: req.status as 'pending' | 'approved' | 'rejected'
      }));

      setRequests(mappedRequests);
    } catch (err) {
      console.error('Error fetching renewal requests:', err);
      toast.error('Failed to load renewal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (requestId: string, approved: boolean) => {
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        toast.error('Request not found');
        return;
      }

      const startDate = new Date();
      let durationInDays = 30; // default monthly
      
      switch (request.plan_type) {
        case 'yearly':
          durationInDays = 365;
          break;
        case 'lifetime':
          durationInDays = 36500; // 100 years
          break;
        case 'monthly':
        default:
          durationInDays = 30;
          break;
      }

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationInDays);

      await supabaseAdmin.rpc('process_renewal_request', {
        p_request_id: requestId,
        p_approved: approved,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      // Update local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success(approved ? 'Renewal request approved' : 'Renewal request rejected');
    } catch (err) {
      console.error('Error processing renewal request:', err);
      toast.error('Failed to process renewal request');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">No pending renewal requests</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{request.user_name}</h3>
                  <p className="text-gray-400">{request.user_email}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-blue-400 font-medium">
                    {request.plan_type.charAt(0).toUpperCase() + request.plan_type.slice(1)} Plan
                  </span>
                  <span className="text-sm text-gray-400">
                    {format(new Date(request.submission_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleVerify(request.id, true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleVerify(request.id, false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
            {request.receipt_image && (
              <div className="w-full md:w-64 h-48 rounded-lg overflow-hidden">
                <img
                  src={request.receipt_image}
                  alt="Payment receipt"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}