# Brevo Email Templates Setup Guide

This guide provides the complete setup for all 22 email templates needed for the TradeLens email journey system. These templates must be created manually in your Brevo dashboard.

## Template Overview

The email journey system uses 22 templates organized into different categories:

### Welcome Series (Templates 5, 8-10)
- **Template 5**: Welcome Email
- **Template 8**: Getting Started Guide
- **Template 9**: Platform Tour
- **Template 10**: First Week Tips

### Trial Journey (Templates 6, 11-12, 14)
- **Template 11**: Trial Started
- **Template 12**: Trial Midpoint
- **Template 6**: Trial Ending Soon
- **Template 14**: Trial Expired

### Milestone Emails (Templates 15-18)
- **Template 15**: First Trade Completed
- **Template 16**: 10 Trades Milestone
- **Template 17**: 50 Trades Milestone
- **Template 18**: 100 Trades Milestone

### Engagement & Re-engagement (Templates 19-22)
- **Template 19**: Inactivity Reminder (7 days)
- **Template 20**: Inactivity Reminder (14 days)
- **Template 21**: Inactivity Reminder (30 days)
- **Template 22**: Win-back Campaign

### Subscription & Payment (Templates 23-26)
- **Template 23**: Subscription Activated
- **Template 24**: Payment Success
- **Template 25**: Payment Failed
- **Template 26**: Subscription Cancelled

### Educational Content (Templates 27-30)
- **Template 27**: Trading Tips Weekly
- **Template 28**: Market Analysis
- **Template 29**: Strategy Spotlight
- **Template 30**: Educational Resources

## Template Variables

All templates support the following dynamic variables:

### User Information
- `{{first_name}}` - User's first name
- `{{last_name}}` - User's last name
- `{{email}}` - User's email address

### Platform Links
- `{{app_url}}` - Main application URL
- `{{login_link}}` - Direct login link
- `{{upgrade_link}}` - Subscription upgrade link
- `{{support_link}}` - Support page link

### Trading Data (when available)
- `{{total_trades}}` - Total number of trades
- `{{win_rate}}` - Win rate percentage
- `{{profit_loss}}` - Total P&L
- `{{last_trade_date}}` - Date of last trade
- `{{favorite_strategy}}` - Most used strategy

### Journey Specific
- `{{trial_days_left}}` - Days remaining in trial
- `{{milestone_count}}` - Number for milestone emails
- `{{inactive_days}}` - Days since last activity

## Template Creation Steps

### 1. Access Brevo Templates
1. Log into your Brevo dashboard
2. Navigate to **Campaigns** > **Templates**
3. Click **Create a template**
4. Choose **Email template**

### 2. Template Configuration
For each template:
1. Set the template name (e.g., "TradeLens - Welcome Email")
2. Choose **Drag & drop editor** or **HTML editor**
3. Design your email using the variables listed above
4. Save the template and note the Template ID

### 3. Template Content Guidelines

#### Welcome Series Templates
**Template 7 - Welcome Email**
```html
<h1>Welcome to TradeLens, {{first_name}}!</h1>
<p>We're excited to have you join our community of traders.</p>
<p>Your trading journey starts here. Let's help you track, analyze, and improve your trades.</p>
<a href="{{login_link}}" class="btn">Get Started</a>
```

**Template 8 - Getting Started Guide**
```html
<h1>Your TradeLens Quick Start Guide</h1>
<p>Hi {{first_name}},</p>
<p>Ready to make the most of TradeLens? Here's how to get started:</p>
<ul>
  <li>Import your first trades</li>
  <li>Set up your trading goals</li>
  <li>Explore our analytics dashboard</li>
</ul>
<a href="{{app_url}}/dashboard" class="btn">Start Trading</a>
```

#### Milestone Templates
**Template 15 - First Trade Completed**
```html
<h1>🎉 Congratulations on your first trade!</h1>
<p>Hi {{first_name}},</p>
<p>You've just completed your first trade on TradeLens! This is the beginning of your data-driven trading journey.</p>
<p>Your trade details:</p>
<ul>
  <li>Total trades: {{total_trades}}</li>
  <li>Current P&L: {{profit_loss}}</li>
</ul>
<a href="{{app_url}}/analytics" class="btn">View Analytics</a>
```

#### Engagement Templates
**Template 19 - Inactivity Reminder (7 days)**
```html
<h1>We miss you, {{first_name}}!</h1>
<p>It's been {{inactive_days}} days since your last visit to TradeLens.</p>
<p>Your trading data is waiting for you:</p>
<ul>
  <li>{{total_trades}} trades tracked</li>
  <li>{{win_rate}}% win rate</li>
</ul>
<a href="{{login_link}}" class="btn">Continue Trading</a>
```

#### Subscription Templates
**Template 23 - Subscription Activated**
```html
<h1>Welcome to TradeLens Premium!</h1>
<p>Hi {{first_name}},</p>
<p>Your subscription is now active! You now have access to:</p>
<ul>
  <li>Advanced analytics</li>
  <li>Unlimited trade tracking</li>
  <li>Premium strategies</li>
  <li>Priority support</li>
</ul>
<a href="{{app_url}}/premium" class="btn">Explore Premium Features</a>
```

## Template ID Mapping

After creating each template in Brevo, update the following mapping in your code:

```javascript
const TEMPLATE_IDS = {
  // Welcome Series
  welcome: 5,
  getting_started: 8,
  platform_tour: 9,
  first_week_tips: 10,
  
  // Trial Journey
  trial_started: 11,
  trial_midpoint: 12,
  trial_ending: 6,
  trial_expired: 14,
  
  // Milestones
  first_trade: 15,
  ten_trades: 16,
  fifty_trades: 17,
  hundred_trades: 18,
  
  // Engagement
  inactive_7_days: 19,
  inactive_14_days: 20,
  inactive_30_days: 21,
  winback: 22,
  
  // Subscription
  subscription_active: 23,
  payment_success: 24,
  payment_failed: 25,
  subscription_cancelled: 26,
  
  // Educational
  trading_tips: 27,
  market_analysis: 28,
  strategy_spotlight: 29,
  educational_resources: 30
};
```

## Environment Variables

Ensure these environment variables are set in your Supabase project:

```bash
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=TradeLens
APP_URL=https://yourdomain.com
```

## Testing Templates

After creating templates, test them using the email journey functions:

```javascript
// Test welcome email
fetch('/functions/v1/send-journey-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'test-user-id',
    email_type: 'welcome',
    template_id: 7,
    template_data: {
      first_name: 'Test',
      total_trades: 0
    }
  })
});
```

## Best Practices

1. **Consistent Branding**: Use consistent colors, fonts, and styling across all templates
2. **Mobile Responsive**: Ensure templates look good on mobile devices
3. **Clear CTAs**: Include clear call-to-action buttons in each email
4. **Personalization**: Use the available variables to personalize content
5. **Testing**: Test each template with sample data before going live
6. **Unsubscribe**: Include unsubscribe links in all marketing emails
7. **Compliance**: Ensure templates comply with email marketing regulations

## Troubleshooting

### Template Not Found Error
- Verify the template ID exists in Brevo
- Check that the template is published/active
- Ensure the API key has access to the template

### Variable Not Rendering
- Check variable spelling and case sensitivity
- Ensure the variable is being passed in template_data
- Verify the variable exists in the user's data

### Email Not Sending
- Check Brevo API key permissions
- Verify sender email is authenticated in Brevo
- Check user email preferences and opt-out status

## Support

For issues with template creation or email delivery:
1. Check Brevo documentation
2. Review Supabase function logs
3. Test with the provided test scripts
4. Contact Brevo support for API-related issues

---

**Note**: This setup replaces the previous campaign-based approach with a simpler template-based system that's easier to manage and maintain.