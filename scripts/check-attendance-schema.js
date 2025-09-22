const sql = require('mssql');

async function checkSchema() {
    try {
        const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
        
        // Check Attendance table columns
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Attendance'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('📊 Attendance table columns:');
        result.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
        });
        
        await pool.close();
        
    } catch (error) {
        console.error('❌ Error checking schema:', error);
    }
}

checkSchema();