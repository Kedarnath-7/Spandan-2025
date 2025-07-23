CREATE OR REPLACE FUNCTION get_registration_details(search_id TEXT)
RETURNS TABLE (
    id UUID,
    group_id TEXT,
    registration_type TEXT,
    members JSON,
    total_amount NUMERIC,
    payment_transaction_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    payment_verification_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH found_group_id AS (
        -- First, try to find the group_id based on the search_id
        -- It could be the group_id itself or the user's primary id from group_registrations
        SELECT gr.group_id
        FROM group_registrations gr
        WHERE gr.group_id = search_id
        OR gr.id::text = search_id
        LIMIT 1
    )
    SELECT
        gr.id,
        gr.group_id,
        gr.registration_type,
        (
            SELECT json_agg(
                json_build_object(
                    'name', gm.name,
                    'email', gm.email,
                    'college', gm.college,
                    'phone', gm.phone,
                    'collegeLocation', gm.college_location,
                    'selectionType', gm.selection_type,
                    'tier', gm.tier,
                    'passType', gm.pass_type,
                    'passTier', gm.pass_tier
                )
            )
            FROM group_members gm
            WHERE gm.group_id = gr.group_id
        ) AS members,
        gr.total_amount,
        gr.payment_transaction_id,
        gr.status,
        gr.created_at,
        gr.payment_verification_date
    FROM group_registrations gr
    WHERE gr.group_id = (SELECT group_id FROM found_group_id);
END;
$$ LANGUAGE plpgsql;
