-- Transaction Locking System for Wallet Operations
-- This SQL creates functions to handle atomic wallet transactions with proper locking

-- Function to execute wallet transaction with advisory lock
CREATE OR REPLACE FUNCTION execute_wallet_transaction(
  p_sender_wallet_id UUID,
  p_recipient_wallet_id UUID,
  p_currency_type TEXT,
  p_amount NUMERIC,
  p_memo TEXT DEFAULT '',
  p_transaction_hash TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_sender_wallet RECORD;
  v_recipient_wallet RECORD;
  v_transaction_id UUID;
  v_new_sender_balance NUMERIC;
  v_new_recipient_balance NUMERIC;
  v_daily_spent NUMERIC;
  v_daily_limit NUMERIC;
  v_result JSON;
BEGIN
  -- Acquire advisory locks (prevents concurrent transactions on same wallets)
  -- Use wallet IDs as lock keys to ensure ordering and prevent deadlocks
  IF p_sender_wallet_id < p_recipient_wallet_id THEN
    PERFORM pg_advisory_xact_lock(('x' || substring(p_sender_wallet_id::text, 1, 8))::bit(32)::int);
    PERFORM pg_advisory_xact_lock(('x' || substring(p_recipient_wallet_id::text, 1, 8))::bit(32)::int);
  ELSE
    PERFORM pg_advisory_xact_lock(('x' || substring(p_recipient_wallet_id::text, 1, 8))::bit(32)::int);
    PERFORM pg_advisory_xact_lock(('x' || substring(p_sender_wallet_id::text, 1, 8))::bit(32)::int);
  END IF;

  -- Get sender wallet with FOR UPDATE to prevent concurrent modifications
  SELECT * INTO v_sender_wallet
  FROM student_wallets 
  WHERE id = p_sender_wallet_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  -- Check if wallet is locked
  IF v_sender_wallet.is_locked THEN
    RETURN json_build_object('success', false, 'error', 'Wallet is locked');
  END IF;

  -- Get recipient wallet with FOR UPDATE
  SELECT * INTO v_recipient_wallet
  FROM student_wallets 
  WHERE id = p_recipient_wallet_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Recipient wallet not found');
  END IF;

  -- Calculate balances and daily limits based on currency
  IF p_currency_type = 'mind_gems' THEN
    v_new_sender_balance = v_sender_wallet.mind_gems_balance - p_amount;
    v_new_recipient_balance = v_recipient_wallet.mind_gems_balance + p_amount;
    v_daily_spent = v_sender_wallet.daily_spent_gems;
    v_daily_limit = v_sender_wallet.daily_limit_gems;
  ELSE -- fluxon
    v_new_sender_balance = v_sender_wallet.fluxon_balance::numeric - p_amount;
    v_new_recipient_balance = v_recipient_wallet.fluxon_balance::numeric + p_amount;
    v_daily_spent = v_sender_wallet.daily_spent_fluxon::numeric;
    v_daily_limit = v_sender_wallet.daily_limit_fluxon::numeric;
  END IF;

  -- Validate sufficient balance
  IF v_new_sender_balance < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Validate daily limit
  IF (v_daily_spent + p_amount) > v_daily_limit THEN
    RETURN json_build_object('success', false, 'error', 'Daily limit exceeded');
  END IF;

  -- Create transaction record first
  INSERT INTO wallet_transactions (
    from_wallet_id,
    to_wallet_id,
    from_address,
    to_address,
    currency_type,
    amount,
    transaction_hash,
    memo,
    status,
    transaction_type,
    created_at
  ) VALUES (
    p_sender_wallet_id,
    p_recipient_wallet_id,
    v_sender_wallet.wallet_address,
    v_recipient_wallet.wallet_address,
    p_currency_type,
    p_amount,
    COALESCE(p_transaction_hash, encode(gen_random_bytes(32), 'hex')),
    p_memo,
    'completed',
    'send',
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Update sender wallet
  IF p_currency_type = 'mind_gems' THEN
    UPDATE student_wallets SET
      mind_gems_balance = v_new_sender_balance,
      daily_spent_gems = v_daily_spent + p_amount,
      total_transactions_sent = total_transactions_sent + 1,
      wallet_xp = wallet_xp + 10,
      last_transaction_at = NOW(),
      updated_at = NOW()
    WHERE id = p_sender_wallet_id;
  ELSE
    UPDATE student_wallets SET
      fluxon_balance = v_new_sender_balance::text,
      daily_spent_fluxon = (v_daily_spent + p_amount)::text,
      total_transactions_sent = total_transactions_sent + 1,
      wallet_xp = wallet_xp + 10,
      last_transaction_at = NOW(),
      updated_at = NOW()
    WHERE id = p_sender_wallet_id;
  END IF;

  -- Update recipient wallet (only if different from sender)
  IF p_sender_wallet_id != p_recipient_wallet_id THEN
    IF p_currency_type = 'mind_gems' THEN
      UPDATE student_wallets SET
        mind_gems_balance = v_new_recipient_balance,
        total_transactions_received = total_transactions_received + 1,
        updated_at = NOW()
      WHERE id = p_recipient_wallet_id;
    ELSE
      UPDATE student_wallets SET
        fluxon_balance = v_new_recipient_balance::text,
        total_transactions_received = total_transactions_received + 1,
        updated_at = NOW()
      WHERE id = p_recipient_wallet_id;
    END IF;
  END IF;

  -- Mark transaction as completed
  UPDATE wallet_transactions 
  SET completed_at = NOW(), status = 'completed'
  WHERE id = v_transaction_id;

  -- Return success with transaction details
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_sender_balance', v_new_sender_balance,
    'new_recipient_balance', v_new_recipient_balance,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return failure
    INSERT INTO wallet_security_logs (
      wallet_id, 
      action_type, 
      action_details, 
      success, 
      error_message,
      created_at
    ) VALUES (
      p_sender_wallet_id, 
      'transaction_error', 
      'Database error during transaction', 
      false, 
      SQLERRM,
      NOW()
    );
    
    RETURN json_build_object('success', false, 'error', 'Transaction failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and reset daily limits (run daily via cron)
CREATE OR REPLACE FUNCTION reset_daily_wallet_limits()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE student_wallets SET
    daily_spent_gems = 0,
    daily_spent_fluxon = '0',
    updated_at = NOW()
  WHERE 
    -- Reset only if it's been more than 24 hours since last reset
    (last_daily_reset IS NULL OR last_daily_reset < CURRENT_DATE)
    AND (daily_spent_gems > 0 OR daily_spent_fluxon::numeric > 0);
    
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  -- Update last reset timestamp
  UPDATE student_wallets SET
    last_daily_reset = CURRENT_DATE
  WHERE last_daily_reset IS NULL OR last_daily_reset < CURRENT_DATE;
  
  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock/unlock wallet for security
CREATE OR REPLACE FUNCTION set_wallet_lock_status(
  p_wallet_id UUID,
  p_is_locked BOOLEAN,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_wallet_exists INTEGER;
BEGIN
  -- Check if wallet exists and update lock status
  UPDATE student_wallets 
  SET 
    is_locked = p_is_locked,
    lock_reason = CASE WHEN p_is_locked THEN p_reason ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_wallet_id;
  
  GET DIAGNOSTICS v_wallet_exists = ROW_COUNT;
  
  IF v_wallet_exists = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Log the action
  INSERT INTO wallet_security_logs (
    wallet_id,
    action_type,
    action_details,
    success,
    created_at
  ) VALUES (
    p_wallet_id,
    CASE WHEN p_is_locked THEN 'wallet_locked' ELSE 'wallet_unlocked' END,
    COALESCE(p_reason, 'Manual lock status change'),
    true,
    NOW()
  );
  
  RETURN json_build_object('success', true, 'locked', p_is_locked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallets 
ON wallet_transactions (from_wallet_id, to_wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created 
ON wallet_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_security_logs_wallet 
ON wallet_security_logs (wallet_id, created_at DESC);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'student_wallets' AND column_name = 'last_daily_reset') THEN
    ALTER TABLE student_wallets ADD COLUMN last_daily_reset DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'student_wallets' AND column_name = 'lock_reason') THEN
    ALTER TABLE student_wallets ADD COLUMN lock_reason TEXT;
  END IF;
END $$;
