import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function matterRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const requestData = await request.json() as Record<string, any>;
    context.log('Matter request data received:', requestData);
    
    return {
        status: 201,
        jsonBody: {
            success: true,
            requestId: `REQ-${Date.now()}`,
            data: {
                ...requestData,
                id: `REQ-${Date.now()}`,
                status: 'processed',
                processedAt: new Date().toISOString()
            }
        }
    };
}

app.http('matterRequest', {
    methods: ['GET', 'POST', 'PUT'],
    authLevel: 'function',
    handler: matterRequest
});
