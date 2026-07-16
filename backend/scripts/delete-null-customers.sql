-- Delete customers with null created_by_id (cascade: work_orders -> vehicles -> customers)

-- 1. Delete work orders associated with vehicles of null customers
DELETE FROM work_order
WHERE vehicle_id IN (
  SELECT v.id FROM vehicle v
  WHERE v.customer_id IN (
    SELECT c.id FROM customers c
    WHERE c.created_by_id IS NULL
  )
);

-- 2. Delete vehicles associated with null customers
DELETE FROM vehicle
WHERE customer_id IN (
  SELECT c.id FROM customers c
  WHERE c.created_by_id IS NULL
);

-- 3. Delete customers with null created_by_id
DELETE FROM customers WHERE created_by_id IS NULL;

-- Verify deletion
SELECT COUNT(*) as remaining_null_customers FROM customers WHERE created_by_id IS NULL;
