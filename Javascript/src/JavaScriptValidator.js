const fs = require('fs');
const path = require('path');

class JavaScriptValidator {
    constructor() {
        this.data = null;
        this.dataPath = path.join(__dirname, '../data/js-language.json');
    }

    async initialize() {
        if (!fs.existsSync(this.dataPath)) {
            throw new Error(`JavaScript language data not found. Run 'npm run build' first.`);
        }
        
        this.data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        return true;
    }

    // Validate JavaScript syntax using simple patterns
    validateSyntax(code) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            usedFeatures: []
        };

        try {
            // Simple syntax validation - check for basic patterns
            const syntaxChecks = [
                {
                    pattern: /(?:^|\s)(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
                    feature: 'variable declaration'
                },
                {
                    pattern: /(?:^|\s)(function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
                    feature: 'function declaration'
                },
                {
                    pattern: /(?:^|\s)(class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
                    feature: 'class declaration'
                },
                {
                    pattern: /(?:^|\s)(if|for|while|switch|try|catch|finally)\s*\(/g,
                    feature: 'control structure'
                },
                {
                    pattern: /(?:^|\s)(import|export)\s/g,
                    feature: 'module syntax'
                },
                {
                    pattern: /(?:^|\s)(async|await)\s/g,
                    feature: 'async/await'
                }
            ];

            syntaxChecks.forEach(check => {
                const matches = code.match(check.pattern);
                if (matches) {
                    result.usedFeatures.push(check.feature);
                }
            });

            // Basic bracket matching
            const brackets = { '(': ')', '[': ']', '{': '}' };
            const stack = [];
            
            for (let i = 0; i < code.length; i++) {
                const char = code[i];
                if (brackets[char]) {
                    stack.push(brackets[char]);
                } else if (Object.values(brackets).includes(char)) {
                    if (stack.length === 0 || stack.pop() !== char) {
                        result.valid = false;
                        result.errors.push(`Mismatched bracket at position ${i}`);
                    }
                }
            }

            if (stack.length > 0) {
                result.valid = false;
                result.errors.push(`Unclosed brackets: ${stack.join(', ')}`);
            }

        } catch (error) {
            result.valid = false;
            result.errors.push(`Parse error: ${error.message}`);
        }

        return result;
    }

    // Check if a JavaScript object exists
    validateObject(objectName) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const object = this.data.objects[objectName];
        return {
            exists: !!object,
            object: object || null,
            suggestion: object ? null : this.findSimilarObjects(objectName)
        };
    }

    // Check if a method exists on an object
    validateMethod(objectName, methodName) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const object = this.data.objects[objectName];
        if (!object) {
            return {
                exists: false,
                error: `Object '${objectName}' not found`,
                suggestion: this.findSimilarObjects(objectName)
            };
        }

        const method = object.methods[methodName] || object.staticMethods[methodName];
        return {
            exists: !!method,
            method: method || null,
            isStatic: object.staticMethods[methodName] ? true : false,
            suggestion: method ? null : this.findSimilarMethods(object, methodName)
        };
    }

    // Check if a keyword is valid
    validateKeyword(keyword) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const keywordData = this.data.keywords[keyword];
        return {
            exists: !!keywordData,
            keyword: keywordData || null,
            suggestion: keywordData ? null : this.findSimilarKeywords(keyword)
        };
    }

    // Get information about a JavaScript object
    getObjectInfo(objectName) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const object = this.data.objects[objectName];
        if (!object) {
            return null;
        }

        return {
            name: object.name,
            description: object.description,
            category: object.category,
            subcategory: object.subcategory,
            methodCount: Object.keys(object.methods).length,
            staticMethodCount: Object.keys(object.staticMethods).length,
            propertyCount: Object.keys(object.properties).length,
            methods: Object.values(object.methods),
            staticMethods: Object.values(object.staticMethods),
            properties: Object.values(object.properties)
        };
    }

    // Get information about a specific method
    getMethodInfo(objectName, methodName) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const object = this.data.objects[objectName];
        if (!object) {
            return null;
        }

        const method = object.methods[methodName] || object.staticMethods[methodName];
        if (!method) {
            return null;
        }

        return {
            name: method.name,
            description: method.description,
            objectName: objectName,
            isStatic: method.static || false,
            type: method.type
        };
    }

    // Get all categories
    getCategories() {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        return Object.values(this.data.categories).map(category => ({
            name: category.name,
            objectCount: Object.keys(category.objects).length,
            keywordCount: Object.keys(category.keywords).length,
            subcategoryCount: Object.keys(category.subcategories).length,
            subcategories: Object.keys(category.subcategories)
        }));
    }

    // Search for objects, methods, or keywords
    search(query) {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        const results = {
            objects: [],
            methods: [],
            keywords: [],
            properties: []
        };

        const searchTerm = query.toLowerCase();

        // Search objects
        Object.values(this.data.objects).forEach(object => {
            if (object.name.toLowerCase().includes(searchTerm) || 
                object.description.toLowerCase().includes(searchTerm)) {
                results.objects.push({
                    name: object.name,
                    description: object.description,
                    category: object.category
                });
            }

            // Search methods
            [...Object.values(object.methods), ...Object.values(object.staticMethods)].forEach(method => {
                if (method.name.toLowerCase().includes(searchTerm) ||
                    method.description.toLowerCase().includes(searchTerm)) {
                    results.methods.push({
                        name: method.name,
                        description: method.description,
                        objectName: object.name,
                        isStatic: method.static || false
                    });
                }
            });

            // Search properties
            Object.values(object.properties).forEach(property => {
                if (property.name.toLowerCase().includes(searchTerm) ||
                    property.description.toLowerCase().includes(searchTerm)) {
                    results.properties.push({
                        name: property.name,
                        description: property.description,
                        objectName: object.name
                    });
                }
            });
        });

        // Search keywords
        Object.values(this.data.keywords).forEach(keyword => {
            if (keyword.name.toLowerCase().includes(searchTerm) ||
                keyword.description.toLowerCase().includes(searchTerm)) {
                results.keywords.push({
                    name: keyword.name,
                    description: keyword.description,
                    category: keyword.category
                });
            }
        });

        return results;
    }

    // Get system statistics
    getStats() {
        if (!this.data) {
            throw new Error('Validator not initialized. Call initialize() first.');
        }

        return this.data.metadata;
    }

    // Helper method to find similar objects
    findSimilarObjects(objectName) {
        if (!this.data) return [];
        
        const objects = Object.keys(this.data.objects);
        return objects.filter(name => 
            this.calculateSimilarity(objectName.toLowerCase(), name.toLowerCase()) > 0.5
        ).slice(0, 3);
    }

    // Helper method to find similar methods
    findSimilarMethods(object, methodName) {
        const allMethods = [...Object.keys(object.methods), ...Object.keys(object.staticMethods)];
        return allMethods.filter(name =>
            this.calculateSimilarity(methodName.toLowerCase(), name.toLowerCase()) > 0.5
        ).slice(0, 3);
    }

    // Helper method to find similar keywords
    findSimilarKeywords(keyword) {
        if (!this.data) return [];
        
        const keywords = Object.keys(this.data.keywords);
        return keywords.filter(name =>
            this.calculateSimilarity(keyword.toLowerCase(), name.toLowerCase()) > 0.5
        ).slice(0, 3);
    }

    // Simple string similarity calculation
    calculateSimilarity(str1, str2) {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return 1;
        
        let matches = 0;
        for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
            if (str1[i] === str2[i]) matches++;
        }
        
        return matches / maxLength;
    }
}

module.exports = JavaScriptValidator;
