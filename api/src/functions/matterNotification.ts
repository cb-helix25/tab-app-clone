import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function matterNotification(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const notificationData = await request.json() as Record<string, any>;
    context.log('Matter notification data received:', notificationData);
    
    return {
        status: 200,
        jsonBody: {
            success: true,
            notificationId: `NOTIFY-${Date.now()}`,
            data: {
                ...notificationData,
                id: `NOTIFY-${Date.now()}`,
                status: 'sent',
                sentAt: new Date().toISOString()
            }
        }
    };
}

app.http('matterNotification', {
    methods: ['POST'],
    authLevel: 'function',
    handler: matterNotification
});
