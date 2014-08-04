/**
 * The NetworkServices interface represents a collection of zero or more indexed properties that are each a
 * user-authorized NetworkService object.
 *
 * @module NetworkServices
 * @see {link http://www.w3.org/TR/discovery-api/#networkservices}
 */
define(['eventemitter2', './networkService'], function (EventEmitter2, NetworkService) {

    'use strict';

    /**
     * The NetworkServices interface represents a collection of zero or more indexed properties that are each a
     * user-authorized NetworkService object.
     *
     * @constructor
     */
    var NetworkServices = function (options) {
        EventEmitter2.call(this);

        if (!options) {
            throw new TypeError('Missing options argument.');
        }

        if (!options.socket) {
            throw new TypeError('Missing options.socket argument.');
        }

        if (!options.services) {
            throw new TypeError('Missing options.services argument.');
        }

        if (typeof options.services.forEach !== 'function') {
            throw new TypeError('Expected options.services argument to be an array  .');
        }

        this.length = options.services.length;
        this.servicesAvailable = this.length;
        this._socket = options.socket;

        options.services.forEach(function (service, index) {
            var networkService = new NetworkService({
                service: service,
                socket: this._socket
            });

            networkService.onavailable(this._onServiceAvailable.bind(this));
            networkService.onunavailable(this._onServiceUnavailable.bind(this));

            this[index] = networkService;
        }, this);

        this._socket.on('disconnect', this._onSocketDisconnect.bind(this));
        this._socket.on('error', this._onSocketError.bind(this));
    };

    // Inherit from EventEmitter2 and restore constructor

    NetworkServices.prototype = new EventEmitter2();

    NetworkServices.prototype.constructor = NetworkServices;

    // Private members

    NetworkServices.prototype._onServiceAvailable = function (networkservice) {
        this.servicesAvailable++;
        this.emit('servicefound', networkservice);
    };

    NetworkServices.prototype._onServiceUnavailable = function (networkservice) {
        this.servicesAvailable--;
        this.emit('servicelost', networkservice);
    };

    NetworkServices.prototype._onSocketDisconnect = function () {
        // TODO
    };

    NetworkServices.prototype._onSocketError = function () {
        // TODO
    };

    /**
     * The internal socket.io instance;
     *
     * @type {Object}
     * @private
     */
    NetworkServices.prototype._socket = null;

    // Public members

    /**
     * The EventTarget.addEventListener() method registers the specified listener on the EventTarget it's called on.
     *
     * @param {String} type A string representing the event type to listen for.
     * @param {String} listener The object that receives a notification when an event of the specified type occurs.
     * @see {link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener}
     */
    NetworkServices.prototype.addEventListener = NetworkServices.prototype.addListener;

    /**
     * Returns the NetworkService object with the given identifier, or null if no service has that identifier.
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservices-getservicebyid}
     */
    NetworkServices.prototype.getServiceById = function (id) {
        throw new Error('Not implemented.');
    };

    /**
     * Returns the current number of indexed properties in the current object's collection.
     *
     * @type {Number}
     */
    NetworkServices.prototype.length = 0;

    /**
     * When a new service that matches one of the requested type tokens is found in the current network.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#event-servicefound}
     */
    NetworkServices.prototype.onservicefound = function (handler) {
        return this.addEventListener('servicefound', handler);
    };

    /**
     * When an existing service that matches one of the requested type tokens gracefully leaves or expires from the
     * current network.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#event-servicelost}
     */
    NetworkServices.prototype.onservicelost = function (handler) {
        return this.addEventListener('servicelost', handler);
    };

    /**
     * Returns the current number of items matching one of the app-requested valid service type tokens in the list of
     * available service records.
     *
     * @type {Number}
     */
    NetworkServices.prototype.servicesAvailable = 0;

    /**
     * @exports NetworkServices
     */
    return NetworkServices;

});
