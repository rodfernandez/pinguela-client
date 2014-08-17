/**
 * The NetworkService interface is used to provide a set of connection information for an HTTP service endpoint and if
 * available, service events, running on a networked device.
 *
 * @module
 * @see {link http://www.w3.org/TR/discovery-api/#networkservice}
 */
define(['underscore', 'eventemitter2'], function (_, EventEmitter2) {

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

        this._options.socket.on('pinguela:servicesFound', this._onServicesFound.bind(this));
        this._options.socket.on('pinguela:servicesLost', this._onServicesLost.bind(this));
    };

    NetworkService.prototype = new EventEmitter2();

    NetworkService.prototype.constructor = NetworkService;

    /**
     * Handles 'pinguela:servicesFound' messages.
     *
     * @private
     */
    NetworkService.prototype._onServicesFound = function (services) {
        var self = this,
            found = _.find(services, function (service) {
                return service.id === self.id;
            });

        if (found) {
            self.online = true;
            self.emit('available', self);
        }
    };

    /**
     * Handles 'pinguela:servicesLost' messages.
     *
     * @private
     */
    NetworkService.prototype._onServicesLost = function (services) {
        var self = this,
            lost = _.find(services, function (service) {
                return service.id === self.id;
            });

        if (lost) {
            self.online = false;
            self.emit('unavailable', self);
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
     * The EventTarget.addEventListener() method registers the specified listener on the EventTarget it's called on.
     *
     * @param {String} type A string representing the event type to listen for.
     * @param {String} listener The object that receives a notification when an event of the specified type occurs.
     * @see {link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener}
     */
    NetworkService.prototype.addEventListener = NetworkService.prototype.addListener;

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

    /**
     * When a current service renews its service registration within the current network.
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/discovery-api/#event-available}
     */
    NetworkService.prototype.onavailable = function (handler) {
        return this.addEventListener('available', handler);
    };

    /**
     * When a valid UPnP Events Subscription Message is received on a user-agent generated callback url for a current
     * service. This event never fires for Zeroconf-based services.
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/discovery-api/#event-notify}
     */
    NetworkService.prototype.onnotify = function (handler) {
        return this.addEventListener('notify', handler);
    };

    /**
     * When a current service gracefully leaves or otherwise expires from the current network.
     *
     * @type {EventHandler}
     * @see {link http://www.w3.org/TR/discovery-api/#event-unavailable}
     */
    NetworkService.prototype.onunavailable = function (handler) {
        return this.addEventListener('unavailable', handler);
    };

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
