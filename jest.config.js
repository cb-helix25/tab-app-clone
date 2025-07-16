module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
    moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy'
    }
};