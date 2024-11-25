create or replace function process_renewal_request(
  p_request_id uuid,
  p_approved boolean,
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
) returns void as $$
begin
  -- Start transaction
  begin
    -- Update the renewal request status
    update renewal_requests
    set status = case when p_approved then 'approved' else 'rejected' end,
        processed_at = now()
    where id = p_request_id;

    -- If approved, update the user's subscription
    if p_approved then
      update user_subscriptions
      set status = 'active',
          start_date = p_start_date,
          end_date = p_end_date
      where user_id = (
        select user_id 
        from renewal_requests 
        where id = p_request_id
      );
    end if;

    -- Commit transaction
    commit;
  exception
    when others then
      -- Rollback transaction on error
      rollback;
      raise;
  end;
end;
$$ language plpgsql security definer;
