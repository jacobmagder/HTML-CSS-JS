#!/usr/bin/env node

const { JavaScriptDataSystem } = require('../src/index');

class JavaScriptValidatorTest {
    constructor() {
        this.system = null;
        this.passedTests = 0;
        this.failedTests = 0;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('JavaScript Validator Test Suite');
        console.log('==============================');
        console.log('');

        try {
            this.system = new JavaScriptDataSystem();
            await this.system.initialize();
            console.log('✅ System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize system:', error.message);
            process.exit(1);
        }

        // Run all test categories
        await this.testSyntaxValidation();
        await this.testObjectValidation();
        await this.testMethodValidation();
        await this.testKeywordValidation();
        await this.testObjectInfo();
        await this.testMethodInfo();
        await this.testCategories();
        await this.testSearch();
        await this.testStats();

        this.printSummary();
    }

    async testSyntaxValidation() {
        console.log('\\nTesting Syntax Validation...');
        
        const testCases = [
            {
                name: 'Valid variable declaration',
                code: 'const x = 42;',
                shouldBeValid: true
            },
            {
                name: 'Valid function declaration',
                code: 'function test() { return true; }',
                shouldBeValid: true
            },
            {
                name: 'Valid class declaration',
                code: 'class MyClass { constructor() {} }',
                shouldBeValid: true
            },
            {
                name: 'Valid async function',
                code: 'async function fetchData() { return await Promise.resolve(42); }',
                shouldBeValid: true
            },
            {
                name: 'Mismatched brackets',
                code: 'function test() { return true;',
                shouldBeValid: false
            },
            {
                name: 'Extra closing bracket',
                code: 'function test() { return true; }}',
                shouldBeValid: false
            }
        ];

        for (const testCase of testCases) {
            const result = this.system.validateSyntax(testCase.code);
            const passed = result.valid === testCase.shouldBeValid;
            
            this.recordTest(
                `Syntax: ${testCase.name}`,
                passed,
                passed ? 'Validation result as expected' : 
                `Expected valid: ${testCase.shouldBeValid}, got: ${result.valid}`
            );
        }
    }

    async testObjectValidation() {
        console.log('\\nTesting Object Validation...');
        
        const testCases = [
            { object: 'Array', shouldExist: true },
            { object: 'String', shouldExist: true },
            { object: 'Object', shouldExist: true },
            { object: 'Promise', shouldExist: true },
            { object: 'Date', shouldExist: true },
            { object: 'Math', shouldExist: true },
            { object: 'NonExistentObject', shouldExist: false },
            { object: 'array', shouldExist: false }, // lowercase
            { object: 'InvalidObject123', shouldExist: false }
        ];

        for (const testCase of testCases) {
            const result = this.system.validateObject(testCase.object);
            const passed = result.exists === testCase.shouldExist;
            
            this.recordTest(
                `Object validation: ${testCase.object}`,
                passed,
                passed ? 'Object existence as expected' : 
                `Expected exists: ${testCase.shouldExist}, got: ${result.exists}`
            );
        }
    }

    async testMethodValidation() {
        console.log('\\nTesting Method Validation...');
        
        const testCases = [
            { object: 'Array', method: 'map', shouldExist: true },
            { object: 'Array', method: 'filter', shouldExist: true },
            { object: 'Array', method: 'push', shouldExist: true },
            { object: 'Array', method: 'isArray', shouldExist: true }, // static method
            { object: 'String', method: 'charAt', shouldExist: true },
            { object: 'String', method: 'substring', shouldExist: true },
            { object: 'Promise', method: 'then', shouldExist: true },
            { object: 'Array', method: 'nonExistentMethod', shouldExist: false },
            { object: 'NonExistentObject', method: 'someMethod', shouldExist: false }
        ];

        for (const testCase of testCases) {
            const result = this.system.validateMethod(testCase.object, testCase.method);
            const passed = result.exists === testCase.shouldExist;
            
            this.recordTest(
                `Method validation: ${testCase.object}.${testCase.method}`,
                passed,
                passed ? 'Method existence as expected' : 
                `Expected exists: ${testCase.shouldExist}, got: ${result.exists}`
            );
        }
    }

    async testKeywordValidation() {
        console.log('\\nTesting Keyword Validation...');
        
        const testCases = [
            { keyword: 'const', shouldExist: true },
            { keyword: 'let', shouldExist: true },
            { keyword: 'var', shouldExist: true },
            { keyword: 'function', shouldExist: true },
            { keyword: 'class', shouldExist: true },
            { keyword: 'if', shouldExist: true },
            { keyword: 'for', shouldExist: true },
            { keyword: 'while', shouldExist: true },
            { keyword: 'async', shouldExist: true },
            { keyword: 'await', shouldExist: true },
            { keyword: 'invalidKeyword', shouldExist: false },
            { keyword: 'notAKeyword123', shouldExist: false }
        ];

        for (const testCase of testCases) {
            const result = this.system.validateKeyword(testCase.keyword);
            const passed = result.exists === testCase.shouldExist;
            
            this.recordTest(
                `Keyword validation: ${testCase.keyword}`,
                passed,
                passed ? 'Keyword existence as expected' : 
                `Expected exists: ${testCase.shouldExist}, got: ${result.exists}`
            );
        }
    }

    async testObjectInfo() {
        console.log('\\nTesting Object Info Retrieval...');
        
        const testCases = ['Array', 'String', 'Object', 'Promise'];

        for (const objectName of testCases) {
            const info = this.system.getObjectInfo(objectName);
            const passed = info !== null && 
                          info.name === objectName && 
                          info.description && 
                          info.description.length > 0 &&
                          typeof info.methodCount === 'number' &&
                          typeof info.propertyCount === 'number';
            
            this.recordTest(
                `Object info: ${objectName}`,
                passed,
                passed ? 'Object info retrieved successfully' : 
                'Failed to retrieve valid object info'
            );
        }

        // Test non-existent object
        const nonExistentInfo = this.system.getObjectInfo('NonExistentObject');
        this.recordTest(
            'Object info: NonExistentObject',
            nonExistentInfo === null,
            nonExistentInfo === null ? 'Correctly returned null for non-existent object' : 
            'Should return null for non-existent object'
        );
    }

    async testMethodInfo() {
        console.log('\\nTesting Method Info Retrieval...');
        
        const testCases = [
            { object: 'Array', method: 'map' },
            { object: 'Array', method: 'filter' },
            { object: 'String', method: 'charAt' },
            { object: 'Promise', method: 'then' }
        ];

        for (const testCase of testCases) {
            const info = this.system.getMethodInfo(testCase.object, testCase.method);
            const passed = info !== null && 
                          info.name === testCase.method && 
                          info.objectName === testCase.object &&
                          info.description && 
                          info.description.length > 0;
            
            this.recordTest(
                `Method info: ${testCase.object}.${testCase.method}`,
                passed,
                passed ? 'Method info retrieved successfully' : 
                'Failed to retrieve valid method info'
            );
        }

        // Test non-existent method
        const nonExistentInfo = this.system.getMethodInfo('Array', 'nonExistentMethod');
        this.recordTest(
            'Method info: Array.nonExistentMethod',
            nonExistentInfo === null,
            nonExistentInfo === null ? 'Correctly returned null for non-existent method' : 
            'Should return null for non-existent method'
        );
    }

    async testCategories() {
        console.log('\\nTesting Categories Retrieval...');
        
        const categories = this.system.getCategories();
        const passed = Array.isArray(categories) && 
                      categories.length > 0 && 
                      categories.every(cat => 
                          cat.name && 
                          typeof cat.objectCount === 'number' && 
                          typeof cat.keywordCount === 'number'
                      );
        
        this.recordTest(
            'Categories retrieval',
            passed,
            passed ? `Retrieved ${categories.length} categories successfully` : 
            'Failed to retrieve valid categories'
        );

        // Test for expected categories
        const expectedCategories = ['Core Language Syntax', 'Built-in Objects', 'Collections', 'Promises and Async'];
        const categoryNames = categories.map(cat => cat.name);
        
        for (const expected of expectedCategories) {
            const found = categoryNames.includes(expected);
            this.recordTest(
                `Category exists: ${expected}`,
                found,
                found ? 'Category found' : 'Expected category not found'
            );
        }
    }

    async testSearch() {
        console.log('\\nTesting Search Functionality...');
        
        const testCases = [
            { query: 'array', expectResults: true },
            { query: 'promise', expectResults: true },
            { query: 'string', expectResults: true },
            { query: 'function', expectResults: true },
            { query: 'xyzInvalidQuery123', expectResults: false }
        ];

        for (const testCase of testCases) {
            const results = this.system.search(testCase.query);
            const hasResults = (results.objects.length + results.methods.length + 
                              results.keywords.length + results.properties.length) > 0;
            const passed = hasResults === testCase.expectResults;
            
            this.recordTest(
                `Search: "${testCase.query}"`,
                passed,
                passed ? 
                (hasResults ? `Found results for search query` : 'Correctly found no results') :
                `Expected results: ${testCase.expectResults}, got results: ${hasResults}`
            );
        }
    }

    async testStats() {
        console.log('\\nTesting Statistics Retrieval...');
        
        const stats = this.system.getStats();
        const passed = stats && 
                      typeof stats.totalCategories === 'number' && 
                      typeof stats.totalObjects === 'number' && 
                      typeof stats.totalKeywords === 'number' && 
                      typeof stats.totalMethods === 'number' &&
                      stats.version &&
                      stats.lastUpdated;
        
        this.recordTest(
            'Statistics retrieval',
            passed,
            passed ? 
            `Retrieved stats: ${stats.totalObjects} objects, ${stats.totalMethods} methods` : 
            'Failed to retrieve valid statistics'
        );
    }

    recordTest(testName, passed, message) {
        if (passed) {
            this.passedTests++;
            console.log(`  ✅ ${testName}`);
        } else {
            this.failedTests++;
            console.log(`  ❌ ${testName}: ${message}`);
        }
        
        this.testResults.push({
            name: testName,
            passed,
            message
        });
    }

    printSummary() {
        console.log('\\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        
        const totalTests = this.passedTests + this.failedTests;
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${this.passedTests}`);
        console.log(`Failed: ${this.failedTests}`);
        console.log(`Success Rate: ${((this.passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\\n❌ Failed Tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach((result, index) => {
                    console.log(`  ${index + 1}. ${result.name}: ${result.message}`);
                });
        }
        
        console.log('\\n' + '='.repeat(60));
        
        if (this.failedTests === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log(`💥 ${this.failedTests} test(s) failed.`);
            process.exit(1);
        }
    }
}

async function main() {
    const testSuite = new JavaScriptValidatorTest();
    await testSuite.runAllTests();
}

if (require.main === module) {
    main();
}

module.exports = JavaScriptValidatorTest;
