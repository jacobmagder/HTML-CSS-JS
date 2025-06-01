const fs = require('fs');
const path = require('path');

/**
 * Validate the generated HTML data for consistency and completeness
 */
class HTMLDataValidator {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.data = null;
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Load and validate the HTML data
     */
    validate() {
        console.log('🔍 Validating HTML data structure...\n');

        try {
            // Load the data
            this.loadData();
            
            // Run validation checks
            this.validateStructure();
            this.validateElements();
            this.validateAttributes();
            this.validateConsistency();
            
            // Report results
            this.reportResults();
            
            return this.errors.length === 0;
        } catch (error) {
            console.error('❌ Validation failed:', error);
            return false;
        }
    }

    loadData() {
        if (!fs.existsSync(this.dataPath)) {
            throw new Error(`Data file not found: ${this.dataPath}`);
        }

        const rawData = fs.readFileSync(this.dataPath, 'utf8');
        this.data = JSON.parse(rawData);
        console.log(`📄 Loaded data with ${this.data.elements.length} elements`);
    }

    validateStructure() {
        console.log('🏗️  Validating data structure...');

        // Check required top-level fields
        const requiredFields = ['version', 'lastUpdated', 'description', 'elements', 'statistics'];
        requiredFields.forEach(field => {
            if (!this.data.hasOwnProperty(field)) {
                this.errors.push(`Missing required field: ${field}`);
            }
        });

        // Check statistics consistency
        if (this.data.statistics) {
            if (this.data.statistics.totalElements !== this.data.elements.length) {
                this.errors.push(`Statistics mismatch: reported ${this.data.statistics.totalElements} elements, found ${this.data.elements.length}`);
            }
        }

        console.log(`  ✅ Structure validation complete (${this.errors.length} errors)`);
    }

    validateElements() {
        console.log('🔧 Validating elements...');
        
        const elementNames = new Set();
        const categories = new Set();

        this.data.elements.forEach((element, index) => {
            const context = `Element ${index} (${element.name || 'unnamed'})`;

            // Check required element fields
            const requiredFields = ['name', 'category', 'description', 'attributes'];
            requiredFields.forEach(field => {
                if (!element.hasOwnProperty(field)) {
                    this.errors.push(`${context}: Missing required field '${field}'`);
                }
            });

            // Check for duplicate element names
            if (element.name) {
                if (elementNames.has(element.name)) {
                    this.errors.push(`${context}: Duplicate element name '${element.name}'`);
                } else {
                    elementNames.add(element.name);
                }

                // Validate element name format
                if (!/^[a-z][a-z0-9-]*$/.test(element.name)) {
                    this.warnings.push(`${context}: Element name '${element.name}' doesn't follow HTML naming conventions`);
                }
            }

            // Track categories
            if (element.category) {
                categories.add(element.category);
            }

            // Validate description
            if (typeof element.description !== 'string' || element.description.length < 10) {
                this.warnings.push(`${context}: Description is too short or missing`);
            }

            // Validate attributes array
            if (!Array.isArray(element.attributes)) {
                this.errors.push(`${context}: Attributes must be an array`);
            }
        });

        console.log(`  📊 Found ${elementNames.size} unique elements in ${categories.size} categories`);
        console.log(`  ✅ Element validation complete`);
    }

    validateAttributes() {
        console.log('⚙️  Validating attributes...');

        let totalAttributes = 0;
        const globalAttributes = new Set();

        this.data.elements.forEach(element => {
            if (!Array.isArray(element.attributes)) return;

            element.attributes.forEach((attr, attrIndex) => {
                totalAttributes++;
                const context = `${element.name}.${attr.name || 'unnamed'} (attr ${attrIndex})`;

                // Check required attribute fields
                const requiredFields = ['name', 'description', 'type'];
                requiredFields.forEach(field => {
                    if (!attr.hasOwnProperty(field)) {
                        this.errors.push(`${context}: Missing required field '${field}'`);
                    }
                });

                // Validate attribute name
                if (attr.name && !/^[a-z][a-z0-9-]*$/.test(attr.name) && !attr.name.startsWith('data-') && !attr.name.startsWith('aria-')) {
                    this.warnings.push(`${context}: Attribute name '${attr.name}' doesn't follow HTML naming conventions`);
                }

                // Track global attributes
                if (attr.global) {
                    globalAttributes.add(attr.name);
                }

                // Validate attribute type
                const validTypes = ['string', 'number', 'boolean', 'url', 'id', 'class-list'];
                if (attr.type && !validTypes.includes(attr.type)) {
                    this.warnings.push(`${context}: Unknown attribute type '${attr.type}'`);
                }

                // Validate boolean flags
                ['required', 'deprecated', 'experimental', 'global'].forEach(flag => {
                    if (attr.hasOwnProperty(flag) && typeof attr[flag] !== 'boolean') {
                        this.errors.push(`${context}: Field '${flag}' must be boolean`);
                    }
                });
            });
        });

        console.log(`  📊 Found ${totalAttributes} total attributes (${globalAttributes.size} global)`);
        console.log(`  ✅ Attribute validation complete`);
    }

    validateConsistency() {
        console.log('🔄 Validating data consistency...');

        // Check category distribution
        const categoryCounts = {};
        this.data.elements.forEach(element => {
            categoryCounts[element.category] = (categoryCounts[element.category] || 0) + 1;
        });

        // Warn about categories with very few elements
        Object.entries(categoryCounts).forEach(([category, count]) => {
            if (count === 1) {
                this.warnings.push(`Category '${category}' has only 1 element - consider merging with another category`);
            }
        });

        // Check for elements without any specific attributes
        let elementsWithoutSpecificAttrs = 0;
        this.data.elements.forEach(element => {
            const specificAttrs = element.attributes.filter(attr => !attr.global);
            if (specificAttrs.length === 0) {
                elementsWithoutSpecificAttrs++;
            }
        });

        if (elementsWithoutSpecificAttrs > 0) {
            this.warnings.push(`${elementsWithoutSpecificAttrs} elements have no element-specific attributes`);
        }

        console.log(`  ✅ Consistency validation complete`);
    }

    reportResults() {
        console.log('\n📋 Validation Report:');
        console.log(`  Total elements: ${this.data.elements.length}`);
        console.log(`  Total errors: ${this.errors.length}`);
        console.log(`  Total warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('\n🎉 All validation checks passed!');
        } else if (this.errors.length === 0) {
            console.log('\n✅ Validation passed with warnings');
        } else {
            console.log('\n❌ Validation failed');
        }
    }
}

// Usage
if (require.main === module) {
    const dataPath = path.join(__dirname, '../data/html-elements.json');
    const validator = new HTMLDataValidator(dataPath);
    
    const isValid = validator.validate();
    process.exit(isValid ? 0 : 1);
}

module.exports = HTMLDataValidator;
