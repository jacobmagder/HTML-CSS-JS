# HTML Data Parser & Validator

A comprehensive HTML data collection and parsing system similar to CSSTree and MDN's CSS data structure. This system provides structured data about HTML elements, attributes, and their relationships for validation, documentation, and tooling purposes.

## 🎯 Overview

This project creates a comprehensive, machine-readable database of HTML elements and their attributes, inspired by:
- **CSSTree's data structure** - for systematic organization
- **MDN Web Docs** - for authoritative documentation
- **W3C/WHATWG specifications** - for accuracy and completeness

## 📊 Generated Data

The system generates structured JSON data containing:
- **53 HTML elements** across 7 categories
- **492 total attributes** (including 8 global attributes)
- Element descriptions, categories, and relationships
- Attribute types, requirements, and validation rules
- Browser support information
- Accessibility metadata

## 🏗️ Project Structure

```
HTML/
├── data/                    # Generated data files
│   ├── html-elements.json   # Main HTML elements data
│   └── html-summary.json    # Statistics and summary
├── scripts/                 # Build and utility scripts
│   ├── tree-to-json.js     # Parser for HTML tree structure
│   └── validate-data.js    # Data validation script
├── src/                     # Main library code
│   ├── HTMLValidator.js    # Validation engine
│   └── index.js            # Main API and CLI
├── test/                    # Test suite
│   └── test-validator.js   # Validation tests
├── html-tree.txt           # Source HTML structure
└── package.json            # Project configuration
```

## 🚀 Quick Start

### Installation

```bash
# Clone and navigate to the HTML directory
cd /workspaces/HTML-CSS-JS/HTML

# Install dependencies
npm install
```

### Generate Data

```bash
# Parse HTML tree structure and generate JSON data
npm run build

# Validate the generated data
npm run validate

# Run tests
npm test

# Complete generation and validation
npm run generate
```

### CLI Usage

```bash
# Validate an HTML element
node src/index.js validate-element div

# Validate an attribute
node src/index.js validate-attribute img src

# Get element information
node src/index.js element-info form

# List all categories
node src/index.js categories

# Search elements
node src/index.js search "form"

# Show statistics
node src/index.js stats
```

## 📚 API Usage

### Basic Usage

```javascript
const { HTMLDataSystem } = require('./src/index');

async function example() {
    const system = new HTMLDataSystem();
    await system.initialize();
    
    // Validate elements
    const divResult = system.validateElement('div');
    console.log(divResult.isValid); // true
    
    // Validate attributes
    const attrResult = system.validateAttribute('img', 'src');
    console.log(attrResult.isValid); // true
    console.log(attrResult.attribute.required); // true
    
    // Get element info
    const elementInfo = system.getElementInfo('form');
    console.log(elementInfo.category); // "Forms"
    console.log(elementInfo.attributes.length); // Number of attributes
    
    // Search elements
    const results = system.searchElements('input');
    console.log(results.map(el => el.name)); // ['input', ...]
}
```

### Validation API

```javascript
const { HTMLValidator } = require('./src/HTMLValidator');

// Load data and create validator
const validator = new HTMLValidator(htmlData);

// Element validation
const elementResult = validator.validateElement('section');
// Returns: { isValid: boolean, element: object, suggestions: string[] }

// Attribute validation  
const attrResult = validator.validateAttribute('input', 'type');
// Returns: { isValid: boolean, isGlobal: boolean, attribute: object, suggestions: string[] }

// Get element relationships
const parents = validator.getPossibleParents('li');
const children = validator.getPossibleChildren('ul');

// Browser support
const support = validator.getBrowserSupport('video');
```

## 🏷️ Data Structure

### Element Format

```json
{
  "name": "div",
  "category": "Text Content",
  "description": "Generic container for flow content...",
  "attributes": [
    {
      "name": "id",
      "description": "Unique identifier for the element",
      "required": false,
      "deprecated": false,
      "experimental": false,
      "type": "id",
      "global": true
    }
  ],
  "contentModel": "flow content",
  "accessibility": {
    "role": "generic",
    "description": "No semantic meaning"
  },
  "browserSupport": {
    "chrome": "supported",
    "firefox": "supported",
    "safari": "supported",
    "edge": "supported"
  },
  "deprecated": false,
  "experimental": false
}
```

### Categories

- **Document Metadata** (8 elements) - `<html>`, `<head>`, `<title>`, etc.
- **Content Sectioning** (14 elements) - `<body>`, `<header>`, `<nav>`, etc.
- **Text Content** (8 elements) - `<div>`, `<p>`, `<span>`, etc.
- **Forms** (7 elements) - `<form>`, `<input>`, `<button>`, etc.
- **Media** (3 elements) - `<img>`, `<video>`, `<audio>`
- **Lists** (6 elements) - `<ul>`, `<ol>`, `<li>`, etc.
- **Tables** (7 elements) - `<table>`, `<tr>`, `<td>`, etc.

## 🔧 Development

### Adding New Elements

1. Update `html-tree.txt` with new element structure
2. Run `npm run build` to regenerate data
3. Run `npm run validate` to check data quality
4. Run `npm test` to ensure everything works

### Parser Customization

The `HTMLTreeParser` class in `scripts/tree-to-json.js` can be extended to:
- Parse additional metadata
- Support custom attribute types
- Add validation rules
- Import from external sources

### Validation Rules

The `HTMLDataValidator` checks for:
- Required fields and proper structure
- Unique element names
- Valid attribute types
- Consistent categorization
- HTML naming conventions

## 🎯 Use Cases

### Development Tools
- **VS Code Extensions** - Auto-completion and validation
- **Linters** - HTML validation and best practices
- **Build Tools** - Static analysis and optimization

### Documentation
- **API Documentation** - Automated docs generation
- **Style Guides** - Component libraries and design systems
- **Training Materials** - Interactive HTML learning tools

### Quality Assurance
- **Accessibility Testing** - ARIA validation and semantic checking
- **Cross-browser Testing** - Feature support validation
- **Performance Analysis** - Element usage optimization

## 🤝 Contributing

This system is designed to be:
- **Extensible** - Easy to add new data sources
- **Maintainable** - Clear separation of concerns
- **Accurate** - Based on official specifications
- **Practical** - Designed for real-world usage

## 📈 Statistics

Current data includes:
- ✅ 53 HTML elements
- ✅ 492 total attributes
- ✅ 8 global attributes
- ✅ 7 semantic categories
- ✅ 0 validation errors
- ⚠️ 1 minor warning (elements without specific attributes)

## 🔮 Future Plans

1. **JavaScript Language Data** - Extend to JS APIs and language features
2. **Enhanced Browser Support** - Detailed compatibility matrices
3. **Content Models** - Full HTML content model validation
4. **ARIA Integration** - Complete accessibility role mapping
5. **Specification Sync** - Automated updates from W3C/WHATWG specs

## 📄 License

MIT License - Feel free to use this in your projects!
