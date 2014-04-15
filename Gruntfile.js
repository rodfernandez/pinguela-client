/*global module:false*/

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['dist/'],
        jshint: {
            options: grunt.file.readJSON('.jshintrc'),
            src: ['**/*.js', '!**/dist/**', '!**/node_modules/**']
        },
        requirejs: {
            build: {
                options: {
                    include: ['./lib/navigator.js'],
                    insertRequire: [
                        './lib/navigator.js'
                    ],
                    mainConfigFile: './config.js',
                    name: './node_modules/almond/almond.js',
                    optimize: 'none',
                    out: './dist/pinguela-client.js',
                    useStrict: true
                }
            },
            build_min: {
                options: {
                    include: ['./lib/navigator.js'],
                    insertRequire: [ './lib/navigator.js'],
                    mainConfigFile: './config.js',
                    name: './node_modules/almond/almond.js',
                    optimize: 'uglify2',
                    out: './dist/pinguela-client.min.js',
                    useStrict: true
                }
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Default task.
    grunt.registerTask('default', ['jshint', 'clean', 'requirejs']);

};