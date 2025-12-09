# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-09

### Added
- Initial release of homebridge-mqtt-bridge plugin
- MQTT connection management with authentication support
- Automatic device status publishing to MQTT topics
- Command subscription for remote device control via MQTT
- Support for On/Power and Brightness characteristics
- Support for Switch, Lightbulb, and Outlet services
- Configuration schema for Homebridge UI integration
- Comprehensive documentation and examples
- Example configuration file

### Features
- Topic format: `{mqttTopic}/status/{device}/{characteristic}` for status
- Topic format: `{mqttTopic}/set/{device}/{characteristic}` for commands
- Configurable MQTT broker URL, topic prefix, and authentication
- Robust error handling and logging
- Automatic reconnection on connection loss

### Security
- Safe JSON parsing with error handling
- Input validation for MQTT topics and messages
- No vulnerabilities detected by CodeQL analysis
