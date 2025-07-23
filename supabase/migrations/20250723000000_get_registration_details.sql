CREATE OR REPLACE FUNCTION get_registration_details(search_id TEXT)
RETURNS TABLE (
  id UUID,
  group_id TEXT,
  registration_type TEXT,
  members JSONB,
  total_amount NUMERIC,
  payment_transaction_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  payment_verification_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gr.id,
    gr.group_id,
    gr.registration_type,
    gr.members,
    gr.total_amount,
    gr.payment_transaction_id,
    gr.status,
    gr.created_at,
    gr.payment_verification_date
  FROM
    group_registrations gr
  WHERE
    gr.group_id = search_id
  OR
    gr.id::TEXT = search_id;
END;
$$ LANGUAGE plpgsql;
