-- Test Database Functions

-- List all custom functions
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_access_matrix',
    'update_user_role',
    'assign_user_plan',
    'check_feature_access',
    'check_resource_limit',
    'get_segment_user_ids',
    'aggregate_trade_notes_for_date',
    'update_journal_images_notes_for_date',
    'upsert_user_subscription',
    'get_current_user_profile',
    'check_admin_role',
    'is_user_setup_complete',
    'check_user_setup_status',
    'ensure_user_profile_exists',
    'initialize_default_user_accounts_strategies',
    'check_expired_subscriptions'
)
ORDER BY routine_name;
