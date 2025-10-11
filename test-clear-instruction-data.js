/**
 * Test script to verify the matter opening workflow correctly clears 
 * and reloads instruction data when clearing drafts
 */

console.log('Testing matter opening draft clearing for instruction context...');

// Simulate localStorage state before clear
const testKeys = [
    'matterOpeningDraft_activePoid',
    'matterOpeningDraft_selectedPoidIds',
    'matterOpeningDraft_description',
    'matterOpeningDraft_areaOfWork'
];

// Set test data
testKeys.forEach(key => {
    localStorage.setItem(key, JSON.stringify(key === 'matterOpeningDraft_activePoid' ? 
        { poid_id: 'TEST_USER', first: 'Test', last: 'User', InstructionRef: 'HLX-28145-99286' } :
        'test_value'));
});

console.log('Before clear:');
testKeys.forEach(key => {
    console.log(`  ${key}: ${localStorage.getItem(key)}`);
});

// Import and test the clearing function
import('./src/app/functionality/matterOpeningUtils.js').then(module => {
    console.log('\nClearing draft data...');
    module.clearMatterOpeningDraft();
    
    console.log('\nAfter clear:');
    testKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value || 'NULL (cleared)'}`);
    });
    
    const allCleared = testKeys.every(key => !localStorage.getItem(key));
    console.log(`\nTest result: ${allCleared ? 'PASS - All data cleared' : 'FAIL - Some data remains'}`);
}).catch(err => {
    console.error('Error testing:', err);
});