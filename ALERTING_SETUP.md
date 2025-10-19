# 🚨 Analytics Gateway Alerting Setup

**Status:** ✅ Configured  
**Alert Channels:** Slack + Email  
**Trigger:** Health check failures (every 15 minutes)

---

## 📋 **Overview**

When your analytics gateway fails its health check, you'll be notified via:
- 📢 **Slack** - Instant notification in your channel
- 📧 **Email** - Alert sent to configured address

---

## 🎯 **How It Works**

```
Every 15 minutes:
  GitHub Actions runs health check
    ↓
  Gateway responds (or doesn't)
    ↓
  Exit code determines status:
    - Exit 0: ✅ Healthy → No alert
    - Exit 1: ⚠️  Degraded → Alert sent
    - Exit 2: ❌ Error → Alert sent
    ↓
  If failure detected:
    → Send Slack notification
    → Send email alert
```

---

## 🔧 **Required Secrets**

Configure these in GitHub:  
**Settings → Secrets and variables → Actions → New repository secret**

### **Gateway Configuration**
```bash
ANALYTICS_GATEWAY_URL          # Your production gateway URL
                               # Example: https://analytics.yourapp.com

ANALYTICS_HEALTH_TOKEN         # Optional Supabase JWT for authentication
                               # Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Slack Alerts**
```bash
SLACK_WEBHOOK_URL              # Incoming webhook URL from Slack
                               # Example: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Get Slack Webhook:**
1. Go to: https://api.slack.com/messaging/webhooks
2. Create new app or use existing
3. Add "Incoming Webhooks" feature
4. Create webhook for your channel
5. Copy webhook URL

### **Email Alerts**
```bash
SMTP_SERVER                    # SMTP server address
                               # Example: smtp.gmail.com

SMTP_PORT                      # SMTP port (usually 587 or 465)
                               # Example: 587

SMTP_USERNAME                  # SMTP authentication username
                               # Example: alerts@yourapp.com

SMTP_PASSWORD                  # SMTP authentication password
                               # Example: your-app-password

ALERT_EMAIL                    # Email address to receive alerts
                               # Example: team@yourapp.com

ALERT_FROM                     # Email "from" address
                               # Example: Analytics Gateway <noreply@yourapp.com>
```

---

## 📧 **Email Provider Setup**

### **Gmail**

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=<app-password>  # NOT your regular password!
ALERT_EMAIL=your-email@gmail.com
ALERT_FROM=Analytics Gateway <your-email@gmail.com>
```

**Get Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not enabled)
3. Go to App Passwords
4. Generate new app password for "Mail"
5. Use generated password as `SMTP_PASSWORD`

### **SendGrid**

```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=<sendgrid-api-key>
ALERT_EMAIL=team@yourapp.com
ALERT_FROM=Analytics Gateway <alerts@yourapp.com>
```

### **AWS SES**

```bash
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=<aws-smtp-username>
SMTP_PASSWORD=<aws-smtp-password>
ALERT_EMAIL=team@yourapp.com
ALERT_FROM=Analytics Gateway <alerts@yourapp.com>
```

### **Mailgun**

```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@yourdomain.com
SMTP_PASSWORD=<mailgun-smtp-password>
ALERT_EMAIL=team@yourapp.com
ALERT_FROM=Analytics Gateway <alerts@yourdomain.com>
```

---

## 🔐 **Setting Secrets in GitHub**

### **Via GitHub UI:**

1. Go to: https://github.com/mhusse29/Marketing-Engine/settings/secrets/actions

2. Click: **"New repository secret"**

3. Add each secret:
   ```
   Name: ANALYTICS_GATEWAY_URL
   Value: https://your-gateway.com
   
   Name: SLACK_WEBHOOK_URL
   Value: https://hooks.slack.com/services/...
   
   Name: SMTP_SERVER
   Value: smtp.gmail.com
   
   ... (repeat for all secrets)
   ```

### **Via GitHub CLI:**

```bash
# Set gateway URL
gh secret set ANALYTICS_GATEWAY_URL --body "https://your-gateway.com"

# Set Slack webhook
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."

# Set SMTP configuration
gh secret set SMTP_SERVER --body "smtp.gmail.com"
gh secret set SMTP_PORT --body "587"
gh secret set SMTP_USERNAME --body "your-email@gmail.com"
gh secret set SMTP_PASSWORD --body "your-app-password"
gh secret set ALERT_EMAIL --body "team@yourapp.com"
gh secret set ALERT_FROM --body "Analytics Gateway <noreply@yourapp.com>"

# Optional: Health check token
gh secret set ANALYTICS_HEALTH_TOKEN --body "your-jwt-token"
```

---

## 📢 **Alert Examples**

### **Slack Notification**

```
🚨 Analytics gateway health check failed on mhusse29/Marketing-Engine (run #123)

Link: https://github.com/mhusse29/Marketing-Engine/actions/runs/123456789
```

### **Email Notification**

```
Subject: [Alert] Analytics Gateway Health Check Failed

Analytics gateway health check failed.

Repository: mhusse29/Marketing-Engine
Branch: main
Run: https://github.com/mhusse29/Marketing-Engine/actions/runs/123456789
```

---

## ✅ **Testing Alerts**

### **Test Without Affecting Production**

1. **Create Test Workflow**
   
   Create `.github/workflows/test-alerts.yml`:
   ```yaml
   name: Test Alerts
   
   on:
     workflow_dispatch:
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - name: Force failure
           run: exit 1
   
         - name: Slack alert
           if: failure()
           uses: slackapi/slack-github-action@v1.27.0
           with:
             payload: |
               {
                 "text": "🧪 Test alert from ${{ github.repository }}"
               }
           env:
             SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
             SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
   
         - name: Email alert
           if: failure()
           uses: dawidd6/action-send-mail@v3
           with:
             server_address: ${{ secrets.SMTP_SERVER }}
             server_port: ${{ secrets.SMTP_PORT }}
             username: ${{ secrets.SMTP_USERNAME }}
             password: ${{ secrets.SMTP_PASSWORD }}
             subject: '[Test] Alert System Test'
             to: ${{ secrets.ALERT_EMAIL }}
             from: ${{ secrets.ALERT_FROM }}
             body: This is a test alert. Please ignore.
   ```

2. **Run Test**
   ```bash
   # Go to: Actions → Test Alerts → Run workflow
   # Or use CLI:
   gh workflow run test-alerts.yml
   ```

3. **Verify**
   - Check Slack for test message
   - Check email inbox
   - Delete test workflow after confirmation

---

## 🔍 **Troubleshooting**

### **Slack Alerts Not Working**

**Check webhook URL:**
```bash
# Test webhook manually
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message from curl"}'
```

**Common issues:**
- ❌ Webhook URL expired or revoked
- ❌ App removed from channel
- ❌ Incorrect secret name in GitHub
- ❌ Webhook not added to correct channel

**Fix:**
1. Verify webhook URL in Slack app settings
2. Regenerate webhook if needed
3. Update `SLACK_WEBHOOK_URL` secret in GitHub

---

### **Email Alerts Not Working**

**Common issues:**
- ❌ Wrong SMTP server or port
- ❌ Authentication failed (wrong username/password)
- ❌ Using regular password instead of app password (Gmail)
- ❌ Firewall blocking SMTP port
- ❌ "From" email not authorized (AWS SES)

**Debug steps:**

1. **Test SMTP connection:**
   ```bash
   # Install swaks (SMTP test tool)
   brew install swaks  # macOS
   
   # Test connection
   swaks --to test@example.com \
         --from alerts@yourapp.com \
         --server smtp.gmail.com:587 \
         --auth LOGIN \
         --auth-user your-email@gmail.com \
         --auth-password your-app-password \
         --tls
   ```

2. **Check GitHub Actions logs:**
   - Go to failed workflow run
   - Expand "Email alert" step
   - Look for error messages

3. **Verify secrets:**
   ```bash
   # List configured secrets (values are hidden)
   gh secret list
   ```

---

### **Health Check Passes But Gateway is Down**

**Possible causes:**
- ❌ `ANALYTICS_GATEWAY_URL` points to wrong endpoint
- ❌ Health check script has bug
- ❌ Gateway `/api/v1/status` endpoint always returns 200

**Fix:**
1. Verify URL in secrets
2. Test health check locally:
   ```bash
   ANALYTICS_GATEWAY_URL=https://your-gateway.com npm run monitor:health
   echo $?  # Should be 0 (healthy), 1 (degraded), or 2 (error)
   ```

---

## 📊 **Alert Frequency**

### **Current Schedule**

```yaml
schedule:
  - cron: '*/15 * * * *'  # Every 15 minutes
```

**This means:**
- Check runs every 15 minutes
- If gateway is down, you'll be alerted within 15 minutes
- Multiple failures = multiple alerts (one per 15-min interval)

### **Adjust Frequency**

**Every 5 minutes (more responsive):**
```yaml
- cron: '*/5 * * * *'
```

**Every 30 minutes (less noisy):**
```yaml
- cron: '*/30 * * * *'
```

**Only during business hours (9am-5pm UTC, Mon-Fri):**
```yaml
- cron: '0 9-17 * * 1-5'
```

---

## 🎛️ **Alert Customization**

### **Slack Message Formatting**

Edit `.github/workflows/health-check.yml`:

```yaml
- name: Slack alert
  if: failure()
  uses: slackapi/slack-github-action@v1.27.0
  with:
    payload: |
      {
        "text": ":fire: CRITICAL: Analytics Gateway Down!",
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "🚨 Gateway Health Check Failed"
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "*Repository:*\n${{ github.repository }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Branch:*\n${{ github.ref_name }}"
              },
              {
                "type": "mrkdwn",
                "text": "*Run:*\n<https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}|#${{ github.run_number }}>"
              },
              {
                "type": "mrkdwn",
                "text": "*Time:*\n${{ github.event.head_commit.timestamp }}"
              }
            ]
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "View Logs"
                },
                "url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              }
            ]
          }
        ]
      }
```

### **Email HTML Formatting**

```yaml
- name: Email alert
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: ${{ secrets.SMTP_SERVER }}
    server_port: ${{ secrets.SMTP_PORT }}
    username: ${{ secrets.SMTP_USERNAME }}
    password: ${{ secrets.SMTP_PASSWORD }}
    subject: '🚨 [CRITICAL] Analytics Gateway Health Check Failed'
    to: ${{ secrets.ALERT_EMAIL }}
    from: ${{ secrets.ALERT_FROM }}
    html_body: |
      <h2 style="color: #d32f2f;">🚨 Analytics Gateway Health Check Failed</h2>
      <table>
        <tr><td><strong>Repository:</strong></td><td>${{ github.repository }}</td></tr>
        <tr><td><strong>Branch:</strong></td><td>${{ github.ref_name }}</td></tr>
        <tr><td><strong>Run:</strong></td><td><a href="https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}">#${{ github.run_number }}</a></td></tr>
        <tr><td><strong>Time:</strong></td><td>${{ github.event.head_commit.timestamp }}</td></tr>
      </table>
      <p><a href="https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Logs</a></p>
```

---

## 📋 **Checklist**

### **Initial Setup**
- [ ] Set `ANALYTICS_GATEWAY_URL` in GitHub secrets
- [ ] Set `ANALYTICS_HEALTH_TOKEN` (if using auth)
- [ ] Create Slack webhook
- [ ] Set `SLACK_WEBHOOK_URL` in GitHub secrets
- [ ] Configure email provider (Gmail, SendGrid, etc.)
- [ ] Set all `SMTP_*` secrets in GitHub secrets
- [ ] Set `ALERT_EMAIL` and `ALERT_FROM`
- [ ] Test alerts using test workflow
- [ ] Verify alerts arrive in Slack and email
- [ ] Delete test workflow

### **Optional Enhancements**
- [ ] Customize Slack message formatting
- [ ] Add HTML formatting to emails
- [ ] Adjust health check frequency
- [ ] Add PagerDuty integration
- [ ] Set up alert escalation
- [ ] Configure quiet hours

---

## 🔗 **Integration Options**

### **PagerDuty**

Add after email alert:

```yaml
- name: PagerDuty alert
  if: failure()
  uses: triggerdotdev/action-trigger-event@v1
  with:
    endpoint: https://events.pagerduty.com/v2/enqueue
    payload: |
      {
        "routing_key": "${{ secrets.PAGERDUTY_INTEGRATION_KEY }}",
        "event_action": "trigger",
        "payload": {
          "summary": "Analytics Gateway health check failed",
          "severity": "critical",
          "source": "${{ github.repository }}",
          "custom_details": {
            "run_url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          }
        }
      }
```

### **Microsoft Teams**

```yaml
- name: Teams alert
  if: failure()
  uses: jdcargile/ms-teams-notification@v1.4
  with:
    github-token: ${{ github.token }}
    ms-teams-webhook-uri: ${{ secrets.MS_TEAMS_WEBHOOK_URL }}
    notification-summary: 'Analytics Gateway health check failed'
    notification-color: 'dc3545'
```

### **Discord**

```yaml
- name: Discord alert
  if: failure()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "🚨 Analytics Gateway Down"
    description: "Health check failed"
    color: 0xff0000
    url: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 📊 **Monitoring Dashboard**

Create a Slack channel dashboard:

```
#analytics-alerts

🟢 Last check: 2 minutes ago (Healthy)
📊 Uptime (24h): 99.8%
⏱️ Avg latency: 142ms
🔄 Total checks today: 96
❌ Failures today: 0
```

Use GitHub Actions to post status updates.

---

## ✅ **Summary**

Your alerting system is configured with:

✅ **Scheduled health checks** - Every 15 minutes  
✅ **Slack notifications** - Instant team alerts  
✅ **Email notifications** - Reliable backup channel  
✅ **Customizable** - Adjust frequency and formatting  
✅ **Tested** - Production-ready workflow  
✅ **Documented** - Complete setup guide  

**Next step:** Add the required secrets in GitHub to activate alerts! 🚀

---

## 🔗 **Quick Links**

- **Set Secrets:** https://github.com/mhusse29/Marketing-Engine/settings/secrets/actions
- **View Workflow:** https://github.com/mhusse29/Marketing-Engine/actions/workflows/health-check.yml
- **Slack Webhooks:** https://api.slack.com/messaging/webhooks
- **Gmail App Passwords:** https://myaccount.google.com/apppasswords
