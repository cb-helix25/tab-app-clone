const sql = require('mssql');
async function getClioId(initials) {
    const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
    const { recordset } = await pool.request()
        .input('initials', sql.NVarChar, initials)
        .query(`SELECT [Clio ID] FROM dbo.team WHERE Initials = @initials`);
    return recordset[0]?.['Clio ID'] || null;
}
module.exports = { getClioId };