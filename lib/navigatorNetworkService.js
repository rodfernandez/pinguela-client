/*global io:false*/

/**
 * Defines the NavigatorNetworkService interface to enable Web pages to connect and communicate with Local-networked
 * Services provided over HTTP. This enables access to services and content provided by home network devices, including
 * the discovery and playback of content available to those devices, both from services such as traditional broadcast
 * media and internet based services as well as local services.
 *
 * @module getNetworkServices
 * @see {link http://www.w3.org/TR/discovery-api/#navigatornetworkservice}
 */
define(['./networkService', './networkServices', 'q'], function (NetworkService, NetworkServices, q) {

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
    NavigatorNetworkService.getNetworkServices = function (type, callback, errback) {
        var deferred = q.defer(),

            socket = io.connect(window.location.protocol + window.location.host),

            onConnect = function () {
                socket.emit('pinguela:getNetworkServices', type);
            },

            onError = function (error) {
                if (typeof errback === 'function') {
                    errback(error);
                } else {
                    deferred.reject(error);
                }
            },

            onNetworkServices = function (services) {
                var options = {
                        services: services,
                        socket: socket
                    },

                    networkServices = new NetworkServices(options);

                if (typeof callback === 'function') {
                    callback(networkServices);
                } else {
                    deferred.resolve(networkServices);
                }
            };

        socket.on('connect', onConnect);
        socket.on('pinguela:networkServices', onNetworkServices);
        socket.on('error', onError);

        if (socket.socket && socket.socket.connected) {
            socket.emit('pinguela:getNetworkServices', type);
        }

        return deferred.promise;
    };

    /**
     * @exports getNetworkServices
     */
    return NavigatorNetworkService;

});
