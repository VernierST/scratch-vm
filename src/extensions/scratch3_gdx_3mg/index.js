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
 * Sensor ID numbers for the GDX-3MG.
 */
const GDX3MG_SENSOR = {
    MAGNETIC_FIELD_X: 1,
    MAGNETIC_FIELD_Y: 2,
    MAGNETIC_FIELD_Z: 3,
    MAGNETIC_FIELD_HIGH_X: 4,
    MAGNETIC_FIELD_HIGH_Y: 5,
    MAGNETIC_FIELD_HIGH_Z: 6
};

/**
 * Measurement period used to sample all channels.
 * @type {number}
 */
const MEASUREMENT_PERIOD = 100;

/**
 * Manage communication with a GDX-3MG peripheral over a Scratch Link client socket.
 */
class Gdx3mg {

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
            magFieldX: 0,
            magFieldY: 0,
            magFieldZ: 0,
            magFieldHighX: 0,
            magFieldHighY: 0,
            magFieldHighZ: 0
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
                {namePrefix: 'GDX-3MG'}
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
     * Disconnect from the GDX-3MG.
     */
    disconnect () {
        this._sensors = {
            magFieldX: 0,
            magFieldY: 0,
            magFieldZ: 0,
            magFieldHighX: 0,
            magFieldHighY: 0,
            magFieldHighZ: 0
        };
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.disconnect();
        }
    }

    /**
     * Return true if connected to the GDX-3MG device.
     * @return {boolean} - whether the GDX-3MG is connected.
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

            // Enable all channels
            this._device.sensors.forEach(sensor => {
                sensor.setEnabled(true);
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
        case GDX3MG_SENSOR.MAGNETIC_FIELD_X:
            // Roughly a +/- 5 mT range, which we will amplify to highlight smaller magnitudes
            this._sensors.magFieldX = sensor.value * 100;
            break;
        case GDX3MG_SENSOR.MAGNETIC_FIELD_Y:
            this._sensors.magFieldY = sensor.value * 100;
            break;
        case GDX3MG_SENSOR.MAGNETIC_FIELD_Z:
            this._sensors.magFieldZ = sensor.value * 100;
            break;
        case GDX3MG_SENSOR.MAGNETIC_FIELD_HIGH_X:
            // Roughly a +/- 130 mT range.
            this._sensors.magFieldHighX = sensor.value * 100;
            break;
        case GDX3MG_SENSOR.MAGNETIC_FIELD_HIGH_Y:
            this._sensors.magFieldHighY = sensor.value * 100;
            break;
        case GDX3MG_SENSOR.MAGNETIC_FIELD_HIGH_Z:
            this._sensors.magFieldHighZ = sensor.value * 100;
            break;
        }
    }

    getMagFieldX () {
        return this._sensors.magFieldX;
    }

    getMagFieldY () {
        return this._sensors.magFieldY;
    }

    getMagFieldZ () {
        return this._sensors.magFieldZ;
    }

    getMagFieldHighX () {
        return this._sensors.magFieldHighX;
    }

    getMagFieldHighY () {
        return this._sensors.magFieldHighY;
    }

    getMagFieldHighZ () {
        return this._sensors.magFieldHighZ;
    }
}

/**
 * Scratch 3.0 blocks to interact with a GDX-3MG peripheral.
 */
class Scratch3Gdx3mgBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Magnetic Field';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'gdx3mg';
    }

    /**
     * Construct a set of GDX-3MG blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new GdxSnd peripheral instance
        this._peripheral = new Gdx3mg(this.runtime, Scratch3Gdx3mgBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3Gdx3mgBlocks.EXTENSION_ID,
            name: Scratch3Gdx3mgBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                /*
                {
                    opcode: 'getMagFieldMagnitude',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldMagnitude',
                        default: 'total magnetic field',
                        description: 'total magnetic field'
                    }),
                    blockType: BlockType.REPORTER
                },
                */
                {
                    opcode: 'getMagFieldX',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldX',
                        default: 'x-axis',
                        description: 'x-axis magnetic field'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getMagFieldY',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldY',
                        default: 'y-axis',
                        description: 'y-axis magnetic field'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getMagFieldZ',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldZ',
                        default: 'z-axis',
                        description: 'z-axis magnetic field'
                    }),
                    blockType: BlockType.REPORTER
                },
                /*
                {
                    opcode: 'getMagFieldHighMagnitude',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldHighMagnitude',
                        default: 'total magnetic field (high)',
                        description: 'total magnetic field (high)'
                    }),
                    blockType: BlockType.REPORTER
                },
                */
                {
                    opcode: 'getMagFieldHighX',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldHighX',
                        default: 'x-axis (high)',
                        description: 'x-axis magnetic field (high)'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getMagFieldHighY',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldHighY',
                        default: 'y-axis (high)',
                        description: 'y-axis magnetic field (high)'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'getMagFieldHighZ',
                    text: formatMessage({
                        id: 'gdxsnd.getMagFieldHighZ',
                        default: 'z-axis (high)',
                        description: 'z-axis magnetic field (high)'
                    }),
                    blockType: BlockType.REPORTER
                }
            ]
        };
    }

    /**
     * @param {number} x - x axis vector
     * @param {number} y - y axis vector
     * @param {number} z - z axis vector
     * @return {number} - the magnitude of a three dimension vector.
     */
    magnitude (x, y, z) {
        return Math.sqrt((x * x) + (y * y) + (z * z));
    }

    getMagFieldMagnitude () {
        return this.magnitude(
            this._peripheral.getMagFieldX(),
            this._peripheral.getMagFieldY(),
            this._peripheral.getMagFieldZ());
    }

    getMagFieldX () {
        return Math.round(this._peripheral.getMagFieldX());
    }

    getMagFieldY () {
        return Math.round(this._peripheral.getMagFieldY());
    }

    getMagFieldZ () {
        return Math.round(this._peripheral.getMagFieldZ());
    }

    getMagFieldHighMagnitude () {
        return this.magnitude(
            this._peripheral.getMagFieldHighX(),
            this._peripheral.getMagFieldHighY(),
            this._peripheral.getMagFieldHighZ());
    }

    getMagFieldHighX () {
        return Math.round(this._peripheral.getMagFieldHighX());
    }

    getMagFieldHighY () {
        return Math.round(this._peripheral.getMagFieldHighY());
    }

    getMagFieldHighZ () {
        return Math.round(this._peripheral.getMagFieldHighZ());
    }
}

module.exports = Scratch3Gdx3mgBlocks;
