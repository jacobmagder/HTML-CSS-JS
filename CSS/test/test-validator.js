const CSSValidator = require('../src/CSSValidator');

/**
 * CSS Validator Test Suite
 * Comprehensive tests for CSS validation functionality
 */

async function runTests() {
    console.log('CSS Validator Test Suite');
    console.log('========================');
    
    let totalTests = 0;
    let passedTests = 0;
    
    const validator = new CSSValidator();
    
    try {
        await validator.initialize();
        console.log('✅ Validator initialized successfully\\n');
    } catch (error) {
        console.error('❌ Failed to initialize validator:', error.message);
        return;
    }
    
    // Test property validation
    console.log('🧪 Testing Property Validation');
    console.log('------------------------------');
    
    const propertyTests = [
        { property: 'color', expected: true, description: 'Valid standard property' },
        { property: 'background-color', expected: true, description: 'Valid hyphenated property' },
        { property: 'display', expected: true, description: 'Valid layout property' },
        { property: 'font-size', expected: true, description: 'Valid typography property' },
        { property: 'margin', expected: true, description: 'Valid box model property' },
        { property: '--custom-color', expected: true, description: 'Valid custom property' },
        { property: '-webkit-transform', expected: true, description: 'Valid vendor prefix' },
        { property: '-moz-appearance', expected: true, description: 'Valid Mozilla prefix' },
        { property: 'invalid-property', expected: false, description: 'Invalid property' },
        { property: 'colr', expected: false, description: 'Typo in property name' },
        { property: '', expected: false, description: 'Empty property name' }
    ];
    
    propertyTests.forEach(test => {
        totalTests++;
        const result = validator.validateProperty(test.property);
        const passed = result.valid === test.expected;
        
        if (passed) {
            passedTests++;
            console.log(`  ✅ ${test.description}`);
        } else {
            console.log(`  ❌ ${test.description}`);
            console.log(`     Expected: ${test.expected}, Got: ${result.valid}`);
        }
        
        // Test suggestions for invalid properties
        if (!test.expected && result.suggestions.length > 0) {
            console.log(`     Suggestions: ${result.suggestions.join(', ')}`);
        }
    });
    
    // Test selector validation
    console.log('\\n🧪 Testing Selector Validation');
    console.log('-------------------------------');
    
    const selectorTests = [
        { selector: 'div', expected: true, description: 'Element selector' },
        { selector: '.my-class', expected: true, description: 'Class selector' },
        { selector: '#my-id', expected: true, description: 'ID selector' },
        { selector: '*', expected: true, description: 'Universal selector' },
        { selector: ':hover', expected: true, description: 'Pseudo-class selector' },
        { selector: '::before', expected: true, description: 'Pseudo-element selector' },
        { selector: '[type="text"]', expected: true, description: 'Attribute selector' },
        { selector: 'div p', expected: true, description: 'Descendant combinator' },
        { selector: 'div > p', expected: true, description: 'Child combinator' },
        { selector: 'h1 + p', expected: true, description: 'Adjacent sibling combinator' },
        { selector: 'h1 ~ p', expected: true, description: 'General sibling combinator' },
        { selector: '123invalid', expected: false, description: 'Invalid selector starting with number' },
        { selector: '.', expected: false, description: 'Incomplete class selector' },
        { selector: '#', expected: false, description: 'Incomplete ID selector' }
    ];
    
    selectorTests.forEach(test => {
        totalTests++;
        const result = validator.validateSelector(test.selector);
        const passed = result.valid === test.expected;
        
        if (passed) {
            passedTests++;
            console.log(`  ✅ ${test.description}`);
        } else {
            console.log(`  ❌ ${test.description}`);
            console.log(`     Expected: ${test.expected}, Got: ${result.valid}`);
        }
        
        if (result.valid && result.type) {
            console.log(`     Type: ${result.type}`);
        }
    });
    
    // Test function validation
    console.log('\\n🧪 Testing Function Validation');
    console.log('-------------------------------');
    
    const functionTests = [
        { function: 'calc()', expected: true, description: 'calc() function' },
        { function: 'rgb()', expected: true, description: 'rgb() function' },
        { function: 'linear-gradient()', expected: true, description: 'linear-gradient() function' },
        { function: 'blur()', expected: true, description: 'blur() function' },
        { function: 'min()', expected: true, description: 'min() function' },
        { function: 'max()', expected: true, description: 'max() function' },
        { function: 'invalid-function()', expected: false, description: 'Invalid function' }
    ];
    
    functionTests.forEach(test => {
        totalTests++;
        const result = validator.validateFunction(test.function);
        const passed = result.valid === test.expected;
        
        if (passed) {
            passedTests++;
            console.log(`  ✅ ${test.description}`);
        } else {
            console.log(`  ❌ ${test.description}`);
            console.log(`     Expected: ${test.expected}, Got: ${result.valid}`);
        }
    });
    
    // Test CSS rule validation
    console.log('\\n🧪 Testing CSS Rule Validation');
    console.log('-------------------------------');
    
    const ruleTests = [
        {
            rule: 'p { color: red; }',
            expectedValid: true,
            description: 'Simple valid rule'
        },
        {
            rule: '.my-class { background-color: blue; font-size: 16px; }',
            expectedValid: true,
            description: 'Class selector with multiple properties'
        },
        {
            rule: '#header { margin: 10px; padding: 5px; }',
            expectedValid: true,
            description: 'ID selector with box model properties'
        },
        {
            rule: 'div:hover { opacity: 0.8; }',
            expectedValid: true,
            description: 'Pseudo-class selector'
        },
        {
            rule: 'invalid rule format',
            expectedValid: false,
            description: 'Invalid rule format'
        },
        {
            rule: 'p { invalid-property: value; }',
            expectedValid: true, // Rule is valid but has warnings
            description: 'Valid rule with invalid property'
        }
    ];
    
    ruleTests.forEach(test => {
        totalTests++;
        const result = validator.validateRule(test.rule);
        const passed = result.valid === test.expectedValid;
        
        if (passed) {
            passedTests++;
            console.log(`  ✅ ${test.description}`);
        } else {
            console.log(`  ❌ ${test.description}`);
            console.log(`     Expected valid: ${test.expectedValid}, Got: ${result.valid}`);
        }
        
        if (result.errors.length > 0) {
            console.log(`     Errors: ${result.errors.length}`);
        }
        if (result.warnings.length > 0) {
            console.log(`     Warnings: ${result.warnings.length}`);
        }
    });
    
    // Test CSS document validation
    console.log('\\n🧪 Testing CSS Document Validation');
    console.log('-----------------------------------');
    
    const cssDocument = `
/* Simple CSS document for testing */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f0f0;
}

.header {
    background-color: #333;
    color: white;
    padding: 1rem;
    text-align: center;
}

.content {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.button:hover {
    background-color: #0056b3;
}

/* Invalid rule for testing */
.invalid {
    invalid-property: test;
    color: red;
}
    `;
    
    totalTests++;
    const docResult = validator.validateCSS(cssDocument);
    
    console.log(`CSS Document Validation Results:`);
    console.log(`  Status: ${docResult.valid ? 'Valid' : 'Invalid'}`);
    console.log(`  Rules: ${docResult.statistics.validRules}/${docResult.statistics.totalRules}`);
    console.log(`  Properties: ${docResult.statistics.validProperties}/${docResult.statistics.totalProperties}`);
    console.log(`  Errors: ${docResult.errors.length}`);
    console.log(`  Warnings: ${docResult.warnings.length}`);
    
    if (docResult.statistics.totalRules > 0) {
        passedTests++;
        console.log(`  ✅ CSS document parsed successfully`);
    } else {
        console.log(`  ❌ Failed to parse CSS document`);
    }
    
    // Test search functionality
    console.log('\\n🧪 Testing Search Functionality');
    console.log('--------------------------------');
    
    const searchTests = [
        { query: 'color', expectedResults: true, description: 'Search for color properties' },
        { query: 'background', expectedResults: true, description: 'Search for background properties' },
        { query: 'font', expectedResults: true, description: 'Search for font properties' },
        { query: 'margin', expectedResults: true, description: 'Search for margin properties' },
        { query: 'nonexistent', expectedResults: false, description: 'Search for non-existent properties' }
    ];
    
    searchTests.forEach(test => {
        totalTests++;
        const results = validator.searchProperties(test.query);
        const hasResults = results.length > 0;
        const passed = hasResults === test.expectedResults;
        
        if (passed) {
            passedTests++;
            console.log(`  ✅ ${test.description} (${results.length} results)`);
        } else {
            console.log(`  ❌ ${test.description}`);
            console.log(`     Expected results: ${test.expectedResults}, Got: ${hasResults}`);
        }
    });
    
    // Test statistics
    console.log('\\n🧪 Testing Statistics');
    console.log('---------------------');
    
    totalTests++;
    try {
        const stats = validator.getStatistics();
        
        if (stats.properties > 0 && stats.types > 0 && stats.categories > 0) {
            passedTests++;
            console.log(`  ✅ Statistics retrieved successfully`);
            console.log(`     Properties: ${stats.properties}`);
            console.log(`     Types: ${stats.types}`);
            console.log(`     Functions: ${stats.functions}`);
            console.log(`     Categories: ${stats.categories}`);
        } else {
            console.log(`  ❌ Invalid statistics`);
        }
    } catch (error) {
        console.log(`  ❌ Error getting statistics: ${error.message}`);
    }
    
    // Test error handling
    console.log('\\n🧪 Testing Error Handling');
    console.log('--------------------------');
    
    totalTests++;
    try {
        const uninitializedValidator = new CSSValidator();
        uninitializedValidator.validateProperty('color');
        console.log(`  ❌ Should have thrown error for uninitialized validator`);
    } catch (error) {
        passedTests++;
        console.log(`  ✅ Properly handles uninitialized validator`);
    }
    
    // Final results
    console.log('\\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\\n🎉 All tests passed! CSS Validator is working correctly.');
    } else {
        console.log(`\\n⚠️  ${totalTests - passedTests} test(s) failed. Please review the issues above.`);
    }
    
    return passedTests === totalTests;
}

// Run tests
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test suite error:', error);
        process.exit(1);
    });
}

module.exports = { runTests };
