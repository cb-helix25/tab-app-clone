import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

export async function marketingMetrics(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Marketing metrics request received');

    try {
        // Get System User token from Key Vault (never expires)
        const credential = new DefaultAzureCredential();
        const vaultUrl = "https://helix-keys.vault.azure.net/";
        const client = new SecretClient(vaultUrl, credential);

        const facebookToken = await client.getSecret("facebook-system-user-token");
        
        if (!facebookToken.value) {
            throw new Error("Facebook System User token not found in Key Vault");
        }

        // Get date range from query parameters
        const url = new URL(request.url);
        const daysBack = parseInt(url.searchParams.get('daysBack') || '30'); // Default to 30 days of historical data
        
        // Calculate date range for the last N days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        context.log(`Fetching Facebook data for daily breakdown: ${startDateStr} to ${endDateStr} (${daysBack} days)`);

        // Call Facebook Graph API for ad account insights with daily breakdown
        const adAccountId = "act_3870546011665"; // Your ad account ID
        const facebookResponse = await fetch(
            `https://graph.facebook.com/v20.0/${adAccountId}/insights?fields=spend,impressions,clicks,reach,frequency,cpm,cpc,ctr,actions,date_start,date_stop&time_range={'since':'${startDateStr}','until':'${endDateStr}'}&time_increment=1&level=account&access_token=${facebookToken.value}`
        );

        if (!facebookResponse.ok) {
            const errorText = await facebookResponse.text();
            context.log(`Facebook API error: ${facebookResponse.status} - ${errorText}`);
            throw new Error(`Facebook API error: ${facebookResponse.status} - ${errorText}`);
        }

        const facebookData = await facebookResponse.json();
        const fbInsights = facebookData.data || [];

        context.log(`Facebook API returned ${fbInsights.length} daily records`);

        // Get page insights for organic performance (still aggregate for now)
        const pageId = "269181206461730"; // Helix Law page ID
        const pageResponse = await fetch(
            `https://graph.facebook.com/v20.0/${pageId}/insights?metric=page_impressions,page_reach,page_engaged_users&period=day&since=${startDateStr}&access_token=${facebookToken.value}`
        );

        let pageInsights: any = {};
        if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            pageInsights = pageData.data?.reduce((acc: any, metric: any) => {
                acc[metric.name] = metric.values?.[metric.values.length - 1]?.value || 0;
                return acc;
            }, {}) || {};
        } else {
            context.log('Page insights request failed, continuing with ad data only');
        }

        // Process daily Facebook insights into daily metrics array
        const dailyMetrics = fbInsights.map((dayData: any) => {
            // Calculate conversions from actions array
            let conversions = 0;
            if (dayData.actions && Array.isArray(dayData.actions)) {
                conversions = dayData.actions
                    .filter((action: any) => action.action_type === 'lead' || action.action_type === 'complete_registration')
                    .reduce((sum: number, action: any) => sum + parseInt(action.value || '0'), 0);
            }

            return {
                date: dayData.date_start, // This will be in YYYY-MM-DD format
                metaAds: {
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

        context.log(`Processed ${dailyMetrics.length} daily metrics records`);

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            jsonBody: {
                success: true,
                data: dailyMetrics, // Return array of daily metrics instead of single aggregated
                timestamp: new Date().toISOString(),
                dataSource: 'Facebook System User Token (Never Expires)',
                dateRange: {
                    start: startDateStr,
                    end: endDateStr,
                    daysIncluded: dailyMetrics.length
                }
            }
        };

    } catch (error) {
        context.log('Error fetching marketing metrics:', error);
        
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            jsonBody: {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        };
    }
}

app.http('marketingMetrics', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: marketingMetrics
});