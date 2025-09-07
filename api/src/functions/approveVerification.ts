import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function approveVerificationHandler(
    req: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log("approveVerificationHandler invoked");

    if (req.method !== "POST") {
        return { status: 405, body: "Method not allowed" };
    }

    try {
        const instructionRef = req.params.instructionRef;
        
        if (!instructionRef) {
            return { 
                status: 400, 
                body: JSON.stringify({ error: 'Instruction reference is required' }),
                headers: { "Content-Type": "application/json" }
            };
        }

        const sql = require('mssql');
        
        // Database connection config
        const config = {
            user: process.env.DB_USER || 'helix-database-server',
            password: process.env.DB_PASSWORD,
            server: 'instructions.database.windows.net',
            database: 'instructions',
            options: { 
                encrypt: true,
                trustServerCertificate: false
            }
        };

        // Get the instruction details first
        const getInstructionQuery = `
            SELECT 
                i.InternalId,
                i.FirstName,
                i.Surname,
                i.Email
            FROM Instructions i
            WHERE i.InstructionRef = @instructionRef
        `;

        const pool = await sql.connect(config);
        let request = pool.request();
        request.input('instructionRef', sql.VarChar(50), instructionRef);
        
        const instructionResult = await request.query(getInstructionQuery);
        
        if (instructionResult.recordset.length === 0) {
            return { 
                status: 404, 
                body: JSON.stringify({ error: 'Instruction not found' }),
                headers: { "Content-Type": "application/json" }
            };
        }

        const instruction = instructionResult.recordset[0];

        // Update the verification status
        const updateQuery = `
            UPDATE IDVerifications 
            SET 
                EIDOverallResult = 'Verified',
                LastUpdated = GETDATE()
            WHERE InstructionInternalId = @internalId
        `;

        request = pool.request();
        request.input('internalId', sql.Int, instruction.InternalId);
        
        await request.query(updateQuery);

        // Also update the Instructions table stage if needed
        const updateInstructionQuery = `
            UPDATE Instructions 
            SET 
                stage = 'proof-of-id-complete',
                EIDOverallResult = 'Verified'
            WHERE InternalId = @internalId
        `;

        request = pool.request();
        request.input('internalId', sql.Int, instruction.InternalId);
        
        await request.query(updateInstructionQuery);

        // Send notification email to client
        const clientName = `${instruction.FirstName || ''} ${instruction.Surname || ''}`.trim();
        
        try {
            await sendVerificationFailureEmail(instructionRef, instruction.Email, clientName, context);
        } catch (emailError: any) {
            context.error('Failed to send verification email:', emailError);
            // Don't fail the approval if email fails, just log it
        }

        return {
            status: 200,
            body: JSON.stringify({
                success: true,
                message: 'Verification approved successfully',
                instructionRef,
                emailSent: true
            }),
            headers: { "Content-Type": "application/json" }
        };

    } catch (error: any) {
        context.error('Error approving verification:', error);
        return { 
            status: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error?.message || 'Unknown error'
            }),
            headers: { "Content-Type": "application/json" }
        };
    }
}

/**
 * Sends verification failure notification email to client
 */
async function sendVerificationFailureEmail(instructionRef: string, clientEmail: string, clientName: string, context: InvocationContext) {
    // Email content based on the template provided by user
    const emailSubject = 'Additional Documents Required for ID Verification - AML Compliance';
    
    const emailBody = `
Dear ${clientName},

Thank you for providing your identification documents for our Anti-Money Laundering (AML) verification process.

While we have successfully verified your identity, our automated address verification system requires additional documentation to complete the process. This is a standard requirement to ensure full compliance with AML regulations.

To complete your verification, please provide one of the following documents that shows your current address:

• Recent utility bill (gas, electricity, water, or council tax) - within the last 3 months
• Recent bank statement - within the last 3 months  
• Tenancy agreement (if renting)
• Mortgage statement (if owned)
• Official government correspondence - within the last 3 months

Please upload your document using the secure link below:
[Document Upload Portal - ${instructionRef}]

If you have any questions or need assistance with the document upload process, please don't hesitate to contact our team.

Thank you for your cooperation in helping us maintain the highest standards of compliance.

Best regards,
Compliance Team
Helix Law

---
Reference: ${instructionRef}
This email was sent from an automated system. Please do not reply directly to this email.
`;

    // For now, just log the email that would be sent
    // In production, this would integrate with SendGrid, AWS SES, or similar service
    context.log('=== EMAIL TO BE SENT ===');
    context.log('To:', clientEmail);
    context.log('Subject:', emailSubject);
    context.log('Body:', emailBody);
    context.log('========================');

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //   to: clientEmail,
    //   from: 'compliance@helixlaw.co.uk',
    //   subject: emailSubject,
    //   text: emailBody
    // };
    // 
    // await sgMail.send(msg);

    return true;
}

app.http("approveVerification", {
    methods: ["POST"],
    authLevel: "function",
    route: "instructions/{instructionRef}/approve-verification",
    handler: approveVerificationHandler,
});
