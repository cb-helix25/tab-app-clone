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

const complianceStatuses = ['pass', 'pass', 'pending', 'fail'];
const compliance = instructionRefs.map((ref, idx) => {
    const today = new Date();
    const expiry = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
    const status = complianceStatuses[idx % complianceStatuses.length];
    return {
        MatterId: ref,
        ComplianceDate: today.toISOString().split('T')[0],
        ComplianceExpiry: expiry.toISOString().split('T')[0],
        CheckId: idx + 1,
        CheckResult: status,
        PEPandSanctionsCheckResult: status === 'fail' ? 'Failed' : 'Passed',
        AddressVerificationCheckResult: idx % 2 === 0 ? 'Passed' : 'Failed',
        Status: status
    };
});

const idVerifications = instructionRefs.map((ref, idx) => {
    const resultOptions = ['Review', 'Passed', 'Failed'];
    return {
        MatterId: ref,
        EIDCheckId: `id-${idx + 1}`,
        EIDStatus: 'completed',
        EIDOverallResult: resultOptions[idx % resultOptions.length],
        PEPAndSanctionsCheckResult: idx % 2 === 0 ? 'Passed' : 'Failed',
        AddressVerificationResult: idx % 2 === 0 ? 'Passed' : 'Review',
        EIDCheckedDate: new Date().toISOString().split('T')[0],
    };
});

data[0].riskAssessments = riskAssessments;
data[0].electronicIDChecks = electronicIDChecks;
data[0].compliance = compliance;
data[0].idVerifications = idVerifications;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(
    `Local risk assessment and ID verification data generated: ${riskAssessments.length} records`
);

