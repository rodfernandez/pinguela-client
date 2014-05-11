requirejs.config({
    paths: {
        eventemitter2: './node_modules/eventemitter2/lib/eventemitter2',
        q: './node_modules/q/q'
    }
});

requirejs(['./lib/navigator']);