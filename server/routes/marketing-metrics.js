const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const router = express.Router();

/**
 * GET /api/marketing-metrics
 * Fetches marketing metrics from Facebook Marketing API using System User token
 * Query params: daysBack (number, defaults to 30), startDate, endDate (optional)
 */
router.get('/', async (req, res) => {
  try {
    console.log('Marketing metrics request received');

    // Get System User token from Key Vault (never expires)
    const credential = new DefaultAzureCredential();
    const vaultUrl = "https://helix-keys.vault.azure.net/";
    const client = new SecretClient(vaultUrl, credential);

    const facebookToken = await client.getSecret("facebook-system-user-token");
    
    if (!facebookToken.value) {
      throw new Error("Facebook System User token not found in Key Vault");
    }

    // Get date range from query parameters
    const daysBack = parseInt(req.query.daysBack || '30'); // Default to 30 days of historical data
    
    // Calculate date range for the last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

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

    res.json({
      success: true,
      data: dailyMetrics, // Return array of daily metrics instead of single aggregated
      timestamp: new Date().toISOString(),
      dataSource: 'Facebook System User Token (Never Expires)',
      dateRange: {
        start: startDateStr,
        end: endDateStr,
        daysIncluded: dailyMetrics.length
      }
    });

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