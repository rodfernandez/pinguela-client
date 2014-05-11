/**
 * The NetworkService interface is used to provide a set of connection information for an HTTP service endpoint and if
 * available, service events, running on a networked device.
 *
 * @module
 * @see {link http://www.w3.org/TR/discovery-api/#networkservice}
 */
define(['eventemitter2'], function (EventEmitter2) {

    'use strict';

    /**
     * The NetworkService interface is used to provide a set of connection information for an HTTP service endpoint and
     * if available, service events, running on a networked device.
     *
     * @constructor
     */
    var NetworkService = function (options) {
        EventEmitter2.call(this);

        if (!options) {
            throw new TypeError('Missing options argument.');
        }

        if (!options.socket) {
            throw new TypeError('Missing options.socket argument.');
        }

        if (!options.service) {
            throw new TypeError('Missing options.service argument.');
        }

        this._options = options;
        this.config = this._options.service.config;
        this.id = this._options.service.id;
        this.name = this._options.service.name;
        this.type = this._options.service.type;
        this.url = this._options.service.url;

        this._options.socket.on('pinguela:serviceDisappeared', this._onServiceDisappeared.bind(this));
    };

    NetworkService.prototype = new EventEmitter2();
    NetworkService.prototype.constructor = NetworkService;

    /**
     * Handles 'pinguela:service-unavailable' messages.
     *
     * @private
     */
    NetworkService.prototype._onServiceDisappeared = function (serviceId) {
        if (this.id === serviceId) {
            this.online = false;
            this.emit('unavailable', this);
        }
    };

    /**
     * The options object used to create this NetworkService instance.
     *
     * @type {Object}
     * @private
     */
    NetworkService.prototype._options = null;

    /**
     * A unique identifier for the given user-selected service instance.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservice-id}
     */
    NetworkService.prototype.id = null;

    /**
     * The name of the user-selected service.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservice-name}
     */
    NetworkService.prototype.name = null;

    /**
     * indicates whether the service is either online, and therefore accessible on the local network, in which case
     * this attribute will return true or, offline, and therefore not accessible on the local network, either
     * temporarily or permanently, in which case this attribute will return false.
     *
     * @type {Boolean}
     */
    NetworkService.prototype.online = true;

//    /**
//     * When a current service renews its service registration within the current network.
//     *
//     * @type {Function}
//     * @see {link http://www.w3.org/TR/discovery-api/#event-available}
//     */
//    NetworkService.prototype.onavailable = function () {
//    };
//
//    /**
//     * When a valid UPnP Events Subscription Message is received on a user-agent generated callback url for a current service. This event never fires for Zeroconf-based services.
//     *
//     * @type {Function}
//     * @see {link http://www.w3.org/TR/discovery-api/#event-notify}
//     */
//    NetworkService.prototype.onnotify = function () {
//
//    };
//
//    /**
//     * When a current service gracefully leaves or otherwise expires from the current network.
//     *
//     * @type {EventHandler}
//     * @see {link http://www.w3.org/TR/discovery-api/#event-unavailable}
//     */
//    NetworkService.prototype.onunavailable = function () {
//
//    };

    /**
     * The valid service type token value of the user-selected service.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservice-type}
     */
    NetworkService.prototype.type = null;


    /**
     * The control URL endpoint (including any required port information) of the user-selected control service.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservice-url}
     */
    NetworkService.prototype.url = null;

    /**
     * The configuration information associated with the service depending on the requested service type.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservice-config}
     */
    NetworkService.prototype.config = null;

    /**
     * @export NetworkService
     */
    return NetworkService;

});
