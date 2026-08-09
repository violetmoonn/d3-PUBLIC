# Firestore Security Specification - D3COMPOSURE Storefront

## 1. Data Invariants
- Products: Must have a name, category, and non-negative price. Visible products are typically managed by admins.
- User Submissions: Authenticated users can submit products with a 'pending' status and `is_visible: false`.
- Orders: Must have valid customer email and total amount.
- Logs/Transmissions: Primarily written by the system or public users (transmissions).
- Settings/Announcements: Read by everyone, write only by Admin.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Malicious ID**: Attempt to create a product with a 2KB ID string.
2. **Identity Spoof**: Authenticated User A tries to update Product submitted by User B.
3. **Privilege Escalation**: User tries to update their own `role` to 'admin' in `/users/`.
4. **Invalid Product Type**: Creating a product with `price: "free"` (string instead of number).
5. **Visible Submission**: User tries to create a submission with `is_visible: true`.
6. **Phantom Fields**: Adding a `hidden_backdoor: true` field to a product.
7. **Bypassing Status**: Updating a pending submission directly to `status: 'approved'`.
8. **Negative Price**: Creating a product with `price: -100`.
9. **Log Forgery**: Overwriting existing logs via a guessable ID.
10. **Settings Hijack**: Public user trying to change the `site_title`.
11. **Order Modification**: Trying to change the `total_amount` of an existing order.
12. **DRIVE_LINKS Poisoning**: Injecting non-Drive URLs into the `drive_links` collection.

## 3. Test Runner (Draft)
The following tests in `firestore.rules.test.ts` will verify these:
- `test('disallows non-admin to update settings', ...)`
- `test('disallows non-admin to approve submissions', ...)`
- `test('disallows invalid product schema', ...)`
- etc.
