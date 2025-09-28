#!/bin/bash

# ============================================
# Intelligent Cleanup Slash Command Setup
# ============================================

echo "🚀 Setting up Intelligent Cleanup Slash Command..."

# Create directories if they don't exist
echo "📁 Creating command directories..."
mkdir -p .claude/commands
mkdir -p .cleanup-history

# Copy the slash command
echo "📝 Installing cleanup slash command..."
if [ -f "cleanup-command.md" ]; then
    cp cleanup-command.md .claude/commands/cleanup.md
    echo "✅ Slash command installed to .claude/commands/cleanup.md"
else
    echo "⚠️  cleanup-command.md not found. Please ensure it's in the current directory."
fi

# Setup .cleanupignore if it doesn't exist
if [ ! -f ".cleanupignore" ]; then
    echo "📋 Creating .cleanupignore file..."
    if [ -f ".cleanupignore-template" ]; then
        cp .cleanupignore-template .cleanupignore
        echo "✅ .cleanupignore created from template"
    else
        # Create a basic .cleanupignore
        cat > .cleanupignore << 'EOF'
# Essential files - never clean
package.json
package-lock.json
yarn.lock
.env*
.git/

# Core source - always keep
src/index.*
src/main.*
src/app.*

# Important docs
README.md
LICENSE
CONTRIBUTING.md
EOF
        echo "✅ Basic .cleanupignore created"
    fi
else
    echo "ℹ️  .cleanupignore already exists, skipping..."
fi

# Add cleanup entries to .gitignore if needed
echo "🔧 Updating .gitignore..."
if [ -f ".gitignore" ]; then
    if ! grep -q ".cleanup-history" .gitignore; then
        echo "" >> .gitignore
        echo "# Cleanup tool files" >> .gitignore
        echo ".cleanup-history/" >> .gitignore
        echo ".cleanup-last-run" >> .gitignore
        echo ".cleanup.log" >> .gitignore
        echo "archive/*/cleanup/" >> .gitignore
        echo "✅ Added cleanup entries to .gitignore"
    else
        echo "ℹ️  .gitignore already has cleanup entries"
    fi
fi

echo ""
echo "✨ Setup complete! You can now use the cleanup command:"
echo ""
echo "  Available commands:"
echo "  ------------------"
echo "  /cleanup --report-only  # Analyze without making changes"
echo "  /cleanup --dry-run      # Preview what will be cleaned"
echo "  /cleanup --execute      # Perform the cleanup"
echo "  /cleanup --force        # Cleanup without confirmation"
echo ""
echo "📝 Configuration files:"
echo "  - Edit .cleanupignore to customize what files to preserve"
echo "  - The command is located at .claude/commands/cleanup.md"
echo ""
echo "🎯 Recommended first step:"
echo "  claude '/cleanup --report-only'"
echo ""
