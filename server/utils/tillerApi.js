const axios = require('axios');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const keyVaultName = process.env.KEY_VAULT_NAME || 'helixlaw-instructions';
const vaultUrl = `https://${keyVaultName}.vault.azure.net`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(vaultUrl, credential);

let cachedClientId;
let cachedClientSecret;
let cachedToken;
let tokenExpiry = 0;

async function getCredentials() {
    if (!cachedClientId || !cachedClientSecret) {
        const [id, secret] = await Promise.all([
            secretClient.getSecret('tiller-clientid'),
            secretClient.getSecret('tiller-clientsecret'),
        ]);
        cachedClientId = id.value;
        cachedClientSecret = secret.value;
    }
    return { clientId: cachedClientId, clientSecret: cachedClientSecret };
}

async function refreshToken() {
    const { clientId, clientSecret } = await getCredentials();
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'VerificationsAPI',
        client_id: clientId,
        client_secret: clientSecret,
    }).toString();

    console.log('▶️ Requesting Tiller token for', clientId);

    try {
        const res = await axios.post(
            'https://verify-auth.tiller-verify.com/connect/token',
            body,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
            }
        );

        console.log('◀️ Token status:', res.status);
        cachedToken = res.data.access_token;
        tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
        console.log('◀️ Token expires in:', res.data.expires_in);
        return cachedToken;
    } catch (err) {
        if (err.response) {
            console.error('❌ Token status:', err.response.status);
            console.error('❌ Token error data:', JSON.stringify(err.response.data));
        } else {
            console.error('❌ Token request error:', err.message);
        }
        throw err;
    }
}

async function getToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        console.log('ℹ️ Using cached Tiller token');
        return cachedToken;
    }
    return refreshToken();
}

async function submitVerification(instructionData) {
    const token = await getToken();
    const payload = buildTillerPayload(instructionData);
    console.log('▶️ Tiller payload built');
    try {
        const res = await axios.post(
            'https://verify-api.tiller-verify.com/api/v1/verifications',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('◀️ Tiller status:', res.status);
        console.log('◀️ Tiller response:', JSON.stringify(res.data));
        return res.data;
    } catch (err) {
        if (err.response) {
            console.error('❌ Tiller status:', err.response.status);
            console.error('❌ Tiller error data:', JSON.stringify(err.response.data));
        } else {
            console.error('❌ Tiller request error:', err.message);
        }
        console.error(
            '❌ Failed payload for',
            instructionData.instructionRef || instructionData.InstructionRef
        );
        throw err;
    }
}

// Reference data for building Tiller payload
const titles = [
    { id: 1, name: 'Mr', code: 'Mr' },
    { id: 2, name: 'Mrs', code: 'Mrs' },
    { id: 3, name: 'Miss', code: 'Miss' },
    { id: 4, name: 'Ms', code: 'Ms' },
    { id: 5, name: 'Dr', code: 'Dr' }
];

const genders = [
    { id: 1, name: 'Male', code: 'M' },
    { id: 2, name: 'Female', code: 'F' }
];

function findIdByName(list, name) {
    if (!name) return undefined;
    const lower = String(name).toLowerCase();
    const entry = list.find(i => i.name.toLowerCase() === lower || i.code === name);
    return entry ? entry.id : undefined;
}

function buildTillerPayload(data) {
    const get = (...keys) => {
        for (const k of keys) {
            if (data[k] != null) return data[k];
        }
        return undefined;
    };

    const profile = {
        titleId: findIdByName(titles, get('title', 'Title')),
        genderTypeId: findIdByName(genders, get('gender', 'Gender')),
        firstName: get('firstName', 'FirstName'),
        lastName: get('lastName', 'LastName'),
        dateOfBirth: get('dob', 'DOB'),
        mobileNumber: get('phone', 'Phone'),
        email: get('email', 'Email'),
        cardTypes: [],
        currentAddress: {
            structured: {
                buildingNumber: get('houseNumber', 'HouseNumber'),
                roadStreet: get('street', 'Street'),
                townCity: get('city', 'City'),
                stateProvinceName: get('county', 'County'),
                postZipCode: get('postcode', 'Postcode'),
                countryCode: get('countryCode', 'CountryCode') || get('country', 'Country')
            }
        }
    };

    const passport = get('passportNumber', 'PassportNumber');
    if (passport) {
        profile.cardTypes.push({ cardTypeId: 1, cardNumber: passport });
    }
    const drivers = get('driversLicenseNumber', 'DriversLicenseNumber');
    if (drivers) {
        profile.cardTypes.push({ cardTypeId: 4, cardNumber: drivers });
    }

    return {
        externalReferenceId: '18207',
        runAsync: 'True',
        mock: 'True', // Enable mock mode for testing
        checks: [
            { checkTypeId: 1, maximumSources: 3, CheckMethod: 1, matchesRequired: 1 },
            { checkTypeId: 2 }
        ],
        profile
    };
}

module.exports = { submitVerification, buildTillerPayload };
