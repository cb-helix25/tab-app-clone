const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'localData', 'localInstructionData.json');

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

if (!Array.isArray(data) || !data.length) {
    console.error('localInstructionData.json is empty or not in expected format');
    process.exit(1);
}

const instructionRefs = (data[0].instructions || [])
    .map(i => i.InstructionRef)
    .filter(Boolean);

const riskLevels = ['Low', 'Low', 'Medium', 'High'];
const riskAssessments = instructionRefs.map((ref, idx) => ({
    MatterId: ref,
    RiskAssessor: 'Local Tester',
    ComplianceDate: new Date().toISOString().split('T')[0],
    RiskAssessmentResult: riskLevels[idx % riskLevels.length],
    RiskScore: (idx + 1) * 5,
    TransactionRiskLevel: `${riskLevels[idx % riskLevels.length]} Risk`,
    ClientRiskFactorsConsidered: true,
    TransactionRiskFactorsConsidered: true,
    FirmWideAMLPolicyConsidered: true,
    FirmWideSanctionsRiskConsidered: true
}));

const eidStatuses = ['verified', 'pending', 'verified', 'verified'];
const electronicIDChecks = instructionRefs.map((ref, idx) => ({
    MatterId: ref,
    EIDStatus: eidStatuses[idx % eidStatuses.length]
}));

data[0].riskAssessments = riskAssessments;
data[0].electronicIDChecks = electronicIDChecks;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`Local risk assessment data generated: ${riskAssessments.length} records`);

