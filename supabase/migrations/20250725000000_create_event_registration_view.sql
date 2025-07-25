-- Create a comprehensive view for event registration data export with member details
-- This view provides a structured format for CSV export with all member information

CREATE OR REPLACE VIEW event_registration_view AS
SELECT 
  er.group_id,
  erm.user_id,
  erm.name,
  erm.email,
  erm.college,
  erm.phone,
  -- Add college_location by extracting location from college name or set as college for now
  erm.college as college_location,
  er.event_name,
  -- Get event category from events table
  e.category as event_category,
  er.event_price,
  er.member_count,
  -- Individual member amount (event_price per member)
  er.event_price as amount,
  er.total_amount,
  er.status,
  er.payment_transaction_id,
  er.reviewed_by,
  er.reviewed_at,
  er.rejection_reason,
  er.created_at,
  er.updated_at,
  -- Additional useful fields for export
  CASE 
    WHEN er.status = 'pending' THEN 'Pending Review'
    WHEN er.status = 'approved' THEN 'Approved'
    WHEN er.status = 'rejected' THEN 'Rejected'
    ELSE er.status
  END as status_display,
  TO_CHAR(er.created_at, 'DD/MM/YYYY HH24:MI') as formatted_created_at,
  CASE 
    WHEN er.reviewed_at IS NOT NULL THEN TO_CHAR(er.reviewed_at, 'DD/MM/YYYY HH24:MI')
    ELSE NULL
  END as formatted_reviewed_at,
  CASE 
    WHEN er.updated_at IS NOT NULL THEN TO_CHAR(er.updated_at, 'DD/MM/YYYY HH24:MI')
    ELSE NULL
  END as formatted_updated_at
FROM event_registrations er
LEFT JOIN event_registration_members erm ON er.group_id = erm.group_id
LEFT JOIN events e ON er.event_id = e.id
ORDER BY er.created_at DESC, erm.member_order;

-- Grant permissions
GRANT SELECT ON event_registration_view TO postgres, anon, authenticated;

-- Add comment for documentation
COMMENT ON VIEW event_registration_view IS 'Formatted view for event registration data export with proper status display and date formatting';
