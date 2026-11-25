export const dealerView = `
SELECT d.id, d.status, d.user_id, l.id AS location_id, c.id AS city_id,
  d.profile || jsonb_build_object('id',d.id,'userId',d.user_id,'dealershipName',d.name,
    'registrationNumber',d.registration_number,'status',d.status,'isVerified',d.status='approved',
    'createdAt',d.created_at,'address',l.address,'pinCode',l.postal_code,'city',c.name,'state',c.state) AS data
FROM bestbuy.dealers d JOIN bestbuy.dealer_locations l ON l.dealer_id=d.id AND l.is_primary
JOIN bestbuy.cities c ON c.id=l.city_id`;
export const userView = `
SELECT u.id,u.role,u.status,u.email,u.password_hash,
  jsonb_strip_nulls(jsonb_build_object('id',u.id,'role',u.role,'status',u.status,'email',u.email,
  'name',u.name,'phoneNumber',u.phone,'createdAt',u.created_at,'dealerProfile',d.data)) AS data
FROM bestbuy.users u LEFT JOIN (${dealerView}) d ON d.user_id=u.id`;
export const listingView = `
SELECT i.id,i.dealer_id,i.location_id,i.variant_id,i.deleted_at,i.currency,dl.city_id,d.status AS dealer_status,
  v.id AS model_id, v.brand,v.model,t.name AS variant,c.name AS city, i.availability,
  i.details || jsonb_build_object('id',i.id,'dealerId',i.dealer_id,'vehicleModelId',v.id,'variantId',t.id,
    'brand',v.brand,'model',v.model,'variant',t.name,'price',i.dealer_price,'dealerOfferPrice',i.dealer_price,
    'exShowroomPrice',i.ex_showroom,'onRoadPrice',i.on_road,'quantity',i.quantity,'availability',i.availability,
    'createdAt',i.created_at,'updatedAt',i.updated_at,'dealer',d.data || jsonb_build_object('city',c.name,'state',c.state,'address',dl.address,'pinCode',dl.postal_code),
    'priceHistory',coalesce((SELECT jsonb_agg(jsonb_build_object('previousPrice',p.previous_price,
      'newPrice',p.new_price,'changedAt',p.changed_at) ORDER BY p.id) FROM bestbuy.price_changes p WHERE p.listing_id=i.id),'[]')) AS data
FROM bestbuy.inventory i JOIN bestbuy.vehicle_variants t ON t.id=i.variant_id JOIN bestbuy.vehicles v ON v.id=t.vehicle_id
JOIN bestbuy.dealer_locations dl ON dl.id=i.location_id JOIN bestbuy.cities c ON c.id=dl.city_id
JOIN (${dealerView}) d ON d.id=i.dealer_id`;
export const queueView = `
SELECT e.id,e.customer_id,e.queue_id,e.status,e.position,q.city_id,q.variant_id,
  jsonb_build_object('id',e.id,'customerId',e.customer_id,'customerName',u.name,'customerPhone',u.phone,
    'city',c.name,'position',e.position,'status',e.status,'createdAt',e.created_at,'vehicleModelId',v.id,
    'variantId',t.id,'variant',jsonb_build_object('id',t.id,'name',t.name),
    'vehicleModel',jsonb_build_object('id',v.id,'make',v.brand,'model',v.model,'variants','[]'::jsonb)) AS data
FROM bestbuy.queue_entries e JOIN bestbuy.shared_queues q ON q.id=e.queue_id JOIN bestbuy.cities c ON c.id=q.city_id
JOIN bestbuy.vehicle_variants t ON t.id=q.variant_id JOIN bestbuy.vehicles v ON v.id=t.vehicle_id
JOIN bestbuy.users u ON u.id=e.customer_id`;
export const offerView = `
SELECT o.id,o.customer_id,o.dealer_id,o.queue_entry_id,o.status,o.currency,
  o.details || jsonb_strip_nulls(jsonb_build_object('id',o.id,'queueEntryId',o.queue_entry_id,
    'customerId',o.customer_id,'customerName',u.name,'dealerId',o.dealer_id,'dealerName',d.name,'listingId',o.listing_id,
    'offeredPrice',o.offered_price,'originalPrice',o.original_price,'expiryDate',o.expires_at,'createdAt',o.created_at,
    'status',CASE WHEN o.status='pending' AND o.expires_at<=now() THEN 'expired' ELSE o.status END)) AS data
FROM bestbuy.offers o JOIN bestbuy.users u ON u.id=o.customer_id JOIN bestbuy.dealers d ON d.id=o.dealer_id`;
export const bookingView = `
SELECT b.id,b.customer_id,b.dealer_id,b.status,b.currency,
  b.details || jsonb_strip_nulls(jsonb_build_object('id',b.id,'customerId',b.customer_id,'customerName',u.name,
    'customerPhone',u.phone,'dealerId',b.dealer_id,'listingId',b.listing_id,'offerId',b.offer_id,
    'status',b.status,'bookingDate',b.booked_for,'lockedPrice',b.locked_price,'lockDurationHours',b.lock_hours,
    'priceLockedUntil',b.locked_until,'statusHistory',b.status_history,'createdAt',b.created_at,'updatedAt',b.updated_at,
    'listing',i.data,'dealer',i.data->'dealer')) AS data
FROM bestbuy.bookings b JOIN bestbuy.users u ON u.id=b.customer_id JOIN (${listingView}) i ON i.id=b.listing_id`;
