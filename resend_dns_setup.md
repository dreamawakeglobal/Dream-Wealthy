# Resend DNS Authentication Guide for dreamwealthyco.com

To ensure high inbox deliverability, bypass spam filters, and authorize Resend to send emails from `@dreamwealthyco.com`, add the following DNS records to your domain registrar (e.g. GoDaddy, Namecheap, Cloudflare, AWS Route 53).

---

## 1. Domain Verification & DKIM Record

| Record Type | Host / Name | Value / Content | TTL | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TXT** | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3w...` *(Copy exact key from Resend Dashboard)* | Auto / 3600 | Required |

---

## 2. SPF (Sender Policy Framework) Record

If you do not have an existing SPF record on `dreamwealthyco.com`:

| Record Type | Host / Name | Value / Content | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` / `dreamwealthyco.com` | `v=spf1 include:resend.com ~all` | Auto / 3600 |

*Note: If an SPF record already exists (e.g. Google Workspace or Microsoft 365), merge `include:resend.com` into your existing record:*
`v=spf1 include:_spf.google.com include:resend.com ~all`

---

## 3. DMARC (Domain-based Message Authentication) Record

| Record Type | Host / Name | Value / Content | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@dreamwealthyco.com` | Auto / 3600 |

---

## 4. Custom Return-Path (MX & CNAME)

| Record Type | Host / Name | Value / Content | TTL |
| :--- | :--- | :--- | :--- |
| **MX** | `bounces` | `feedback-smtp.us-east-1.amazonses.com` (Priority 10) | Auto / 3600 |
| **TXT** | `bounces` | `v=spf1 include:amazonses.com ~all` | Auto / 3600 |

---

## 5. Verified Sender Email Addresses

Once DNS records propagate (typically 5–15 minutes), the following email senders are active in Dream Wealthy Edge Functions:

1. `Dream Wealthy Support <support@dreamwealthyco.com>` (Contact Form & Ticketing)
2. `Dream Wealthy <welcome@dreamwealthyco.com>` (Welcome Onboarding Emails)
3. `Dream Wealthy Digest <digest@dreamwealthyco.com>` (Monthly Financial Summaries)
4. `Dream Wealthy Security <security@dreamwealthyco.com>` (Plaid Connection & Security Relink Alerts)
