-- Function to handle member renewal with transaction
create or replace function renew_member(
  p_member_id uuid,
  p_duration integer,
  p_price numeric,
  p_start_date date,
  p_end_date date
) returns void as $$
begin
  -- Update member's end date
  update members
  set 
    end_date = p_end_date,
    duration = p_duration,
    price = p_price
  where id = p_member_id;

  -- Add renewal history record
  insert into renewal_history (
    member_id,
    renewal_date,
    duration,
    price,
    start_date,
    end_date
  ) values (
    p_member_id,
    current_date,
    p_duration,
    p_price,
    p_start_date,
    p_end_date
  );
end;
$$ language plpgsql;
