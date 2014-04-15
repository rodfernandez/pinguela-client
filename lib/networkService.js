/**
 * The NetworkService interface is used to provide a set of connection information for an HTTP service endpoint and if
 * available, service events, running on a networked device.
 *
 * @module
 * @see {link http://www.w3.org/TR/discovery-api/#networkservice}
 */
define(function () {

    'use strict';

    /**
     *
     * @constructor
     */
    var NetworkService = function () {
    };

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
