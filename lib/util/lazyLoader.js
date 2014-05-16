define(['q'], function (q) {

    return function (url) {
        var deferred = q.defer(),

            xhr = new XMLHttpRequest(),

            handler = function (e) {
                var currentTarget = e.currentTarget;

                if (currentTarget.readyState !== 4) {
                    return;
                }

                if (currentTarget.status !== 200) {
                    return deferred.reject(new Error(currentTarget.statusText));
                }

                try {
                    /* jshint evil:true */
                    window.eval(currentTarget.responseText);
                } catch (error) {
                    deferred.reject(error);
                }

                deferred.resolve(window.io);
            };

        xhr.onreadystatechange = handler;
        xhr.open('get', url, true);
        xhr.send();

        return deferred.promise;
    };

});