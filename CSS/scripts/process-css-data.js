const fs = require('fs');
const path = require('path');

/**
 * CSS Language Data Processor
 * Converts the CSS tree data from ALL_data.txt into structured JSON
 */

function processCSSData() {
    const inputPath = path.join(__dirname, '../ALL_data.txt');
    const outputPath = path.join(__dirname, '../data/css-language.json');
    const summaryPath = path.join(__dirname, '../data/css-summary.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    try {
        console.log('Reading CSS data from ALL_data.txt...');
        const rawData = fs.readFileSync(inputPath, 'utf8');
        
        // Parse the JSON data
        const cssData = JSON.parse(rawData);
        
        // Extract and organize CSS information
        const processedData = {
            metadata: {
                version: cssData.csstree?.version || 'unknown',
                generatedAt: new Date().toISOString(),
                source: 'CSS Tree Parser'
            },
            categories: {
                properties: {},
                types: {},
                selectors: {},
                functions: {},
                atRules: {}
            },
            statistics: {
                totalProperties: 0,
                totalTypes: 0,
                totalSelectors: 0,
                totalFunctions: 0,
                totalAtRules: 0
            }
        };
        
        // Process CSS properties
        if (cssData.csstree?.default?.properties) {
            console.log('Processing CSS properties...');
            const properties = cssData.csstree.default.properties;
            
            Object.keys(properties).forEach(prop => {
                const syntax = properties[prop];
                const category = categorizeProperty(prop);
                
                if (!processedData.categories.properties[category]) {
                    processedData.categories.properties[category] = {};
                }
                
                processedData.categories.properties[category][prop] = {
                    name: prop,
                    syntax: syntax,
                    category: category,
                    isVendorPrefix: prop.startsWith('-'),
                    isCustomProperty: prop.startsWith('--')
                };
                
                processedData.statistics.totalProperties++;
            });
        }
        
        // Process CSS types (value definitions)
        if (cssData.csstree?.default?.types) {
            console.log('Processing CSS types...');
            const types = cssData.csstree.default.types;
            
            Object.keys(types).forEach(type => {
                const definition = types[type];
                const category = categorizeType(type);
                
                if (!processedData.categories.types[category]) {
                    processedData.categories.types[category] = {};
                }
                
                processedData.categories.types[category][type] = {
                    name: type,
                    definition: definition,
                    category: category,
                    isFunction: type.includes('('),
                    isKeyword: !type.includes('(') && !type.includes('<')
                };
                
                processedData.statistics.totalTypes++;
            });
        }
        
        // Extract functions from types
        Object.keys(processedData.categories.types).forEach(category => {
            Object.keys(processedData.categories.types[category]).forEach(typeName => {
                const type = processedData.categories.types[category][typeName];
                if (type.isFunction) {
                    const funcCategory = 'mathematical'; // Default category
                    
                    if (!processedData.categories.functions[funcCategory]) {
                        processedData.categories.functions[funcCategory] = {};
                    }
                    
                    processedData.categories.functions[funcCategory][typeName] = {
                        name: typeName,
                        syntax: type.definition,
                        category: funcCategory,
                        parameters: extractFunctionParameters(type.definition)
                    };
                    
                    processedData.statistics.totalFunctions++;
                }
            });
        });
        
        // Add common selectors
        const commonSelectors = {
            'basic': {
                'element': { name: 'element', syntax: 'E', description: 'Type selector' },
                'class': { name: 'class', syntax: '.class', description: 'Class selector' },
                'id': { name: 'id', syntax: '#id', description: 'ID selector' },
                'universal': { name: 'universal', syntax: '*', description: 'Universal selector' }
            },
            'pseudo-classes': {
                'hover': { name: 'hover', syntax: ':hover', description: 'Mouse hover state' },
                'focus': { name: 'focus', syntax: ':focus', description: 'Element focus state' },
                'active': { name: 'active', syntax: ':active', description: 'Element active state' },
                'first-child': { name: 'first-child', syntax: ':first-child', description: 'First child element' },
                'last-child': { name: 'last-child', syntax: ':last-child', description: 'Last child element' },
                'nth-child': { name: 'nth-child', syntax: ':nth-child(n)', description: 'Nth child element' }
            },
            'pseudo-elements': {
                'before': { name: 'before', syntax: '::before', description: 'Insert content before element' },
                'after': { name: 'after', syntax: '::after', description: 'Insert content after element' },
                'first-line': { name: 'first-line', syntax: '::first-line', description: 'First line of element' },
                'first-letter': { name: 'first-letter', syntax: '::first-letter', description: 'First letter of element' }
            },
            'combinators': {
                'descendant': { name: 'descendant', syntax: 'A B', description: 'Descendant combinator' },
                'child': { name: 'child', syntax: 'A > B', description: 'Child combinator' },
                'adjacent-sibling': { name: 'adjacent-sibling', syntax: 'A + B', description: 'Adjacent sibling combinator' },
                'general-sibling': { name: 'general-sibling', syntax: 'A ~ B', description: 'General sibling combinator' }
            }
        };
        
        processedData.categories.selectors = commonSelectors;
        processedData.statistics.totalSelectors = Object.keys(commonSelectors).reduce((total, category) => {
            return total + Object.keys(commonSelectors[category]).length;
        }, 0);
        
        // Add common at-rules
        const commonAtRules = {
            'conditional': {
                'media': { name: 'media', syntax: '@media', description: 'Media queries' },
                'supports': { name: 'supports', syntax: '@supports', description: 'Feature queries' }
            },
            'descriptive': {
                'import': { name: 'import', syntax: '@import', description: 'Import external stylesheets' },
                'charset': { name: 'charset', syntax: '@charset', description: 'Character encoding' }
            },
            'behavior': {
                'keyframes': { name: 'keyframes', syntax: '@keyframes', description: 'Animation keyframes' },
                'font-face': { name: 'font-face', syntax: '@font-face', description: 'Font definitions' }
            }
        };
        
        processedData.categories.atRules = commonAtRules;
        processedData.statistics.totalAtRules = Object.keys(commonAtRules).reduce((total, category) => {
            return total + Object.keys(commonAtRules[category]).length;
        }, 0);
        
        // Write processed data
        console.log('Writing processed CSS data...');
        fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
        
        // Write summary
        const summary = {
            categories: Object.keys(processedData.categories).length,
            properties: processedData.statistics.totalProperties,
            types: processedData.statistics.totalTypes,
            functions: processedData.statistics.totalFunctions,
            selectors: processedData.statistics.totalSelectors,
            atRules: processedData.statistics.totalAtRules,
            total: processedData.statistics.totalProperties + 
                   processedData.statistics.totalTypes + 
                   processedData.statistics.totalSelectors + 
                   processedData.statistics.totalAtRules,
            generatedAt: processedData.metadata.generatedAt
        };
        
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        
        console.log('\nCSS Data Processing Complete!');
        console.log('================================');
        console.log(`Categories: ${summary.categories}`);
        console.log(`Properties: ${summary.properties}`);
        console.log(`Types: ${summary.types}`);
        console.log(`Functions: ${summary.functions}`);
        console.log(`Selectors: ${summary.selectors}`);
        console.log(`At-Rules: ${summary.atRules}`);
        console.log(`Total Items: ${summary.total}`);
        console.log(`Output: ${outputPath}`);
        console.log(`Summary: ${summaryPath}`);
        
        return true;
        
    } catch (error) {
        console.error('Error processing CSS data:', error);
        return false;
    }
}

function categorizeProperty(propName) {
    // Categorize CSS properties
    if (propName.startsWith('--')) return 'custom-properties';
    if (propName.startsWith('-webkit-')) return 'webkit-vendor';
    if (propName.startsWith('-moz-')) return 'mozilla-vendor';
    if (propName.startsWith('-ms-')) return 'microsoft-vendor';
    if (propName.startsWith('-o-')) return 'opera-vendor';
    
    // Layout properties
    if (propName.includes('display') || propName.includes('position') || 
        propName.includes('float') || propName.includes('clear')) return 'layout';
    
    // Box model
    if (propName.includes('margin') || propName.includes('padding') || 
        propName.includes('border') || propName.includes('width') || 
        propName.includes('height')) return 'box-model';
    
    // Typography
    if (propName.includes('font') || propName.includes('text') || 
        propName.includes('line') || propName.includes('letter')) return 'typography';
    
    // Colors and backgrounds
    if (propName.includes('color') || propName.includes('background') || 
        propName.includes('opacity')) return 'visual';
    
    // Flexbox and Grid
    if (propName.includes('flex') || propName.includes('grid') || 
        propName.includes('align') || propName.includes('justify')) return 'layout-advanced';
    
    // Animations and transforms
    if (propName.includes('animation') || propName.includes('transition') || 
        propName.includes('transform')) return 'animation';
    
    return 'miscellaneous';
}

function categorizeType(typeName) {
    if (typeName.includes('color')) return 'color-values';
    if (typeName.includes('length') || typeName.includes('percentage')) return 'length-values';
    if (typeName.includes('time') || typeName.includes('frequency')) return 'time-frequency';
    if (typeName.includes('angle')) return 'angle-values';
    if (typeName.includes('function') || typeName.includes('()')) return 'functions';
    if (typeName.includes('gradient')) return 'gradients';
    if (typeName.includes('image')) return 'images';
    return 'keywords';
}

function extractFunctionParameters(syntax) {
    // Simple parameter extraction from function syntax
    const match = syntax.match(/\\(([^)]+)\\)/);
    if (match) {
        return match[1].split(',').map(param => param.trim());
    }
    return [];
}

// Run the processor
if (require.main === module) {
    processCSSData();
}

module.exports = { processCSSData };
