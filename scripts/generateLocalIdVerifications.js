const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src', 'localData');
const instructionPath = path.join(dataDir, 'localInstructionData.json');
const outputPath = path.join(dataDir, 'localIdVerifications.json');

function loadJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function mergeData() {
    const dataset = loadJson(instructionPath);
    if (!Array.isArray(dataset)) {
        console.error('localInstructionData.json is malformed');
        process.exit(1);
    }

    const records = [];

    for (const prospect of dataset) {
        const byRef = {};
        for (const inst of prospect.instructions || []) {
            byRef[inst.InstructionRef] = inst;
        }

        for (const v of prospect.idVerifications || []) {
            const inst = byRef[v.InstructionRef] || {};
            const entry = { ...v };

            entry.FirstName = inst.FirstName || null;
            entry.LastName = inst.LastName || null;
            entry.Email = inst.Email || null;
            entry.Nationality = inst.Nationality || null;
            entry.NationalityAlpha2 = inst.NationalityAlpha2 || null;
            entry.DOB = inst.DOB || null;
            entry.PassportNumber = inst.PassportNumber || null;
            entry.DriversLicenseNumber = inst.DriversLicenseNumber || null;
            entry.HouseNumber = inst.HouseNumber || null;
            entry.Street = inst.Street || null;
            entry.City = inst.City || null;
            entry.County = inst.County || null;
            entry.Postcode = inst.Postcode || null;
            entry.Country = inst.Country || null;
            entry.CountryCode = inst.CountryCode || null;

            if (inst.CompanyName) entry.CompanyName = inst.CompanyName;
            if (inst.CompanyNumber) entry.CompanyNumber = inst.CompanyNumber;
            if (inst.CompanyHouseNumber) entry.CompanyHouseNumber = inst.CompanyHouseNumber;
            if (inst.CompanyStreet) entry.CompanyStreet = inst.CompanyStreet;
            if (inst.CompanyCity) entry.CompanyCity = inst.CompanyCity;
            if (inst.CompanyCounty) entry.CompanyCounty = inst.CompanyCounty;
            if (inst.CompanyPostcode) entry.CompanyPostcode = inst.CompanyPostcode;
            if (inst.CompanyCountry) entry.CompanyCountry = inst.CompanyCountry;
            if (inst.CompanyCountryCode) entry.CompanyCountryCode = inst.CompanyCountryCode;

            records.push(entry);
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
    console.log(`localIdVerifications.json generated with ${records.length} records`);
}

mergeData();
