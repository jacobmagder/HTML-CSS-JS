const CSSValidator = require('./CSSValidator');

/**
 * CSS Validator CLI Interface
 * Command-line interface for CSS validation
 */

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('CSS Validator CLI');
        console.log('================');
        console.log('');
        console.log('Usage:');
        console.log('  node src/index.js validate <css-file>     # Validate CSS file');
        console.log('  node src/index.js property <property>     # Check CSS property');
        console.log('  node src/index.js selector <selector>     # Check CSS selector');
        console.log('  node src/index.js search <query>          # Search CSS properties');
        console.log('  node src/index.js stats                   # Show CSS statistics');
        console.log('');
        console.log('Examples:');
        console.log('  node src/index.js property color');
        console.log('  node src/index.js selector ".my-class"');
        console.log('  node src/index.js search background');
        return;
    }
    
    const command = args[0];
    const param = args[1];
    
    try {
        const validator = new CSSValidator();
        await validator.initialize();
        
        switch (command) {
            case 'validate':
                await validateFile(validator, param);
                break;
                
            case 'property':
                checkProperty(validator, param);
                break;
                
            case 'selector':
                checkSelector(validator, param);
                break;
                
            case 'function':
                checkFunction(validator, param);
                break;
                
            case 'search':
                searchProperties(validator, param);
                break;
                
            case 'stats':
                showStatistics(validator);
                break;
                
            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function validateFile(validator, filePath) {
    const fs = require('fs');
    const path = require('path');
    
    if (!filePath) {
        console.error('Please provide a CSS file path');
        return;
    }
    
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    
    console.log(`Validating CSS file: ${filePath}`);
    console.log('='.repeat(50));
    
    const cssContent = fs.readFileSync(filePath, 'utf8');
    const result = validator.validateCSS(cssContent);
    
    // Display results
    console.log(`\\nValidation Results:`);
    console.log(`Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Rules: ${result.statistics.validRules}/${result.statistics.totalRules} valid`);
    console.log(`Properties: ${result.statistics.validProperties}/${result.statistics.totalProperties} valid`);
    console.log(`Unique Selectors: ${result.statistics.uniqueSelectors}`);
    console.log(`Unique Properties: ${result.statistics.uniqueProperties}`);
    
    if (result.errors.length > 0) {
        console.log(`\\n❌ Errors (${result.errors.length}):`);
        result.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
    }
    
    if (result.warnings.length > 0) {
        console.log(`\\n⚠️  Warnings (${result.warnings.length}):`);
        result.warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning}`);
        });
    }
    
    // Show detailed rule analysis for first few rules
    if (result.rules.length > 0) {
        console.log(`\\n📋 Rule Analysis (first 5 rules):`);
        result.rules.slice(0, 5).forEach((rule, index) => {
            console.log(`\\n  Rule ${index + 1}:`);
            console.log(`    Selector: ${rule.selector?.selector || 'Unknown'} (${rule.selector?.valid ? 'Valid' : 'Invalid'})`);
            console.log(`    Declarations: ${rule.declarations.length}`);
            
            if (rule.declarations.length > 0) {
                rule.declarations.forEach(decl => {
                    const status = decl.propertyValid ? '✅' : '❌';
                    console.log(`      ${status} ${decl.property}: ${decl.value}`);
                });
            }
        });
    }
}

function checkProperty(validator, propertyName) {
    if (!propertyName) {
        console.error('Please provide a CSS property name');
        return;
    }
    
    console.log(`Checking CSS property: ${propertyName}`);
    console.log('='.repeat(40));
    
    const result = validator.validateProperty(propertyName);
    
    if (result.valid) {
        console.log('✅ Valid CSS property');
        console.log(`Category: ${result.category}`);
        console.log(`Syntax: ${result.syntax}`);
        
        if (result.isVendorPrefix) {
            console.log('🏷️  Vendor-prefixed property');
        }
        
        if (result.isCustomProperty) {
            console.log('🎨 Custom property (CSS variable)');
        }
    } else {
        console.log('❌ Unknown CSS property');
        
        if (result.suggestions.length > 0) {
            console.log('\\n💡 Did you mean:');
            result.suggestions.forEach(suggestion => {
                console.log(`  • ${suggestion}`);
            });
        }
    }
}

function checkSelector(validator, selector) {
    if (!selector) {
        console.error('Please provide a CSS selector');
        return;
    }
    
    console.log(`Checking CSS selector: ${selector}`);
    console.log('='.repeat(40));
    
    const result = validator.validateSelector(selector);
    
    if (result.valid) {
        console.log('✅ Valid CSS selector');
        console.log(`Type: ${result.type}`);
        
        if (result.category) {
            console.log(`Category: ${result.category}`);
        }
        
        if (result.description) {
            console.log(`Description: ${result.description}`);
        }
    } else {
        console.log('❌ Invalid or unrecognized CSS selector');
        
        if (result.suggestions.length > 0) {
            console.log('\\n💡 Common selectors:');
            result.suggestions.forEach(suggestion => {
                console.log(`  • ${suggestion}`);
            });
        }
    }
}

function checkFunction(validator, functionName) {
    if (!functionName) {
        console.error('Please provide a CSS function name');
        return;
    }
    
    console.log(`Checking CSS function: ${functionName}`);
    console.log('='.repeat(40));
    
    const result = validator.validateFunction(functionName);
    
    if (result.valid) {
        console.log('✅ Valid CSS function');
        console.log(`Category: ${result.category}`);
        console.log(`Syntax: ${result.syntax}`);
        
        if (result.parameters.length > 0) {
            console.log(`Parameters: ${result.parameters.join(', ')}`);
        }
    } else {
        console.log('❌ Unknown CSS function');
        
        if (result.suggestions.length > 0) {
            console.log('\\n💡 Similar functions:');
            result.suggestions.forEach(suggestion => {
                console.log(`  • ${suggestion}`);
            });
        }
    }
}

function searchProperties(validator, query) {
    if (!query) {
        console.error('Please provide a search query');
        return;
    }
    
    console.log(`Searching CSS properties for: "${query}"`);
    console.log('='.repeat(50));
    
    const results = validator.searchProperties(query);
    
    if (results.length === 0) {
        console.log('No properties found matching your query.');
        return;
    }
    
    console.log(`Found ${results.length} properties:`);
    console.log('');
    
    // Group by category
    const categories = {};
    results.forEach(prop => {
        if (!categories[prop.category]) {
            categories[prop.category] = [];
        }
        categories[prop.category].push(prop);
    });
    
    Object.keys(categories).forEach(category => {
        console.log(`📂 ${category}:`);
        categories[category].forEach(prop => {
            let flags = '';
            if (prop.isVendorPrefix) flags += ' 🏷️';
            if (prop.isCustomProperty) flags += ' 🎨';
            
            console.log(`  • ${prop.name}${flags}`);
            console.log(`    Syntax: ${prop.syntax}`);
        });
        console.log('');
    });
}

function showStatistics(validator) {
    console.log('CSS Language Statistics');
    console.log('======================');
    
    const stats = validator.getStatistics();
    
    console.log(`\\n📊 Overview:`);
    console.log(`Categories: ${stats.categories}`);
    console.log(`Properties: ${stats.properties}`);
    console.log(`Types: ${stats.types}`);
    console.log(`Functions: ${stats.functions}`);
    console.log(`Selectors: ${stats.selectors}`);
    console.log(`At-Rules: ${stats.atRules}`);
    console.log(`Total Items: ${stats.total}`);
    
    console.log(`\\n📂 Property Categories:`);
    stats.propertyCategories
        .sort((a, b) => b.count - a.count)
        .forEach(category => {
            const percentage = ((category.count / stats.properties) * 100).toFixed(1);
            console.log(`  ${category.name}: ${category.count} (${percentage}%)`);
        });
}

// Run CLI
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };
