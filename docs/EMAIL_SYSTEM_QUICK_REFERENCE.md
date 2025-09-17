# 📧 Email System V2 - Quick Reference
*September 15, 2025*

## 🚀 Quick Start

### Check Email Delivery Status
```bash
# View recent email operations
curl http://localhost:8080/api/ops?action=sendEmail&limit=5
```

### Send Email (API)
```javascript
POST /api/sendEmail
{
  "email_contents": "<html>...</html>",
  "user_email": "client@example.com", 
  "subject": "Legal Services Proposal",
  "from_email": "solicitor@helix-law.com",
  "cc_emails": "advisor@example.com",
  "bcc_emails": "monitoring@helix-law.com"
}
```

### Animation States
```typescript
// Processing Status Props
emailStatus: 'idle' | 'processing' | 'sent' | 'error'
dealStatus: 'idle' | 'processing' | 'ready' | 'error' 
```

---

## 🎯 Key Features

✅ **Centralized Routing**: Single `/api/sendEmail` endpoint  
✅ **Graph Integration**: Microsoft Graph API with OAuth2  
✅ **Animated Feedback**: Icon morphing and status updates  
✅ **Ops Logging**: JSONL correlation tracking  
✅ **Security**: Azure Key Vault credentials  

---

## 🔧 Architecture

```
Frontend → Express Proxy → Graph API → Email Delivery
    ↓
Animated Status UI + Operations Logging
```

---

## 🎨 Visual States

| State | Icon | Color | Animation |
|-------|------|-------|-----------|
| Processing | Deal/Envelope | Blue | Subtle float |
| Success | Checkmark | Green | Morph transition |  
| Error | X/Warning | Red | None |
| Idle | Outline | Gray | None |

---

## 🚨 Troubleshooting

**Email not sending?**
- Check Network tab: POST /api/sendEmail → 200
- Check ops logs: `email.send.result` entries
- Verify Graph credentials in Key Vault

**Animations not working?**  
- Check CSS animations in document head
- Verify status props: `emailStatus`, `dealStatus`
- Test in different browsers

**Proxy issues?**
- Verify setupProxy.js routes /api/sendEmail to Express
- Confirm Express server on port 8080
- Check sendEmail not in decoupled functions

---

## 📊 Monitoring

```bash
# Email delivery success rate
grep "email.send.result" server/logs/ops.log.jsonl | tail -10

# Graph API responses  
grep "graph.api.response" server/logs/ops.log.jsonl | tail -5
```

---

*For complete documentation see: `docs/EMAIL_DELIVERY_SYSTEM_V2.md`*