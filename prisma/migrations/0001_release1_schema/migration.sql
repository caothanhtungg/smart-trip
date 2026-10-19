-- DRAFT ONLY: not executed against any database.
CREATE UNIQUE INDEX one_host_per_trip ON trip_members (trip_id) WHERE role = 'HOST';
CREATE UNIQUE INDEX one_pending_claim ON member_claims (trip_id, user_id) WHERE status = 'PENDING';
CREATE UNIQUE INDEX one_active_settlement ON settlements (trip_id) WHERE status = 'ACTIVE';
ALTER TABLE trips ADD CONSTRAINT trips_end_date_gte_start_date CHECK (end_date >= start_date);
ALTER TABLE expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);
ALTER TABLE expense_shares ADD CONSTRAINT expense_shares_amount_non_negative CHECK (amount >= 0);
ALTER TABLE expense_items ADD CONSTRAINT expense_items_amount_positive CHECK (amount > 0);
ALTER TABLE settlement_transfers ADD CONSTRAINT settlement_transfers_amount_positive CHECK (amount > 0), ADD CONSTRAINT settlement_transfers_distinct_members CHECK (from_member_id <> to_member_id), ADD CONSTRAINT settlement_transfers_unpaid_has_no_payment_metadata CHECK (status <> 'UNPAID' OR (paid_at IS NULL AND paid_marked_by_member_id IS NULL AND completed_at IS NULL AND completed_by_member_id IS NULL)), ADD CONSTRAINT settlement_transfers_paid_has_paid_metadata CHECK (status <> 'PAID' OR (paid_at IS NOT NULL AND paid_marked_by_member_id IS NOT NULL AND completed_at IS NULL AND completed_by_member_id IS NULL)), ADD CONSTRAINT settlement_transfers_completed_has_completion_metadata CHECK (status <> 'COMPLETED' OR (paid_at IS NOT NULL AND paid_marked_by_member_id IS NOT NULL AND completed_at IS NOT NULL AND completed_by_member_id IS NOT NULL));
-- Application-level invariants: item eligibility, surcharge allocation/sums, claim locks/conflicts.
