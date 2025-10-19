# 📊 KPI Definitions & Metrics Guide

## Complete reference for all analytics metrics and calculations

---

## 🎯 Tier 1: Mission Critical KPIs

### 1. **System Health Score**
**Formula:**
```
Health Score = Uptime% × Speed Factor
Speed Factor = 1 / (1 + P95_Latency_seconds)

Example: 99% uptime × (1 / (1 + 2.5)) = 99 × 0.286 = 28.3
Target: > 80
```

**Components:**
- Uptime % = (Successful Requests / Total Requests) × 100
- P95 Latency = 95th percentile response time in seconds

**Alert Thresholds:**
- 🟢 Green: > 80
- 🟡 Yellow: 50-80
- 🔴 Red: < 50

**SQL Query:**
```sql
SELECT * FROM get_health_score('1 hour');
```

---

### 2. **Error Rate**
**Formula:**
```
Error Rate % = (Failed Requests / Total Requests) × 100
```

**Alert Thresholds:**
- 🟢 Green: < 1%
- 🟡 Yellow: 1-5%
- 🔴 Red: > 5%

**Breakdown:** Track by service type, provider, and time

---

### 3. **Active Users (DAU/MAU/WAU)**
**Definitions:**
- **DAU** (Daily Active Users): Unique users in last 24 hours
- **WAU** (Weekly Active Users): Unique users in last 7 days
- **MAU** (Monthly Active Users): Unique users in last 30 days

**Key Ratio:**
```
DAU/MAU Ratio = DAU / MAU
Target: > 0.20 (20% daily engagement)
```

**SQL:**
```sql
SELECT 
  COUNT(DISTINCT user_id) as dau
FROM api_usage
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

---

### 4. **Revenue vs Cost Ratio**
**Formula:**
```
Margin % = ((Revenue - Cost) / Revenue) × 100
```

**Components:**
- Revenue = Sum of subscription costs
- Cost = Sum of API usage costs

**Alert Thresholds:**
- 🟢 Green: > 70% margin
- 🟡 Yellow: 40-70% margin
- 🔴 Red: < 40% margin

---

### 5. **Average Response Time (P95 Latency)**
**Definition:** Time taken for 95% of requests to complete

**Alert Thresholds:**
- 🟢 Green: < 3 seconds
- 🟡 Yellow: 3-10 seconds
- 🔴 Red: > 10 seconds

**Track:** By service type and provider

---

## 📈 Tier 2: Performance KPIs

### 6. **Latency Percentiles**
- **P50 (Median):** 50% of requests faster than this
- **P90:** 90% of requests faster than this
- **P95:** 95% of requests faster than this
- **P99:** 99% of requests faster than this

**Why Track Multiple?**
- P50 = Typical user experience
- P95 = User experience for most
- P99 = Worst-case scenarios

---

### 7. **API Success Rate**
**Formula:**
```
Success Rate % = (Successful Requests / Total Requests) × 100
```

**Target:** > 99%

**Track:** Per service, per provider

---

### 8. **Provider Reliability Score**
**Formula:**
```
Reliability = (Success Rate × 0.5) + ((1 - Normalized_Latency) × 0.3) + (Cost_Efficiency × 0.2)
```

**Components:**
- Success Rate: % of successful requests
- Normalized Latency: Latency relative to best provider
- Cost Efficiency: Inverse of cost per request

---

### 9. **Token Efficiency Ratio**
**Formula:**
```
Token Efficiency = Output Tokens / Input Tokens
```

**Interpretation:**
- Higher = More output generated per input
- Track by model to identify most efficient models

---

### 10. **Cost Per Successful Generation**
**Formula:**
```
Cost Per Success = Total Cost / Successful Requests
```

**Track:** By service type and provider

---

### 11. **Rate Limit Hit Rate**
**Formula:**
```
Hit Rate % = (Rate Limit Hits / Total Requests) × 100
```

**Target:** < 1%

---

## 💰 Tier 3: Business & Financial KPIs

### 12. **Monthly Recurring Revenue (MRR)**
**Formula:**
```
MRR = Sum of all active subscription monthly costs
```

**Growth Metrics:**
- MRR Growth Rate = ((MRR_current - MRR_previous) / MRR_previous) × 100
- Target: > 10% month-over-month

---

### 13. **Customer Acquisition Cost (CAC)**
**Formula:**
```
CAC = Total Marketing & Sales Costs / New Customers Acquired
```

**Note:** Requires marketing cost tracking

---

### 14. **Lifetime Value (LTV)**
**Formula:**
```
LTV = Average Revenue Per User × Average Customer Lifespan

Simplified: LTV = Average lifetime_cost from user_subscriptions
```

**Key Ratio:**
```
LTV:CAC Ratio = LTV / CAC
Target: > 3:1
```

---

### 15. **Churn Rate**
**Formula:**
```
Monthly Churn % = (Customers Lost This Month / Customers at Start of Month) × 100
```

**Definition:** Users who were active but haven't used the service in 30+ days

**Target:** < 5% monthly

---

### 16. **Churn Risk Score**
**Formula:**
```
Churn Score = (Days_Inactive × 5) + 
              (Usage_Decline_Penalty) + 
              (Error_Count × 2) - 
              (High_Engagement_Bonus)

Where:
- Usage_Decline_Penalty = 20 if current week < 50% of previous week
- High_Engagement_Bonus = 20 if user is near limits (engaged)
```

**Categories:**
- 0-25: Low Risk
- 26-50: Medium Risk
- 51-75: High Risk
- 76-100: Critical Risk

---

### 17. **Feature Adoption Rate**
**Formula:**
```
Adoption Rate % = (Users Using Feature / Total Active Users) × 100
```

**Track:** For each service type

---

### 18. **Plan Conversion Rate**
**Formula:**
```
Conversion Rate % = (Paid Subscribers / Total Users) × 100
```

**Funnel:**
- Free → Basic: X%
- Basic → Premium: X%

---

## 🔧 Tier 4: Operational KPIs

### 19. **Request Rate (Throughput)**
**Formula:**
```
Requests Per Minute = Total Requests / Time Period (minutes)
```

**Track:** Real-time and historical trends

---

### 20. **Cache Hit Rate**
**Formula:**
```
Cache Hit Rate % = (Cache Hits / Total Requests) × 100
```

**Target:** > 80% (if caching is implemented)

---

### 21. **Database Query Performance**
**Metrics:**
- Average query time
- Slow queries (> 1 second)
- Query volume

**Tool:** pg_stat_statements

---

### 22. **API Quota Remaining**
**Formula:**
```
Quota Usage % = (Requests Used / Quota Limit) × 100
```

**Alert:** When > 80% of quota used

---

## 👥 User Behavior Metrics

### 23. **User Segments (RFM)**

**Recency (R):** Days since last activity
- Score 5: 0-3 days
- Score 4: 4-7 days
- Score 3: 8-14 days
- Score 2: 15-30 days
- Score 1: 30+ days

**Frequency (F):** Number of requests
- Score 5: Top 20%
- Score 4: 20-40%
- Score 3: 40-60%
- Score 2: 60-80%
- Score 1: Bottom 20%

**Monetary (M):** Total spending
- Score 5: Top 20%
- Score 4: 20-40%
- Score 3: 40-60%
- Score 2: 60-80%
- Score 1: Bottom 20%

**Segments:**
- Champions: R≥4, F≥4, M≥4
- Loyal: R≥3, F≥3, M≥3
- At Risk: R≤2, F≥3
- Lost: R≤2, F≤2

---

### 24. **User Journey Metrics**

**Activation Rate:**
```
Activation % = (Users with 3+ actions / Total Signups) × 100
```

**Time to Value:**
```
TTV = Average time from signup to first successful generation
Target: < 5 minutes
```

---

### 25. **Session Metrics**

**Average Session Duration:**
```
Avg Session = Sum of (Last Action - First Action) / Total Sessions
```

**Sessions Per User:**
```
Sessions Per User = Total Sessions / Unique Users
```

---

## 🔐 Security & Quality Metrics

### 26. **Anomaly Detection Score**

**Cost Anomaly:**
```
Z-Score = (Current Cost - Mean Cost) / Standard Deviation
Alert if Z-Score > 3
```

**Usage Anomaly:** Same formula for request counts

---

### 27. **Error Diversity**
**Metric:** Number of unique error types

**High Diversity** = Many different errors (investigate)

---

## 📊 Content Quality Metrics

### 28. **Generation Success Rate by Type**
```
Success Rate = Successful Generations / Total Attempts × 100
```

**Track separately for:**
- Text/Content
- Images
- Videos

---

### 29. **Retry Rate**
**Formula:**
```
Retry Rate % = (Requests After Errors / Total Errors) × 100
```

**High retry rate** = Users encountering issues but persisting

---

## 🎯 Predictive Metrics

### 30. **30-Day Cost Forecast**
**Methods:**
1. **Simple Average:** Avg daily cost × 30
2. **Trend-Based:** Account for growth trend
3. **Regression:** Linear regression on historical data

**Formula (Trend-Based):**
```
Forecast = (Current Avg Daily Cost + (Trend Slope × 30 days)) × 30
```

---

### 31. **Growth Velocity**
**Formula:**
```
Growth Velocity = (Current Period - Previous Period) / Previous Period × 100

Examples:
- WoW (Week over Week)
- MoM (Month over Month)
```

---

## 🚨 Alert Conditions Summary

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Health Score | > 80 | 50-80 | < 50 |
| Error Rate | < 1% | 1-5% | > 5% |
| P95 Latency | < 3s | 3-10s | > 10s |
| Success Rate | > 99% | 95-99% | < 95% |
| Margin % | > 70% | 40-70% | < 40% |
| Churn Rate | < 3% | 3-7% | > 7% |
| API Quota | < 70% | 70-90% | > 90% |

---

## 📅 Reporting Cadence

### Real-Time (< 1 min lag)
- Health Score
- Current Active Users
- Request Rate
- Error Count

### Hourly
- Latency Trends
- Error Patterns
- Cost Tracking

### Daily
- DAU
- Cost Summary
- Top Users
- Error Analysis

### Weekly
- WAU
- Feature Adoption
- User Segments
- Churn Risk

### Monthly
- MRR
- LTV
- Retention Cohorts
- Plan Conversions

---

## 🔗 Related Queries

Each KPI can be calculated using queries from:
- `analytics-queries.sql` (Basic 10)
- `analytics-queries-advanced.sql` (Advanced 30+)

---

**Last Updated:** 2025-10-17
**Version:** 1.0
