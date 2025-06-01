#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class JavaScriptDataValidator {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/js-language.json');
        this.data = null;
        this.errors = [];
        this.warnings = [];
    }

    async validate() {
        console.log('JavaScript Data Validator');
        console.log('========================');

        if (!fs.existsSync(this.dataPath)) {
            console.error(`Error: Data file not found: ${this.dataPath}`);
            console.log('Run "npm run build" to generate the data file.');
            process.exit(1);
        }

        try {
            this.data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        } catch (error) {
            console.error('Error parsing JSON data:', error.message);
            process.exit(1);
        }

        console.log('\\nValidating JavaScript language data...');

        this.validateStructure();
        this.validateCategories();
        this.validateObjects();
        this.validateKeywords();
        this.validateMetadata();
        this.validateConsistency();

        this.reportResults();
    }

    validateStructure() {
        console.log('Checking data structure...');

        const requiredFields = ['categories', 'objects', 'keywords', 'metadata'];
        requiredFields.forEach(field => {
            if (!this.data[field]) {
                this.errors.push(`Missing required field: ${field}`);
            }
        });

        if (typeof this.data.categories !== 'object') {
            this.errors.push('categories should be an object');
        }

        if (typeof this.data.objects !== 'object') {
            this.errors.push('objects should be an object');
        }

        if (typeof this.data.keywords !== 'object') {
            this.errors.push('keywords should be an object');
        }

        if (typeof this.data.metadata !== 'object') {
            this.errors.push('metadata should be an object');
        }
    }

    validateCategories() {
        console.log('Validating categories...');

        Object.entries(this.data.categories).forEach(([categoryName, category]) => {
            if (!category.name) {
                this.errors.push(`Category ${categoryName} missing name`);
            }

            if (category.name !== categoryName) {
                this.errors.push(`Category name mismatch: ${categoryName} vs ${category.name}`);
            }

            const requiredFields = ['subcategories', 'objects', 'keywords'];
            requiredFields.forEach(field => {
                if (!category[field]) {
                    this.errors.push(`Category ${categoryName} missing ${field}`);
                }
            });
        });
    }

    validateObjects() {
        console.log('Validating objects...');

        Object.entries(this.data.objects).forEach(([objectName, object]) => {
            // Check required fields
            const requiredFields = ['name', 'description', 'methods', 'staticMethods', 'properties'];
            requiredFields.forEach(field => {
                if (object[field] === undefined) {
                    this.errors.push(`Object ${objectName} missing ${field}`);
                }
            });

            // Validate name consistency
            if (object.name !== objectName) {
                this.errors.push(`Object name mismatch: ${objectName} vs ${object.name}`);
            }

            // Validate object name format (should start with uppercase)
            if (objectName !== 'e' && !/^[A-Z]/.test(objectName)) {
                this.warnings.push(`Object ${objectName} should start with uppercase letter`);
            }

            // Check description
            if (!object.description || object.description.length < 10) {
                this.warnings.push(`Object ${objectName} has short or missing description`);
            }

            // Validate methods
            if (object.methods) {
                Object.entries(object.methods).forEach(([methodName, method]) => {
                    if (!method.name || !method.description) {
                        this.errors.push(`Object ${objectName} method ${methodName} missing required fields`);
                    }
                    if (method.name !== methodName) {
                        this.errors.push(`Method name mismatch in ${objectName}: ${methodName} vs ${method.name}`);
                    }
                });
            }

            // Validate static methods
            if (object.staticMethods) {
                Object.entries(object.staticMethods).forEach(([methodName, method]) => {
                    if (!method.name || !method.description) {
                        this.errors.push(`Object ${objectName} static method ${methodName} missing required fields`);
                    }
                    if (method.name !== methodName) {
                        this.errors.push(`Static method name mismatch in ${objectName}: ${methodName} vs ${method.name}`);
                    }
                    if (!method.static) {
                        this.warnings.push(`Static method ${objectName}.${methodName} should have static: true`);
                    }
                });
            }

            // Validate properties
            if (object.properties) {
                Object.entries(object.properties).forEach(([propName, property]) => {
                    if (!property.name || !property.description) {
                        this.errors.push(`Object ${objectName} property ${propName} missing required fields`);
                    }
                    if (property.name !== propName) {
                        this.errors.push(`Property name mismatch in ${objectName}: ${propName} vs ${property.name}`);
                    }
                });
            }

            // Check category association
            if (object.category && !this.data.categories[object.category]) {
                this.errors.push(`Object ${objectName} references non-existent category: ${object.category}`);
            }
        });
    }

    validateKeywords() {
        console.log('Validating keywords...');

        Object.entries(this.data.keywords).forEach(([keywordName, keyword]) => {
            // Check required fields
            const requiredFields = ['name', 'description', 'attributes'];
            requiredFields.forEach(field => {
                if (keyword[field] === undefined) {
                    this.errors.push(`Keyword ${keywordName} missing ${field}`);
                }
            });

            // Validate name consistency
            if (keyword.name !== keywordName) {
                this.errors.push(`Keyword name mismatch: ${keywordName} vs ${keyword.name}`);
            }

            // Validate keyword name format (should be lowercase)
            if (/[A-Z]/.test(keywordName)) {
                this.warnings.push(`Keyword ${keywordName} contains uppercase letters`);
            }

            // Check description
            if (!keyword.description || keyword.description.length < 10) {
                this.warnings.push(`Keyword ${keywordName} has short or missing description`);
            }

            // Validate attributes
            if (keyword.attributes) {
                Object.entries(keyword.attributes).forEach(([attrName, attribute]) => {
                    if (!attribute.name) {
                        this.errors.push(`Keyword ${keywordName} attribute ${attrName} missing name`);
                    }
                    if (attribute.name !== attrName) {
                        this.errors.push(`Attribute name mismatch in ${keywordName}: ${attrName} vs ${attribute.name}`);
                    }
                });
            }

            // Check category association
            if (keyword.category && !this.data.categories[keyword.category]) {
                this.errors.push(`Keyword ${keywordName} references non-existent category: ${keyword.category}`);
            }
        });
    }

    validateMetadata() {
        console.log('Validating metadata...');

        const metadata = this.data.metadata;
        const requiredFields = ['version', 'lastUpdated', 'totalCategories', 'totalObjects', 'totalKeywords', 'totalMethods'];
        
        requiredFields.forEach(field => {
            if (metadata[field] === undefined) {
                this.errors.push(`Metadata missing ${field}`);
            }
        });

        // Validate counts
        const actualCategories = Object.keys(this.data.categories).length;
        const actualObjects = Object.keys(this.data.objects).length;
        const actualKeywords = Object.keys(this.data.keywords).length;

        if (metadata.totalCategories !== actualCategories) {
            this.errors.push(`Metadata category count mismatch: ${metadata.totalCategories} vs ${actualCategories}`);
        }

        if (metadata.totalObjects !== actualObjects) {
            this.errors.push(`Metadata object count mismatch: ${metadata.totalObjects} vs ${actualObjects}`);
        }

        if (metadata.totalKeywords !== actualKeywords) {
            this.errors.push(`Metadata keyword count mismatch: ${metadata.totalKeywords} vs ${actualKeywords}`);
        }

        // Count methods
        let actualMethods = 0;
        Object.values(this.data.objects).forEach(object => {
            actualMethods += Object.keys(object.methods || {}).length;
            actualMethods += Object.keys(object.staticMethods || {}).length;
        });

        if (metadata.totalMethods !== actualMethods) {
            this.errors.push(`Metadata method count mismatch: ${metadata.totalMethods} vs ${actualMethods}`);
        }

        // Validate version format
        if (!/^\\d+\\.\\d+\\.\\d+/.test(metadata.version)) {
            this.warnings.push(`Version should follow semantic versioning: ${metadata.version}`);
        }

        // Validate lastUpdated format
        if (isNaN(Date.parse(metadata.lastUpdated))) {
            this.errors.push(`Invalid lastUpdated date format: ${metadata.lastUpdated}`);
        }
    }

    validateConsistency() {
        console.log('Validating data consistency...');

        // Check that all objects in categories exist in objects collection
        Object.entries(this.data.categories).forEach(([categoryName, category]) => {
            Object.keys(category.objects || {}).forEach(objectName => {
                if (!this.data.objects[objectName]) {
                    this.errors.push(`Category ${categoryName} references non-existent object: ${objectName}`);
                }
            });

            Object.keys(category.keywords || {}).forEach(keywordName => {
                if (!this.data.keywords[keywordName]) {
                    this.errors.push(`Category ${categoryName} references non-existent keyword: ${keywordName}`);
                }
            });
        });

        // Check for duplicate method names within objects
        Object.entries(this.data.objects).forEach(([objectName, object]) => {
            const allMethods = [
                ...Object.keys(object.methods || {}),
                ...Object.keys(object.staticMethods || {})
            ];
            
            const duplicates = allMethods.filter((method, index) => allMethods.indexOf(method) !== index);
            if (duplicates.length > 0) {
                this.errors.push(`Object ${objectName} has duplicate methods: ${duplicates.join(', ')}`);
            }
        });

        // Check for objects without any methods or properties
        Object.entries(this.data.objects).forEach(([objectName, object]) => {
            const methodCount = Object.keys(object.methods || {}).length;
            const staticMethodCount = Object.keys(object.staticMethods || {}).length;
            const propertyCount = Object.keys(object.properties || {}).length;
            
            if (methodCount === 0 && staticMethodCount === 0 && propertyCount === 0) {
                this.warnings.push(`Object ${objectName} has no methods or properties`);
            }
        });
    }

    reportResults() {
        console.log('\\n' + '='.repeat(50));
        console.log('VALIDATION RESULTS');
        console.log('='.repeat(50));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All validations passed!');
        } else {
            if (this.errors.length > 0) {
                console.log(`\\n❌ ERRORS (${this.errors.length}):`);
                this.errors.forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
            }

            if (this.warnings.length > 0) {
                console.log(`\\n⚠️  WARNINGS (${this.warnings.length}):`);
                this.warnings.forEach((warning, index) => {
                    console.log(`  ${index + 1}. ${warning}`);
                });
            }
        }

        console.log('\\n' + '='.repeat(50));
        console.log('DATA SUMMARY');
        console.log('='.repeat(50));
        console.log(`Categories: ${Object.keys(this.data.categories).length}`);
        console.log(`Objects: ${Object.keys(this.data.objects).length}`);
        console.log(`Keywords: ${Object.keys(this.data.keywords).length}`);
        
        let totalMethods = 0;
        let totalProperties = 0;
        Object.values(this.data.objects).forEach(object => {
            totalMethods += Object.keys(object.methods || {}).length;
            totalMethods += Object.keys(object.staticMethods || {}).length;
            totalProperties += Object.keys(object.properties || {}).length;
        });
        console.log(`Methods: ${totalMethods}`);
        console.log(`Properties: ${totalProperties}`);

        if (this.errors.length > 0) {
            console.log('\\n❌ Validation failed due to errors.');
            process.exit(1);
        } else {
            console.log('\\n✅ Validation completed successfully!');
        }
    }
}

async function main() {
    const validator = new JavaScriptDataValidator();
    await validator.validate();
}

if (require.main === module) {
    main();
}

module.exports = JavaScriptDataValidator;
