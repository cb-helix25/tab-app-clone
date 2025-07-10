const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'localData');
const instructionPath = path.join(dataDir, 'localInstructionData.json');
const riskAssessmentPath = path.join(dataDir, 'localRiskAssessments.json');

function loadJson(p) {
    if (!fs.existsSync(p)) {
        console.error(`File not found: ${p}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function mergeRiskAssessmentData() {
    const instructionData = loadJson(instructionPath);
    const riskAssessmentData = loadJson(riskAssessmentPath);
    
    if (!Array.isArray(instructionData)) {
        console.error('localInstructionData.json is malformed');
        process.exit(1);
    }
    
    if (!Array.isArray(riskAssessmentData)) {
        console.error('localRiskAssessments.json is malformed');
        process.exit(1);
    }

    // Create a lookup map of risk assessments by MatterId
    const riskAssessmentMap = {};
    riskAssessmentData.forEach(risk => {
        if (risk.MatterId) {
            riskAssessmentMap[risk.MatterId] = risk;
        }
    });

    // Update each prospect's risk assessments
    instructionData.forEach(prospect => {
        if (prospect.instructions) {
            prospect.instructions.forEach(instruction => {
                const riskAssessment = riskAssessmentMap[instruction.InstructionRef];
                if (riskAssessment) {
                    // Initialize riskAssessments array if it doesn't exist
                    if (!prospect.riskAssessments) {
                        prospect.riskAssessments = [];
                    }
                    
                    // Clear existing risk assessments for this instruction
                    prospect.riskAssessments = prospect.riskAssessments.filter(
                        r => r.MatterId !== instruction.InstructionRef
                    );
                    
                    // Add the new risk assessment
                    prospect.riskAssessments.push(riskAssessment);
                }
            });
        }
    });

    fs.writeFileSync(instructionPath, JSON.stringify(instructionData, null, 2));
    console.log(`Updated localInstructionData.json with ${riskAssessmentData.length} risk assessments`);
}

mergeRiskAssessmentData();
