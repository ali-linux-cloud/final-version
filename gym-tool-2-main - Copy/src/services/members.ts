import { supabase } from '../lib/supabase';
import type { Member, MemberFormData } from '../types/member';
import type { RenewalHistory } from '../types/member';

export async function getMembers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        renewal_history (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { members: data || [], error: null };
  } catch (error) {
    console.error('Get members error:', error);
    return { members: [], error };
  }
}

export async function addMember(userId: string, memberData: MemberFormData) {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([{
        user_id: userId,
        ...memberData
      }])
      .select()
      .single();

    if (error) throw error;

    return { member: data, error: null };
  } catch (error) {
    console.error('Add member error:', error);
    return { member: null, error };
  }
}

export async function updateMember(memberId: string, updates: Partial<Member>) {
  try {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

    return { member: data, error: null };
  } catch (error) {
    console.error('Update member error:', error);
    return { member: null, error };
  }
}

export async function deleteMember(memberId: string) {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Delete member error:', error);
    return { error };
  }
}

export async function renewMember(
  memberId: string, 
  duration: number, 
  price: number, 
  startDate: string,
  endDate: string
) {
  try {
    // Start a transaction by using RPC
    const { data: result, error: rpcError } = await supabase.rpc('renew_member', {
      p_member_id: memberId,
      p_duration: duration,
      p_price: price,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (rpcError) throw rpcError;

    return { success: true, error: null };
  } catch (error) {
    console.error('Renew member error:', error);
    return { success: false, error };
  }
}

export async function getRenewalHistory(memberId: string) {
  try {
    const { data, error } = await supabase
      .from('renewal_history')
      .select('*')
      .eq('member_id', memberId)
      .order('renewal_date', { ascending: false });

    if (error) throw error;

    return { history: data || [], error: null };
  } catch (error) {
    console.error('Get renewal history error:', error);
    return { history: [], error };
  }
}
