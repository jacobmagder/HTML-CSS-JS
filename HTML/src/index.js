const HTMLValidator = require('./HTMLValidator');
const HTMLTreeParser = require('../scripts/tree-to-json');
const fs = require('fs');
const path = require('path');

class HTMLDataSystem {
    constructor() {
        this.validator = null;
        this.data = null;
        this.dataPath = path.join(__dirname, '../data/html-elements.json');
    }

    /**
     * Initialize the HTML data system
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Load or generate HTML data
            await this.loadOrGenerateData();
            
            // Initialize validator with the data
            this.validator = new HTMLValidator(this.data);
            
            console.log('✅ HTML Data System initialized successfully');
            console.log(`📊 Loaded ${this.data.elements.length} HTML elements`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize HTML Data System:', error);
            return false;
        }
    }

    /**
     * Load existing data or generate it from tree file
     */
    async loadOrGenerateData() {
        if (fs.existsSync(this.dataPath)) {
            // Load existing data
            console.log('📂 Loading existing HTML data...');
            const rawData = fs.readFileSync(this.dataPath, 'utf8');
            this.data = JSON.parse(rawData);
        } else {
            // Generate data from tree file
            console.log('🔨 Generating HTML data from tree structure...');
            await this.generateData();
        }
    }

    /**
     * Generate data from the HTML tree structure
     */
    async generateData() {
        const parser = new HTMLTreeParser();
        const treeFilePath = path.join(__dirname, '../html-tree.txt');
        
        if (!fs.existsSync(treeFilePath)) {
            throw new Error(`HTML tree file not found: ${treeFilePath}`);
        }

        this.data = parser.parseTreeFile(treeFilePath);
        
        if (!this.data) {
            throw new Error('Failed to parse HTML tree file');
        }

        // Ensure data directory exists
        const dataDir = path.dirname(this.dataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save the generated data
        fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
        
        // Generate summary
        const summary = parser.generateSummary(this.data);
        const summaryPath = path.join(dataDir, 'html-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

        console.log('✅ HTML data generated and saved');
    }

    /**
     * Validate an HTML element
     * @param {string} elementName - Element name to validate
     * @returns {Object} Validation result
     */
    validateElement(elementName) {
        if (!this.validator) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }
        return this.validator.validateElement(elementName);
    }

    /**
     * Validate an attribute for a given element
     * @param {string} elementName - Element name
     * @param {string} attributeName - Attribute name to validate
     * @returns {Object} Validation result
     */
    validateAttribute(elementName, attributeName) {
        if (!this.validator) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }
        return this.validator.validateAttribute(elementName, attributeName);
    }

    /**
     * Get information about an HTML element
     * @param {string} elementName - Element name
     * @returns {Object|null} Element information
     */
    getElementInfo(elementName) {
        if (!this.validator) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }
        return this.validator.getElementInfo(elementName);
    }

    /**
     * Get elements by category
     * @param {string} category - Category name
     * @returns {Array} Elements in the category
     */
    getElementsByCategory(category) {
        if (!this.validator) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }
        return this.validator.getElementsByCategory(category);
    }

    /**
     * Get system statistics
     * @returns {Object} System statistics
     */
    getStatistics() {
        if (!this.data) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }
        return this.data.statistics;
    }

    /**
     * Get all available categories
     * @returns {Array} List of categories
     */
    getCategories() {
        if (!this.data) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }
        return [...new Set(this.data.elements.map(el => el.category))];
    }

    /**
     * Search elements by name or description
     * @param {string} query - Search query
     * @returns {Array} Matching elements
     */
    searchElements(query) {
        if (!this.data) {
            throw new Error('HTML Data System not initialized. Call initialize() first.');
        }

        const lowerQuery = query.toLowerCase();
        return this.data.elements.filter(element => 
            element.name.toLowerCase().includes(lowerQuery) ||
            element.description.toLowerCase().includes(lowerQuery) ||
            element.category.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get the raw data object
     * @returns {Object} Raw HTML data
     */
    getRawData() {
        return this.data;
    }
}

// CLI usage when run directly
if (require.main === module) {
    const system = new HTMLDataSystem();
    
    async function runCLI() {
        await system.initialize();
        
        const args = process.argv.slice(2);
        const command = args[0];
        
        switch (command) {
            case 'validate-element':
                if (args[1]) {
                    const result = system.validateElement(args[1]);
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    console.log('Usage: node src/index.js validate-element <element-name>');
                }
                break;
                
            case 'validate-attribute':
                if (args[1] && args[2]) {
                    const result = system.validateAttribute(args[1], args[2]);
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    console.log('Usage: node src/index.js validate-attribute <element-name> <attribute-name>');
                }
                break;
                
            case 'element-info':
                if (args[1]) {
                    const result = system.getElementInfo(args[1]);
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    console.log('Usage: node src/index.js element-info <element-name>');
                }
                break;
                
            case 'categories':
                const categories = system.getCategories();
                console.log('Available categories:');
                categories.forEach(cat => console.log(`  - ${cat}`));
                break;
                
            case 'stats':
                const stats = system.getStatistics();
                console.log('System Statistics:');
                console.log(JSON.stringify(stats, null, 2));
                break;
                
            case 'search':
                if (args[1]) {
                    const results = system.searchElements(args[1]);
                    console.log(`Found ${results.length} elements matching "${args[1]}":`);
                    results.forEach(el => console.log(`  - ${el.name} (${el.category})`));
                } else {
                    console.log('Usage: node src/index.js search <query>');
                }
                break;
                
            default:
                console.log('HTML Data System CLI');
                console.log('Usage: node src/index.js <command> [args]');
                console.log('');
                console.log('Commands:');
                console.log('  validate-element <name>        - Validate an HTML element');
                console.log('  validate-attribute <el> <attr> - Validate an attribute');
                console.log('  element-info <name>            - Get element information');
                console.log('  categories                     - List all categories');
                console.log('  stats                          - Show system statistics');
                console.log('  search <query>                 - Search elements');
        }
    }
    
    runCLI().catch(console.error);
}

module.exports = { HTMLDataSystem, HTMLValidator, HTMLTreeParser };
