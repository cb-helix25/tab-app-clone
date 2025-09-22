const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function createSchema() {
    try {
        // Check for connection string
        if (!process.env.SQL_CONNECTION_STRING) {
            throw new Error('SQL_CONNECTION_STRING environment variable not set');
        }

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'attendance-schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📝 Running schema creation script...');
        const result = await pool.request().query(schemaSQL);
        
        console.log('✅ Schema creation completed successfully');
        console.log('Result:', result);
        
        // Test that tables exist
        console.log('🔍 Verifying tables exist...');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('Users', 'Attendance', 'AnnualLeave')
        `);
        
        console.log('📊 Found tables:', tablesResult.recordset.map(r => r.TABLE_NAME));
        
        await pool.close();
        
    } catch (error) {
        console.error('❌ Error creating schema:', error);
        process.exit(1);
    }
}

createSchema();