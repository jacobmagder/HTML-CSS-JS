const fs = require('fs');
const path = require('path');

class HTMLTreeParser {
    constructor() {
        this.elements = [];
        this.currentCategory = null;
        this.currentElement = null;
        this.inDescription = false;
        this.descriptionBuffer = [];
    }

    parseTreeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                this.parseLine(line.trim(), i);
            }
            
            // Finalize any pending element
            this._finalizeCurrentElement();
            
            return {
                version: "1.0.0",
                lastUpdated: new Date().toISOString(),
                description: "Comprehensive HTML elements data structure",
                elements: this.elements,
                statistics: {
                    totalElements: this.elements.length,
                    categories: [...new Set(this.elements.map(el => el.category))].length
                }
            };
        } catch (error) {
            console.error('Error parsing tree file:', error);
            return null;
        }
    }

    parseLine(line, lineNumber) {
        if (!line) {
            this._endDescription();
            return;
        }

        // Skip comment lines and headers
        if (line.startsWith('#') && !line.startsWith('##') && !line.startsWith('###')) {
            return;
        }

        // Category headers (e.g., "## Document Metadata")
        if (line.startsWith('##') && !line.startsWith('###')) {
            this._finalizeCurrentElement();
            this.currentCategory = line.replace(/^##\s*/, '').trim();
            console.log(`Found category: ${this.currentCategory}`);
            return;
        }

        // Element definitions (e.g., "### <html>")
        if (line.startsWith('###')) {
            this._finalizeCurrentElement();
            const elementMatch = line.match(/###\s*<([^>]+)>/);
            if (elementMatch) {
                console.log(`Found element: ${elementMatch[1]} in category: ${this.currentCategory}`);
                this.currentElement = {
                    name: elementMatch[1],
                    category: this.currentCategory || 'Unknown',
                    description: '',
                    attributes: [],
                    contentModel: '',
                    accessibility: {},
                    browserSupport: {},
                    examples: [],
                    deprecated: false,
                    experimental: false
                };
                this.inDescription = true;
                this.descriptionBuffer = [];
            }
            return;
        }

        // Attribute definitions (starting with "- ")
        if (line.startsWith('- ') && this.currentElement) {
            this._endDescription();
            const attrText = line.substring(2);
            
            // Skip "None specific to this element" entries
            if (attrText.toLowerCase().includes('none specific') || 
                attrText.toLowerCase().includes('no specific')) {
                return;
            }
            
            const attribute = this._parseAttribute(attrText);
            if (attribute) {
                this.currentElement.attributes.push(attribute);
            }
            return;
        }

        // Content model definitions
        if (line.startsWith('Content model:') && this.currentElement) {
            this._endDescription();
            this.currentElement.contentModel = line.replace('Content model:', '').trim();
            return;
        }

        // Browser support
        if (line.startsWith('Browser support:') && this.currentElement) {
            this._endDescription();
            this.currentElement.browserSupport = this._parseBrowserSupport(line);
            return;
        }

        // Accessibility information
        if (line.startsWith('Accessibility:') && this.currentElement) {
            this._endDescription();
            this.currentElement.accessibility = this._parseAccessibility(line);
            return;
        }

        // Status indicators
        if (line.includes('(deprecated)') || line.includes('(obsolete)')) {
            if (this.currentElement) {
                this.currentElement.deprecated = true;
            }
            return;
        }

        if (line.includes('(experimental)')) {
            if (this.currentElement) {
                this.currentElement.experimental = true;
            }
            return;
        }

        // Description text
        if (this.inDescription && this.currentElement) {
            this.descriptionBuffer.push(line);
        }
    }

    _parseAttribute(attrText) {
        // Parse attribute text like "src (required) - URL of the image"
        const parts = attrText.split(' - ');
        const nameAndFlags = parts[0];
        const description = parts[1] || '';

        let name = nameAndFlags;
        let required = false;
        let deprecated = false;
        let experimental = false;

        // Extract flags
        if (nameAndFlags.includes('(required)')) {
            required = true;
            name = nameAndFlags.replace('(required)', '').trim();
        }
        if (nameAndFlags.includes('(deprecated)')) {
            deprecated = true;
            name = nameAndFlags.replace('(deprecated)', '').trim();
        }
        if (nameAndFlags.includes('(experimental)')) {
            experimental = true;
            name = nameAndFlags.replace('(experimental)', '').trim();
        }

        return {
            name: name.trim(),
            description: description.trim(),
            required,
            deprecated,
            experimental,
            type: this._inferAttributeType(name, description)
        };
    }

    _inferAttributeType(name, description) {
        // Simple type inference based on common patterns
        if (name.includes('id') || name === 'for') return 'id';
        if (name.includes('class')) return 'class-list';
        if (name.includes('src') || name.includes('href') || name.includes('action')) return 'url';
        if (name.includes('width') || name.includes('height') || name.includes('size')) return 'number';
        if (name.includes('disabled') || name.includes('checked') || name.includes('required')) return 'boolean';
        if (description.toLowerCase().includes('url')) return 'url';
        if (description.toLowerCase().includes('number')) return 'number';
        if (description.toLowerCase().includes('boolean')) return 'boolean';
        
        return 'string';
    }

    _parseBrowserSupport(line) {
        // Simple parser for browser support - would need more sophisticated parsing in reality
        const support = {
            chrome: 'unknown',
            firefox: 'unknown',
            safari: 'unknown',
            edge: 'unknown'
        };

        const text = line.replace('Browser support:', '').trim().toLowerCase();
        if (text.includes('all modern browsers') || text.includes('widely supported')) {
            Object.keys(support).forEach(browser => {
                support[browser] = 'supported';
            });
        }

        return support;
    }

    _parseAccessibility(line) {
        const text = line.replace('Accessibility:', '').trim();
        return {
            role: 'unknown',
            description: text
        };
    }

    _endDescription() {
        if (this.inDescription && this.currentElement && this.descriptionBuffer.length > 0) {
            this.currentElement.description = this.descriptionBuffer.join(' ').trim();
            this.inDescription = false;
            this.descriptionBuffer = [];
        }
    }

    _finalizeCurrentElement() {
        this._endDescription();
        if (this.currentElement) {
            // Add some default attributes for all elements if not already present
            this._addGlobalAttributes();
            this.elements.push(this.currentElement);
            this.currentElement = null;
        }
    }

    _addGlobalAttributes() {
        if (!this.currentElement) return;

        const globalAttrs = [
            { name: 'id', description: 'Unique identifier for the element', required: false, type: 'id' },
            { name: 'class', description: 'Space-separated list of CSS classes', required: false, type: 'class-list' },
            { name: 'style', description: 'Inline CSS styles', required: false, type: 'string' },
            { name: 'title', description: 'Advisory information about the element', required: false, type: 'string' },
            { name: 'lang', description: 'Language of the element content', required: false, type: 'string' },
            { name: 'dir', description: 'Text direction (ltr, rtl, auto)', required: false, type: 'string' },
            { name: 'hidden', description: 'Indicates element is not relevant', required: false, type: 'boolean' },
            { name: 'tabindex', description: 'Indicates if element can be focused', required: false, type: 'number' }
        ];

        // Only add global attributes that aren't already defined
        const existingAttrNames = new Set(this.currentElement.attributes.map(attr => attr.name));
        
        globalAttrs.forEach(globalAttr => {
            if (!existingAttrNames.has(globalAttr.name)) {
                this.currentElement.attributes.push({
                    ...globalAttr,
                    global: true
                });
            }
        });
    }

    // Generate summary statistics
    generateSummary(data) {
        const categories = {};
        const deprecatedElements = [];
        const experimentalElements = [];

        data.elements.forEach(element => {
            // Count by category
            if (!categories[element.category]) {
                categories[element.category] = 0;
            }
            categories[element.category]++;

            // Track deprecated/experimental
            if (element.deprecated) {
                deprecatedElements.push(element.name);
            }
            if (element.experimental) {
                experimentalElements.push(element.name);
            }
        });

        return {
            totalElements: data.elements.length,
            categoryCounts: categories,
            deprecatedCount: deprecatedElements.length,
            experimentalCount: experimentalElements.length,
            deprecatedElements,
            experimentalElements
        };
    }
}

// Usage
if (require.main === module) {
    const parser = new HTMLTreeParser();
    const treeFilePath = path.join(__dirname, '../html-tree.txt');
    
    if (!fs.existsSync(treeFilePath)) {
        console.error(`HTML tree file not found: ${treeFilePath}`);
        process.exit(1);
    }

    console.log('Parsing HTML tree structure...');
    const result = parser.parseTreeFile(treeFilePath);

    if (result) {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write main data file
        const outputPath = path.join(dataDir, 'html-elements.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        // Generate and write summary
        const summary = parser.generateSummary(result);
        const summaryPath = path.join(dataDir, 'html-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        
        console.log('✅ HTML elements data generated successfully!');
        console.log(`📄 Main data: ${outputPath}`);
        console.log(`📊 Summary: ${summaryPath}`);
        console.log(`📈 Statistics: ${result.statistics.totalElements} elements in ${result.statistics.categories} categories`);
    } else {
        console.error('❌ Failed to parse HTML tree');
        process.exit(1);
    }
}

module.exports = HTMLTreeParser;
