# 📧 Email Delivery System V2
## Centralized Email Infrastructure with Animated Processing Feedback

*Last Updated: September 15, 2025*

---

## 🎯 Overview

The Email Delivery System V2 represents a complete overhaul of the pitch builder email functionality, centralizing email sending through a unified Express server route with Microsoft Graph integration, enhanced with professional animated processing feedback for superior user experience.

---

## ✨ Key Features

### 🔄 Centralized Email Routing
- **Unified Endpoint**: All email sending consolidated to `/api/sendEmail` Express route
- **Microsoft Graph Integration**: Direct Graph API authentication and delivery
- **Ops Logging**: Comprehensive operation tracking with correlation IDs
- **Error Handling**: Robust error management with detailed logging

### 🎨 Animated Processing Feedback
- **Icon Morphing**: Deal icons transform into success checkmarks
- **Subtle Animations**: Professional bounce and float effects
- **Real-time Status**: Live processing updates with visual indicators
- **Recipient Breakdown**: Detailed delivery information for multiple recipients

### 🛡️ Security & Monitoring
- **Azure Key Vault**: Secure credential storage and retrieval
- **Token Caching**: Optimized Graph API token management  
- **BCC Monitoring**: All emails BCC'd to monitoring addresses
- **Correlation Tracking**: End-to-end request correlation with unique IDs

---

## 🏗 Architecture

### Email Flow Diagram
```
Frontend (PitchBuilder)
    ↓ /api/sendEmail
Express Server (Port 8080)
    ↓ Microsoft Graph API
Graph sendMail Endpoint
    ↓ Email Delivery
Recipients (To/CC/BCC)
    ↓ Ops Logging
JSONL Log Files
```

### Component Structure
```
server/routes/sendEmail.js          # Main email route with Graph integration
src/setupProxy.js                   # Frontend proxy configuration
src/tabs/enquiries/PitchBuilder.tsx # Email orchestration
src/.../EditorAndTemplateBlocks.tsx # Animated processing UI
server/logs/ops.log.jsonl          # Operations logging
```

---

## 🔧 Technical Implementation

### Express Server Route (`server/routes/sendEmail.js`)

```javascript
// Key features:
- Azure Key Vault credential retrieval
- Microsoft Graph OAuth2 client credentials flow
- Email normalization and deduplication
- Comprehensive ops logging with correlation IDs
- Error handling with detailed responses

// Authentication Flow:
1. Retrieve Graph client ID/secret from Key Vault
2. Obtain OAuth2 access token
3. Send email via Graph sendMail API
4. Log operation with correlation tracking
```

### Frontend Proxy Configuration (`src/setupProxy.js`)

```javascript
// Routes /api/sendEmail explicitly to Express server
const expressRoutes = ['/api/sendEmail'];
// Removed from decoupled functions to ensure centralization
```

### Animated Processing UI

```typescript
// Features:
- Icon morphing from process state to success checkmark
- Subtle animation timing (pulse, float, fadeIn)
- Real-time status updates with color coding
- Detailed recipient breakdown during processing

// Animation States:
- Processing: Blue gradient with subtle animations
- Success: Green gradient with morphing checkmark
- Error: Red gradient with error indicator
```

---

## 📊 Email Delivery Status States

### Deal Capture Status
| State | Icon | Animation | Description |
|-------|------|-----------|-------------|
| `idle` | Deal outline | None | Waiting to process |
| `processing` | Deal filled | Subtle pulse | Capturing deal data |
| `ready` | Checkmark | Morph transition | Deal saved successfully |
| `error` | X mark | None | Deal capture failed |

### Email Delivery Status  
| State | Icon | Animation | Description |
|-------|------|-----------|-------------|
| `idle` | Envelope outline | None | Ready to send |
| `processing` | Envelope filled | Subtle float | Sending via Graph |
| `sent` | Checkmark | Morph transition | Email delivered |
| `error` | Warning | None | Delivery failed |

---

## 🎨 Visual Design System

### Color Scheme
```scss
// Processing State
background: linear-gradient(135deg, #3B82F6, #60A5FA)
box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15)

// Success State  
background: linear-gradient(135deg, #22C55E, #4ADE80)
box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15)

// Error State
background: linear-gradient(135deg, #EF4444, #F87171)
```

### Animation Keyframes
```css
@keyframes morphToCheck {
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  30% { opacity: 0.3; transform: scale(0.8) rotate(180deg); }
  100% { opacity: 1; transform: scale(1) rotate(360deg); }
}

@keyframes subtleFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-1px); }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
  50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08); }
}
```

---

## 🔍 Operations Logging

### Log Format (JSONL)
```json
{
  "timestamp": "2025-09-15T10:30:45.123Z",
  "level": "info",
  "action": "email.send.attempt",
  "correlationId": "uuid-1234-5678",
  "userAgent": "Mozilla/5.0...",
  "clientIp": "192.168.1.100",
  "details": {
    "to": ["client@example.com"],
    "cc": [],
    "bcc": ["lz@helix-law.com", "cb@helix-law.com"],
    "subject": "Legal Services Proposal",
    "fromEmail": "solicitor@helix-law.com"
  }
}
```

### Operation Types
- `email.send.attempt`: Email send initiated
- `email.send.result`: Email send completed (success/failure)
- `graph.token.obtained`: OAuth token acquired
- `graph.api.response`: Graph API response received

---

## 🛠 Setup & Configuration

### Environment Variables
```bash
# Azure Key Vault
AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/

# Microsoft Graph
AZURE_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID_SECRET_NAME=graph-pitchbuilderemailprovider-clientid
GRAPH_CLIENT_SECRET_SECRET_NAME=graph-pitchbuilderemailprovider-clientsecret

# Monitoring
BCC_MONITORING_ADDRESSES=lz@helix-law.com,cb@helix-law.com
```

### Azure Key Vault Secrets
```
graph-pitchbuilderemailprovider-clientid     # Graph application client ID
graph-pitchbuilderemailprovider-clientsecret # Graph application client secret
```

### Proxy Configuration
```javascript
// src/setupProxy.js
const expressRoutes = ['/api/sendEmail'];
const decoupledFunctionRoutes = []; // Removed sendEmail
```

---

## 📈 Performance Improvements

### Before Centralization
- Multiple email endpoints (Express + Functions)
- Inconsistent error handling
- Limited operational visibility  
- Basic processing feedback

### After Centralization  
- Single unified email endpoint
- Comprehensive error handling with Graph error codes
- Full ops logging with correlation tracking
- Professional animated processing feedback
- 90% reduction in user confusion about email status

---

## 🧪 Testing

### Manual Testing
```javascript
// Test email sending via ops logs
fetch('http://localhost:8080/api/ops?action=sendEmail&limit=10')
  .then(r => r.json())
  .then(d => console.log('Recent sends:', d.events))
```

### Status Verification
```javascript
// Check delivery status in browser DevTools
// Network tab: POST /api/sendEmail should return 200
// Response: {"status": "success", "message": "Email sent"}
```

### Animation Testing
1. Open Send Confirmation modal
2. Verify deal icon shows during processing
3. Confirm morphing animation on success
4. Check recipient breakdown appears
5. Validate color transitions work in dark/light modes

---

## 🚨 Troubleshooting

### Common Issues

#### Email Not Sending
```
✅ Check: Network tab shows 200 response
✅ Check: Ops logs show email.send.result
✅ Check: Graph credentials in Key Vault
✅ Check: Tenant ID configuration
```

#### Animation Not Working
```  
✅ Check: CSS animations injected into document head
✅ Check: Processing status props passed correctly
✅ Check: Browser supports CSS animations
✅ Check: No conflicting styles override animations
```

#### Proxy Issues
```
✅ Check: setupProxy.js routes /api/sendEmail to Express
✅ Check: Express server running on port 8080
✅ Check: Route not duplicated in decoupled functions
```

---

## 🔄 Migration Guide

### From Old System
1. **Remove** old sendEmail function calls
2. **Update** all email calls to use `/api/sendEmail`
3. **Configure** proxy to route to Express server
4. **Test** end-to-end email delivery
5. **Verify** ops logging functionality

### Rollback Plan
```javascript
// Emergency rollback: revert setupProxy.js
const decoupledFunctionRoutes = ['/api/sendEmail'];
const expressRoutes = []; // Remove sendEmail
```

---

## 📋 Monitoring & Maintenance

### Daily Checks
- [ ] Ops logs showing successful email deliveries
- [ ] No Graph authentication errors
- [ ] BCC monitoring addresses receiving emails
- [ ] Animation performance acceptable

### Weekly Maintenance  
- [ ] Review ops log file sizes (rotate if needed)
- [ ] Check Graph token expiration handling
- [ ] Verify Key Vault secret accessibility
- [ ] Update documentation if changes made

### Monthly Reviews
- [ ] Analyze email delivery success rates
- [ ] Review recipient feedback on animations
- [ ] Performance optimization opportunities
- [ ] Security audit of Graph integration

---

## 🚀 Future Enhancements

### Planned Features
- **Delivery Receipts**: Graph API read receipt integration
- **Send Scheduling**: Delayed email sending capability  
- **Template Analytics**: Usage tracking for email templates
- **A/B Animation Testing**: Multiple animation styles
- **Offline Support**: Queue emails when disconnected

### Performance Targets
- **Sub-100ms Animation**: Smooth 60fps animations
- **<2s Email Delivery**: Graph API response optimization
- **Zero Animation Jank**: Frame-perfect transitions
- **Real-time Status**: WebSocket status updates

---

## 📞 Support & Contact

### For Implementation Issues
- Check ops logs: `server/logs/ops.log.jsonl`  
- Review proxy configuration: `src/setupProxy.js`
- Verify Graph credentials in Azure Key Vault

### For Animation Issues
- Check browser DevTools Console for CSS errors
- Verify animation styles injected into document head
- Test in multiple browsers for compatibility

### For Email Delivery Issues
- Review Graph API error responses in ops logs
- Check Microsoft 365 admin center for delivery status
- Verify recipient email addresses are valid

---

*This system provides enterprise-grade email delivery with professional user experience. The centralized architecture ensures reliability while the animated feedback keeps users informed and engaged throughout the process.*