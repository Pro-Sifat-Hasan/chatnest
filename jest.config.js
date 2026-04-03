/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {
        '^.+\\.m?[jt]s$': ['babel-jest', { configFile: './babel.config.js' }],
    },
    moduleFileExtensions: ['ts', 'js', 'mjs'],
    moduleNameMapper: {
        '^(.*)\\.js$': ['$1.ts', '$1.js']
    },
    collectCoverageFrom: [
        'src/lib/utils/**/*.ts',
        'src/lib/ChatStorageManager.ts',
        'src/lib/supabase/SupabaseManager.ts',
        'src/lib/chatnest/typing/typeWriter.ts',
        'src/lib/chatnest/storage/loadChatHistory.ts',
        'src/lib/chatnest/api/sendMessage.ts',
    ],
    coverageReporters: ['text', 'lcov'],
    verbose: true,
};
