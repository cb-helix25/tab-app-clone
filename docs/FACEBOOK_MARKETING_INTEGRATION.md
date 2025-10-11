# Facebook Marketing API Integration Documentation

## Overview
This document outlines the complete setup of Facebook Marketing API integration for ROI tracking in the Helix Hub enquiry reporting system.

## Objective
Integrate Facebook advertising cost data and page performance metrics into the Teams app enquiry reports to enable comprehensive ROI analysis.

## Components Implemented

### 1. Facebook App Configuration
- **App Name**: Helix Marketing Hub (renamed from LeadHandler)
- **App ID**: 3367675020051719
- **App Type**: Business
- **Purpose**: Marketing API access for analytics integration

### 2. System User Setup
- **Business Manager**: Helix Law Limited (ID: 598399417200545)
- **System User**: Lead Handler (ID: 122102227065026073)
- **Token Type**: Never-expiring System User token
- **Permissions Granted**:
  - `ads_read` - Read ad account data, campaigns, insights
  - `ads_management` - Full ad account access and management
  - `business_management` - Access business portfolio and assets
  - `pages_show_list` - List pages you manage
  - `pages_read_engagement` - Page insights and engagement metrics
  - `read_insights` - General insights across platforms
  - `leads_retrieval` - Access lead form data
  - `pages_messaging` - Message analytics and data
  - `instagram_basic` - Basic Instagram account access
  - `instagram_manage_insights` - Instagram analytics and insights
  - `public_profile` - Basic profile information
  - `whatsapp_business_management` - WhatsApp Business insights

### 3. Asset Assignments
The System User has been granted access to:
- **Ad Account**: 3870546011665 (Helix Law Limited)
- **Facebook Page**: 269181206461730 (Helix Law)
- **Instagram Account**: 17841408839729093 (helixlawltd)
- **WhatsApp Account**: 723649030081082 (Helix Law Limited)

## Azure Key Vault Secrets

### Facebook Marketing Integration Secrets
| Secret Name | Purpose | Expiration | App Source |
|-------------|---------|------------|------------|
| `facebook-system-user-token` | Never-expiring Marketing API access | Never | Helix Marketing Hub (3367675020051719) |
| `facebook-marketing-hub-app-secret` | App secret for token generation | Never | Helix Marketing Hub (3367675020051719) |
| `facebook-marketing-hub-access-token` | 60-day User Access Token (backup) | ~60 days | Helix Marketing Hub (3367675020051719) |

### Legacy Facebook Secrets (Separate Lead Processing System)
| Secret Name | Purpose | Expiration | App Source |
|-------------|---------|------------|------------|
| `facebook-page-access-token` | Lead webhook processing | Unknown | Different Facebook App |
| `facebook-app-secret` | Lead webhook signature verification | Never | Different Facebook App |
| `facebook-verify-token` | Webhook verification | Never | Different Facebook App |

## API Integration Details

### Primary Marketing API Endpoints
1. **Ad Account Insights**:
   ```
   GET https://graph.facebook.com/v20.0/act_3870546011665/insights
   Parameters: fields=spend,impressions,clicks,reach,frequency&date_preset=yesterday
   ```

2. **Page Insights**:
   ```
   GET https://graph.facebook.com/v20.0/269181206461730/insights
   Parameters: metric=page_views,page_engaged_users&period=day
   ```

3. **Campaign Performance**:
   ```
   GET https://graph.facebook.com/v20.0/act_3870546011665/campaigns
   Parameters: fields=name,status,effective_status,insights{spend,impressions,clicks}
   ```

### Authentication Pattern
All API calls use the System User token from Key Vault:
```typescript
const credential = new DefaultAzureCredential();
const client = new SecretClient("https://helix-keys.vault.azure.net/", credential);
const tokenSecret = await client.getSecret("facebook-system-user-token");
const accessToken = tokenSecret.value;
```

## Data Integration Points

### 1. Marketing Metrics Framework
- **File**: `src/tabs/Reporting/ReportingHome.tsx`
- **Interfaces**: MarketingMetrics, FacebookMetrics, GoogleMetrics
- **Function**: `fetchMarketingMetrics()` - Retrieves data from Azure Function

### 2. Backend API Endpoint
- **File**: `api/src/marketingMetrics.ts`
- **Purpose**: Fetches Facebook marketing data and returns structured metrics
- **Key Vault Integration**: Uses DefaultAzureCredential pattern for secure token access

### 3. Express Route Handler
- **File**: `server/routes/marketing-metrics.js`
- **Purpose**: Development/testing endpoint with mock data structure

## Token Management Strategy

### Current Approach: System User Token (Recommended)
- **Advantages**:
  - Never expires
  - Business-grade reliability
  - Not tied to individual user accounts
  - Granular permission control
- **Maintenance**: Zero - set and forget

### Backup Approach: Auto-Refresh System
- **File**: `api/src/refreshFacebookToken.ts`
- **Script**: `scripts/refresh-facebook-token.ps1`
- **Purpose**: Automatically refresh 60-day User Access Tokens
- **Schedule**: Monthly execution recommended

## Testing and Validation

### Successful Test Results
1. **Ad Account Access**: ✅ Successfully retrieved spend, impressions, clicks, reach data
2. **Token Validity**: ✅ System User token verified as never-expiring
3. **Key Vault Storage**: ✅ All secrets properly stored and accessible
4. **Business Asset Access**: ✅ Confirmed access to ad account 3870546011665

### ROI Data Available
- Daily ad spend amounts
- Impression and reach metrics
- Click-through rates
- Cost per engagement
- Campaign performance data
- Page organic performance metrics

## Integration with Enquiry Reports

### Marketing Metrics Display
The enquiry reporting system now includes:
- Facebook ad cost data by date range
- ROI calculations (enquiry value vs. ad spend)
- Performance trends and insights
- Cost per enquiry analysis

### Data Correlation
- Match enquiry submission dates with ad campaign performance
- Calculate cost-effectiveness of different advertising strategies
- Identify high-performing ad campaigns and content
- Track conversion rates from Facebook traffic

## Security Considerations

### Access Control
- System User tokens stored in Azure Key Vault with RBAC
- DefaultAzureCredential pattern for secure authentication
- Granular Facebook permissions minimize attack surface
- Separate tokens for different use cases (lead processing vs. analytics)

### Monitoring
- Token validity checks in API calls
- Error handling for expired or invalid tokens
- Audit trail through Azure Function logs
- Key Vault access logging enabled

## Maintenance and Operations

### Regular Tasks
- **Monthly**: Verify System User token functionality
- **Quarterly**: Review Facebook app permissions and usage
- **As Needed**: Update API version if Facebook deprecates endpoints

### Troubleshooting
1. **Token Issues**: Check System User status in Business Manager
2. **Permission Errors**: Verify asset assignments in Business Manager
3. **API Failures**: Check Facebook API status and rate limits
4. **Key Vault Access**: Verify Azure Function managed identity permissions

## Future Enhancements

### Planned Improvements
- Google Ads API integration for complete marketing analytics
- Google Analytics 4 integration for website performance
- Advanced ROI modeling and predictive analytics
- Automated alerting for campaign performance anomalies

### Scalability Considerations
- Implement caching for frequently accessed marketing data
- Consider Azure Cache for Redis for improved performance
- Batch API calls to optimize rate limit usage
- Implement data archiving for historical marketing metrics

## Related Documentation
- [Enquiry Reporting System](./ENQUIRIES_REPORT_ANALYSIS.md)
- [Azure Function Development](./LOCAL_DEVELOPMENT_SETUP.md)
- [Key Vault Security Patterns](./enquiry-processing-v2/README.md)

---

**Last Updated**: October 10, 2025
**Author**: Development Team
**Version**: 1.0