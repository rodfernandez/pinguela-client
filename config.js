requirejs.config({
    deps: [ 'q', 'socket_io' ],
    paths: {
        q: './node_modules/q/q',
        socket_io: './node_modules/socket.io-client/dist/socket.io.min'
    }
});
