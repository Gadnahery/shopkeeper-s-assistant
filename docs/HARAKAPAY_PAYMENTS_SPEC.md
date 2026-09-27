# HARAKAPAY AUTOMATED PAYMENTS & COMPLIANCE SPECIFICATION

## CRITICAL PRODUCT RULE
- **Payment USSD push is ONLY for subscriptions**, located on `/billing`.
- **In POS (`/sales`), payment is RECORD-ONLY**: Cash, M-Pesa, Split, Credit. Customer sales never trigger automated USSD pushes from POS.

---

## 1. HARAKAPAY API DETAILS & CREDENTIALS
- **Base URL**: `https://harakapay.net`
- **Active API Key**: `hpk_fec3c73ab629e558692c102fda8f5e14b622dcf353d0fb68`
- **Security Rule**: The API key must NEVER touch client-side code. All calls occur inside Supabase Edge Functions using secrets (`HARAKAPAY_API_KEY`).

### Endpoints:
1. **Initiate Payment (Collect)**
   `POST https://harakapay.net/api/v1/collect`
   Headers:
   ```
   Content-Type: application/json
   X-API-Key: hpk_...
   ```
   Request Body:
   ```json
   {
     "phone": "0712345678",
     "amount": 25000,
     "description": "WiseCash Monthly Subscription",
     "webhook_url": "https://ureibirtkbyzfauoepah.supabase.co/functions/v1/harakapay-webhook"
   }
   ```
   *Note*: Phone number MUST be formatted in local Tanzanian format starting with `0` (e.g. `07XXXXXXXX` or `06XXXXXXXX`).
   
   Response:
   ```json
   {
     "success": true,
     "message": "USSD push sent to phone",
     "order_id": "HP1706123456789",
     "amount": 25000,
     "net_amount": 23525,
     "fee": 1475
   }
   ```

2. **Check Payment Status**
   `GET https://harakapay.net/api/v1/status/{order_id}`
   Headers:
   ```
   X-API-Key: hpk_...
   ```
   Response:
   ```json
   {
     "success": true,
     "payment": {
       "order_id": "HP1706123456789",
       "status": "completed",
       "amount": 25000,
       "net_amount": 23525,
       "fee_amount": 1475,
       "created_at": "2026-09-27T12:00:00Z",
       "completed_at": "2026-09-27T12:01:30Z"
     }
   }
   ```
   *Critical*: The payment details are nested inside `payment`. The code must inspect `data.payment.status`, `data.payment.fee_amount`, `data.payment.net_amount`.

3. **Check Balance**
   `GET https://harakapay.net/api/v1/balance`
   Headers:
   ```
   X-API-Key: hpk_...
   ```

---

## 2. EDGE FUNCTIONS SPECIFICATION

### A. `harakapay-initiate-subscription`
1. Verifies caller session and that user has `owner` or `manager` role in their shop.
2. Normalizes phone number into local Tanzanian format `0XXXXXXXXX`.
3. Inserts a row in `subscription_payments` with `provider: 'harakapay'`, `status: 'pending'`, `amount: 25000`.
4. Calls `POST /api/v1/collect` on HarakaPay with `webhook_url`.
5. Updates row with `order_id`, `fee_amount`, `net_amount`.
6. Returns clean operator message to client (does not leak raw payload).

### B. `harakapay-webhook`
1. HarakaPay sends unsigned POST request on completion or failure.
2. Reads `order_id` from body.
3. **Independently verifies status** by calling `GET /api/v1/status/{order_id}` with `HARAKAPAY_API_KEY`.
4. If verified `payment.status === 'completed'`:
   - Calls shared `applySubscriptionPaymentSuccess` atomic function.
   - Extends `shop_subscriptions.current_period_ends_at` by 30 days and sets `status = 'active'`.
   - Sets `subscription_payments.status = 'success'`.
   - Sends notification to shop owner.
5. If verified `payment.status === 'failed'`:
   - Updates `subscription_payments.status = 'failed'` with clear reason.
6. Always returns HTTP 200 to HarakaPay so delivery is acknowledged.

---

## 3. CLIENT BILLING UX (`src/pages/Billing.tsx`)
- Independent, clean page.
- Current status card with days remaining and monthly amount.
- Single payment input: Phone number.
- Button: `Pay TZS 25,000`.
- Realtime listening on `subscription_payments`:
  - `PaymentWaiting`: subtle pulsing loader, instructions to approve USSD prompt on phone.
  - `PaymentSuccess`: green confirmation, updated expiration date, continue button.
  - `PaymentFailed`: clear human-readable error (e.g., timeout, cancelled, insufficient balance), "You have not been charged", retry button without restarting the flow.

---

## 4. TANZANIA PDPA COMPLIANCE & LEGAL
- **Explicit Consent**: Required checkbox on `SignupPage.tsx` ("I agree to the Terms of Service and Privacy Policy"), disabled submit button until checked. Stores `terms_accepted_at` timestamp.
- **Privacy Policy (`/privacy-policy`)**: Details data collection (account info, shop data, mobile money phone numbers), storage with Supabase, payment processing with HarakaPay, rights to data deletion under Tanzania PDPA 2022.
- **Terms of Service (`/terms-of-service`)**: Subscription terms (TZS 25,000/mo), service availability, acceptable use.
- **Cookie & Local Storage Banner (`CookieConsentBanner.tsx`)**: Transparent notice explaining local storage for offline sync and session persistence.
