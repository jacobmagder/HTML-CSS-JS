class HTMLValidator {
    constructor(htmlData) {
        this.htmlData = htmlData;
        this.elements = new Map();
        this.attributes = new Map();
        
        // Initialize data structures
        this._initializeData();
    }
    
    _initializeData() {
        // Convert array of elements to Map for faster lookup
        if (this.htmlData && this.htmlData.elements) {
            this.htmlData.elements.forEach(element => {
                this.elements.set(element.name, element);
                
                // Build global attributes map
                if (element.attributes) {
                    element.attributes.forEach(attr => {
                        if (!this.attributes.has(attr.name)) {
                            this.attributes.set(attr.name, []);
                        }
                        this.attributes.get(attr.name).push(element.name);
                    });
                }
            });
        }
    }
    
    /**
     * Check if an HTML element is valid
     * @param {string} elementName - The element name to validate
     * @returns {Object} Validation result
     */
    validateElement(elementName) {
        const normalizedName = elementName.toLowerCase();
        const element = this.elements.get(normalizedName);
        
        return {
            isValid: !!element,
            element: element || null,
            suggestions: element ? [] : this._getSuggestions(normalizedName)
        };
    }
    
    /**
     * Check if an attribute is valid for a given element
     * @param {string} elementName - The element name
     * @param {string} attributeName - The attribute name to validate
     * @returns {Object} Validation result
     */
    validateAttribute(elementName, attributeName) {
        const normalizedElement = elementName.toLowerCase();
        const normalizedAttribute = attributeName.toLowerCase();
        
        const element = this.elements.get(normalizedElement);
        if (!element) {
            return {
                isValid: false,
                reason: `Unknown element: ${elementName}`,
                suggestions: this._getSuggestions(normalizedElement)
            };
        }
        
        // Check if attribute exists on this element
        const hasAttribute = element.attributes && 
            element.attributes.some(attr => attr.name === normalizedAttribute);
            
        // Check global attributes
        const isGlobalAttribute = this._isGlobalAttribute(normalizedAttribute);
        
        return {
            isValid: hasAttribute || isGlobalAttribute,
            isGlobal: isGlobalAttribute,
            attribute: hasAttribute ? 
                element.attributes.find(attr => attr.name === normalizedAttribute) : 
                null,
            suggestions: (hasAttribute || isGlobalAttribute) ? [] : 
                this._getAttributeSuggestions(element, normalizedAttribute)
        };
    }
    
    /**
     * Get information about an HTML element
     * @param {string} elementName - The element name
     * @returns {Object|null} Element information
     */
    getElementInfo(elementName) {
        const normalizedName = elementName.toLowerCase();
        return this.elements.get(normalizedName) || null;
    }
    
    /**
     * Get all elements in a specific category
     * @param {string} category - The category name
     * @returns {Array} Array of elements in the category
     */
    getElementsByCategory(category) {
        return Array.from(this.elements.values())
            .filter(element => element.category === category);
    }
    
    /**
     * Get elements that can contain a specific element
     * @param {string} elementName - The element name
     * @returns {Array} Array of possible parent elements
     */
    getPossibleParents(elementName) {
        const normalizedName = elementName.toLowerCase();
        const parents = [];
        
        this.elements.forEach((element, name) => {
            if (element.contentModel && 
                this._canContain(element.contentModel, normalizedName)) {
                parents.push(name);
            }
        });
        
        return parents;
    }
    
    /**
     * Get elements that a specific element can contain
     * @param {string} elementName - The element name
     * @returns {Array} Array of possible child elements
     */
    getPossibleChildren(elementName) {
        const normalizedName = elementName.toLowerCase();
        const element = this.elements.get(normalizedName);
        
        if (!element || !element.contentModel) {
            return [];
        }
        
        const children = [];
        this.elements.forEach((childElement, childName) => {
            if (this._canContain(element.contentModel, childName)) {
                children.push(childName);
            }
        });
        
        return children;
    }
    
    /**
     * Check browser support for an element
     * @param {string} elementName - The element name
     * @param {string} browser - The browser name (optional)
     * @returns {Object} Browser support information
     */
    getBrowserSupport(elementName, browser = null) {
        const element = this.elements.get(elementName.toLowerCase());
        if (!element || !element.browserSupport) {
            return null;
        }
        
        if (browser) {
            return element.browserSupport[browser] || null;
        }
        
        return element.browserSupport;
    }
    
    // Private helper methods
    _getSuggestions(elementName) {
        const suggestions = [];
        const elementNames = Array.from(this.elements.keys());
        
        // Simple string similarity matching
        elementNames.forEach(name => {
            if (this._calculateSimilarity(elementName, name) > 0.6) {
                suggestions.push(name);
            }
        });
        
        return suggestions.slice(0, 5); // Return top 5 suggestions
    }
    
    _getAttributeSuggestions(element, attributeName) {
        const suggestions = [];
        
        if (element.attributes) {
            element.attributes.forEach(attr => {
                if (this._calculateSimilarity(attributeName, attr.name) > 0.6) {
                    suggestions.push(attr.name);
                }
            });
        }
        
        return suggestions.slice(0, 5);
    }
    
    _isGlobalAttribute(attributeName) {
        const globalAttributes = [
            'accesskey', 'class', 'contenteditable', 'dir', 'draggable',
            'hidden', 'id', 'lang', 'spellcheck', 'style', 'tabindex',
            'title', 'translate', 'data-*', 'aria-*'
        ];
        
        return globalAttributes.includes(attributeName) ||
               attributeName.startsWith('data-') ||
               attributeName.startsWith('aria-');
    }
    
    _canContain(contentModel, childElementName) {
        if (!contentModel) return false;
        
        // This is a simplified implementation
        // In a real implementation, you'd need to parse content model rules
        if (contentModel.includes('any')) return true;
        if (contentModel.includes('flow') && this._isFlowContent(childElementName)) return true;
        if (contentModel.includes('phrasing') && this._isPhrasingContent(childElementName)) return true;
        
        return contentModel.includes(childElementName);
    }
    
    _isFlowContent(elementName) {
        // Simplified check - in reality, this would be more comprehensive
        const flowElements = [
            'div', 'p', 'span', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
        ];
        return flowElements.includes(elementName);
    }
    
    _isPhrasingContent(elementName) {
        // Simplified check - in reality, this would be more comprehensive
        const phrasingElements = [
            'span', 'a', 'img', 'strong', 'em', 'code', 'b', 'i', 'u'
        ];
        return phrasingElements.includes(elementName);
    }
    
    _calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this._levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    _levenshteinDistance(str1, str2) {
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

module.exports = HTMLValidator;
