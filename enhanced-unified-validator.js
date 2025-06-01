const fs = require('fs');
const path = require('path');

// Import the individual validators
const HTMLValidator = require('./HTML/src/HTMLValidator.js');
const JavaScriptValidator = require('./Javascript/src/JavaScriptValidator.js');

/**
 * Enhanced Unified Web Validator
 * Integrates HTML, CSS, and JavaScript validation into a comprehensive system
 */
class EnhancedUnifiedValidator {
    constructor() {
        this.htmlValidator = null;
        this.jsValidator = null;
        this.cssValidator = null;
        this.initialized = false;
    }

    async initialize() {
        console.log('🚀 Initializing Enhanced Unified Web Validator...');
        
        try {
            // Initialize HTML validator
            console.log('📄 Loading HTML validator...');
            const htmlData = JSON.parse(fs.readFileSync('./HTML/data/html-elements.json', 'utf8'));
            this.htmlValidator = new HTMLValidator(htmlData);
            
            // Initialize JavaScript validator
            console.log('⚡ Loading JavaScript validator...');
            this.jsValidator = new JavaScriptValidator();
            await this.jsValidator.initialize();
            
            // Try to initialize CSS validator (graceful fallback if it fails)
            console.log('🎨 Loading CSS validator...');
            try {
                const CSSValidator = require('./CSS/src/CSSValidator.js');
                this.cssValidator = new CSSValidator();
                await this.cssValidator.initialize();
                console.log('✅ CSS validator loaded successfully');
            } catch (error) {
                console.log('⚠️  CSS validator unavailable, continuing without CSS validation');
                console.log('   Error:', error.message);
                this.cssValidator = null;
            }
            
            this.initialized = true;
            console.log('✅ Enhanced Unified Web Validator initialized successfully!\n');
            
        } catch (error) {
            throw new Error(`Failed to initialize validators: ${error.message}`);
        }
    }

    /**
     * Validate a complete web document
     */
    async validateWebDocument(filePath) {
        if (!this.initialized) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        console.log(`🔍 Validating web document: ${path.basename(filePath)}`);
        console.log('='.repeat(60));

        const content = fs.readFileSync(filePath, 'utf8');
        const results = {
            file: filePath,
            timestamp: new Date().toISOString(),
            html: { valid: true, errors: [], warnings: [], stats: {} },
            css: { valid: true, errors: [], warnings: [], stats: {} },
            javascript: { valid: true, errors: [], warnings: [], stats: {} },
            crossValidation: { issues: [], suggestions: [] },
            summary: { totalErrors: 0, totalWarnings: 0, overallValid: true }
        };

        // 1. HTML Validation
        console.log('📄 HTML Validation');
        console.log('-'.repeat(20));
        results.html = this.validateHTML(content);
        console.log(`   Elements found: ${results.html.stats.elementsFound || 0}`);
        console.log(`   Errors: ${results.html.errors.length}`);
        console.log(`   Warnings: ${results.html.warnings.length}\n`);

        // 2. CSS Validation (if available)
        if (this.cssValidator) {
            console.log('🎨 CSS Validation');
            console.log('-'.repeat(20));
            results.css = this.validateCSS(content);
            console.log(`   Rules found: ${results.css.stats.rulesFound || 0}`);
            console.log(`   Properties found: ${results.css.stats.propertiesFound || 0}`);
            console.log(`   Errors: ${results.css.errors.length}`);
            console.log(`   Warnings: ${results.css.warnings.length}\n`);
        } else {
            console.log('🎨 CSS Validation: Skipped (validator unavailable)\n');
        }

        // 3. JavaScript Validation
        console.log('⚡ JavaScript Validation');
        console.log('-'.repeat(20));
        results.javascript = this.validateJavaScript(content);
        console.log(`   Scripts found: ${results.javascript.stats.scriptsFound || 0}`);
        console.log(`   Features used: ${results.javascript.stats.featuresUsed || 0}`);
        console.log(`   Errors: ${results.javascript.errors.length}`);
        console.log(`   Warnings: ${results.javascript.warnings.length}\n`);

        // 4. Cross-validation
        console.log('🔗 Cross-System Validation');
        console.log('-'.repeat(25));
        results.crossValidation = this.performCrossValidation(content, results);
        console.log(`   Cross-validation issues: ${results.crossValidation.issues.length}`);
        console.log(`   Suggestions: ${results.crossValidation.suggestions.length}\n`);

        // 5. Summary
        results.summary.totalErrors = results.html.errors.length + 
                                    results.css.errors.length + 
                                    results.javascript.errors.length;
        results.summary.totalWarnings = results.html.warnings.length + 
                                      results.css.warnings.length + 
                                      results.javascript.warnings.length;
        results.summary.overallValid = results.summary.totalErrors === 0;

        this.printSummary(results);
        return results;
    }

    validateHTML(content) {
        const result = { valid: true, errors: [], warnings: [], stats: {} };
        
        try {
            // Extract HTML elements
            const elementMatches = content.match(/<(\w+)(?:\s[^>]*)?>/g) || [];
            const elements = elementMatches.map(match => {
                const elementName = match.match(/<(\w+)/)[1].toLowerCase();
                return elementName;
            });

            result.stats.elementsFound = elements.length;
            result.stats.uniqueElements = [...new Set(elements)].length;

            // Validate each element
            const unknownElements = [];
            elements.forEach(element => {
                if (!this.htmlValidator.isValidElement(element)) {
                    unknownElements.push(element);
                }
            });

            if (unknownElements.length > 0) {
                result.warnings.push({
                    type: 'unknown-elements',
                    message: `Unknown HTML elements found: ${[...new Set(unknownElements)].join(', ')}`
                });
            }

            // Check for common issues
            if (!content.includes('<!DOCTYPE')) {
                result.warnings.push({
                    type: 'missing-doctype',
                    message: 'Missing DOCTYPE declaration'
                });
            }

        } catch (error) {
            result.errors.push({
                type: 'validation-error',
                message: `HTML validation failed: ${error.message}`
            });
            result.valid = false;
        }

        return result;
    }

    validateCSS(content) {
        const result = { valid: true, errors: [], warnings: [], stats: {} };
        
        if (!this.cssValidator) {
            result.warnings.push({
                type: 'validator-unavailable',
                message: 'CSS validator not available'
            });
            return result;
        }

        try {
            // Extract CSS from style tags and linked stylesheets
            const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
            let cssContent = styleMatches.map(match => {
                return match.replace(/<\/?style[^>]*>/gi, '');
            }).join('\n');

            if (cssContent.trim()) {
                const cssResult = this.cssValidator.validateDocument(cssContent);
                result.stats.rulesFound = cssResult.rules?.valid || 0;
                result.stats.propertiesFound = cssResult.properties?.valid || 0;
                
                if (cssResult.errors) {
                    result.errors.push(...cssResult.errors.map(err => ({
                        type: 'css-error',
                        message: err
                    })));
                }
                
                if (cssResult.warnings) {
                    result.warnings.push(...cssResult.warnings.map(warn => ({
                        type: 'css-warning',
                        message: warn
                    })));
                }
            } else {
                result.stats.rulesFound = 0;
                result.stats.propertiesFound = 0;
            }

        } catch (error) {
            result.errors.push({
                type: 'validation-error',
                message: `CSS validation failed: ${error.message}`
            });
            result.valid = false;
        }

        return result;
    }

    validateJavaScript(content) {
        const result = { valid: true, errors: [], warnings: [], stats: {} };
        
        try {
            // Extract JavaScript from script tags
            const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
            let jsContent = scriptMatches.map(match => {
                return match.replace(/<\/?script[^>]*>/gi, '');
            }).join('\n');

            result.stats.scriptsFound = scriptMatches.length;

            if (jsContent.trim()) {
                const jsResult = this.jsValidator.validateSyntax(jsContent);
                result.stats.featuresUsed = jsResult.usedFeatures?.length || 0;
                
                if (jsResult.errors) {
                    result.errors.push(...jsResult.errors.map(err => ({
                        type: 'js-error',
                        message: err
                    })));
                }
                
                if (jsResult.warnings) {
                    result.warnings.push(...jsResult.warnings.map(warn => ({
                        type: 'js-warning',
                        message: warn
                    })));
                }
                
                result.valid = jsResult.valid;
            } else {
                result.stats.featuresUsed = 0;
            }

        } catch (error) {
            result.errors.push({
                type: 'validation-error',
                message: `JavaScript validation failed: ${error.message}`
            });
            result.valid = false;
        }

        return result;
    }

    performCrossValidation(content, results) {
        const crossValidation = { issues: [], suggestions: [] };

        // Check for DOM selectors in JavaScript that reference HTML elements
        const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        const jsContent = scriptMatches.join('\n');

        // Look for DOM selectors
        const selectorMatches = jsContent.match(/(?:getElementById|querySelector|querySelectorAll)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];
        
        selectorMatches.forEach(match => {
            const selectorMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (selectorMatch) {
                const selector = selectorMatch[1];
                
                // Check if referenced elements exist in HTML
                if (selector.startsWith('#')) {
                    const id = selector.substring(1);
                    if (!content.includes(`id="${id}"`)) {
                        crossValidation.issues.push({
                            type: 'missing-element',
                            message: `JavaScript references element with ID "${id}" but it's not found in HTML`
                        });
                    }
                } else if (selector.startsWith('.')) {
                    const className = selector.substring(1);
                    if (!content.includes(`class="${className}`) && !content.includes(`class='${className}`)) {
                        crossValidation.suggestions.push({
                            type: 'missing-class',
                            message: `JavaScript references class "${className}" - ensure it exists in HTML or CSS`
                        });
                    }
                }
            }
        });

        // Check for modern JS features that might need polyfills
        if (jsContent.includes('async') || jsContent.includes('await')) {
            crossValidation.suggestions.push({
                type: 'browser-compatibility',
                message: 'Using async/await - ensure browser compatibility or include polyfills'
            });
        }

        return crossValidation;
    }

    printSummary(results) {
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`📄 HTML: ${results.html.errors.length === 0 ? '✅ VALID' : '❌ ERRORS'} (${results.html.errors.length} errors, ${results.html.warnings.length} warnings)`);
        console.log(`🎨 CSS:  ${results.css.errors.length === 0 ? '✅ VALID' : '❌ ERRORS'} (${results.css.errors.length} errors, ${results.css.warnings.length} warnings)`);
        console.log(`⚡ JS:   ${results.javascript.errors.length === 0 ? '✅ VALID' : '❌ ERRORS'} (${results.javascript.errors.length} errors, ${results.javascript.warnings.length} warnings)`);
        console.log(`🔗 Cross: ${results.crossValidation.issues.length === 0 ? '✅ VALID' : '⚠️  ISSUES'} (${results.crossValidation.issues.length} issues, ${results.crossValidation.suggestions.length} suggestions)`);
        console.log('-'.repeat(60));
        console.log(`🎯 OVERALL: ${results.summary.overallValid ? '✅ VALID' : '❌ NEEDS ATTENTION'}`);
        console.log(`📈 Total: ${results.summary.totalErrors} errors, ${results.summary.totalWarnings} warnings`);
        console.log('='.repeat(60));
    }

    /**
     * Get comprehensive statistics
     */
    getSystemStats() {
        if (!this.initialized) {
            throw new Error('Validator not initialized');
        }

        const stats = {
            html: this.htmlValidator.getStatistics(),
            javascript: this.jsValidator.getStatistics(),
            css: this.cssValidator ? this.cssValidator.getStatistics() : { message: 'CSS validator unavailable' },
            system: {
                validators: {
                    html: true,
                    javascript: true,
                    css: !!this.cssValidator
                },
                totalValidators: 2 + (this.cssValidator ? 1 : 0),
                initialized: this.initialized
            }
        };

        return stats;
    }
}

// CLI Interface
async function main() {
    if (require.main === module) {
        const validator = new EnhancedUnifiedValidator();
        
        try {
            await validator.initialize();
            
            // Test with our test document
            const testFile = './test-document.html';
            if (fs.existsSync(testFile)) {
                console.log('🧪 Testing with test-document.html\n');
                await validator.validateWebDocument(testFile);
            } else {
                console.log('⚠️  test-document.html not found, showing system stats instead\n');
                const stats = validator.getSystemStats();
                console.log('📊 System Statistics:');
                console.log(JSON.stringify(stats, null, 2));
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }
}

main();

module.exports = EnhancedUnifiedValidator;
