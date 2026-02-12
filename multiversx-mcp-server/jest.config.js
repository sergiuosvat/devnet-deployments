/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/index.ts',
        '!src/server.ts',
        '!src/http.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 90,
            statements: 90
        }
    },
    modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/src/__tests__/e2e/"]
};
