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
 * Sensor ID numbers for the GDX-MD.
 */
const GDXMD_SENSOR = {
    POSITION: 5, // Standard resolution (~.25 m to ~3.5 m)
    POSITION_CART: 6, // High resolution (~.15 m to 2 m)
    POSITION_TC: 7 // Temperature compensated
};

/**
 * Measurement period used to sample all channels.
 * @type {number}
 */
const MEASUREMENT_PERIOD = 250;

/**
 * Threshold for distance value, for the whenCloserThan hat block.
 * @type {number}
 */
const PENCIL_THRESHOLD = 19;

/**
 * Threshold for distance value, for the whenCloserThan hat block.
 * @type {number}
 */
const NOTEBOOK_THRESHOLD = 38;

/**
 * Threshold for distance value, for the whenCloserThan hat block.
 * @type {number}
 */
const DESK_THRESHOLD = 100;

/**
 * Manage communication with a GDX-MD peripheral over a Scratch Link client socket.
 */
class GdxMd {

    /**
     * Construct a GDX-MD communication object.
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
            position: 0,
            position_cart: 0,
            position_tc: 0
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
                {namePrefix: 'GDX-MD'}
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
     * Disconnect from the GDX-MD.
     */
    disconnect () {
        this._sensors = {
            postion: 0
        };
        if (this._scratchLinkSocket) {
            this._scratchLinkSocket.disconnect();
        }
    }

    /**
     * Return true if connected to the GDX-MD device.
     * @return {boolean} - whether the GDX-MD is connected.
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

            // Enable only the high resolution position (cart) channel
            this._device.sensors.forEach(sensor => {
                if (GDXMD_SENSOR.POSITION_CART === sensor.number) {
                    sensor.setEnabled(true);
                } else {
                    sensor.setEnabled(false);
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
     * Handler for sensor value changes from the GdxMd device.
     * @param {object} sensor - device channel whose value has changed
     * @private
     */
    _onSensorValueChanged (sensor) {
        switch (sensor.number) {
        case GDXMD_SENSOR.POSITION:
            this._sensors.postion = sensor.value * 100;
            break;
        case GDXMD_SENSOR.POSITION_CART:
            this._sensors.postion_cart = sensor.value * 100;
            break;
        case GDXMD_SENSOR.POSITION_TC:
            this._sensors.postion_tc = sensor.value * 100;
            break;
        }
    }

    getDistance () {
        return this._sensors.postion;
    }

    getDistanceCart () {
        return this._sensors.postion_cart;
    }

    getDistanceTC () {
        return this._sensors.postion_tc;
    }
}

/**
 * Enum for closer than menu options.
 * @readonly
 * @enum {string}
 */
const DistanceValues = {
    PENCIL: 'pencil',
    NOTEBOOK: 'notebook',
    DESK: 'desk'
};

/**
 * Scratch 3.0 blocks to interact with a GDX-MD peripheral.
 */
class Scratch3GdxMdBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'Motion Detector';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'gdxmd';
    }

    get DISTANCE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'gdxmd.DistanceValues.pencil',
                    default: 'pencil',
                    description: 'label for pencil element in distance picker for gdxmd extension'
                }),
                value: DistanceValues.PENCIL
            },
            {
                text: formatMessage({
                    id: 'gdxmd.DistanceValues.notebook',
                    default: 'notebook',
                    description: 'label for notebook element in distance picker for gdxmd extension'
                }),
                value: DistanceValues.NOTEBOOK
            },
            {
                text: formatMessage({
                    id: 'gdxmd.DistanceValues.desk',
                    default: 'desk',
                    description: 'label for desk element in distance picker for gdxmd extension'
                }),
                value: DistanceValues.DESK
            }
        ];
    }

    /**
     * Construct a set of GDX-MD blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new GdxMd peripheral instance
        this._peripheral = new GdxMd(this.runtime, Scratch3GdxMdBlocks.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3GdxMdBlocks.EXTENSION_ID,
            name: Scratch3GdxMdBlocks.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'getDistanceCart',
                    text: formatMessage({
                        id: 'gdxmd.getDistanceCart',
                        default: 'distance',
                        description: 'gets distance'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'whenCloserThan',
                    text: formatMessage({
                        id: 'gdxmd.whenCloserThan',
                        default: 'when closer than a [DISTANCE]',
                        description: 'when closer than'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        DISTANCE: {
                            type: ArgumentType.STRING,
                            menu: 'distanceOptions',
                            defaultValue: DistanceValues.NOTEBOOK
                        }
                    }
                },
                {
                    opcode: 'whenFartherThan',
                    text: formatMessage({
                        id: 'gdxmd.whenFartherThan',
                        default: 'when farther than a [DISTANCE]',
                        description: 'when farther than'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        DISTANCE: {
                            type: ArgumentType.STRING,
                            menu: 'distanceOptions',
                            defaultValue: DistanceValues.NOTEBOOK
                        }
                    }
                }
            ],
            menus: {
                distanceOptions: this.DISTANCE_MENU
            }
        };
    }

    getDistanceCart () {
        return Math.round(this._peripheral.getDistanceCart());
    }

    whenCloserThan (args) {
        switch (args.DISTANCE) {
        case DistanceValues.PENCIL:
            return this.getDistanceCart() <= PENCIL_THRESHOLD;
        case DistanceValues.NOTEBOOK:
            return this.getDistanceCart() <= NOTEBOOK_THRESHOLD;
        case DistanceValues.DESK:
            return this.getDistanceCart() <= DESK_THRESHOLD;

        default:
            log.warn(`unknown distance value in whenCloserThan: ${args.DISTANCE}`);
            return false;
        }
    }

    whenFartherThan (args) {
        switch (args.DISTANCE) {
        case DistanceValues.PENCIL:
            return this.getDistanceCart() >= PENCIL_THRESHOLD;
        case DistanceValues.NOTEBOOK:
            return this.getDistanceCart() >= NOTEBOOK_THRESHOLD;
        case DistanceValues.DESK:
            return this.getDistanceCart() >= DESK_THRESHOLD;

        default:
            log.warn(`unknown distance value in whenFartherThan: ${args.DISTANCE}`);
            return false;
        }
    }
}

module.exports = Scratch3GdxMdBlocks;
