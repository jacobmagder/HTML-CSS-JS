# JavaScript Language Data System

A comprehensive JavaScript language data collection and validation system that provides structured information about JavaScript syntax, objects, methods, keywords, and Web APIs.

## 🎯 Features

- **Complete Language Coverage**: Core JavaScript syntax, ES6+ features, and Web APIs
- **Structured Data**: Well-organized JSON data with categories, objects, methods, and keywords  
- **Validation System**: Syntax validation, object/method checking, and keyword validation
- **CLI Interface**: Command-line tools for validation, information retrieval, and search
- **Comprehensive Testing**: 57 tests covering all system functionality with 100% success rate
- **Modern JavaScript**: ES6+ features including async/await, destructuring, arrow functions
- **Web APIs**: DOM manipulation, Fetch API, Storage APIs, Canvas, WebSocket, and more

## 📊 Current Data Stats

- **Categories**: 6 (Core Language Syntax, Built-in Objects, Collections, Promises and Async, ES6+ Modern Features, Web APIs)
- **Objects**: 39 (Array, String, Object, Promise, Document, Element, Canvas, etc.)
- **Keywords**: 41 (async, await, const, let, class, for, while, etc.)
- **Methods**: 305 (comprehensive coverage of all object methods)
- **Properties**: 33 (object properties and attributes)

## 🚀 Quick Start

### Installation

```bash
cd Javascript
npm install
```

### Build System

```bash
# Generate JSON data from tree structure
npm run build

# Run comprehensive test suite
npm test

# Validate data consistency
npm run validate

# View statistics
npm run stats
```

### CLI Usage

```bash
# Validate JavaScript syntax
node src/index.js validate-syntax "const x = 42;"

# Check if object exists
node src/index.js validate-object Array

# Check if method exists  
node src/index.js validate-method Array.map

# Check if keyword exists
node src/index.js validate-keyword async

# Get object information
node src/index.js object-info Document

# Get method information
node src/index.js method-info Array.filter

# List all categories
node src/index.js categories

# Search for features
node src/index.js search "promise"

# Get system statistics
node src/index.js stats
```
- ECMAScript specification references

## Categories

### Core Language
- **Keywords**: Reserved words and operators
- **Types**: Primitive and object types
- **Statements**: Control flow and declaration statements
- **Expressions**: All expression types
- **Functions**: Function declarations, expressions, and arrow functions

### Built-in Objects
- **Global Objects**: Object, Array, Function, etc.
- **Error Objects**: Error types and their properties
- **Dates and Numbers**: Date, Number, Math, etc.
- **Text Processing**: String, RegExp
- **Collections**: Map, Set, WeakMap, WeakSet
- **Promises**: Promise, async/await

### Web APIs
- **DOM**: Document Object Model interfaces
- **Events**: Event types and handlers
- **Storage**: localStorage, sessionStorage, IndexedDB
- **Network**: Fetch, XMLHttpRequest, WebSocket
- **Graphics**: Canvas, WebGL, SVG
- **Media**: Audio, Video, MediaStream

### Browser Features
- **BOM**: Browser Object Model (window, navigator, etc.)
- **Geolocation**: Location services
- **Notifications**: Web notifications
- **Workers**: Service Workers, Web Workers
- **Modules**: ES modules, CommonJS

## Usage

```javascript
const { JavaScriptDataSystem } = require('./src/index');

const jsSystem = new JavaScriptDataSystem();
await jsSystem.initialize();

// Validate JavaScript syntax
const result = jsSystem.validateSyntax('const x = 42;');

// Get information about a built-in object
const arrayInfo = jsSystem.getObjectInfo('Array');

// Check method availability
const methodInfo = jsSystem.getMethodInfo('Array', 'map');
```

## Data Format

Each JavaScript feature is documented with:
- Name and type
- Description and examples
- Parameters and return types
- Browser support matrix
- ECMAScript version introduced
- MDN documentation links
- Usage patterns and best practices
