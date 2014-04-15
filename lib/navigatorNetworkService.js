/**
 * Defines the NavigatorNetworkService interface to enable Web pages to connect and communicate with Local-networked
 * Services provided over HTTP. This enables access to services and content provided by home network devices, including
 * the discovery and playback of content available to those devices, both from services such as traditional broadcast
 * media and internet based services as well as local services.
 *
 * @module getNetworkServices
 * @see {link http://www.w3.org/TR/discovery-api/#navigatornetworkservice}
 */
define(['./networkService', './networkServices'], function (NetworkService, NetworkServices) {

    'use strict';

    var NavigatorNetworkService = {};

    /**
     * Immediately returns a new Promise object and then the user is prompted to select discovered network services that
     * have advertised support for the requested service type(s). The type argument contains one or more valid service
     * type tokens that the web page would like to interact with. If the user accepts, the promise object is resolved,
     * with a NetworkServices object as its argument. If the user declines, or an error occurs, the promise object is
     * rejected.
     *
     * @param type {String|Array} one or more valid service type tokens that the web page would like to interact with.
     */
    NavigatorNetworkService.getNetworkServices = function (type) {

    };

    /**
     * @exports getNetworkServices
     */
    return NavigatorNetworkService;

});
