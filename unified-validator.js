#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import both validation systems
const HTMLValidator = require('../../HTML/src/HTMLValidator');
const JavaScriptValidator = require('../Javascript/src/JavaScriptValidator');

class UnifiedWebValidator {
    constructor() {
        this.htmlValidator = null;
        this.jsValidator = null;
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Unified Web Validator...');
        
        try {
            // Load HTML data
            const htmlDataPath = path.join(__dirname, '../HTML/data/html-elements.json');
            if (fs.existsSync(htmlDataPath)) {
                const htmlData = JSON.parse(fs.readFileSync(htmlDataPath, 'utf8'));
                this.htmlValidator = new HTMLValidator(htmlData);
                console.log('✅ HTML validation system loaded');
            } else {
                console.log('⚠️  HTML data not found. Run "npm run build" in HTML directory.');
            }
            
            // Load JavaScript data
            const jsDataPath = path.join(__dirname, '../Javascript/data/js-language.json');
            if (fs.existsSync(jsDataPath)) {
                const jsData = JSON.parse(fs.readFileSync(jsDataPath, 'utf8'));
                this.jsValidator = new JavaScriptValidator(jsData);
                console.log('✅ JavaScript validation system loaded');
            } else {
                console.log('⚠️  JavaScript data not found. Run "npm run build" in Javascript directory.');
            }
            
            this.initialized = true;
            console.log('🎉 Unified Web Validator ready!\\n');
            
        } catch (error) {
            console.error('❌ Error initializing validator:', error.message);
            process.exit(1);
        }
    }
    
    /**
     * Validate a complete HTML document with embedded JavaScript
     */
    validateHTMLDocument(htmlContent) {
        const results = {
            html: { valid: true, errors: [], warnings: [] },
            javascript: { valid: true, errors: [], warnings: [] },
            crossValidation: { valid: true, errors: [], warnings: [] }
        };
        
        if (!this.initialized) {
            results.html.errors.push('Validator not initialized');
            results.html.valid = false;
            return results;
        }
        
        try {
            // Extract HTML elements and validate
            const htmlElements = this.extractHTMLElements(htmlContent);
            htmlElements.forEach(element => {
                if (this.htmlValidator && !this.htmlValidator.isValidElement(element.tag)) {
                    results.html.errors.push(`Invalid HTML element: ${element.tag}`);
                    results.html.valid = false;
                }
                
                // Validate attributes
                if (element.attributes && this.htmlValidator) {
                    Object.keys(element.attributes).forEach(attrName => {
                        if (!this.htmlValidator.isValidAttribute(element.tag, attrName)) {
                            results.html.warnings.push(`Invalid attribute "${attrName}" for element "${element.tag}"`);
                        }
                    });
                }
            });
            
            // Extract and validate JavaScript
            const scriptBlocks = this.extractJavaScript(htmlContent);
            scriptBlocks.forEach(script => {
                if (this.jsValidator) {
                    const syntaxValid = this.jsValidator.validateSyntax(script.content);
                    if (!syntaxValid.isValid) {
                        results.javascript.errors.push(`JavaScript syntax error: ${syntaxValid.error}`);
                        results.javascript.valid = false;
                    }
                    
                    // Check for DOM API usage
                    const domUsage = this.extractDOMUsage(script.content);
                    domUsage.forEach(api => {
                        if (!this.jsValidator.validateObject(api.object)) {
                            results.crossValidation.warnings.push(`Unknown DOM object: ${api.object}`);
                        }
                        if (api.method && !this.jsValidator.validateMethod(`${api.object}.${api.method}`)) {
                            results.crossValidation.warnings.push(`Unknown DOM method: ${api.object}.${api.method}`);
                        }
                    });
                }
            });
            
            // Cross-validation: Check if JavaScript DOM selectors match HTML elements
            const selectors = this.extractDOMSelectors(htmlContent);
            selectors.forEach(selector => {
                if (selector.type === 'id') {
                    const hasId = htmlElements.some(el => 
                        el.attributes && el.attributes.id === selector.value
                    );
                    if (!hasId) {
                        results.crossValidation.warnings.push(`JavaScript selector references non-existent ID: ${selector.value}`);
                    }
                }
            });
            
        } catch (error) {
            results.html.errors.push(`Validation error: ${error.message}`);
            results.html.valid = false;
        }
        
        return results;
    }
    
    /**
     * Extract HTML elements from content
     */
    extractHTMLElements(content) {
        const elements = [];
        const elementRegex = /<(\\w+)([^>]*)>/g;
        let match;
        
        while ((match = elementRegex.exec(content)) !== null) {
            const tagName = match[1].toLowerCase();
            const attributeString = match[2];
            
            const attributes = {};
            if (attributeString) {
                const attrRegex = /(\\w+)(?:=["']([^"']*?)["'])?/g;
                let attrMatch;
                while ((attrMatch = attrRegex.exec(attributeString)) !== null) {
                    attributes[attrMatch[1]] = attrMatch[2] || '';
                }
            }
            
            elements.push({
                tag: tagName,
                attributes: attributes,
                position: match.index
            });
        }
        
        return elements;
    }
    
    /**
     * Extract JavaScript code blocks from HTML
     */
    extractJavaScript(content) {
        const scripts = [];
        
        // Extract <script> blocks
        const scriptRegex = /<script[^>]*?>(.*?)<\\/script>/gis;
        let match;
        
        while ((match = scriptRegex.exec(content)) !== null) {
            scripts.push({
                content: match[1].trim(),
                type: 'script-tag',
                position: match.index
            });
        }
        
        // Extract inline event handlers
        const eventRegex = /on\\w+=[""']([^""']*)[""']/g;
        while ((match = eventRegex.exec(content)) !== null) {
            scripts.push({
                content: match[1],
                type: 'event-handler',
                position: match.index
            });
        }
        
        return scripts;
    }
    
    /**
     * Extract DOM API usage from JavaScript
     */
    extractDOMUsage(jsContent) {
        const domUsage = [];
        
        // Common DOM patterns
        const patterns = [
            /document\\.(\\w+)(?:\\((.*?)\\))?/g,
            /element\\.(\\w+)(?:\\((.*?)\\))?/g,
            /window\\.(\\w+)(?:\\((.*?)\\))?/g,
            /(querySelector|getElementById|getElementsByClassName|getElementsByTagName)\\(/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(jsContent)) !== null) {
                const object = match[0].includes('document') ? 'Document' : 
                            match[0].includes('element') ? 'Element' : 
                            match[0].includes('window') ? 'Window' : 'Document';
                
                domUsage.push({
                    object: object,
                    method: match[1],
                    position: match.index
                });
            }
        });
        
        return domUsage;
    }
    
    /**
     * Extract DOM selectors from JavaScript
     */
    extractDOMSelectors(content) {
        const selectors = [];
        
        // Extract getElementById calls
        const idRegex = /getElementById\\s*\\(\\s*["']([^"']+)["']\\s*\\)/g;
        let match;
        while ((match = idRegex.exec(content)) !== null) {
            selectors.push({
                type: 'id',
                value: match[1],
                position: match.index
            });
        }
        
        // Extract querySelector calls with ID selectors
        const querySelectorRegex = /querySelector\\s*\\(\\s*["']#([^"']+)["']\\s*\\)/g;
        while ((match = querySelectorRegex.exec(content)) !== null) {
            selectors.push({
                type: 'id',
                value: match[1],
                position: match.index
            });
        }
        
        return selectors;
    }
    
    /**
     * Get comprehensive statistics from both systems
     */
    getUnifiedStats() {
        const stats = {
            html: {},
            javascript: {},
            combined: {}
        };
        
        if (this.htmlValidator && this.htmlValidator.htmlData) {
            stats.html = {
                elements: this.htmlValidator.htmlData.elements?.length || 0,
                totalAttributes: this.htmlValidator.htmlData.elements?.reduce((sum, el) => 
                    sum + (el.attributes?.length || 0), 0) || 0,
                categories: [...new Set(this.htmlValidator.htmlData.elements?.map(el => el.category) || [])].length
            };
        }
        
        if (this.jsValidator && this.jsValidator.jsData) {
            const metadata = this.jsValidator.jsData.metadata || {};
            stats.javascript = {
                categories: metadata.totalCategories || 0,
                objects: metadata.totalObjects || 0,
                keywords: metadata.totalKeywords || 0,
                methods: metadata.totalMethods || 0
            };
        }
        
        stats.combined = {
            totalFeatures: (stats.html.elements || 0) + (stats.javascript.objects || 0),
            totalMethods: (stats.html.totalAttributes || 0) + (stats.javascript.methods || 0)
        };
        
        return stats;
    }
    
    /**
     * Search across both HTML and JavaScript features
     */
    searchAllFeatures(query) {
        const results = {
            html: [],
            javascript: [],
            total: 0
        };
        
        if (this.htmlValidator) {
            // Search HTML elements
            this.htmlValidator.htmlData.elements?.forEach(element => {
                if (element.name.toLowerCase().includes(query.toLowerCase()) ||
                    element.description?.toLowerCase().includes(query.toLowerCase())) {
                    results.html.push({
                        type: 'element',
                        name: element.name,
                        description: element.description,
                        category: element.category
                    });
                }
                
                // Search attributes
                element.attributes?.forEach(attr => {
                    if (attr.name.toLowerCase().includes(query.toLowerCase()) ||
                        attr.description?.toLowerCase().includes(query.toLowerCase())) {
                        results.html.push({
                            type: 'attribute',
                            name: attr.name,
                            description: attr.description,
                            element: element.name
                        });
                    }
                });
            });
        }
        
        if (this.jsValidator) {
            const jsResults = this.jsValidator.search(query);
            results.javascript = jsResults;
        }
        
        results.total = results.html.length + results.javascript.length;
        return results;
    }
}

// CLI Interface
async function main() {
    const validator = new UnifiedWebValidator();
    
    const command = process.argv[2];
    const arg1 = process.argv[3];
    const arg2 = process.argv[4];
    
    if (!command) {
        console.log(`
Unified Web Validator - HTML + JavaScript Validation System
========================================================

Commands:
  validate-html <file>           - Validate HTML file
  validate-document <file>       - Validate HTML document with JavaScript
  stats                         - Show unified statistics
  search <query>                - Search across all features
  html-element <name>           - Get HTML element info
  js-object <name>              - Get JavaScript object info
  html-stats                    - HTML system stats only
  js-stats                      - JavaScript system stats only

Examples:
  node unified-validator.js validate-document index.html
  node unified-validator.js search "array"
  node unified-validator.js stats
        `);
        return;
    }
    
    switch (command) {
        case 'validate-document':
            if (!arg1) {
                console.log('❌ Please provide an HTML file path');
                return;
            }
            
            if (!fs.existsSync(arg1)) {
                console.log(`❌ File not found: ${arg1}`);
                return;
            }
            
            const content = fs.readFileSync(arg1, 'utf8');
            const results = validator.validateHTMLDocument(content);
            
            console.log('\\n📄 Document Validation Results');
            console.log('================================');
            
            console.log(`\\n🌐 HTML Validation: ${results.html.valid ? '✅ VALID' : '❌ INVALID'}`);
            if (results.html.errors.length > 0) {
                console.log('Errors:');
                results.html.errors.forEach(error => console.log(`  - ${error}`));
            }
            if (results.html.warnings.length > 0) {
                console.log('Warnings:');
                results.html.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            
            console.log(`\\n⚡ JavaScript Validation: ${results.javascript.valid ? '✅ VALID' : '❌ INVALID'}`);
            if (results.javascript.errors.length > 0) {
                console.log('Errors:');
                results.javascript.errors.forEach(error => console.log(`  - ${error}`));
            }
            if (results.javascript.warnings.length > 0) {
                console.log('Warnings:');
                results.javascript.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            
            console.log(`\\n🔗 Cross-validation: ${results.crossValidation.valid ? '✅ VALID' : '❌ ISSUES'}`);
            if (results.crossValidation.errors.length > 0) {
                console.log('Errors:');
                results.crossValidation.errors.forEach(error => console.log(`  - ${error}`));
            }
            if (results.crossValidation.warnings.length > 0) {
                console.log('Warnings:');
                results.crossValidation.warnings.forEach(warning => console.log(`  - ${warning}`));
            }
            break;
            
        case 'stats':
            const stats = validator.getUnifiedStats();
            console.log('\\n📊 Unified Web Development Statistics');
            console.log('======================================');
            console.log(`\\n🌐 HTML System:`);
            console.log(`  Elements: ${stats.html.elements || 0}`);
            console.log(`  Attributes: ${stats.html.totalAttributes || 0}`);
            console.log(`  Categories: ${stats.html.categories || 0}`);
            console.log(`\\n⚡ JavaScript System:`);
            console.log(`  Categories: ${stats.javascript.categories || 0}`);
            console.log(`  Objects: ${stats.javascript.objects || 0}`);
            console.log(`  Keywords: ${stats.javascript.keywords || 0}`);
            console.log(`  Methods: ${stats.javascript.methods || 0}`);
            console.log(`\\n🔗 Combined:`);
            console.log(`  Total Features: ${stats.combined.totalFeatures}`);
            console.log(`  Total Methods/Attributes: ${stats.combined.totalMethods}`);
            break;
            
        case 'search':
            if (!arg1) {
                console.log('❌ Please provide a search query');
                return;
            }
            
            const searchResults = validator.searchAllFeatures(arg1);
            console.log(`\\n🔍 Search Results for "${arg1}"`);
            console.log('==============================');
            
            if (searchResults.html.length > 0) {
                console.log(`\\n🌐 HTML Features (${searchResults.html.length}):`);
                searchResults.html.forEach(result => {
                    console.log(`  ${result.type}: ${result.name} - ${result.description || 'No description'}`);
                });
            }
            
            if (searchResults.javascript.length > 0) {
                console.log(`\\n⚡ JavaScript Features (${searchResults.javascript.length}):`);
                searchResults.javascript.forEach(result => {
                    console.log(`  ${result.type}: ${result.name} - ${result.description || 'No description'}`);
                });
            }
            
            console.log(`\\n📊 Total Results: ${searchResults.total}`);
            break;
            
        case 'html-element':
            if (!arg1) {
                console.log('❌ Please provide an HTML element name');
                return;
            }
            
            if (validator.htmlValidator) {
                const elementInfo = validator.htmlValidator.getElementInfo(arg1);
                if (elementInfo) {
                    console.log(`\\n🌐 HTML Element: ${elementInfo.name}`);
                    console.log('==========================');
                    console.log(`Description: ${elementInfo.description || 'No description'}`);
                    console.log(`Category: ${elementInfo.category || 'Unknown'}`);
                    if (elementInfo.attributes && elementInfo.attributes.length > 0) {
                        console.log(`\\nAttributes (${elementInfo.attributes.length}):`);
                        elementInfo.attributes.forEach(attr => {
                            console.log(`  ${attr.name}: ${attr.description || 'No description'}`);
                        });
                    }
                } else {
                    console.log(`❌ HTML element "${arg1}" not found`);
                }
            } else {
                console.log('❌ HTML validator not available');
            }
            break;
            
        case 'js-object':
            if (!arg1) {
                console.log('❌ Please provide a JavaScript object name');
                return;
            }
            
            if (validator.jsValidator) {
                const objectInfo = validator.jsValidator.getObjectInfo(arg1);
                if (objectInfo) {
                    console.log(`\\n⚡ JavaScript Object: ${objectInfo.name}`);
                    console.log('============================');
                    console.log(`Description: ${objectInfo.description || 'No description'}`);
                    console.log(`Category: ${objectInfo.category || 'Unknown'}`);
                    if (objectInfo.methods && objectInfo.methods.length > 0) {
                        console.log(`\\nMethods (${objectInfo.methods.length}):`);
                        objectInfo.methods.forEach(method => {
                            console.log(`  ${method.name}(): ${method.description || 'No description'}`);
                        });
                    }
                } else {
                    console.log(`❌ JavaScript object "${arg1}" not found`);
                }
            } else {
                console.log('❌ JavaScript validator not available');
            }
            break;
            
        default:
            console.log(`❌ Unknown command: ${command}`);
            console.log('Use no arguments to see available commands');
    }
}

// Export for use as module
module.exports = UnifiedWebValidator;

// Run CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}
