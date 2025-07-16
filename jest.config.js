module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
    transform: {
        '^.+\\.[tj]sx?$': 'ts-jest'
    },
    moduleNameMapper: {
        '\\.(css|less|scss)$': 'identity-obj-proxy',
        '\\.(svg|png|jpg|jpeg)$': 'identity-obj-proxy'
    }
};