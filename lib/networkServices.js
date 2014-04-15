/**
 * The NetworkServices interface represents a collection of zero or more indexed properties that are each a
 * user-authorized NetworkService object.
 *
 * @module NetworkServices
 * @see {link http://www.w3.org/TR/discovery-api/#networkservices}
 */
define(['./eventTarget', './networkService'], function (EventTarget, NetworkService) {

    'use strict';

    /**
     * The NetworkServices interface represents a collection of zero or more indexed properties that are each a
     * user-authorized NetworkService object.
     *
     * @constructor
     */
    var NetworkServices = function (services) {
//        var count = services && services.length;
    };

    /**
     * Returns the NetworkService object with the given identifier, or null if no service has that identifier.
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservices-getservicebyid}
     */
    NetworkServices.prototype.getServiceById = function (id) {

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
