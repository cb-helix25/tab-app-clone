const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { google } = require('googleapis');
const fs = require('fs');
const { getRedisClient, generateCacheKey, cacheWrapper } = require('../utils/redisClient');
const router = express.Router();

/**
 * GET /api/marketing-metrics
 * Fetches marketing metrics from Facebook Marketing API using System User token
 * Query params: daysBack (number, defaults to 30), startDate, endDate (optional)
 */
router.get('/', async (req, res) => {
  try {
    console.log('Marketing metrics request received');

    // Get date range from query parameters for cache key
    const daysBack = parseInt(req.query.daysBack || '30'); // Default to 30 days of historical data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate cache key based on date range (hourly TTL since marketing data doesn't need real-time updates)
    const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH format
    const cacheKey = generateCacheKey('marketing-metrics', 'facebook-data', `${startDateStr}_${endDateStr}_${currentHour}`);
    
    // Use cache wrapper with 1-hour TTL
    const result = await cacheWrapper(
      cacheKey,
      async () => {
        // Get System User token from Key Vault (never expires)
        const credential = new DefaultAzureCredential();
        const vaultUrl = "https://helix-keys.vault.azure.net/";
        const client = new SecretClient(vaultUrl, credential);

        const facebookToken = await client.getSecret("facebook-system-user-token");
        
        if (!facebookToken.value) {
          throw new Error("Facebook System User token not found in Key Vault");
        }

        console.log(`Fetching Facebook data for daily breakdown: ${startDateStr} to ${endDateStr} (${daysBack} days)`);

        // Call Facebook Graph API for ad account insights with daily breakdown
        const adAccountId = "act_3870546011665"; // Your ad account ID
        const facebookResponse = await fetch(
          `https://graph.facebook.com/v20.0/${adAccountId}/insights?fields=spend,impressions,clicks,reach,frequency,cpm,cpc,ctr,actions,date_start,date_stop&time_range={'since':'${startDateStr}','until':'${endDateStr}'}&time_increment=1&level=account&access_token=${facebookToken.value}`
        );

        if (!facebookResponse.ok) {
          const errorText = await facebookResponse.text();
          console.log(`Facebook API error: ${facebookResponse.status} - ${errorText}`);
          throw new Error(`Facebook API error: ${facebookResponse.status} - ${errorText}`);
        }

        const facebookData = await facebookResponse.json();
        const fbInsights = facebookData.data || [];

        console.log(`Facebook API returned ${fbInsights.length} daily records`);

        // Get page insights for organic performance (still aggregate for now)
        const pageId = "269181206461730"; // Helix Law page ID
        const pageResponse = await fetch(
          `https://graph.facebook.com/v20.0/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users&period=day&since=${startDateStr}&access_token=${facebookToken.value}`
        );

        let pageInsights = {};
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          pageInsights = pageData.data?.reduce((acc, metric) => {
            acc[metric.name] = metric.values?.[metric.values.length - 1]?.value || 0;
            return acc;
          }, {}) || {};
        } else {
          console.log('Page insights request failed, continuing with ad data only');
        }

        // Process daily Facebook insights into daily metrics array
        const dailyMetrics = fbInsights.map((dayData) => {
          // Calculate conversions from actions array
          let conversions = 0;
          if (dayData.actions && Array.isArray(dayData.actions)) {
            conversions = dayData.actions
              .filter((action) => action.action_type === 'lead' || action.action_type === 'complete_registration')
              .reduce((sum, action) => sum + parseInt(action.value || '0'), 0);
          }

          return {
            date: dayData.date_start, // This will be in YYYY-MM-DD format
            metaAds: {
              date: dayData.date_start,
              spend: parseFloat(dayData.spend || "0"),
              impressions: parseInt(dayData.impressions || "0"),
              clicks: parseInt(dayData.clicks || "0"),
              reach: parseInt(dayData.reach || "0"),
              frequency: parseFloat(dayData.frequency || "0"),
              cpc: parseFloat(dayData.cpc || "0"),
              cpm: parseFloat(dayData.cpm || "0"),
              ctr: parseFloat(dayData.ctr || "0"),
              conversions: conversions,
            },
            // Add some mock Google data for now
            googleAnalytics: {
              date: dayData.date_start,
              sessions: Math.floor(Math.random() * 100) + 50,
              users: Math.floor(Math.random() * 80) + 40,
              pageviews: Math.floor(Math.random() * 200) + 100,
              bounceRate: Math.random() * 30 + 40,
              avgSessionDuration: Math.random() * 120 + 60,
              conversions: Math.floor(Math.random() * 5) + 1,
              conversionRate: Math.random() * 5 + 1,
              organicTraffic: Math.floor(Math.random() * 50) + 25,
          paidTraffic: Math.floor(Math.random() * 30) + 15,
        },
        googleAds: {
          date: dayData.date_start,
          impressions: Math.floor(Math.random() * 1000) + 500,
          clicks: Math.floor(Math.random() * 50) + 25,
          cost: Math.random() * 50 + 25,
          conversions: Math.floor(Math.random() * 3) + 1,
          ctr: Math.random() * 3 + 1,
          cpc: Math.random() * 2 + 0.5,
          qualityScore: Math.random() * 3 + 7,
          impressionShare: Math.random() * 20 + 70,
          cpm: Math.random() * 10 + 5,
        }
      };
    });

    console.log(`Processed ${dailyMetrics.length} daily metrics records`);

    return {
      success: true,
      data: dailyMetrics, // Return array of daily metrics instead of single aggregated
      timestamp: new Date().toISOString(),
      dataSource: 'Facebook System User Token (Never Expires)',
      dateRange: {
        start: startDateStr,
        end: endDateStr,
        daysIncluded: dailyMetrics.length
      }
    };
      },
      3600 // 1-hour TTL in seconds
    );

    res.json(result);

  } catch (error) {
    console.error('Marketing metrics error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate mock marketing data for testing purposes
 */
function generateMockMarketingData(startDate, endDate) {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    // Add some realistic variations
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const weekendMultiplier = isWeekend ? 0.7 : 1.0;
    
    data.push({
      date: dateStr,
      googleAnalytics: {
        date: dateStr,
        sessions: Math.floor((Math.random() * 2000 + 1000) * weekendMultiplier),
        users: Math.floor((Math.random() * 1500 + 800) * weekendMultiplier),
        pageviews: Math.floor((Math.random() * 5000 + 2000) * weekendMultiplier),
        bounceRate: Math.random() * 0.3 + 0.4, // 40-70%
        avgSessionDuration: Math.random() * 180 + 120, // 2-5 minutes
        conversions: Math.floor((Math.random() * 15 + 5) * weekendMultiplier),
        conversionRate: Math.random() * 0.03 + 0.01, // 1-4%
        organicTraffic: Math.floor((Math.random() * 1000 + 500) * weekendMultiplier),
        paidTraffic: Math.floor((Math.random() * 800 + 200) * weekendMultiplier)
      },
      googleAds: {
        date: dateStr,
        impressions: Math.floor((Math.random() * 10000 + 5000) * weekendMultiplier),
        clicks: Math.floor((Math.random() * 300 + 100) * weekendMultiplier),
        cost: Math.random() * 500 + 200,
        conversions: Math.floor((Math.random() * 12 + 3) * weekendMultiplier),
        ctr: Math.random() * 0.04 + 0.02, // 2-6%
        cpc: Math.random() * 3 + 1.5, // £1.50-£4.50
        cpa: Math.random() * 80 + 40, // £40-£120
        qualityScore: Math.random() * 2 + 7 // 7-9
      },
      metaAds: {
        date: dateStr,
        reach: Math.floor((Math.random() * 20000 + 10000) * weekendMultiplier),
        impressions: Math.floor((Math.random() * 30000 + 15000) * weekendMultiplier),
        clicks: Math.floor((Math.random() * 400 + 150) * weekendMultiplier),
        spend: Math.random() * 400 + 150,
        conversions: Math.floor((Math.random() * 10 + 2) * weekendMultiplier),
        ctr: Math.random() * 0.035 + 0.015, // 1.5-5%
        cpm: Math.random() * 15 + 8, // £8-£23
        cpc: Math.random() * 2 + 1, // £1-£3
        frequency: Math.random() * 1.5 + 1.2 // 1.2-2.7
      }
    });
  }
  
  return data;
}

/**
 * GET /api/marketing-metrics/summary
 * Returns aggregated summary metrics
 */
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters: startDate and endDate' 
      });
    }

    const data = generateMockMarketingData(startDate, endDate);
    
    // Calculate totals and averages
    const summary = data.reduce((acc, day) => {
      const ga = day.googleAnalytics;
      const gads = day.googleAds;
      const meta = day.metaAds;
      
      return {
        totalSessions: acc.totalSessions + ga.sessions,
        totalUsers: acc.totalUsers + ga.users,
        totalConversions: acc.totalConversions + ga.conversions + gads.conversions + meta.conversions,
        totalSpend: acc.totalSpend + gads.cost + meta.spend,
        totalClicks: acc.totalClicks + gads.clicks + meta.clicks,
        totalImpressions: acc.totalImpressions + gads.impressions + meta.impressions,
        totalReach: acc.totalReach + meta.reach,
        days: acc.days + 1
      };
    }, {
      totalSessions: 0,
      totalUsers: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalReach: 0,
      days: 0
    });
    
    // Calculate averages and derived metrics
    const avgCPA = summary.totalConversions > 0 ? summary.totalSpend / summary.totalConversions : 0;
    const avgCTR = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;
    const avgConversionRate = summary.totalClicks > 0 ? (summary.totalConversions / summary.totalClicks) * 100 : 0;
    
    res.json({
      success: true,
      period: { startDate, endDate, days: summary.days },
      summary: {
        sessions: summary.totalSessions,
        users: summary.totalUsers,
        conversions: summary.totalConversions,
        spend: Math.round(summary.totalSpend * 100) / 100,
        clicks: summary.totalClicks,
        impressions: summary.totalImpressions,
        reach: summary.totalReach,
        avgCPA: Math.round(avgCPA * 100) / 100,
        avgCTR: Math.round(avgCTR * 100) / 100,
        avgConversionRate: Math.round(avgConversionRate * 100) / 100
      },
      note: 'This is mock data. Replace with actual API integrations.'
    });

  } catch (error) {
    console.error('Marketing metrics summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch marketing metrics summary',
      details: error.message 
    });
  }
});

/**
 * GET /api/marketing-metrics/ads
 * Fetches individual ad performance data from Facebook Marketing API
 */
router.get('/ads', async (req, res) => {
  try {
    console.log('Individual ads request received');

    // Get System User token from Key Vault
    const credential = new DefaultAzureCredential();
    const vaultUrl = "https://helix-keys.vault.azure.net/";
    const client = new SecretClient(vaultUrl, credential);

    const facebookToken = await client.getSecret("facebook-system-user-token");
    
    if (!facebookToken.value) {
      throw new Error("Facebook System User token not found in Key Vault");
    }

    // Get date range from query parameters
    const daysBack = parseInt(req.query.daysBack || '7'); // Default to last 7 days for individual ads
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`Fetching individual ad data: ${startDateStr} to ${endDateStr}`);

    // Call Facebook Graph API for individual ad insights
    const adAccountId = "act_3870546011665";
    const adsResponse = await fetch(
      `https://graph.facebook.com/v20.0/${adAccountId}/insights?fields=ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,reach,frequency,cpm,cpc,ctr,actions,date_start,date_stop&time_range={'since':'${startDateStr}','until':'${endDateStr}'}&level=ad&limit=50&access_token=${facebookToken.value}`
    );

    if (!adsResponse.ok) {
      const errorText = await adsResponse.text();
      console.log(`Facebook Ads API error: ${adsResponse.status} - ${errorText}`);
      
      // Handle rate limiting gracefully
      if (adsResponse.status === 403) {
        console.warn('Facebook API rate limit hit, returning cached data or empty response');
        return res.json({
          success: true,
          data: [],
          message: 'Facebook API rate limit reached. Please try again later.',
          rateLimited: true
        });
      }
      
      throw new Error(`Facebook Ads API error: ${adsResponse.status} - ${errorText}`);
    }

    const adsData = await adsResponse.json();
    const ads = adsData.data || [];

    console.log(`Facebook API returned ${ads.length} individual ads`);

    // Process individual ad data
    const processedAds = ads.map((ad) => {
      // Calculate conversions from actions array
      let conversions = 0;
      if (ad.actions && Array.isArray(ad.actions)) {
        conversions = ad.actions
          .filter((action) => action.action_type === 'lead' || action.action_type === 'complete_registration')
          .reduce((sum, action) => sum + parseInt(action.value || '0'), 0);
      }

      return {
        adId: ad.ad_id,
        adName: ad.ad_name || `Ad ${ad.ad_id}`,
        campaignName: ad.campaign_name || 'Unknown Campaign',
        adsetName: ad.adset_name || 'Unknown Adset',
        dateStart: ad.date_start,
        dateStop: ad.date_stop,
        metrics: {
          spend: parseFloat(ad.spend || "0"),
          impressions: parseInt(ad.impressions || "0"),
          clicks: parseInt(ad.clicks || "0"),
          reach: parseInt(ad.reach || "0"),
          frequency: parseFloat(ad.frequency || "0"),
          cpc: parseFloat(ad.cpc || "0"),
          cpm: parseFloat(ad.cpm || "0"),
          ctr: parseFloat(ad.ctr || "0"),
          conversions: conversions,
          costPerConversion: conversions > 0 ? parseFloat(ad.spend || "0") / conversions : 0,
          conversionRate: parseInt(ad.clicks || "0") > 0 ? (conversions / parseInt(ad.clicks || "0")) * 100 : 0
        }
      };
    });

    // Sort by spend (highest first)
    processedAds.sort((a, b) => b.metrics.spend - a.metrics.spend);

    res.json({
      success: true,
      data: processedAds,
      totalAds: processedAds.length,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
        daysIncluded: daysBack
      },
      timestamp: new Date().toISOString(),
      dataSource: 'Facebook System User Token'
    });

  } catch (error) {
    console.error('Individual ads error:', error);
    
    // Handle rate limiting more gracefully in catch block too
    if (error.message && error.message.includes('Application request limit reached')) {
      return res.json({
        success: true,
        data: [],
        message: 'Facebook API rate limit reached. Please try again later.',
        rateLimited: true,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

/**
 * GET /api/marketing-metrics/ga4
 * Fetches GA4 daily metrics using a service account stored in Azure Key Vault
 * Query params: startDate, endDate OR daysBack (default 30)
 * Env/assumptions: KEY_VAULT_URL, GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_SECRET (JSON)
 */
router.get('/ga4', async (req, res) => {
  try {
    let serviceAccount;
    // 1) Local overrides for dev/testing
    if (process.env.GA4_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
      } catch (e) {
        return res.status(500).json({ success: false, error: 'Invalid GA4_SERVICE_ACCOUNT_JSON' });
      }
    } else if (process.env.GA4_CREDENTIALS_PATH && fs.existsSync(process.env.GA4_CREDENTIALS_PATH)) {
      try {
        const raw = fs.readFileSync(process.env.GA4_CREDENTIALS_PATH, 'utf8');
        serviceAccount = JSON.parse(raw);
      } catch (e) {
        return res.status(500).json({ success: false, error: 'Failed to read GA4_CREDENTIALS_PATH' });
      }
    } else {
      // 2) Default: Key Vault
      const kvUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(kvUrl, credential);
      const secretName = process.env.GA4_SERVICE_ACCOUNT_SECRET || 'ga4-service-account-json';
      const saSecret = await client.getSecret(secretName);
      if (!saSecret.value) {
        return res.status(500).json({ success: false, error: 'GA4 service account secret missing' });
      }
      serviceAccount = JSON.parse(saSecret.value);
    }

  // Dates and filters
  let { startDate, endDate, daysBack, organicOnly } = req.query;
    if (!startDate || !endDate) {
      const days = parseInt(daysBack || '30');
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
      return res.status(500).json({ success: false, error: 'GA4_PROPERTY_ID not set' });
    }

    // Auth with service account JSON (no file path required)
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

    const requestBody = {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' },
      ],
      dimensions: [{ name: 'date' }],
    };

    // Optional: restrict to Organic Search only (defaultChannelGroup)
    if (String(organicOnly) === 'true') {
      // Use sessionDefaultChannelGroup filter WITHOUT adding it to the dimensions list
      // to avoid incompatibilities across mixed-scope metrics.
      const channelDim = 'sessionDefaultChannelGroup';
      requestBody.dimensionFilter = {
        filter: {
          fieldName: channelDim,
          stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
        },
      };
    }

    const response = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody,
    });

    const rows = response.data.rows || [];
    const data = rows.map((row) => {
      const dateVal = row.dimensionValues?.[0]?.value;
      return ({
        date: dateVal,
        googleAnalytics: {
          date: dateVal,
          sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
          activeUsers: parseInt(row.metricValues?.[1]?.value || '0', 10),
          screenPageViews: parseInt(row.metricValues?.[2]?.value || '0', 10),
          bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
          averageSessionDuration: parseFloat(row.metricValues?.[4]?.value || '0'),
          conversions: parseInt(row.metricValues?.[5]?.value || '0', 10),
        },
      });
    });

    return res.json({
      success: true,
      data,
      dateRange: { start: startDate, end: endDate, daysIncluded: data.length },
      source: 'GA4 Analytics Data API',
    });
  } catch (err) {
    console.error('GA4 endpoint error', err);
    return res.status(500).json({ success: false, error: err.message || 'Unknown error' });
  }
});

/**
 * GET /api/marketing-metrics/google-ads
 * Fetches Google Ads daily metrics via REST Search endpoint using OAuth2 (refresh token flow)
 * Query params: startDate, endDate OR daysBack (default 30); optional customerId override
 * Required config (prefer env vars; optionally via Key Vault if SECRET names provided):
 *  - GOOGLE_ADS_DEVELOPER_TOKEN
 *  - GOOGLE_ADS_CLIENT_ID
 *  - GOOGLE_ADS_CLIENT_SECRET
 *  - GOOGLE_ADS_REFRESH_TOKEN
 *  - GOOGLE_ADS_LOGIN_CUSTOMER_ID (manager account, no dashes)
 *  - GOOGLE_ADS_CUSTOMER_ID (target account, no dashes; can override via query)
 */
router.get('/google-ads', async (req, res) => {
  try {
    // Resolve credentials from env first; optionally from Key Vault if secret names provided
    const cfg = {
      developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      clientId: process.env.GOOGLE_ADS_CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      loginCustomerId: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''),
      customerId: (req.query.customerId || process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''),
    };

    // If any are missing and we have secret names, try Key Vault
    const missing = Object.entries(cfg).filter(([k, v]) => !v && k !== 'customerId');
    if (missing.length > 0 && process.env.KEY_VAULT_URL) {
      const kvUrl = process.env.KEY_VAULT_URL;
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(kvUrl, credential);
      const secretNameMap = {
        developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN_SECRET,
        clientId: process.env.GOOGLE_ADS_CLIENT_ID_SECRET,
        clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET_SECRET,
        refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN_SECRET,
        loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_SECRET,
        customerId: process.env.GOOGLE_ADS_CUSTOMER_ID_SECRET,
      };
      for (const [key, envSecretName] of Object.entries(secretNameMap)) {
        if (!cfg[key] && envSecretName) {
          try {
            const sec = await client.getSecret(envSecretName);
            if (sec?.value) {
              // Only strip dashes for customer IDs; leave tokens/secrets as-is
              cfg[key] = (key === 'loginCustomerId' || key === 'customerId')
                ? sec.value.replace(/-/g, '')
                : sec.value;
            }
          } catch (e) {
            // best effort; continue
          }
        }
      }
    }

    // Validate required configuration
    const requiredKeys = ['developerToken', 'clientId', 'clientSecret', 'refreshToken', 'loginCustomerId'];
    const missingKeys = requiredKeys.filter((k) => !cfg[k]);
    if (missingKeys.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing Google Ads configuration: ${missingKeys.join(', ')}`,
        hint: 'Set env vars or configure Key Vault secrets for Google Ads credentials.',
      });
    }
    if (!cfg.customerId) {
      return res.status(400).json({ success: false, error: 'Missing customerId (set GOOGLE_ADS_CUSTOMER_ID or pass ?customerId=)' });
    }

    // Date range
    let { startDate, endDate, daysBack } = req.query;
    if (!startDate || !endDate) {
      const days = parseInt(daysBack || '30', 10);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    // OAuth2: exchange refresh token for access token
    const oauth2 = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
    oauth2.setCredentials({ refresh_token: cfg.refreshToken });
    const tokenResp = await oauth2.getAccessToken();
    const accessToken = typeof tokenResp === 'string' ? tokenResp : tokenResp?.token;
    if (!accessToken) {
      return res.status(500).json({ success: false, error: 'Failed to obtain Google Ads access token' });
    }

    // Build GAQL query for daily metrics
    const query = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date
    `;

  const url = `https://googleads.googleapis.com/v22/customers/${cfg.customerId}/googleAds:search`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': cfg.developerToken,
        'login-customer-id': cfg.loginCustomerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, pageSize: 10000 }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ success: false, error: `Google Ads API error: ${resp.status} ${errText.slice(0, 500)}` });
    }
    const json = await resp.json();
    const results = Array.isArray(json.results) ? json.results : [];

    // Aggregate by date
    const byDate = new Map();
    for (const row of results) {
      const date = row?.segments?.date;
      const metrics = row?.metrics || {};
      if (!date) continue;
      const prev = byDate.get(date) || { impressions: 0, clicks: 0, costMicros: 0, conversions: 0 };
      prev.impressions += Number(metrics.impressions || 0);
      prev.clicks += Number(metrics.clicks || 0);
      prev.costMicros += Number(metrics.costMicros || metrics.cost_micros || 0);
      prev.conversions += Number(metrics.conversions || 0);
      byDate.set(date, prev);
    }

    const data = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, m]) => {
      const cost = (m.costMicros || 0) / 1_000_000;
      const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
      const cpc = m.clicks > 0 ? cost / m.clicks : 0;
      const cpa = m.conversions > 0 ? cost / m.conversions : 0;
      return {
        date,
        googleAds: {
          date,
          impressions: m.impressions,
          clicks: m.clicks,
          cost: Number(cost.toFixed(2)),
          conversions: m.conversions,
          ctr: Number(ctr.toFixed(2)),
          cpc: Number(cpc.toFixed(2)),
          cpa: Number(cpa.toFixed(2)),
        },
      };
    });

    return res.json({
      success: true,
      data,
      dateRange: { start: startDate, end: endDate, daysIncluded: data.length },
      source: 'Google Ads API (REST search)',
    });
  } catch (err) {
    console.error('Google Ads endpoint error', err);
    return res.status(500).json({ success: false, error: err.message || 'Unknown error' });
  }
});

// Shared helpers for GA4 endpoints
async function getGa4AuthAndClient() {
  let serviceAccount;
  if (process.env.GA4_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GA4_CREDENTIALS_PATH && fs.existsSync(process.env.GA4_CREDENTIALS_PATH)) {
    const raw = fs.readFileSync(process.env.GA4_CREDENTIALS_PATH, 'utf8');
    serviceAccount = JSON.parse(raw);
  } else {
    const kvUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(kvUrl, credential);
    const secretName = process.env.GA4_SERVICE_ACCOUNT_SECRET || 'ga4-service-account-json';
    const saSecret = await client.getSecret(secretName);
    if (!saSecret.value) throw new Error('GA4 service account secret missing');
    serviceAccount = JSON.parse(saSecret.value);
  }
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error('GA4_PROPERTY_ID not set');
  const auth = new google.auth.GoogleAuth({ credentials: serviceAccount, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  return { analyticsdata, propertyId };
}

function resolveDateRange(q) {
  let { startDate, endDate, daysBack } = q || {};
  if (!startDate || !endDate) {
    const days = parseInt(daysBack || '30', 10);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    startDate = start.toISOString().split('T')[0];
    endDate = end.toISOString().split('T')[0];
  }
  return { startDate, endDate };
}

function maybeOrganicFilter(organicOnly) {
  if (String(organicOnly) !== 'true') return undefined;
  return {
    filter: {
      fieldName: 'sessionDefaultChannelGroup',
      stringFilter: { matchType: 'EXACT', value: 'Organic Search' },
    },
  };
}

async function runGa4(analyticsdata, propertyId, requestBody) {
  const resp = await analyticsdata.properties.runReport({ property: `properties/${propertyId}`, requestBody });
  return resp.data;
}

// GA4: sessions by channel group
router.get('/ga4/channels', async (req, res) => {
  try {
    const { analyticsdata, propertyId } = await getGa4AuthAndClient();
    const { startDate, endDate } = resolveDateRange(req.query);
    const cacheKey = generateCacheKey('ga4', 'channels', `${startDate}_${endDate}_${String(req.query.organicOnly)}`);
    const result = await cacheWrapper(cacheKey, async () => {
      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
        dimensionFilter: maybeOrganicFilter(req.query.organicOnly),
      };
      const data = await runGa4(analyticsdata, propertyId, requestBody);
      const rows = data.rows || [];
      return { success: true, data: rows.map(r => ({
        channel: r.dimensionValues?.[0]?.value,
        sessions: Number(r.metricValues?.[0]?.value || 0),
        conversions: Number(r.metricValues?.[1]?.value || 0),
      })), dateRange: { start: startDate, end: endDate } };
    }, 1800);
    return res.json(result);
  } catch (err) {
    console.error('GA4 channels error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GA4: sessions by source/medium
router.get('/ga4/source-medium', async (req, res) => {
  try {
    const { analyticsdata, propertyId } = await getGa4AuthAndClient();
    const { startDate, endDate } = resolveDateRange(req.query);
    const cacheKey = generateCacheKey('ga4', 'sourceMedium', `${startDate}_${endDate}_${String(req.query.organicOnly)}`);
    const result = await cacheWrapper(cacheKey, async () => {
      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
        dimensionFilter: maybeOrganicFilter(req.query.organicOnly),
        limit: 1000,
      };
      const data = await runGa4(analyticsdata, propertyId, requestBody);
      const rows = data.rows || [];
      return { success: true, data: rows.map(r => ({
        sourceMedium: r.dimensionValues?.[0]?.value,
        sessions: Number(r.metricValues?.[0]?.value || 0),
        conversions: Number(r.metricValues?.[1]?.value || 0),
      })), dateRange: { start: startDate, end: endDate } };
    }, 1800);
    return res.json(result);
  } catch (err) {
    console.error('GA4 source-medium error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GA4: top landing pages
router.get('/ga4/landing-pages', async (req, res) => {
  try {
    const { analyticsdata, propertyId } = await getGa4AuthAndClient();
    const { startDate, endDate } = resolveDateRange(req.query);
    const cacheKey = generateCacheKey('ga4', 'landingPages', `${startDate}_${endDate}`);
    const result = await cacheWrapper(cacheKey, async () => {
      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [{ name: 'landingPage' }],
        orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
        limit: 1000,
      };
      const data = await runGa4(analyticsdata, propertyId, requestBody);
      const rows = data.rows || [];
      return { success: true, data: rows.map(r => ({
        landingPage: r.dimensionValues?.[0]?.value,
        sessions: Number(r.metricValues?.[0]?.value || 0),
        conversions: Number(r.metricValues?.[1]?.value || 0),
      })), dateRange: { start: startDate, end: endDate } };
    }, 1800);
    return res.json(result);
  } catch (err) {
    console.error('GA4 landing-pages error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GA4: devices
router.get('/ga4/devices', async (req, res) => {
  try {
    const { analyticsdata, propertyId } = await getGa4AuthAndClient();
    const { startDate, endDate } = resolveDateRange(req.query);
    const cacheKey = generateCacheKey('ga4', 'devices', `${startDate}_${endDate}`);
    const result = await cacheWrapper(cacheKey, async () => {
      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [{ name: 'deviceCategory' }],
        orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
      };
      const data = await runGa4(analyticsdata, propertyId, requestBody);
      const rows = data.rows || [];
      return { success: true, data: rows.map(r => ({
        device: r.dimensionValues?.[0]?.value,
        sessions: Number(r.metricValues?.[0]?.value || 0),
        conversions: Number(r.metricValues?.[1]?.value || 0),
      })), dateRange: { start: startDate, end: endDate } };
    }, 1800);
    return res.json(result);
  } catch (err) {
    console.error('GA4 devices error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GA4: geo by country
router.get('/ga4/geo', async (req, res) => {
  try {
    const { analyticsdata, propertyId } = await getGa4AuthAndClient();
    const { startDate, endDate } = resolveDateRange(req.query);
    const cacheKey = generateCacheKey('ga4', 'geo', `${startDate}_${endDate}`);
    const result = await cacheWrapper(cacheKey, async () => {
      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [{ name: 'country' }],
        orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
        limit: 1000,
      };
      const data = await runGa4(analyticsdata, propertyId, requestBody);
      const rows = data.rows || [];
      return { success: true, data: rows.map(r => ({
        country: r.dimensionValues?.[0]?.value,
        sessions: Number(r.metricValues?.[0]?.value || 0),
        conversions: Number(r.metricValues?.[1]?.value || 0),
      })), dateRange: { start: startDate, end: endDate } };
    }, 1800);
    return res.json(result);
  } catch (err) {
    console.error('GA4 geo error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GA4: top converting events
router.get('/ga4/events', async (req, res) => {
  try {
    const { analyticsdata, propertyId } = await getGa4AuthAndClient();
    const { startDate, endDate } = resolveDateRange(req.query);
    const cacheKey = generateCacheKey('ga4', 'events', `${startDate}_${endDate}`);
    const result = await cacheWrapper(cacheKey, async () => {
      const requestBody = {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'eventCount' }, { name: 'conversions' }],
        dimensions: [{ name: 'eventName' }],
        orderBys: [{ desc: true, metric: { metricName: 'eventCount' } }],
        limit: 1000,
      };
      const data = await runGa4(analyticsdata, propertyId, requestBody);
      const rows = data.rows || [];
      return { success: true, data: rows.map(r => ({
        eventName: r.dimensionValues?.[0]?.value,
        eventCount: Number(r.metricValues?.[0]?.value || 0),
        conversions: Number(r.metricValues?.[1]?.value || 0),
      })), dateRange: { start: startDate, end: endDate } };
    }, 1800);
    return res.json(result);
  } catch (err) {
    console.error('GA4 events error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});