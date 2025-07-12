# Stream Deck Mastodon Plugin

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0.0-green.svg)](https://github.com/andypiper/StreamDeckMastodon)

> A Stream Deck plugin for posting to Mastodon with a single button press

This Stream Deck plugin allows users to post messages to their Mastodon account with a single button press. Configure your Mastodon instance, access token, and message text, then post directly from your Stream Deck.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Background

This project was inspired by [rabidlogic/StreamDeckMastodon](https://github.com/rabidlogic/StreamDeckMastodon) but has been completely rewritten for current Stream Deck software versions using SDK v2.

## Install

This plugin requires Stream Deck software version 6.5 or later on macOS 10.15+ or Windows 10+ (only tested on macOS though)

### From Release

1. Download the latest `.streamDeckPlugin` file from the [releases page](https://github.com/andypiper/StreamDeckMastodon/releases)
2. Double-click the file to install automatically in Stream Deck software
3. The plugin will appear in the Stream Deck actions list under "Mastodon"

### From Source

```bash
git clone https://github.com/andypiper/StreamDeckMastodon.git
cd StreamDeckMastodon
just dev
```

Requires [Just](https://github.com/casey/just) command runner and the `streamdeck` CLI command.

## Usage

```bash
# Build and test the plugin
just dev
```

1. Drag the "Send Post" action from the Mastodon category onto a Stream Deck key
2. Click the key to open the Property Inspector
3. Configure your settings:
   - **Mastodon Instance**: Your instance URL (e.g., `https://mastodon.social`)
   - **Access Token**: Your Mastodon API access token  
   - **Message**: The text to post (max 500 characters)
4. Press the Stream Deck key to post your message

### Getting a Mastodon Access Token

1. Go to your Mastodon instance in a web browser
2. Navigate to Settings → Development → New Application
3. Create an application with `write:statuses` scope
4. Copy the access token for use in the plugin

### Development Commands

```bash
just                   # Show all available commands
just validate          # Validate plugin structure
just check-manifest    # Check manifest.json syntax
just test              # Run all validation checks
just package           # Package plugin for distribution
just install           # Install plugin locally for testing
just dev               # Full development workflow
```

### Testing

Enable debug logging by setting `debug = true` in `propertyinspector/js/common.js:23`.

## API

The plugin posts to the Mastodon API using:

- **Endpoint**: `POST {instance}/api/v1/statuses`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Form data with `status` field containing the message text

## Maintainers

[@andypiper](https://github.com/andypiper)

## Contributing

PRs accepted. Please ensure all validation checks pass with `just test`.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT](LICENSE) © 2025 Andy Piper
