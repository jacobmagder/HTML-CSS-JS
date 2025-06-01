#!/bin/bash

# 🚀 Web Development Validation Ecosystem Backup Script
# This script backs up only YOUR created files, not external libraries

echo "🚀 Creating backup of Web Development Validation Ecosystem..."
echo "============================================================"

# Create backup directory with timestamp
BACKUP_DIR="web-validation-backup-$(date +%Y%m%d-%H%M%S)"
mkdir "$BACKUP_DIR"

echo "📁 Backup directory: $BACKUP_DIR"

# Create main structure
mkdir -p "$BACKUP_DIR"/{HTML,Javascript,CSS}
mkdir -p "$BACKUP_DIR"/HTML/{src,scripts,test,data}
mkdir -p "$BACKUP_DIR"/Javascript/{src,scripts,test,data}
mkdir -p "$BACKUP_DIR"/CSS/{src,scripts,test,data}

echo "📄 Copying core system files..."
# Core system files
cp enhanced-unified-validator.js "$BACKUP_DIR/"
cp unified-validator.js "$BACKUP_DIR/"
cp demo.js "$BACKUP_DIR/"
cp final-status.js "$BACKUP_DIR/"
cp PROJECT-SUMMARY.md "$BACKUP_DIR/"
cp test-document.html "$BACKUP_DIR/"
cp README.md "$BACKUP_DIR/"

echo "📄 Copying HTML system..."
# HTML System
cp HTML/package.json "$BACKUP_DIR"/HTML/
cp HTML/README.md "$BACKUP_DIR"/HTML/
cp HTML/src/*.js "$BACKUP_DIR"/HTML/src/
cp HTML/scripts/*.js "$BACKUP_DIR"/HTML/scripts/
cp HTML/test/*.js "$BACKUP_DIR"/HTML/test/
cp HTML/data/*.json "$BACKUP_DIR"/HTML/data/
cp HTML/html-tree.txt "$BACKUP_DIR"/HTML/ 2>/dev/null || true

echo "⚡ Copying JavaScript system..."
# JavaScript System
cp Javascript/package.json "$BACKUP_DIR"/Javascript/
cp Javascript/README.md "$BACKUP_DIR"/Javascript/
cp Javascript/js-language-tree.txt "$BACKUP_DIR"/Javascript/
cp Javascript/src/*.js "$BACKUP_DIR"/Javascript/src/
cp Javascript/scripts/*.js "$BACKUP_DIR"/Javascript/scripts/
cp Javascript/test/*.js "$BACKUP_DIR"/Javascript/test/
cp Javascript/data/*.json "$BACKUP_DIR"/Javascript/data/

echo "🎨 Copying CSS system..."
# CSS System  
cp CSS/package.json "$BACKUP_DIR"/CSS/
cp CSS/ALL_data.txt "$BACKUP_DIR"/CSS/
cp CSS/src/CSSValidator.js "$BACKUP_DIR"/CSS/src/
cp CSS/src/index.js "$BACKUP_DIR"/CSS/src/
cp CSS/scripts/process-css-data.js "$BACKUP_DIR"/CSS/scripts/
cp CSS/scripts/validate-data.js "$BACKUP_DIR"/CSS/scripts/
cp CSS/test/test-validator.js "$BACKUP_DIR"/CSS/test/
cp CSS/data/*.json "$BACKUP_DIR"/CSS/data/

# Create restoration instructions
cat > "$BACKUP_DIR"/RESTORE-INSTRUCTIONS.md << 'EOF'
# 🔄 RESTORATION INSTRUCTIONS

## To restore this Web Development Validation Ecosystem:

### 1. Prerequisites
```bash
# Install Node.js (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

### 2. Set up the project
```bash
# Create project directory
mkdir HTML-CSS-JS
cd HTML-CSS-JS

# Copy all files from backup
cp -r /path/to/backup/* .

# Install dependencies for each system
cd HTML && npm install
cd ../Javascript && npm install  
cd ../CSS && npm install
cd ..
```

### 3. Verify installation
```bash
# Test each system
cd HTML && npm test
cd ../Javascript && npm test
cd ../CSS && npm test

# Test unified system
cd ..
node enhanced-unified-validator.js test-document.html
```

### 4. External dependencies (if needed)
```bash
# Only if you need the CSS Tree library for advanced features
cd CSS
git clone https://github.com/csstree/csstree.git csstree-master

# Only if you need MDN data
cd ../HTML
git clone https://github.com/mdn/browser-compat-data.git MDN/data-main
```

## 🎯 What's included in this backup:
- ✅ All custom validation logic and systems
- ✅ All generated language data (HTML, CSS, JS)
- ✅ All tests and documentation
- ✅ Unified validation system
- ✅ CLI tools and demo scripts
- ❌ External libraries (download separately if needed)

## 📊 System capabilities after restoration:
- HTML validation (142+ elements)
- JavaScript validation (305 methods, 39 objects)
- CSS validation (651 properties, 409 types)
- Cross-system validation
- Unified error reporting
- Educational and professional use ready
EOF

# Create file inventory
echo "📋 Creating file inventory..."
find "$BACKUP_DIR" -type f | sort > "$BACKUP_DIR"/FILE-INVENTORY.txt

# Calculate sizes
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
FILE_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)

echo ""
echo "✅ BACKUP COMPLETE!"
echo "=================="
echo "📁 Directory: $BACKUP_DIR"
echo "📊 Total size: $TOTAL_SIZE"
echo "📄 Files backed up: $FILE_COUNT"
echo "💾 Your complete Web Development Validation Ecosystem is saved!"
echo ""
echo "🔄 To restore: Follow instructions in $BACKUP_DIR/RESTORE-INSTRUCTIONS.md"
echo "📋 File list: See $BACKUP_DIR/FILE-INVENTORY.txt"

# Optionally create tar.gz archive
read -p "📦 Create compressed archive? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
    ARCHIVE_SIZE=$(du -sh "$BACKUP_DIR.tar.gz" | cut -f1)
    echo "✅ Archive created: $BACKUP_DIR.tar.gz ($ARCHIVE_SIZE)"
fi

echo "🎉 Backup process complete!"
