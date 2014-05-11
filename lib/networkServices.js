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

            this[index] = networkService;
        }, this);

        this._socket.on('disconnect', this._onSocketDisconnect.bind(this));
        this._socket.on('error', this._onSocketError.bind(this));
    };

    // Inherit from EventEmitter2 and restore constructor

    NetworkServices.prototype = new EventEmitter2();
    NetworkServices.prototype.constructor = NetworkServices;

    // Private members

    NetworkServices.prototype._onSocketError = function () {
        // TODO
    };

    NetworkServices.prototype._onSocketDisconnect = function () {
        // TODO
    };

    NetworkServices.prototype._onServiceFound = function (networkservice) {
        this.emit(this.prototype.servicefound, networkservice);
    };

    NetworkServices.prototype._onServiceLost = function (networkservice) {
        this.emit(this.prototype.servicefound, networkservice);
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
    NetworkServices.prototype.servicefound = 'servicefound';

    /**
     * When an existing service that matches one of the requested type tokens gracefully leaves or expires from the
     * current network.
     *
     * @type {String}
     * @see {link http://www.w3.org/TR/discovery-api/#event-servicelost}
     */
    NetworkServices.prototype.servicelost = 'servicelost';

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
