const fs = require('fs');
const path = require('path');

/**
 * CSS Validator Class
 * Provides comprehensive CSS validation including properties, selectors, and syntax
 */
class CSSValidator {
    constructor() {
        this.data = null;
        this.dataPath = path.join(__dirname, '../data/css-language.json');
    }

    async initialize() {
        if (!fs.existsSync(this.dataPath)) {
            throw new Error(`CSS language data not found. Run 'npm run build' first.`);
        }
        
        this.data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        return true;
    }

    /**
     * Validate CSS property
     */
    validateProperty(propertyName) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const result = {
            valid: false,
            property: propertyName,
            category: null,
            syntax: null,
            isVendorPrefix: false,
            isCustomProperty: false,
            suggestions: []
        };

        // Search through all property categories
        for (const category of Object.keys(this.data.categories.properties)) {
            const properties = this.data.categories.properties[category];
            
            if (properties[propertyName]) {
                result.valid = true;
                result.category = category;
                result.syntax = properties[propertyName].syntax;
                result.isVendorPrefix = properties[propertyName].isVendorPrefix;
                result.isCustomProperty = properties[propertyName].isCustomProperty;
                break;
            }
        }

        // If not found, provide suggestions
        if (!result.valid) {
            result.suggestions = this.findSimilarProperties(propertyName);
        }

        return result;
    }

    /**
     * Validate CSS selector
     */
    validateSelector(selector) {
        const result = {
            valid: false,
            selector: selector,
            type: null,
            category: null,
            description: null,
            suggestions: []
        };

        // Basic selector validation patterns
        const selectorPatterns = {
            element: /^[a-zA-Z][a-zA-Z0-9]*$/,
            class: /^\.[a-zA-Z_-][a-zA-Z0-9_-]*$/,
            id: /^#[a-zA-Z_-][a-zA-Z0-9_-]*$/,
            universal: /^\*$/,
            'pseudo-class': /^:[a-zA-Z-]+(?:\([^)]*\))?$/,
            'pseudo-element': /^::[a-zA-Z-]+$/,
            attribute: /^\[[^\]]+\]$/,
            descendant: /^.+ .+$/,
            child: /^.+ > .+$/,
            'adjacent-sibling': /^.+ \+ .+$/,
            'general-sibling': /^.+ ~ .+$/
        };

        // Check against patterns
        for (const [type, pattern] of Object.entries(selectorPatterns)) {
            if (pattern.test(selector.trim())) {
                result.valid = true;
                result.type = type;
                
                // Find in our selector data
                for (const category of Object.keys(this.data.categories.selectors)) {
                    const selectors = this.data.categories.selectors[category];
                    for (const selectorName of Object.keys(selectors)) {
                        if (selectors[selectorName].name === type || 
                            selectors[selectorName].syntax === selector) {
                            result.category = category;
                            result.description = selectors[selectorName].description;
                            break;
                        }
                    }
                }
                break;
            }
        }

        if (!result.valid) {
            result.suggestions = this.findSimilarSelectors(selector);
        }

        return result;
    }

    /**
     * Validate CSS function
     */
    validateFunction(functionName) {
        const result = {
            valid: false,
            function: functionName,
            category: null,
            syntax: null,
            parameters: [],
            suggestions: []
        };

        // Search through all function categories
        for (const category of Object.keys(this.data.categories.functions)) {
            const functions = this.data.categories.functions[category];
            
            if (functions[functionName]) {
                result.valid = true;
                result.category = category;
                result.syntax = functions[functionName].syntax;
                result.parameters = functions[functionName].parameters || [];
                break;
            }
        }

        if (!result.valid) {
            result.suggestions = this.findSimilarFunctions(functionName);
        }

        return result;
    }

    /**
     * Validate complete CSS rule
     */
    validateRule(cssRule) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            selector: null,
            declarations: []
        };

        try {
            // Simple CSS rule parsing
            const parts = cssRule.trim().split('{');
            if (parts.length !== 2) {
                result.valid = false;
                result.errors.push('Invalid CSS rule format');
                return result;
            }

            const selectorPart = parts[0].trim();
            const declarationsPart = parts[1].replace('}', '').trim();

            // Validate selector
            result.selector = this.validateSelector(selectorPart);
            if (!result.selector.valid) {
                result.warnings.push(`Unknown selector: ${selectorPart}`);
            }

            // Validate declarations
            if (declarationsPart) {
                const declarations = declarationsPart.split(';').filter(d => d.trim());
                
                declarations.forEach(declaration => {
                    const colonIndex = declaration.indexOf(':');
                    if (colonIndex === -1) {
                        result.errors.push(`Invalid declaration: ${declaration}`);
                        return;
                    }

                    const property = declaration.substring(0, colonIndex).trim();
                    const value = declaration.substring(colonIndex + 1).trim();

                    const propValidation = this.validateProperty(property);
                    const declResult = {
                        property: property,
                        value: value,
                        propertyValid: propValidation.valid,
                        valueValid: true, // Basic validation for now
                        suggestions: propValidation.suggestions
                    };

                    if (!propValidation.valid) {
                        result.warnings.push(`Unknown property: ${property}`);
                    }

                    result.declarations.push(declResult);
                });
            }

        } catch (error) {
            result.valid = false;
            result.errors.push(`Parse error: ${error.message}`);
        }

        return result;
    }

    /**
     * Validate complete CSS document
     */
    validateCSS(cssContent) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            rules: [],
            statistics: {
                totalRules: 0,
                validRules: 0,
                totalProperties: 0,
                validProperties: 0,
                uniqueSelectors: new Set(),
                uniqueProperties: new Set()
            }
        };

        try {
            // Simple CSS parsing - split by rules
            const rules = this.extractCSSRules(cssContent);
            
            rules.forEach((rule, index) => {
                const ruleResult = this.validateRule(rule);
                ruleResult.ruleIndex = index;
                
                result.rules.push(ruleResult);
                result.statistics.totalRules++;
                
                if (ruleResult.valid && ruleResult.errors.length === 0) {
                    result.statistics.validRules++;
                }
                
                // Collect statistics
                if (ruleResult.selector?.selector) {
                    result.statistics.uniqueSelectors.add(ruleResult.selector.selector);
                }
                
                ruleResult.declarations.forEach(decl => {
                    result.statistics.totalProperties++;
                    result.statistics.uniqueProperties.add(decl.property);
                    
                    if (decl.propertyValid) {
                        result.statistics.validProperties++;
                    }
                });
                
                // Collect errors and warnings
                result.errors.push(...ruleResult.errors);
                result.warnings.push(...ruleResult.warnings);
            });
            
            // Convert sets to counts
            result.statistics.uniqueSelectors = result.statistics.uniqueSelectors.size;
            result.statistics.uniqueProperties = result.statistics.uniqueProperties.size;
            
            result.valid = result.errors.length === 0;
            
        } catch (error) {
            result.valid = false;
            result.errors.push(`CSS parsing error: ${error.message}`);
        }

        return result;
    }

    /**
     * Extract CSS rules from content
     */
    extractCSSRules(cssContent) {
        // Remove comments
        const cleaned = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Simple rule extraction
        const rules = [];
        let braceCount = 0;
        let currentRule = '';
        
        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            currentRule += char;
            
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                
                if (braceCount === 0 && currentRule.trim()) {
                    rules.push(currentRule.trim());
                    currentRule = '';
                }
            }
        }
        
        return rules.filter(rule => rule.length > 0);
    }

    /**
     * Search for CSS properties
     */
    searchProperties(query) {
        const results = [];
        const queryLower = query.toLowerCase();

        for (const category of Object.keys(this.data.categories.properties)) {
            const properties = this.data.categories.properties[category];
            
            Object.keys(properties).forEach(propName => {
                const prop = properties[propName];
                
                if (propName.toLowerCase().includes(queryLower) ||
                    prop.syntax.toLowerCase().includes(queryLower)) {
                    results.push({
                        name: propName,
                        category: category,
                        syntax: prop.syntax,
                        isVendorPrefix: prop.isVendorPrefix,
                        isCustomProperty: prop.isCustomProperty
                    });
                }
            });
        }

        return results.sort((a, b) => {
            // Sort by relevance - exact matches first
            const aExact = a.name.toLowerCase() === queryLower;
            const bExact = b.name.toLowerCase() === queryLower;
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get CSS statistics
     */
    getStatistics() {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        return {
            categories: Object.keys(this.data.categories).length,
            properties: this.data.statistics.totalProperties,
            types: this.data.statistics.totalTypes,
            functions: this.data.statistics.totalFunctions,
            selectors: this.data.statistics.totalSelectors,
            atRules: this.data.statistics.totalAtRules,
            total: this.data.statistics.totalProperties + 
                   this.data.statistics.totalTypes + 
                   this.data.statistics.totalSelectors + 
                   this.data.statistics.totalAtRules,
            propertyCategories: Object.keys(this.data.categories.properties).map(category => ({
                name: category,
                count: Object.keys(this.data.categories.properties[category]).length
            }))
        };
    }

    /**
     * Find similar properties for suggestions
     */
    findSimilarProperties(propertyName) {
        const suggestions = [];
        const queryLower = propertyName.toLowerCase();
        
        // Simple similarity check
        for (const category of Object.keys(this.data.categories.properties)) {
            const properties = this.data.categories.properties[category];
            
            Object.keys(properties).forEach(propName => {
                const distance = this.levenshteinDistance(queryLower, propName.toLowerCase());
                if (distance <= 3) { // Allow up to 3 character differences
                    suggestions.push({
                        property: propName,
                        distance: distance,
                        category: category
                    });
                }
            });
        }
        
        return suggestions
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5)
            .map(s => s.property);
    }

    /**
     * Find similar selectors for suggestions
     */
    findSimilarSelectors(selector) {
        // Basic selector suggestions
        const common = ['.class', '#id', 'element', ':hover', ':focus', '::before', '::after'];
        return common.filter(s => s !== selector).slice(0, 3);
    }

    /**
     * Find similar functions for suggestions
     */
    findSimilarFunctions(functionName) {
        const suggestions = [];
        const queryLower = functionName.toLowerCase();
        
        for (const category of Object.keys(this.data.categories.functions)) {
            const functions = this.data.categories.functions[category];
            
            Object.keys(functions).forEach(funcName => {
                if (funcName.toLowerCase().includes(queryLower)) {
                    suggestions.push(funcName);
                }
            });
        }
        
        return suggestions.slice(0, 3);
    }

    /**
     * Calculate Levenshtein distance for similarity
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
}

module.exports = CSSValidator;
