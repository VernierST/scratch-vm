const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const formatMessage = require('format-message');
const BLE = require('../../io/ble');
const godirect = require('@vernier/godirect/dist/godirect.min.umd.js');
const ScratchLinkDeviceAdapter = require('./scratch-link-device-adapter');

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOCAuNSkiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTEyIDM5LjVBMi41IDIuNSAwIDAgMSA5LjUgMzdjMC0uMy4yLS41LjUtLjVzLjUuMi41LjVhMS41IDEuNSAwIDEgMCAzIDB2LS4yYzAtLjQtLjItLjgtLjUtMWwtLjgtLjljLS41LS40LS43LTEtLjctMS43VjMxYzAtLjMuMi0uNS41LS41cy41LjIuNS41djIuMmMwIC40LjEuOC40IDFsLjguOWMuNS40LjggMSAuOCAxLjd2LjJjMCAxLjQtMS4xIDIuNS0yLjUgMi41eiIgZmlsbD0iI0U2RTdFOCIvPjxwYXRoIGQ9Ik0yMy43LjNBMSAxIDAgMCAwIDIzIDBIMWExIDEgMCAwIDAtLjcuM0ExIDEgMCAwIDAgMCAxdjI2YzAgLjMuMS41LjMuNy4yLjIuNC4zLjcuM2gyMmMuMyAwIC41LS4xLjctLjMuMi0uMi4zLS40LjMtLjdWMWExIDEgMCAwIDAtLjMtLjd6TTEyIDRjMiAwIDMuMyAyIDIuNiAzLjhMMTMuMyAxMWExLjQgMS40IDAgMCAxLTIuNyAwTDkuNSA3LjdsLS4yLTFDOS4yIDUuNCAxMC40IDQgMTIgNHoiIHN0cm9rZT0iIzdDODdBNSIgZmlsbD0iIzg1OTJBRiIgZmlsbC1ydWxlPSJub256ZXJvIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMiAydjI0aDIwVjJIMnptMTAgMmMyIDAgMy4zIDIgMi42IDMuOEwxMy4zIDExYTEuNCAxLjQgMCAwIDEtMi43IDBMOS41IDcuN2wtLjItMUM5LjIgNS40IDEwLjQgNCAxMiA0eiIgc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjNUNCMUQ2IiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIHN0cm9rZT0iIzdDODdBNSIgZmlsbD0iIzg1OTJBRiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMjIgMjZIMnYtNmwyMC00eiIvPjxwYXRoIGQ9Ik0uMyAyNy43TDIgMjZNLjMuM0wyIDJNMjIgMkwyMy43LjNNMjMuNyAyNy43TDIyIDI2IiBzdHJva2U9IiM3Qzg3QTUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxjaXJjbGUgZmlsbD0iI0ZGQkYwMCIgY3g9IjEyIiBjeT0iMTQuOCIgcj0iMS4yIi8+PHBhdGggc3Ryb2tlPSIjN0M4N0E1IiBmaWxsPSIjRTZFN0U4IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xMCAyOGg0djRoLTR6Ii8+PHBhdGggZD0iTTE1LjUgMjJoLTdhLjUuNSAwIDAgMS0uNS0uNWMwLS4zLjItLjUuNS0uNWg3Yy4zIDAgLjUuMi41LjVzLS4yLjUtLjUuNXpNMTcuNSAyNGgtMTFhLjUuNSAwIDAgMS0uNS0uNWMwLS4zLjItLjUuNS0uNWgxMWMuMyAwIC41LjIuNS41cy0uMi41LS41LjV6IiBmaWxsPSIjRkZCRjAwIi8+PC9nPjwvc3ZnPg==';

/**
 * Enum for Vernier godirect protocol.
 * @readonly
 * @enum {string}
 */
const BLEUUID = {
    service: 'd91714ef-28b9-4f91-ba16-f0d9a604f112',
    commandChar: 'f4bf14a6-c7d5-4b6d-8aa8-df1a7c83adcb',
    responseChar: 'b41e6675-a329-40e0-aa01-44d2f444babe'
};

/**
 * Sensor ID numbers for the GDX-SND.
 */
const GDXSND_SENSOR = {
    MICROPHONE: 1,
    SOUND_LEVEL_A: 2,
    SOUND_LEVEL_C: 3,
    WAVE_AMPLITUDE: 4
};

/**
 * Measurement period used to sample all channels.
 * @type {number}
 */
const MEASUREMENT_PERIOD = 100;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const WHISPER_THRESHOLD = 30;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const CONVERSATION_THRESHOLD = 60;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const ALARM_CLOCK_THRESHOLD = 80;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const TRUCK_THRESHOLD = 85;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const ROCK_BAND_THRESHOLD = 110;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const THUNDER_THRESHOLD = 120;

/**
 * Threshold for sound level value, for the whenSoundLevelExceeds hat block.
 * @type {number}
 */
const JET_ENGINE_THRESHOLD = 140;

/**
 * Manage communication with a GDX-SND peripheral over a Scratch Link client socket.
 */
class GdxSnd {

    /**
     * Construct a GDX-SND communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime, extensionId) {

        /**
         * The Scratch 3.0 runtime used to trigger the green flag button.
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;

        /**
         * The BluetoothLowEnergy connection socket for reading/writing peripheral data.
         * @type {BLE}
         * @private
         */
        this._scratchLinkSocket = null;

        /**
         * An @vernier/godirect Device
         * @type {Device}
         * @private
         */
        this._device = null;

        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._sensors = {
            soundLevelA: 0,
            soundLevelC: 0,
            waveAmplitude: 0
        };

        this.disconnect = this.disconnect.bind(this);
        this._onConnect = this._onConnect.bind(this);
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.disconnect();
        }

        this._scratchLinkSocket = new BLE(this._runtime, this._extensionId, {
            filters: [
                {namePrefix: 'GDX-SND'}
            ],
            optionalServices: [
                BLEUUID.service
            ]
        }, this._onConnect);
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    connect (id) {
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.connectPeripheral(id);
        }
    }

    /**
     * Called by the runtime when a user exits the connection popup.
     * Disconnect from the GDX-SND.
     */
    disconnect () {
        this._sensors = {
            soundLevelA: 0,
            soundLevelC: 0,
            waveAmplitude: 0
        };
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.disconnect();
        }
    }

    /**
     * Return true if connected to the GDX-SND device.
     * @return {boolean} - whether the GDX-SND is connected.
     */
    isConnected () {
        let connected = false;
        if (this._scratchLinkSocket) {
            connected = this._scratchLinkSocket.isConnected();
        }
        return connected;
    }

    /**
     * Starts reading data from peripheral after BLE has connected to it.
     * @private
     */
    _onConnect () {
        const adapter = new ScratchLinkDeviceAdapter(this._scratchLinkSocket, BLEUUID);
        godirect.createDevice(adapter, {open: true, startMeasurements: false}).then(device => {
            // Setup device
            this._device = device;
            this._device.keepValues = false; // todo: possibly remove after updating Vernier godirect module

            // Enable sensors
            this._device.sensors.forEach(sensor => {
                if (GDXSND_SENSOR.MICROPHONE === sensor.number) {
                    sensor.setEnabled(false);
                } else {
                    sensor.setEnabled(true);
                }
            });

            // Set sensor value-update behavior
            this._device.on('measurements-started', () => {
                const enabledSensors = this._device.sensors.filter(s => s.enabled);
                enabledSensors.forEach(sensor => {
                    sensor.on('value-changed', s => {
                        this._onSensorValueChanged(s);
                    });
                });
            });

            // Start device
            this._device.start(MEASUREMENT_PERIOD);
        });
    }

    /**
     * Handler for sensor value changes from the goforce device.
     * @param {object} sensor - goforce device sensor whose value has changed
     * @private
     */
    _onSensorValueChanged (sensor) {
        switch (sensor.number) {
        case GDXSND_SENSOR.SOUND_LEVEL_A:
            // TODO: should we normalize the decibels? Typical range is 50-110 dB.
            this._sensors.soundLevelA = sensor.value;
            break;
        case GDXSND_SENSOR.SOUND_LEVEL_C:
            // TODO: should we normalize the decibels? Typical range is ~50-110 dB.
            this._sensors.soundLevelC = sensor.value;
            break;
        case GDXSND_SENSOR.WAVE_AMPLITUDE:
            // TODO: should we normalize the wave amplitude? Typical range is ~0-0.6
            this._sensors.waveAmplitude = sensor.value * 100;
            break;
        }
    }

    getSoundLevelA () {
        return this._sensors.soundLevelA;
    }

    getSoundLevelC () {
        return this._sensors.soundLevelC;
    }

    getWaveAmplitude () {
        return this._sensors.waveAmplitude;
    }
}

/**
 * Enum for sound level threshold menu options.
 * @readonly
 * @enum {string}
 */
const SoundLevelValues = {
    WHISPER: 'whisper',
    CONVERSATION: 'conversation',
    ALARM_CLOCK: 'alarm clock',
    TRUCK: 'truck',
    ROCK_BAND: 'rock band',
    THUNDER: 'thunder',
    JET_ENGINE: 'jet engine'
};

/**
 * Scratch 3.0 blocks to interact with a GDX-SND peripheral.
 */
class Scratch3GdxSndBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Sound Level';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'gdxsnd';
    }

    get SOUND_LEVEL_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.whisper',
                    default: 'whisper',
                    description: 'label for whisper element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.WHISPER
            },
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.conversation',
                    default: 'conversation',
                    description: 'label for conversation element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.CONVERSATION
            },
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.alarmClock',
                    default: 'alarm clock',
                    description: 'label for alarm clock element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.ALARM_CLOCK
            },
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.truck',
                    default: 'truck',
                    description: 'label for truck element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.TRUCK
            },
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.rockBand',
                    default: 'rock band',
                    description: 'label for rock band element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.ROCK_BAND
            },
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.thunder',
                    default: 'thunder',
                    description: 'label for thunder element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.THUNDER
            },
            {
                text: formatMessage({
                    id: 'gdxsnd.SoundLevelValues.jetEngine',
                    default: 'jet engine',
                    description: 'label for jet engine element in sound level picker for gdxsnd extension'
                }),
                value: SoundLevelValues.JET_ENGINE
            }
        ];
    }

    /**
     * Construct a set of GDX-SND blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new GdxSnd peripheral instance
        this._peripheral = new GdxSnd(this.runtime, Scratch3GdxSndBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3GdxSndBlocks.EXTENSION_ID,
            name: Scratch3GdxSndBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'getSoundLevelA',
                    text: formatMessage({
                        id: 'gdxsnd.getSoundLevelA',
                        default: 'sound level A-weighted',
                        description: 'gets sound level A-weighted'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getSoundLevelC',
                    text: formatMessage({
                        id: 'gdxsnd.getSoundLevelC',
                        default: 'sound level C-weighted',
                        description: 'gets sound level C-weighted'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getWaveAmplitude',
                    text: formatMessage({
                        id: 'gdxsnd.getWaveAmplitude',
                        default: 'wave amplitude',
                        description: 'gets wave amplitude'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'whenSoundLevelExceeds',
                    text: formatMessage({
                        id: 'gdxsnd.whenSoundLevel',
                        default: 'when louder than a [SOUND_LEVEL]',
                        description: 'when the sound level exceeds'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        SOUND_LEVEL: {
                            type: ArgumentType.STRING,
                            menu: 'soundLevelOptions',
                            defaultValue: SoundLevelValues.CONVERSATION
                        }
                    }
                }
            ],
            menus: {
                soundLevelOptions: this.SOUND_LEVEL_MENU
            }
        };
    }

    getSoundLevelA () {
        return Math.round(this._peripheral.getSoundLevelA());
    }

    getSoundLevelC () {
        return Math.round(this._peripheral.getSoundLevelC());
    }

    getWaveAmplitude () {
        return Math.round(this._peripheral.getWaveAmplitude());
    }

    whenSoundLevelExceeds (args) {
        switch (args.SOUND_LEVEL) {
        case SoundLevelValues.WHISPER:
            return this.getSoundLevelA() > WHISPER_THRESHOLD;
        case SoundLevelValues.CONVERSATION:
            return this.getSoundLevelA() > CONVERSATION_THRESHOLD;
        case SoundLevelValues.ALARM_CLOCK:
            return this.getSoundLevelA() > ALARM_CLOCK_THRESHOLD;
        case SoundLevelValues.TRUCK:
            return this.getSoundLevelA() > TRUCK_THRESHOLD;
        case SoundLevelValues.ROCK_BAND:
            return this.getSoundLevelA() > ROCK_BAND_THRESHOLD;
        case SoundLevelValues.THUNDER:
            return this.getSoundLevelA() > THUNDER_THRESHOLD;
        case SoundLevelValues.JET_ENGINE:
            return this.getSoundLevelA() > JET_ENGINE_THRESHOLD;
        default:
            log.warn(`unknown sound level value in whenSoundLevelExceeds: ${args.SOUND_LEVEL}`);
            return false;
        }
    }
}

module.exports = Scratch3GdxSndBlocks;
