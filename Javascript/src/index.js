#!/usr/bin/env node

const JavaScriptValidator = require('./JavaScriptValidator');

class JavaScriptDataSystem {
    constructor() {
        this.validator = new JavaScriptValidator();
        this.initialized = false;
    }

    async initialize() {
        await this.validator.initialize();
        this.initialized = true;
        return this;
    }

    // Validate JavaScript syntax
    validateSyntax(code) {
        this.ensureInitialized();
        return this.validator.validateSyntax(code);
    }

    // Validate object existence
    validateObject(objectName) {
        this.ensureInitialized();
        return this.validator.validateObject(objectName);
    }

    // Validate method existence
    validateMethod(objectName, methodName) {
        this.ensureInitialized();
        return this.validator.validateMethod(objectName, methodName);
    }

    // Validate keyword
    validateKeyword(keyword) {
        this.ensureInitialized();
        return this.validator.validateKeyword(keyword);
    }

    // Get object information
    getObjectInfo(objectName) {
        this.ensureInitialized();
        return this.validator.getObjectInfo(objectName);
    }

    // Get method information
    getMethodInfo(objectName, methodName) {
        this.ensureInitialized();
        return this.validator.getMethodInfo(objectName, methodName);
    }

    // Get all categories
    getCategories() {
        this.ensureInitialized();
        return this.validator.getCategories();
    }

    // Search for features
    search(query) {
        this.ensureInitialized();
        return this.validator.search(query);
    }

    // Get system statistics
    getStats() {
        this.ensureInitialized();
        return this.validator.getStats();
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('System not initialized. Call initialize() first.');
        }
    }
}

// CLI Interface
async function runCLI() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log('JavaScript Language Data System');
        console.log('===============================');
        console.log('\nAvailable commands:');
        console.log('  validate-syntax <code>     - Validate JavaScript syntax');
        console.log('  validate-object <object>   - Check if object exists');
        console.log('  validate-method <obj> <method> - Check if method exists');
        console.log('  validate-keyword <keyword> - Check if keyword is valid');
        console.log('  object-info <object>       - Get object information');
        console.log('  method-info <obj> <method> - Get method information');
        console.log('  categories                 - List all categories');
        console.log('  stats                      - Show system statistics');
        console.log('  search <query>             - Search for features');
        console.log('\nExamples:');
        console.log('  node src/index.js validate-syntax "const x = 42;"');
        console.log('  node src/index.js object-info Array');
        console.log('  node src/index.js method-info Array map');
        console.log('  node src/index.js search "promise"');
        return;
    }

    try {
        const system = new JavaScriptDataSystem();
        await system.initialize();

        switch (command) {
            case 'validate-syntax':
                const code = args[1];
                if (!code) {
                    console.error('Error: Please provide JavaScript code to validate');
                    process.exit(1);
                }
                const syntaxResult = system.validateSyntax(code);
                console.log('Syntax Validation Result:');
                console.log(`Valid: ${syntaxResult.valid}`);
                if (syntaxResult.errors.length > 0) {
                    console.log('Errors:');
                    syntaxResult.errors.forEach(error => console.log(`  - ${error}`));
                }
                if (syntaxResult.warnings.length > 0) {
                    console.log('Warnings:');
                    syntaxResult.warnings.forEach(warning => console.log(`  - ${warning}`));
                }
                if (syntaxResult.usedFeatures.length > 0) {
                    console.log('Detected Features:');
                    syntaxResult.usedFeatures.forEach(feature => console.log(`  - ${feature}`));
                }
                break;

            case 'validate-object':
                const objectName = args[1];
                if (!objectName) {
                    console.error('Error: Please provide object name');
                    process.exit(1);
                }
                const objectResult = system.validateObject(objectName);
                console.log(`Object '${objectName}': ${objectResult.exists ? 'EXISTS' : 'NOT FOUND'}`);
                if (!objectResult.exists && objectResult.suggestion.length > 0) {
                    console.log('Did you mean:');
                    objectResult.suggestion.forEach(suggestion => console.log(`  - ${suggestion}`));
                }
                break;

            case 'validate-method':
                const objName = args[1];
                const methodName = args[2];
                if (!objName || !methodName) {
                    console.error('Error: Please provide both object name and method name');
                    process.exit(1);
                }
                const methodResult = system.validateMethod(objName, methodName);
                if (methodResult.exists) {
                    console.log(`Method '${objName}.${methodName}': EXISTS`);
                    console.log(`Type: ${methodResult.isStatic ? 'Static' : 'Instance'} method`);
                } else {
                    console.log(`Method '${objName}.${methodName}': NOT FOUND`);
                    if (methodResult.error) {
                        console.log(`Error: ${methodResult.error}`);
                    }
                    if (methodResult.suggestion && methodResult.suggestion.length > 0) {
                        console.log('Did you mean:');
                        methodResult.suggestion.forEach(suggestion => console.log(`  - ${suggestion}`));
                    }
                }
                break;

            case 'validate-keyword':
                const keyword = args[1];
                if (!keyword) {
                    console.error('Error: Please provide keyword');
                    process.exit(1);
                }
                const keywordResult = system.validateKeyword(keyword);
                console.log(`Keyword '${keyword}': ${keywordResult.exists ? 'VALID' : 'INVALID'}`);
                if (!keywordResult.exists && keywordResult.suggestion.length > 0) {
                    console.log('Did you mean:');
                    keywordResult.suggestion.forEach(suggestion => console.log(`  - ${suggestion}`));
                }
                break;

            case 'object-info':
                const infoObjectName = args[1];
                if (!infoObjectName) {
                    console.error('Error: Please provide object name');
                    process.exit(1);
                }
                const objectInfo = system.getObjectInfo(infoObjectName);
                if (!objectInfo) {
                    console.log(`Object '${infoObjectName}' not found`);
                    break;
                }
                console.log(`Object: ${objectInfo.name}`);
                console.log(`Description: ${objectInfo.description}`);
                console.log(`Category: ${objectInfo.category} > ${objectInfo.subcategory}`);
                console.log(`Properties: ${objectInfo.propertyCount}`);
                console.log(`Instance Methods: ${objectInfo.methodCount}`);
                console.log(`Static Methods: ${objectInfo.staticMethodCount}`);
                
                if (objectInfo.properties.length > 0) {
                    console.log('\nProperties:');
                    objectInfo.properties.forEach(prop => {
                        console.log(`  ${prop.name}: ${prop.description}`);
                    });
                }
                
                if (objectInfo.methods.length > 0) {
                    console.log('\nInstance Methods:');
                    objectInfo.methods.forEach(method => {
                        console.log(`  ${method.name}(): ${method.description}`);
                    });
                }
                
                if (objectInfo.staticMethods.length > 0) {
                    console.log('\nStatic Methods:');
                    objectInfo.staticMethods.forEach(method => {
                        console.log(`  ${method.name}(): ${method.description}`);
                    });
                }
                break;

            case 'method-info':
                const methodObjName = args[1];
                const methodInfoName = args[2];
                if (!methodObjName || !methodInfoName) {
                    console.error('Error: Please provide both object name and method name');
                    process.exit(1);
                }
                const methodInfo = system.getMethodInfo(methodObjName, methodInfoName);
                if (!methodInfo) {
                    console.log(`Method '${methodObjName}.${methodInfoName}' not found`);
                    break;
                }
                console.log(`Method: ${methodInfo.objectName}.${methodInfo.name}()`);
                console.log(`Description: ${methodInfo.description}`);
                console.log(`Type: ${methodInfo.isStatic ? 'Static' : 'Instance'} method`);
                break;

            case 'categories':
                const categories = system.getCategories();
                console.log('JavaScript Language Categories:');
                console.log('==============================');
                categories.forEach(category => {
                    console.log(`\\n${category.name}:`);
                    console.log(`  Objects: ${category.objectCount}`);
                    console.log(`  Keywords: ${category.keywordCount}`);
                    console.log(`  Subcategories: ${category.subcategoryCount}`);
                    if (category.subcategories.length > 0) {
                        console.log(`  Subcategories: ${category.subcategories.join(', ')}`);
                    }
                });
                break;

            case 'stats':
                const stats = system.getStats();
                console.log('JavaScript Language Data Statistics:');
                console.log('===================================');
                console.log(`Version: ${stats.version}`);
                console.log(`Last Updated: ${stats.lastUpdated}`);
                console.log(`Total Categories: ${stats.totalCategories}`);
                console.log(`Total Objects: ${stats.totalObjects}`);
                console.log(`Total Keywords: ${stats.totalKeywords}`);
                console.log(`Total Methods: ${stats.totalMethods}`);
                break;

            case 'search':
                const query = args[1];
                if (!query) {
                    console.error('Error: Please provide search query');
                    process.exit(1);
                }
                const searchResults = system.search(query);
                console.log(`Search Results for "${query}":`);
                console.log('=============================');
                
                if (searchResults.objects.length > 0) {
                    console.log('\\nObjects:');
                    searchResults.objects.forEach(obj => {
                        console.log(`  ${obj.name}: ${obj.description} (${obj.category})`);
                    });
                }
                
                if (searchResults.methods.length > 0) {
                    console.log('\\nMethods:');
                    searchResults.methods.forEach(method => {
                        console.log(`  ${method.objectName}.${method.name}(): ${method.description}`);
                    });
                }
                
                if (searchResults.keywords.length > 0) {
                    console.log('\\nKeywords:');
                    searchResults.keywords.forEach(keyword => {
                        console.log(`  ${keyword.name}: ${keyword.description} (${keyword.category})`);
                    });
                }
                
                if (searchResults.properties.length > 0) {
                    console.log('\\nProperties:');
                    searchResults.properties.forEach(prop => {
                        console.log(`  ${prop.objectName}.${prop.name}: ${prop.description}`);
                    });
                }
                
                const totalResults = searchResults.objects.length + searchResults.methods.length + 
                                   searchResults.keywords.length + searchResults.properties.length;
                console.log(`\\nTotal results: ${totalResults}`);
                break;

            default:
                console.error(`Unknown command: ${command}`);
                console.log('Run without arguments to see available commands');
                process.exit(1);
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    runCLI();
}

module.exports = { JavaScriptDataSystem, JavaScriptValidator };
