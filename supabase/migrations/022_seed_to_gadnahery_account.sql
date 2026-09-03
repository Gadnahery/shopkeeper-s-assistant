-- Migration 022: Seed Mary Stanislaus Mlay Gas Supply data directly into existing account (gadnahery7@gmail.com)
DO $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;

  v_cat_refill UUID := gen_random_uuid();
  v_cat_empty UUID := gen_random_uuid();
  v_cat_acc UUID := gen_random_uuid();

  -- Suppliers
  v_sup_oryx UUID := gen_random_uuid();
  v_sup_taifa UUID := gen_random_uuid();
  v_sup_ogas UUID := gen_random_uuid();
  v_sup_lake UUID := gen_random_uuid();
  v_sup_puma UUID := gen_random_uuid();
  v_sup_cam UUID := gen_random_uuid();

  -- Product IDs
  v_p_ox15 UUID := gen_random_uuid();
  v_p_ox6 UUID := gen_random_uuid();
  v_p_t15 UUID := gen_random_uuid();
  v_p_t6 UUID := gen_random_uuid();
  v_p_og15 UUID := gen_random_uuid();
  v_p_og6 UUID := gen_random_uuid();
  v_p_l15 UUID := gen_random_uuid();
  v_p_l6 UUID := gen_random_uuid();
  v_p_p15 UUID := gen_random_uuid();
  v_p_p6 UUID := gen_random_uuid();
  v_p_c38 UUID := gen_random_uuid();
  v_p_c15 UUID := gen_random_uuid();
  v_p_c6 UUID := gen_random_uuid();

  -- Customers
  v_cust_wholesale UUID := gen_random_uuid();
  v_cust_retail UUID := gen_random_uuid();

  -- Purchases & Sales
  v_po_id UUID := gen_random_uuid();
  v_sale1_id UUID := gen_random_uuid();
  v_sale2_id UUID := gen_random_uuid();
  v_sale3_id UUID := gen_random_uuid();
BEGIN
  -- 1. Find existing user by email
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER('gadnahery7@gmail.com') LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User gadnahery7@gmail.com not found in auth.users table. Please create/register the user first.';
  END IF;

  -- 2. Find or Create Shop for this user
  SELECT shop_id INTO v_shop_id FROM public.profiles WHERE user_id = v_user_id LIMIT 1;

  IF v_shop_id IS NULL THEN
    INSERT INTO public.shops (
      name,
      phone,
      currency,
      locale,
      country_code,
      address,
      receipt_header,
      receipt_footer,
      tax_rate
    ) VALUES (
      'Mary Stanislaus Mlay Gas Supply',
      '+255 754 000 111',
      'TZS',
      'sw-TZ',
      'TZ',
      'Kariakoo / Sinza, Dar es Salaam, Tanzania',
      'MARY STANISLAUS MLAY GAS SUPPLY' || E'\n' || 'Dar es Salaam, Tanzania' || E'\n' || 'Simu: 0754 000 111',
      'Asante kwa kununua kwetu!' || E'\n' || 'Usalama wa gesi ni jukumu letu sote.',
      0
    ) RETURNING id INTO v_shop_id;
  ELSE
    UPDATE public.shops
    SET
      name = 'Mary Stanislaus Mlay Gas Supply',
      phone = '+255 754 000 111',
      currency = 'TZS',
      locale = 'sw-TZ',
      country_code = 'TZ',
      address = 'Kariakoo / Sinza, Dar es Salaam, Tanzania',
      receipt_header = 'MARY STANISLAUS MLAY GAS SUPPLY' || E'\n' || 'Dar es Salaam, Tanzania' || E'\n' || 'Simu: 0754 000 111',
      receipt_footer = 'Asante kwa kununua kwetu!' || E'\n' || 'Usalama wa gesi ni jukumu letu sote.',
      tax_rate = 0
    WHERE id = v_shop_id;
  END IF;

  -- 3. Update Profile & User Role
  INSERT INTO public.profiles (user_id, shop_id, full_name, phone)
  VALUES (v_user_id, v_shop_id, 'Mary Stanislaus Mlay', '+255 754 000 111')
  ON CONFLICT (user_id) DO UPDATE SET
    shop_id = v_shop_id,
    full_name = 'Mary Stanislaus Mlay',
    phone = '+255 754 000 111';

  INSERT INTO public.user_roles (user_id, shop_id, role)
  VALUES (v_user_id, v_shop_id, 'owner')
  ON CONFLICT (user_id, shop_id) DO UPDATE SET role = 'owner';

  -- 4. Shop Settings
  DELETE FROM public.shop_settings WHERE shop_id = v_shop_id;
  INSERT INTO public.shop_settings (shop_id, shop_name, phone, currency, language)
  VALUES (v_shop_id, 'Mary Stanislaus Mlay Gas Supply', '+255 754 000 111', 'TZS', 'sw');

  -- 5. Wipe old demo data from this shop cleanly
  DELETE FROM public.sale_items WHERE shop_id = v_shop_id;
  DELETE FROM public.sales WHERE shop_id = v_shop_id;
  DELETE FROM public.stock_received_items WHERE stock_received_id IN (SELECT id FROM public.stock_received WHERE shop_id = v_shop_id);
  DELETE FROM public.stock_received WHERE shop_id = v_shop_id;
  DELETE FROM public.expenses WHERE shop_id = v_shop_id;
  DELETE FROM public.products WHERE shop_id = v_shop_id;
  DELETE FROM public.categories WHERE shop_id = v_shop_id;
  DELETE FROM public.suppliers WHERE shop_id = v_shop_id;
  DELETE FROM public.customers WHERE shop_id = v_shop_id;

  -- 6. Categories
  INSERT INTO public.categories (id, shop_id, name, description)
  VALUES
    (v_cat_refill, v_shop_id, 'Gas ya Kujaza (Refill)', 'Mitungi ya gesi iliyojaa tayari kwa mauzo'),
    (v_cat_empty, v_shop_id, 'Mitungi Mitupu (Empty Cylinders)', 'Mtaji wa mitungi mitupu ya akiba'),
    (v_cat_acc, v_shop_id, 'Vifaa na Vifaa vya Gesi', 'Regulators, mabomba ya gesi, na majiko');

  -- 7. Suppliers
  INSERT INTO public.suppliers (id, shop_id, name, contact_person, phone, pending_payment)
  VALUES
    (v_sup_oryx, v_shop_id, 'Oryx Energies Tanzania', 'Bw. Mwamba (Oryx Depot)', '0715 111 222', 0),
    (v_sup_taifa, v_shop_id, 'Taifa Gas Tanzania Ltd', 'Bi. Neema (Taifa Plant)', '0716 333 444', 0),
    (v_sup_ogas, v_shop_id, 'O-Gas Supply', 'Sales Desk', '0717 555 666', 0),
    (v_sup_lake, v_shop_id, 'Lake Gas Ltd', 'Dispatch', '0718 777 888', 0),
    (v_sup_puma, v_shop_id, 'Puma Energy Gas', 'Depot Manager', '0719 999 000', 0),
    (v_sup_cam, v_shop_id, 'Cam Gas Tanzania', 'Customer Care', '0712 121 212', 0);

  -- 8. Customers
  INSERT INTO public.customers (id, shop_id, name, phone, customer_type, credit_balance)
  VALUES
    (v_cust_wholesale, v_shop_id, 'Wateja wa Jumla (Retailers / Maduka Madogo)', '0754 888 999', 'wholesale', 0),
    (v_cust_retail, v_shop_id, 'Wateja wa Rejareja (Nyumbani / Walk-in)', '0712 000 333', 'retail', 0);

  -- 9. Products (13 items with code, barcode, sku, prices, and ledger stock balances)
  INSERT INTO public.products (
    id, shop_id, category_id, name, code, barcode, sku, buying_price, selling_price, stock, low_stock_alert
  ) VALUES
    (v_p_ox15, v_shop_id, v_cat_refill, 'Oryx Gas 15kg', 'OX-15', 'OX-15', 'OX-15', 48000, 54000, 3, 5),
    (v_p_ox6, v_shop_id, v_cat_refill, 'Oryx Gas 6kg', 'OX-6', 'OX-6', 'OX-6', 20000, 23500, 9, 10),
    (v_p_t15, v_shop_id, v_cat_refill, 'Taifa Gas 15kg', 'T-15', 'T-15', 'T-15', 47000, 53000, 7, 5),
    (v_p_t6, v_shop_id, v_cat_refill, 'Taifa Gas 6kg', 'T-6', 'T-6', 'T-6', 19500, 22500, 16, 10),
    (v_p_og15, v_shop_id, v_cat_refill, 'O-Gas 15kg', 'OG-15', 'OG-15', 'OG-15', 46000, 52000, 3, 3),
    (v_p_og6, v_shop_id, v_cat_refill, 'O-Gas 6kg', 'OG-6', 'OG-6', 'OG-6', 20000, 23500, 5, 5),
    (v_p_l15, v_shop_id, v_cat_refill, 'Lake Gas 15kg', 'L-15', 'L-15', 'L-15', 47000, 53000, 0, 3),
    (v_p_l6, v_shop_id, v_cat_refill, 'Lake Gas 6kg', 'L-6', 'L-6', 'L-6', 19500, 22500, 0, 3),
    (v_p_p15, v_shop_id, v_cat_refill, 'Puma Gas 15kg', 'P-15', 'P-15', 'P-15', 47000, 53000, 0, 3),
    (v_p_p6, v_shop_id, v_cat_refill, 'Puma Gas 6kg', 'P-6', 'P-6', 'P-6', 19500, 22500, 0, 3),
    (v_p_c38, v_shop_id, v_cat_refill, 'Cam Gas 38kg', 'C-38', 'C-38', 'C-38', 130000, 150000, 0, 2),
    (v_p_c15, v_shop_id, v_cat_refill, 'Cam Gas 15kg', 'C-15', 'C-15', 'C-15', 47000, 53000, 0, 3),
    (v_p_c6, v_shop_id, v_cat_refill, 'Cam Gas 6kg', 'C-6', 'C-6', 'C-6', 19000, 22000, 4, 3);

  -- 10. Record All 29 Pre-Operational Expenses (2,606,500 TZS)
  INSERT INTO public.expenses (shop_id, description, amount, category, date, created_at)
  VALUES
    (v_shop_id, '1. Kodi ya fremu miezi 14 (Rent)', 1400000, 'Rent', '2026-06-01', '2026-06-01 08:00:00+03'),
    (v_shop_id, '2. Dalali (Broker)', 100000, 'Operational', '2026-06-01', '2026-06-01 09:00:00+03'),
    (v_shop_id, '3. Leseni ya biashara', 80000, 'Legal & Licensing', '2026-06-02', '2026-06-02 10:00:00+03'),
    (v_shop_id, '4. Leseni ya zimamoto (Fire)', 40000, 'Legal & Licensing', '2026-06-02', '2026-06-02 11:00:00+03'),
    (v_shop_id, '5. Mtungi wa zimamoto (Fire Extinguisher)', 80000, 'Equipment', '2026-06-03', '2026-06-03 09:30:00+03'),
    (v_shop_id, '6. Mtu wa leseni ya biashara', 20000, 'Operational', '2026-06-03', '2026-06-03 11:00:00+03'),
    (v_shop_id, '7. Mtu wa leseni ya fire', 10000, 'Operational', '2026-06-03', '2026-06-03 12:00:00+03'),
    (v_shop_id, '8. Nauli na makato', 26000, 'Transport', '2026-06-04', '2026-06-04 14:00:00+03'),
    (v_shop_id, '9. Simu ndogo ya office', 27000, 'Equipment', '2026-06-05', '2026-06-05 10:00:00+03'),
    (v_shop_id, '10. Kudesign bango la biashara', 20000, 'Marketing', '2026-06-06', '2026-06-06 11:00:00+03'),
    (v_shop_id, '11. Kuprinti bango', 76000, 'Marketing', '2026-06-07', '2026-06-07 14:00:00+03'),
    (v_shop_id, '12. Fremu ya bango', 45000, 'Marketing', '2026-06-08', '2026-06-08 10:00:00+03'),
    (v_shop_id, '13. Taa tatu (3) za bango', 15000, 'Marketing', '2026-06-08', '2026-06-08 12:00:00+03'),
    (v_shop_id, '14. Holder za bango', 10500, 'Marketing', '2026-06-08', '2026-06-08 13:00:00+03'),
    (v_shop_id, '15. Wire wa bango', 8000, 'Marketing', '2026-06-08', '2026-06-08 14:00:00+03'),
    (v_shop_id, '16. Fundi umeme', 10000, 'Maintenance', '2026-06-09', '2026-06-09 10:00:00+03'),
    (v_shop_id, '17. Kuliwamba bango na kulifunga', 30000, 'Marketing', '2026-06-09', '2026-06-09 15:00:00+03'),
    (v_shop_id, '18. Gate la ndani', 120000, 'Renovation', '2026-06-10', '2026-06-10 11:00:00+03'),
    (v_shop_id, '19. Usafiri wa kuleta gate', 17000, 'Transport', '2026-06-10', '2026-06-10 14:00:00+03'),
    (v_shop_id, '20. Taa za office nje na ndani', 18000, 'Renovation', '2026-06-11', '2026-06-11 10:00:00+03'),
    (v_shop_id, '21. Kufuri za office (2 pc)', 39000, 'Equipment', '2026-06-11', '2026-06-11 12:00:00+03'),
    (v_shop_id, '22. Viti vya office (2 pc)', 44000, 'Equipment', '2026-06-12', '2026-06-12 11:00:00+03'),
    (v_shop_id, '23. Meza ya office (used)', 25000, 'Equipment', '2026-06-12', '2026-06-12 14:00:00+03'),
    (v_shop_id, '24. Service ya pikipiki', 26000, 'Vehicle', '2026-06-13', '2026-06-13 10:00:00+03'),
    (v_shop_id, '25. Kage ya kubebea gas', 135000, 'Equipment', '2026-06-14', '2026-06-14 11:00:00+03'),
    (v_shop_id, '26. Shelyu ya vifaa vya gas', 10000, 'Equipment', '2026-06-15', '2026-06-15 10:00:00+03'),
    (v_shop_id, '27. Rangi na mpigaji', 25000, 'Renovation', '2026-06-16', '2026-06-16 12:00:00+03'),
    (v_shop_id, '28. Mwanasheria', 10000, 'Legal & Licensing', '2026-06-17', '2026-06-17 10:00:00+03'),
    (v_shop_id, '29. Mzani wa kupimia gas', 140000, 'Equipment', '2026-06-18', '2026-06-18 11:00:00+03');

  -- 11. Record Purchases Batch (Section F: 322 cylinders)
  INSERT INTO public.stock_received (
    id, shop_id, supplier_id, supplier_name, notes, status, total_amount, created_at
  ) VALUES (
    v_po_id,
    v_shop_id,
    v_sup_oryx,
    'Oryx Energies Tanzania',
    'Shehena ya Awamu ya 1 (Refills ya Gesi - Oryx, Taifa, O-Gas, Lake, Puma, Cam)',
    'received',
    8350000,
    '2026-06-22 08:30:00+03'
  );

  INSERT INTO public.stock_received_items (stock_received_id, product_id, quantity, buying_price)
  VALUES
    (v_po_id, v_p_ox15, 37, 48000),
    (v_po_id, v_p_ox6, 100, 20000),
    (v_po_id, v_p_t15, 23, 47000),
    (v_po_id, v_p_t6, 79, 19500),
    (v_po_id, v_p_og15, 5, 46000),
    (v_po_id, v_p_og6, 40, 20000),
    (v_po_id, v_p_l15, 5, 47000),
    (v_po_id, v_p_l6, 5, 19500),
    (v_po_id, v_p_p15, 5, 47000),
    (v_po_id, v_p_p6, 5, 19500),
    (v_po_id, v_p_c38, 3, 130000),
    (v_po_id, v_p_c15, 5, 47000),
    (v_po_id, v_p_c6, 10, 19000);

  -- 12. Record Real Wholesale & Retail Sales (275 cylinders sold)
  -- Wholesale Sale 1 (Oryx & Taifa)
  INSERT INTO public.sales (
    id, shop_id, customer_id, customer_name, subtotal, total, discount_amount, payment_method, status, invoice_number, created_at
  ) VALUES (
    v_sale1_id,
    v_shop_id,
    v_cust_wholesale,
    'Wateja wa Jumla (Retailers / Maduka Madogo)',
    4861500,
    4861500,
    0,
    'Cash',
    'completed',
    'INV-MLAY-001',
    '2026-06-25 14:00:00+03'
  );

  INSERT INTO public.sale_items (sale_id, shop_id, product_id, product_name, quantity, unit_price, total)
  VALUES
    (v_sale1_id, v_shop_id, v_p_ox15, 'Oryx Gas 15kg', 30, 54000, 1620000),
    (v_sale1_id, v_shop_id, v_p_ox6, 'Oryx Gas 6kg', 89, 23500, 2091500),
    (v_sale1_id, v_shop_id, v_p_t15, 'Taifa Gas 15kg', 16, 53000, 848000),
    (v_sale1_id, v_shop_id, v_p_t6, 'Taifa Gas 6kg', 60, 22500, 1350000);

  -- Wholesale Sale 2 (O-Gas, Lake, Puma, Cam)
  INSERT INTO public.sales (
    id, shop_id, customer_id, customer_name, subtotal, total, discount_amount, payment_method, status, invoice_number, created_at
  ) VALUES (
    v_sale2_id,
    v_shop_id,
    v_cust_wholesale,
    'Wateja wa Jumla (Retailers / Maduka Madogo)',
    1911500,
    1911500,
    0,
    'M-Pesa',
    'completed',
    'INV-MLAY-002',
    '2026-06-28 16:30:00+03'
  );

  INSERT INTO public.sale_items (sale_id, shop_id, product_id, product_name, quantity, unit_price, total)
  VALUES
    (v_sale2_id, v_shop_id, v_p_og15, 'O-Gas 15kg', 2, 52000, 104000),
    (v_sale2_id, v_shop_id, v_p_og6, 'O-Gas 6kg', 33, 23500, 775500),
    (v_sale2_id, v_shop_id, v_p_l15, 'Lake Gas 15kg', 5, 53000, 265000),
    (v_sale2_id, v_shop_id, v_p_l6, 'Lake Gas 6kg', 5, 22500, 112500),
    (v_sale2_id, v_shop_id, v_p_p15, 'Puma Gas 15kg', 5, 53000, 265000),
    (v_sale2_id, v_shop_id, v_p_p6, 'Puma Gas 6kg', 4, 22500, 90000),
    (v_sale2_id, v_shop_id, v_p_c15, 'Cam Gas 15kg', 5, 53000, 265000),
    (v_sale2_id, v_shop_id, v_p_c6, 'Cam Gas 6kg', 6, 22000, 132000);

  -- Retail Sales (Walk-in Rejareja: 4 OX-15, 2 OX-6, 3 T-6, 2 OG-6, 1 P-6, 3 C-38)
  INSERT INTO public.sales (
    id, shop_id, customer_id, customer_name, subtotal, total, discount_amount, payment_method, status, invoice_number, created_at
  ) VALUES (
    v_sale3_id,
    v_shop_id,
    NULL,
    'Mteja wa Nyumbani (Rejareja)',
    900000,
    900000,
    0,
    'Cash',
    'completed',
    'INV-MLAY-003',
    '2026-06-30 18:00:00+03'
  );

  INSERT INTO public.sale_items (sale_id, shop_id, product_id, product_name, quantity, unit_price, total)
  VALUES
    (v_sale3_id, v_shop_id, v_p_ox15, 'Oryx Gas 15kg', 4, 54000, 216000),
    (v_sale3_id, v_shop_id, v_p_ox6, 'Oryx Gas 6kg', 2, 23500, 47000),
    (v_sale3_id, v_shop_id, v_p_t6, 'Taifa Gas 6kg', 3, 22500, 67500),
    (v_sale3_id, v_shop_id, v_p_og6, 'O-Gas 6kg', 2, 23500, 47000),
    (v_sale3_id, v_shop_id, v_p_p6, 'Puma Gas 6kg', 1, 22500, 22500),
    (v_sale3_id, v_shop_id, v_p_c38, 'Cam Gas 38kg', 3, 150000, 450000);

END;
$$;
