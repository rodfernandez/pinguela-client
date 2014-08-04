requirejs.config({
    paths: {
        eventemitter2: './node_modules/eventemitter2/lib/eventemitter2',
        q: './node_modules/q/q',
        'underscore': './node_modules/underscore/underscore'
    }
});

requirejs(['./lib/navigator']);