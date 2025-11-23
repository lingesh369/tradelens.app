# TradeLens Edge Functions Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                    https://your-domain.com                       │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ API Calls                          │ Webhooks
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                       │
│          https://tzhhxeyisppkzyjacodu.supabase.co              │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Payment APIs    │  │   AI Functions   │  │   Webhooks   │ │
│  │                  │  │                  │  │              │ │
│  │ • create-order   │  │ • ai-chat        │  │ • cashfree   │ │
│  │ • process-conf   │  │ • intent-class   │  │ • nowpayments│ │
│  │ • check-status   │  │ • context-fetch  │  │ • paypal     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Shared Utilities (_shared/)                  │  │
│  │                                                            │  │
│  │  • auth.ts - JWT verification                            │  │
│  │  • cors.ts - CORS handling                               │  │
│  │  • response.ts - Response helpers                        │  │
│  │  • payment-providers/ - Payment integrations             │  │
│  │  • ai/ - OpenAI integration                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬──────────────────────┬──────────────────┬─────────────┘
         │                      │                  │
         ▼                      ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Payment APIs   │  │   OpenAI API     │  │   Supabase DB   │
│                 │  │                  │  │                 │
│ • Cashfree      │  │ • GPT-4          │  │ • payments      │
│ • PayPal        │  │ • GPT-3.5        │  │ • subscriptions │
│ • NOWPayments   │  │ • Vision         │  │ • profiles      │
└─────────────────┘  └──────────────────┘  └─────────────────┘
```

## Payment Flow Architecture

```
User Initiates Payment
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Frontend: Select Plan & Payment Method                    │
└───────────────────────────────────────────────────────────┘
        │
        ├─── Cashfree ────┐
        ├─── PayPal ──────┤
        └─── Crypto ──────┤
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ Edge Function: create-{provider}-order                    │
│                                                            │
│ 1. Verify user authentication                             │
│ 2. Validate input (planId, amount, etc.)                  │
│ 3. Call payment provider API                              │
│ 4. Return order/invoice details                           │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Payment Provider: User completes payment                  │
└───────────────────────────────────────────────────────────┘
        │
        ├─── Webhook ─────┐
        └─── Redirect ────┤
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ Edge Function: {provider}-webhook OR                      │
│                process-{provider}-confirmation            │
│                                                            │
│ 1. Verify webhook signature (webhooks only)               │
│ 2. Get payment status from provider                       │
│ 3. Update payment record in database                      │
│ 4. If successful: Activate subscription                   │
│ 5. Calculate subscription dates                           │
│ 6. Update subscriptions table                             │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Database: Subscription Active                             │
│                                                            │
│ • payments.status = 'completed'                           │
│ • subscriptions.status = 'active'                         │
│ • subscriptions.current_period_end = calculated           │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Frontend: Show success & redirect to dashboard           │
└───────────────────────────────────────────────────────────┘
```

## AI Chat Flow Architecture

```
User Sends Message
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Frontend: AI Chat Interface                               │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Edge Function: ai-intent-classifier                       │
│                                                            │
│ 1. Analyze user message                                   │
│ 2. Classify intent:                                       │
│    • trade_analysis                                       │
│    • strategy_review                                      │
│    • general_question                                     │
│    • chart_analysis                                       │
│ 3. Extract entities (dates, symbols, etc.)               │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Edge Function: ai-context-fetcher                         │
│                                                            │
│ Based on intent, fetch relevant data:                     │
│ • Recent trades                                           │
│ • Trading statistics                                      │
│ • Active strategies                                       │
│ • User profile                                            │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Edge Function: ai-chat                                    │
│                                                            │
│ 1. Build context-aware prompt                             │
│ 2. Include conversation history                           │
│ 3. Call OpenAI API (GPT-4)                               │
│ 4. Return AI response                                     │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ Frontend: Display AI Response                             │
└───────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: CORS Protection
├─ All functions include CORS headers
├─ OPTIONS requests handled
└─ Origin validation

Layer 2: Authentication
├─ JWT token verification (verifyAuth)
├─ User identity extraction
├─ Session validation
└─ Supabase Auth integration

Layer 3: Authorization
├─ User-specific data access
├─ RLS policies in database
└─ Service role for admin operations

Layer 4: Input Validation
├─ Required field checks
├─ Type validation
├─ Sanitization
└─ Error handling

Layer 5: Webhook Security
├─ Signature verification (Cashfree)
├─ Timestamp validation
├─ Replay attack prevention
└─ IP whitelisting (optional)

Layer 6: Secrets Management
├─ Environment variables
├─ No hardcoded credentials
├─ Supabase secrets vault
└─ Separate sandbox/production keys
```

## Data Flow

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ 1. User action (payment, chat, etc.)
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              Edge Function (Entry Point)                  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 1. Handle CORS (if OPTIONS request)             │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 2. Verify Authentication (JWT)                  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 3. Validate Input                               │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 4. Business Logic                               │    │
│  │    • Call external APIs                         │    │
│  │    • Process data                               │    │
│  │    • Update database                            │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 5. Return Response                              │    │
│  │    • Success: 200 with data                     │    │
│  │    • Error: 4xx/5xx with message                │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
       │
       │ 2. Response
       │
       ▼
┌──────────────┐
│   Frontend   │
│              │
│ • Update UI  │
│ • Show data  │
│ • Handle err │
└──────────────┘
```

## Shared Utilities Architecture

```
_shared/
│
├── auth.ts
│   ├── verifyAuth(req) → { user, supabaseClient }
│   └── createServiceClient() → supabaseClient
│
├── cors.ts
│   ├── corsHeaders (object)
│   └── handleCors(req) → Response | null
│
├── response.ts
│   ├── successResponse(data, status) → Response
│   └── errorResponse(message, status, details) → Response
│
├── payment-providers/
│   ├── cashfree.ts
│   │   ├── createCashfreeOrder(orderData)
│   │   ├── getCashfreeOrderStatus(orderId)
│   │   └── verifyCashfreeWebhook(timestamp, body, signature)
│   │
│   ├── paypal.ts
│   │   ├── createPayPalOrder(amount, currency, planId)
│   │   ├── capturePayPalOrder(orderId)
│   │   └── getPayPalOrderDetails(orderId)
│   │
│   └── nowpayments.ts
│       ├── createNowPaymentsInvoice(invoiceData)
│       ├── getNowPaymentsInvoiceStatus(invoiceId)
│       └── getAvailableCurrencies()
│
└── ai/
    └── openai.ts
        ├── createChatCompletion(messages, model, temp, maxTokens)
        └── analyzeImage(imageUrl, prompt)
```

## Deployment Architecture

```
Local Development
├── supabase start (local Supabase)
├── supabase functions serve (local functions)
└── Test with localhost URLs

        │
        │ Deploy
        ▼

Production
├── supabase functions deploy (deploy all)
├── supabase secrets set (set env vars)
└── Configure webhooks in provider dashboards

        │
        │ Monitor
        ▼

Monitoring
├── supabase functions logs <name> (view logs)
├── Supabase Dashboard (metrics)
└── Error tracking (alerts)
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Technology Stack                      │
├─────────────────────────────────────────────────────────┤
│ Runtime:        Deno (Edge Runtime)                     │
│ Language:       TypeScript                              │
│ Framework:      Supabase Edge Functions                 │
│ Database:       PostgreSQL (Supabase)                   │
│ Authentication: Supabase Auth (JWT)                     │
│ AI:             OpenAI (GPT-4, GPT-3.5, Vision)        │
│ Payments:       Cashfree, PayPal, NOWPayments          │
│ Deployment:     Supabase CLI                            │
│ Monitoring:     Supabase Dashboard + Logs               │
└─────────────────────────────────────────────────────────┘
```

## Best Practices Implemented

✅ **Code Organization**
- Shared utilities for reusability
- Clear separation of concerns
- Modular architecture

✅ **Security**
- JWT authentication
- Webhook signature verification
- Environment variable management
- Input validation

✅ **Error Handling**
- Try-catch blocks
- Proper error responses
- Detailed logging
- User-friendly messages

✅ **Performance**
- Efficient database queries
- Caching (PayPal tokens)
- Minimal dependencies
- Fast response times

✅ **Maintainability**
- TypeScript for type safety
- Consistent code style
- Comprehensive documentation
- Easy to test and debug

✅ **Scalability**
- Stateless functions
- Horizontal scaling ready
- Database connection pooling
- Rate limiting ready
