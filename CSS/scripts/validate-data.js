const fs = require('fs');
const path = require('path');

/**
 * CSS Language Data Validator
 * Validates the processed CSS data for consistency and completeness
 */

function validateCSSData() {
    const dataPath = path.join(__dirname, '../data/css-language.json');
    
    if (!fs.existsSync(dataPath)) {
        console.error('CSS language data not found. Run "npm run build" first.');
        return false;
    }
    
    try {
        console.log('Validating CSS language data...');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        
        let errors = [];
        let warnings = [];
        
        // Validate structure
        const requiredSections = ['metadata', 'categories', 'statistics'];
        requiredSections.forEach(section => {
            if (!data[section]) {
                errors.push(`Missing required section: ${section}`);
            }
        });
        
        // Validate categories
        if (data.categories) {
            const requiredCategories = ['properties', 'types', 'selectors', 'functions', 'atRules'];
            requiredCategories.forEach(category => {
                if (!data.categories[category]) {
                    errors.push(`Missing required category: ${category}`);
                }
            });
            
            // Validate properties structure
            if (data.categories.properties) {
                let propertyCount = 0;
                Object.keys(data.categories.properties).forEach(category => {
                    const props = data.categories.properties[category];
                    Object.keys(props).forEach(propName => {
                        const prop = props[propName];
                        propertyCount++;
                        
                        if (!prop.name || !prop.syntax) {
                            errors.push(`Property ${propName} missing required fields`);
                        }
                        
                        if (prop.name !== propName) {
                            warnings.push(`Property name mismatch: ${propName} vs ${prop.name}`);
                        }
                    });
                });
                
                if (data.statistics?.totalProperties !== propertyCount) {
                    warnings.push(`Property count mismatch: ${data.statistics.totalProperties} vs ${propertyCount}`);
                }
            }
            
            // Validate types structure
            if (data.categories.types) {
                let typeCount = 0;
                Object.keys(data.categories.types).forEach(category => {
                    const types = data.categories.types[category];
                    Object.keys(types).forEach(typeName => {
                        const type = types[typeName];
                        typeCount++;
                        
                        if (!type.name || !type.definition) {
                            errors.push(`Type ${typeName} missing required fields`);
                        }
                    });
                });
                
                if (data.statistics?.totalTypes !== typeCount) {
                    warnings.push(`Type count mismatch: ${data.statistics.totalTypes} vs ${typeCount}`);
                }
            }
        }
        
        // Validate statistics
        if (data.statistics) {
            const stats = data.statistics;
            const requiredStats = ['totalProperties', 'totalTypes', 'totalSelectors', 'totalFunctions', 'totalAtRules'];
            
            requiredStats.forEach(stat => {
                if (typeof stats[stat] !== 'number') {
                    errors.push(`Invalid statistic: ${stat} should be a number`);
                }
            });
        }
        
        // Report results
        console.log('\\nValidation Results:');
        console.log('==================');
        
        if (errors.length === 0) {
            console.log('✅ All validation checks passed!');
        } else {
            console.log(`❌ ${errors.length} error(s) found:`);
            errors.forEach(error => console.log(`  • ${error}`));
        }
        
        if (warnings.length > 0) {
            console.log(`⚠️  ${warnings.length} warning(s):`);
            warnings.forEach(warning => console.log(`  • ${warning}`));
        }
        
        // Display statistics
        if (data.statistics) {
            console.log('\\nData Statistics:');
            console.log('================');
            console.log(`Properties: ${data.statistics.totalProperties}`);
            console.log(`Types: ${data.statistics.totalTypes}`);
            console.log(`Functions: ${data.statistics.totalFunctions}`);
            console.log(`Selectors: ${data.statistics.totalSelectors}`);
            console.log(`At-Rules: ${data.statistics.totalAtRules}`);
        }
        
        if (data.categories?.properties) {
            console.log('\\nProperty Categories:');
            console.log('===================');
            Object.keys(data.categories.properties).forEach(category => {
                const count = Object.keys(data.categories.properties[category]).length;
                console.log(`${category}: ${count} properties`);
            });
        }
        
        return errors.length === 0;
        
    } catch (error) {
        console.error('Error validating CSS data:', error);
        return false;
    }
}

// Run the validator
if (require.main === module) {
    validateCSSData();
}

module.exports = { validateCSSData };
