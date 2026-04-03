/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['**/tests/**/*.test.js'],
    transform: {
        '^.+\\.m?js$': ['babel-jest', { configFile: './babel.config.js' }],
    },
    moduleFileExtensions: ['js', 'mjs'],
    collectCoverageFrom: [
        'src/lib/utils/**/*.js',
        'src/lib/ChatStorageManager.js',
        'src/lib/supabase/SupabaseManager.js',
        'src/lib/chatnest/typing/typeWriter.js',
        'src/lib/chatnest/storage/loadChatHistory.js',
        'src/lib/chatnest/api/sendMessage.js',
    ],
    coverageReporters: ['text', 'lcov'],
    verbose: true,
};
