#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class JavaScriptTreeParser {
    constructor() {
        this.data = {
            categories: {},
            objects: {},
            keywords: {},
            metadata: {
                version: "1.0.0",
                lastUpdated: new Date().toISOString(),
                totalCategories: 0,
                totalObjects: 0,
                totalKeywords: 0,
                totalMethods: 0
            }
        };
    }

    parse(content) {
        const lines = content.split('\n');
        let currentCategory = null;
        let currentSubcategory = null;
        let currentObject = null;
        let currentKeyword = null;
        let collectingMethods = false;
        let collectingProperties = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line || line.startsWith('//')) continue;

            // Categories (## Category Name)
            if (line.match(/^## (.+)$/)) {
                currentCategory = line.substring(3).trim();
                this.data.categories[currentCategory] = {
                    name: currentCategory,
                    subcategories: {},
                    objects: {},
                    keywords: {}
                };
                currentSubcategory = null;
                currentObject = null;
                currentKeyword = null;
                collectingMethods = false;
                collectingProperties = false;
                continue;
            }

            // Subcategories (### Subcategory Name)
            if (line.match(/^### (.+)$/)) {
                currentSubcategory = line.substring(4).trim();
                if (currentCategory) {
                    this.data.categories[currentCategory].subcategories[currentSubcategory] = {
                        name: currentSubcategory,
                        objects: {},
                        keywords: {}
                    };
                }
                currentObject = null;
                currentKeyword = null;
                collectingMethods = false;
                collectingProperties = false;
                continue;
            }

            // Objects and Keywords (#### <name>)
            if (line.match(/^#### <(.+)>$/)) {
                const name = line.match(/^#### <(.+)>$/)[1];
                const isBuiltInObject = name[0] === name[0].toUpperCase() && name !== 'e'; // Objects start with uppercase
                
                if (isBuiltInObject) {
                    currentObject = name;
                    currentKeyword = null;
                    
                    this.data.objects[name] = {
                        name: name,
                        category: currentCategory,
                        subcategory: currentSubcategory,
                        description: "",
                        properties: {},
                        methods: {},
                        staticMethods: {},
                        examples: []
                    };

                    // Add to category tracking
                    if (currentCategory) {
                        this.data.categories[currentCategory].objects[name] = this.data.objects[name];
                        if (currentSubcategory) {
                            this.data.categories[currentCategory].subcategories[currentSubcategory].objects[name] = this.data.objects[name];
                        }
                    }
                } else {
                    currentKeyword = name;
                    currentObject = null;
                    
                    this.data.keywords[name] = {
                        name: name,
                        category: currentCategory,
                        subcategory: currentSubcategory,
                        description: "",
                        attributes: {},
                        examples: []
                    };

                    // Add to category tracking
                    if (currentCategory) {
                        this.data.categories[currentCategory].keywords[name] = this.data.keywords[name];
                        if (currentSubcategory) {
                            this.data.categories[currentCategory].subcategories[currentSubcategory].keywords[name] = this.data.keywords[name];
                        }
                    }
                }
                
                collectingMethods = false;
                collectingProperties = false;
                continue;
            }

            // Description line (first line after ####)
            if ((currentObject || currentKeyword) && !collectingMethods && !collectingProperties) {
                if (line && !line.startsWith('- ') && !line.includes('Properties:') && !line.includes('Methods:')) {
                    const target = currentObject ? this.data.objects[currentObject] : this.data.keywords[currentKeyword];
                    if (!target.description) {
                        target.description = line;
                    } else {
                        target.description += ' ' + line;
                    }
                    continue;
                }
            }

            // Properties section
            if (line === 'Properties:') {
                collectingProperties = true;
                collectingMethods = false;
                continue;
            }

            // Methods section
            if (line === 'Methods:') {
                collectingMethods = true;
                collectingProperties = false;
                continue;
            }

            // Property/Method/Attribute items (- name - description)
            if (line.match(/^- (.+) - (.+)$/)) {
                const match = line.match(/^- (.+) - (.+)$/);
                const name = match[1].trim();
                const description = match[2].trim();

                if (currentObject) {
                    if (collectingProperties) {
                        this.data.objects[currentObject].properties[name] = {
                            name: name,
                            description: description,
                            type: "property"
                        };
                    } else if (collectingMethods) {
                        const isStatic = description.includes('(static method)');
                        const cleanDescription = description.replace(' (static method)', '');
                        
                        if (isStatic) {
                            this.data.objects[currentObject].staticMethods[name] = {
                                name: name,
                                description: cleanDescription,
                                type: "static method",
                                static: true
                            };
                        } else {
                            this.data.objects[currentObject].methods[name] = {
                                name: name,
                                description: cleanDescription,
                                type: "method",
                                static: false
                            };
                        }
                    }
                } else if (currentKeyword) {
                    this.data.keywords[currentKeyword].attributes[name] = {
                        name: name,
                        description: description,
                        type: "attribute"
                    };
                }
                continue;
            }

            // Simple property items (- name)
            if (line.match(/^- (.+)$/) && !line.includes(' - ')) {
                const name = line.substring(2).trim();
                
                if (currentKeyword) {
                    this.data.keywords[currentKeyword].attributes[name] = {
                        name: name,
                        description: "",
                        type: "attribute"
                    };
                }
                continue;
            }
        }

        // Calculate metadata
        this.data.metadata.totalCategories = Object.keys(this.data.categories).length;
        this.data.metadata.totalObjects = Object.keys(this.data.objects).length;
        this.data.metadata.totalKeywords = Object.keys(this.data.keywords).length;
        
        let totalMethods = 0;
        Object.values(this.data.objects).forEach(obj => {
            totalMethods += Object.keys(obj.methods).length;
            totalMethods += Object.keys(obj.staticMethods).length;
        });
        this.data.metadata.totalMethods = totalMethods;

        return this.data;
    }

    generateSummary() {
        const summary = {
            metadata: this.data.metadata,
            categories: {},
            topObjects: [],
            topKeywords: []
        };

        // Category summaries
        Object.values(this.data.categories).forEach(category => {
            summary.categories[category.name] = {
                name: category.name,
                objectCount: Object.keys(category.objects).length,
                keywordCount: Object.keys(category.keywords).length,
                subcategoryCount: Object.keys(category.subcategories).length
            };
        });

        // Top objects by method count
        summary.topObjects = Object.values(this.data.objects)
            .map(obj => ({
                name: obj.name,
                methodCount: Object.keys(obj.methods).length + Object.keys(obj.staticMethods).length,
                propertyCount: Object.keys(obj.properties).length
            }))
            .sort((a, b) => b.methodCount - a.methodCount)
            .slice(0, 10);

        // Top keywords by attribute count
        summary.topKeywords = Object.values(this.data.keywords)
            .map(keyword => ({
                name: keyword.name,
                attributeCount: Object.keys(keyword.attributes).length
            }))
            .sort((a, b) => b.attributeCount - a.attributeCount)
            .slice(0, 10);

        return summary;
    }
}

function main() {
    const inputFile = path.join(__dirname, '../js-language-tree.txt');
    const outputFile = path.join(__dirname, '../data/js-language.json');
    const summaryFile = path.join(__dirname, '../data/js-summary.json');

    console.log('JavaScript Tree Parser');
    console.log('=====================');

    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file not found: ${inputFile}`);
        process.exit(1);
    }

    // Ensure data directory exists
    const dataDir = path.dirname(outputFile);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
        console.log(`Reading tree structure from: ${inputFile}`);
        const content = fs.readFileSync(inputFile, 'utf8');

        console.log('Parsing JavaScript language tree...');
        const parser = new JavaScriptTreeParser();
        const data = parser.parse(content);

        console.log(`Writing JavaScript data to: ${outputFile}`);
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

        console.log('Generating summary...');
        const summary = parser.generateSummary();
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

        console.log('\nParsing completed successfully!');
        console.log(`Categories: ${data.metadata.totalCategories}`);
        console.log(`Objects: ${data.metadata.totalObjects}`);
        console.log(`Keywords: ${data.metadata.totalKeywords}`);
        console.log(`Methods: ${data.metadata.totalMethods}`);
        console.log(`\nFiles generated:`);
        console.log(`- ${outputFile}`);
        console.log(`- ${summaryFile}`);

    } catch (error) {
        console.error('Error parsing JavaScript tree:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = JavaScriptTreeParser;
