define(['./navigatorNetworkService'], function (NavigatorNetworkService) {

    'use strict';

    if (navigator && typeof navigator.getNetworkServices !== 'function') {
        navigator.getNetworkServices = NavigatorNetworkService.getNetworkServices;
    }

    return navigator;

});
