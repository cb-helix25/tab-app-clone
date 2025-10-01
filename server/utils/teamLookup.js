const { createEnvBasedQueryRunner } = require('./sqlHelpers');

const runTeamQuery = createEnvBasedQueryRunner('SQL_CONNECTION_STRING');

async function getClioId(initials) {
    const result = await runTeamQuery((request, s) =>
        request
            .input('initials', s.NVarChar, initials)
            .query('SELECT [Clio ID] FROM dbo.team WHERE Initials = @initials')
    );

    return result.recordset?.[0]?.['Clio ID'] || null;
}

module.exports = { getClioId };