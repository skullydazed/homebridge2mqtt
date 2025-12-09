# homebridge2mqtt

A Homebridge plugin that bridges your HomeKit devices to MQTT. This plugin allows you to:
- **Monitor** device status by publishing to MQTT topics
- **Control** devices by sending commands via MQTT

## Installation

```bash
npm install -g homebridge-mqtt-bridge
```

Or install via the Homebridge UI by searching for "MQTT Bridge".

## Configuration

Add the following to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "MQTT-Bridge",
      "name": "MQTT Bridge",
      "mqttUrl": "mqtt://localhost:1883",
      "mqttTopic": "homebridge",
      "mqttUsername": "optional_username",
      "mqttPassword": "optional_password",
      "mqttClientId": "homebridge-mqtt-bridge"
    }
  ]
}
```

### Configuration Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `mqttUrl` | Yes | `mqtt://localhost:1883` | URL of your MQTT broker |
| `mqttTopic` | No | `homebridge` | Base topic prefix for all MQTT messages |
| `mqttUsername` | No | - | Username for MQTT authentication |
| `mqttPassword` | No | - | Password for MQTT authentication |
| `mqttClientId` | No | `homebridge-mqtt-bridge` | Unique client ID for MQTT connection |

## Usage

### Device Status Publishing

When a device state changes in HomeKit, the plugin automatically publishes the new state to MQTT:

**Topic Format:** `{mqttTopic}/status/{device_name}/{characteristic}`

**Examples:**
- `homebridge/status/Living Room Light/On` → `true` or `false`
- `homebridge/status/Bedroom Lamp/Brightness` → `0` to `100`

### Device Control via MQTT

You can control devices by publishing to command topics:

**Topic Format:** `{mqttTopic}/set/{device_name}/{characteristic}`

**Examples:**

Turn on a light:
```bash
mosquitto_pub -t "homebridge/set/Living Room Light/On" -m "true"
```

Set brightness:
```bash
mosquitto_pub -t "homebridge/set/Bedroom Lamp/Brightness" -m "75"
```

Turn off a switch:
```bash
mosquitto_pub -t "homebridge/set/Kitchen Switch/On" -m "false"
```

### Supported Characteristics

- `On` / `Power` - Boolean (true/false) for switches, lights, outlets
- `Brightness` - Integer (0-100) for dimmable lights

## MQTT Topics

The plugin uses a consistent topic structure:

### Status Topics (Published by plugin)
- `homebridge/status/{device_name}/On` - Device power state
- `homebridge/status/{device_name}/Brightness` - Light brightness level

### Command Topics (Subscribed by plugin)
- `homebridge/set/{device_name}/On` - Control device power
- `homebridge/set/{device_name}/Brightness` - Control light brightness

## Example Integration

### Node-RED Flow

```json
[
  {
    "id": "mqtt_in",
    "type": "mqtt in",
    "topic": "homebridge/status/#",
    "broker": "mqtt_broker"
  },
  {
    "id": "mqtt_out",
    "type": "mqtt out",
    "topic": "homebridge/set/Living Room Light/On",
    "broker": "mqtt_broker"
  }
]
```

### Home Assistant

```yaml
# configuration.yaml
mqtt:
  light:
    - name: "Living Room Light"
      state_topic: "homebridge/status/Living Room Light/On"
      command_topic: "homebridge/set/Living Room Light/On"
      brightness_state_topic: "homebridge/status/Living Room Light/Brightness"
      brightness_command_topic: "homebridge/set/Living Room Light/Brightness"
      payload_on: "true"
      payload_off: "false"
```

## Troubleshooting

### Plugin not connecting to MQTT
- Verify MQTT broker is running and accessible
- Check `mqttUrl` configuration
- Verify username/password if authentication is enabled
- Check Homebridge logs for connection errors

### Device commands not working
- Ensure device names match exactly (case-sensitive)
- Verify MQTT messages are valid JSON
- Check command topics are correctly formatted
- Review Homebridge logs for errors

### Status updates not publishing
- Confirm devices are properly configured in Homebridge
- Check MQTT broker is receiving connections
- Verify the plugin is loaded in Homebridge

## Development

```bash
# Clone the repository
git clone https://github.com/skullydazed/homebridge2mqtt.git
cd homebridge2mqtt

# Install dependencies
npm install

# Link for local development
npm link
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/skullydazed/homebridge2mqtt/issues) page.
