const { HTMLDataSystem } = require('../src/index');

async function runTests() {
    console.log('🧪 Running HTML Data System Tests\n');
    
    // Initialize the system
    const system = new HTMLDataSystem();
    const initialized = await system.initialize();
    
    if (!initialized) {
        console.error('❌ Failed to initialize system');
        return;
    }

    console.log('✅ System initialized successfully\n');

    // Test 1: Validate common elements
    console.log('📋 Test 1: Element Validation');
    const elementsToTest = ['div', 'span', 'a', 'img', 'invalid-element'];
    
    elementsToTest.forEach(element => {
        const result = system.validateElement(element);
        console.log(`  ${element}: ${result.isValid ? '✅' : '❌'} ${!result.isValid && result.suggestions.length > 0 ? `(suggestions: ${result.suggestions.join(', ')})` : ''}`);
    });

    console.log('\n📋 Test 2: Attribute Validation');
    const attributeTests = [
        ['img', 'src'],
        ['img', 'alt'],
        ['a', 'href'],
        ['div', 'id'],
        ['div', 'invalid-attr'],
        ['span', 'class']
    ];

    attributeTests.forEach(([element, attribute]) => {
        const result = system.validateAttribute(element, attribute);
        console.log(`  ${element}.${attribute}: ${result.isValid ? '✅' : '❌'} ${result.isGlobal ? '(global)' : ''}`);
    });

    console.log('\n📋 Test 3: Element Information');
    const divInfo = system.getElementInfo('div');
    if (divInfo) {
        console.log(`  div element found with ${divInfo.attributes.length} attributes`);
        console.log(`  Category: ${divInfo.category}`);
        console.log(`  Description: ${divInfo.description.substring(0, 100)}...`);
    } else {
        console.log('  ❌ div element not found');
    }

    console.log('\n📋 Test 4: Categories');
    const categories = system.getCategories();
    console.log(`  Found ${categories.length} categories:`);
    categories.slice(0, 5).forEach(cat => console.log(`    - ${cat}`));
    if (categories.length > 5) {
        console.log(`    ... and ${categories.length - 5} more`);
    }

    console.log('\n📋 Test 5: Search');
    const searchResults = system.searchElements('form');
    console.log(`  Search for "form" returned ${searchResults.length} results:`);
    searchResults.slice(0, 3).forEach(el => console.log(`    - ${el.name} (${el.category})`));

    console.log('\n📋 Test 6: Statistics');
    const stats = system.getStatistics();
    console.log(`  Total elements: ${stats.totalElements}`);
    console.log(`  Categories: ${stats.categories}`);

    console.log('\n🎉 All tests completed!');
}

// Handle errors gracefully
runTests().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
