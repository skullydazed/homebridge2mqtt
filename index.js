const mqtt = require('mqtt');

let Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform('homebridge-mqtt-bridge', 'MQTT-Bridge', MQTTBridgePlatform);
};

class MQTTBridgePlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.accessories = [];
    this.mqttClient = null;

    // Configuration validation
    if (!config) {
      this.log.error('No configuration provided');
      return;
    }

    this.mqttUrl = config.mqttUrl || 'mqtt://localhost:1883';
    this.mqttTopic = config.mqttTopic || 'homebridge';
    this.mqttOptions = {
      username: config.mqttUsername,
      password: config.mqttPassword,
      clientId: config.mqttClientId || 'homebridge-mqtt-bridge'
    };

    // Connect to MQTT broker
    this.connectMQTT();

    // Wait for homebridge to finish launching
    if (this.api) {
      this.api.on('didFinishLaunching', () => {
        this.log.info('Finished launching, subscribing to MQTT topics');
        this.subscribeToCommands();
      });
    }
  }

  connectMQTT() {
    this.log.info('Connecting to MQTT broker at ' + this.mqttUrl);
    
    this.mqttClient = mqtt.connect(this.mqttUrl, this.mqttOptions);

    this.mqttClient.on('connect', () => {
      this.log.info('Connected to MQTT broker');
    });

    this.mqttClient.on('error', (err) => {
      this.log.error('MQTT connection error:', err.message);
    });

    this.mqttClient.on('offline', () => {
      this.log.warn('MQTT client offline');
    });

    this.mqttClient.on('reconnect', () => {
      this.log.info('Reconnecting to MQTT broker');
    });
  }

  subscribeToCommands() {
    if (!this.mqttClient) return;

    const commandTopic = `${this.mqttTopic}/set/#`;
    this.mqttClient.subscribe(commandTopic, (err) => {
      if (err) {
        this.log.error('Failed to subscribe to command topic:', err.message);
      } else {
        this.log.info('Subscribed to command topic:', commandTopic);
      }
    });

    this.mqttClient.on('message', (topic, message) => {
      this.handleMQTTMessage(topic, message);
    });
  }

  handleMQTTMessage(topic, message) {
    try {
      const parts = topic.split('/');
      if (parts.length < 4 || parts[1] !== 'set') return;

      const accessoryName = parts[2];
      const characteristic = parts[3];
      const value = JSON.parse(message.toString());

      this.log.info(`Received command for ${accessoryName}/${characteristic}: ${value}`);

      // Find the accessory and update its characteristic
      const accessory = this.accessories.find(acc => acc.displayName === accessoryName);
      if (accessory) {
        this.updateAccessoryCharacteristic(accessory, characteristic, value);
      } else {
        this.log.warn(`Accessory not found: ${accessoryName}`);
      }
    } catch (error) {
      this.log.error('Error handling MQTT message:', error.message);
    }
  }

  updateAccessoryCharacteristic(accessory, characteristicName, value) {
    const context = accessory.context;
    const service = accessory.getService(Service.Switch) || accessory.getService(Service.Lightbulb);
    
    if (!service) {
      this.log.warn('No suitable service found on accessory');
      return;
    }

    let characteristic;
    switch (characteristicName.toLowerCase()) {
      case 'on':
      case 'power':
        characteristic = service.getCharacteristic(Characteristic.On);
        break;
      case 'brightness':
        characteristic = service.getCharacteristic(Characteristic.Brightness);
        break;
      default:
        this.log.warn(`Unknown characteristic: ${characteristicName}`);
        return;
    }

    if (characteristic) {
      characteristic.updateValue(value);
      this.log.info(`Updated ${accessory.displayName} ${characteristicName} to ${value}`);
    }
  }

  publishStatus(accessory, characteristic, value) {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const topic = `${this.mqttTopic}/status/${accessory.displayName}/${characteristic}`;
    const message = JSON.stringify(value);

    this.mqttClient.publish(topic, message, { retain: true }, (err) => {
      if (err) {
        this.log.error('Failed to publish status:', err.message);
      } else {
        this.log.debug(`Published status: ${topic} = ${message}`);
      }
    });
  }

  configureAccessory(accessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    
    // Set up the accessory
    this.setupAccessoryHandlers(accessory);
    this.accessories.push(accessory);
  }

  setupAccessoryHandlers(accessory) {
    const service = accessory.getService(Service.Switch) || 
                    accessory.getService(Service.Lightbulb) ||
                    accessory.getService(Service.Outlet);

    if (!service) return;

    // Set up characteristic change handlers
    const onCharacteristic = service.getCharacteristic(Characteristic.On);
    if (onCharacteristic) {
      onCharacteristic.on('get', (callback) => {
        const value = onCharacteristic.value;
        callback(null, value);
      });

      onCharacteristic.on('set', (value, callback) => {
        this.publishStatus(accessory, 'On', value);
        callback(null);
      });

      // Publish initial state
      this.publishStatus(accessory, 'On', onCharacteristic.value || false);
    }

    // Set up brightness if available
    const brightnessCharacteristic = service.getCharacteristic(Characteristic.Brightness);
    if (brightnessCharacteristic) {
      brightnessCharacteristic.on('get', (callback) => {
        const value = brightnessCharacteristic.value;
        callback(null, value);
      });

      brightnessCharacteristic.on('set', (value, callback) => {
        this.publishStatus(accessory, 'Brightness', value);
        callback(null);
      });

      // Publish initial state
      this.publishStatus(accessory, 'Brightness', brightnessCharacteristic.value || 0);
    }
  }

  accessories(callback) {
    // This method is called when Homebridge requests accessories
    // For this plugin, we'll work with cached accessories
    // Accessories should be added through Homebridge's native functionality
    callback(this.accessories);
  }
}
