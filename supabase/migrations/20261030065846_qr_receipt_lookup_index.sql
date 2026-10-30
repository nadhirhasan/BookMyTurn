-- Cover receipt cleanup/lookups when a queue entry is linked or removed.
create index qr_receipt_queue_entry on bookmyturn_private.qr_receipts(queue_entry_id);
