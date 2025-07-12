# Justfile for Stream Deck Mastodon Plugin

# Default recipe - show available commands
default:
    @just --list

# Clean build artifacts
clean:
    rm -f *.streamDeckPlugin

# Package the plugin for distribution
package: clean
    @echo "Packaging Stream Deck plugin..."
    streamdeck pack org.andypiper.mastodon.sdPlugin

# Install the plugin locally for testing
install: package
    @echo "Installing plugin locally..."
    open org.andypiper.mastodon.streamDeckPlugin

# Validate plugin structure
validate:
    @echo "Validating plugin structure..."
    @test -f org.andypiper.mastodon.sdPlugin/manifest.json || (echo "ERROR: manifest.json not found" && exit 1)
    @test -f org.andypiper.mastodon.sdPlugin/app.js || (echo "ERROR: app.js not found" && exit 1)
    @test -f org.andypiper.mastodon.sdPlugin/index.html || (echo "ERROR: index.html not found" && exit 1)
    @test -d org.andypiper.mastodon.sdPlugin/action/images || (echo "ERROR: action/images directory not found" && exit 1)
    @test -d org.andypiper.mastodon.sdPlugin/propertyinspector || (echo "ERROR: propertyinspector directory not found" && exit 1)
    @echo "✓ Plugin structure is valid"

# Check manifest.json syntax
check-manifest:
    @echo "Checking manifest.json syntax..."
    @python3 -m json.tool org.andypiper.mastodon.sdPlugin/manifest.json > /dev/null && echo "✓ manifest.json is valid JSON"

# Run all checks before packaging
test: validate check-manifest
    @echo "✓ All checks passed"

# Full build and test cycle
build: test package
    @echo "✓ Plugin built successfully: org.andypiper.mastodon.streamDeckPlugin"

# Development workflow - build and install
dev: build install
    @echo "✓ Plugin installed for development testing"