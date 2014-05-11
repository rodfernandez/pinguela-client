/*global module:false*/

module.exports = function (grunt) {

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
                    mainConfigFile: './main.js',
                    name: './node_modules/almond/almond.js',
                    optimize: 'none',
                    out: './dist/pinguela-client-dev.js',
                    useStrict: true,
                    wrap: {
                        start: '(function() {' + grunt.util.linefeed,
                        end: 'require("./lib/navigator.js");' + grunt.util.linefeed + '}());'
                    }
                }
            },
            build_min: {
                options: {
                    include: ['./lib/navigator.js'],
                    mainConfigFile: './main.js',
                    name: './node_modules/almond/almond.js',
                    optimize: 'uglify2',
                    out: './dist/pinguela-client.js',
                    useStrict: true,
                    wrap: {
                        start: '(function() {' + grunt.util.linefeed,
                        end: 'require("./lib/navigator.js");' + grunt.util.linefeed + '}());'
                    }
                }
            }
        },
        watch: {
            lib: {
                files: ['./*.js', './lib/**/*.js'],
                tasks: ['build'],
                options: {
                    debounceDelay: 1000
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('build', ['test', 'clean', 'requirejs']);
    grunt.registerTask('default', ['build']);

};
