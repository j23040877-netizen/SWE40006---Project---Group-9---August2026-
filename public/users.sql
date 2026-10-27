SELECT * FROM orders ;

-- \echo '----------------------------------------'
-- \echo '           REGISTERED USERS             '
-- \echo '----------------------------------------'
-- SELECT id, name, email, created_at FROM users;

-- \echo ''
-- \echo '----------------------------------------'
-- \echo '          CUSTOMER ORDER HISTORY        '
-- \echo '----------------------------------------'
-- SELECT id, order_number, user_id, total_amount, payment_status, fulfillment_status, created_at FROM orders;