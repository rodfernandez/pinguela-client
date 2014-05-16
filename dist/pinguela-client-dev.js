(function () {
    /**
     * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
     * Available via the MIT or new BSD license.
     * see: http://github.com/jrburke/almond for details
     */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
    /*jslint sloppy: true */
    /*global setTimeout: false */

    var requirejs, require, define;
    (function (undef) {
        var main, req, makeMap, handlers,
            defined = {},
            waiting = {},
            config = {},
            defining = {},
            hasOwn = Object.prototype.hasOwnProperty,
            aps = [].slice,
            jsSuffixRegExp = /\.js$/;

        function hasProp(obj, prop) {
            return hasOwn.call(obj, prop);
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @returns {String} normalized name
         */
        function normalize(name, baseName) {
            var nameParts, nameSegment, mapValue, foundMap, lastIndex,
                foundI, foundStarMap, starI, i, j, part,
                baseParts = baseName && baseName.split("/"),
                map = config.map,
                starMap = (map && map['*']) || {};

            //Adjust any relative paths.
            if (name && name.charAt(0) === ".") {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that "directory" and not name of the baseName's
                    //module. For instance, baseName of "one/two/three", maps to
                    //"one/two/three.js", but we want the directory, "one/two" for
                    //this normalization.
                    baseParts = baseParts.slice(0, baseParts.length - 1);
                    name = name.split('/');
                    lastIndex = name.length - 1;

                    // Node .js allowance:
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                        name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                    }

                    name = baseParts.concat(name);

                    //start trimDots
                    for (i = 0; i < name.length; i += 1) {
                        part = name[i];
                        if (part === ".") {
                            name.splice(i, 1);
                            i -= 1;
                        } else if (part === "..") {
                            if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                                //End of the line. Keep at least one non-dot
                                //path segment at the front so it can be mapped
                                //correctly to disk. Otherwise, there is likely
                                //no path mapping for a path starting with '..'.
                                //This can still fail, but catches the most reasonable
                                //uses of ..
                                break;
                            } else if (i > 0) {
                                name.splice(i - 1, 2);
                                i -= 2;
                            }
                        }
                    }
                    //end trimDots

                    name = name.join("/");
                } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }

            //Apply map config if available.
            if ((baseParts || starMap) && map) {
                nameParts = name.split('/');

                for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join("/");

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = map[baseParts.slice(0, j).join('/')];

                            //baseName segment has  config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = mapValue[nameSegment];
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (foundMap) {
                        break;
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && starMap[nameSegment]) {
                        foundStarMap = starMap[nameSegment];
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            return name;
        }

        function makeRequire(relName, forceSync) {
            return function () {
                //A version of a require function that passes a moduleName
                //value for items that may need to
                //look up paths relative to the moduleName
                return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
            };
        }

        function makeNormalize(relName) {
            return function (name) {
                return normalize(name, relName);
            };
        }

        function makeLoad(depName) {
            return function (value) {
                defined[depName] = value;
            };
        }

        function callDep(name) {
            if (hasProp(waiting, name)) {
                var args = waiting[name];
                delete waiting[name];
                defining[name] = true;
                main.apply(undef, args);
            }

            if (!hasProp(defined, name) && !hasProp(defining, name)) {
                throw new Error('No ' + name);
            }
            return defined[name];
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Makes a name map, normalizing the name, and using a plugin
         * for normalization if necessary. Grabs a ref to plugin
         * too, as an optimization.
         */
        makeMap = function (name, relName) {
            var plugin,
                parts = splitPrefix(name),
                prefix = parts[0];

            name = parts[1];

            if (prefix) {
                prefix = normalize(prefix, relName);
                plugin = callDep(prefix);
            }

            //Normalize according
            if (prefix) {
                if (plugin && plugin.normalize) {
                    name = plugin.normalize(name, makeNormalize(relName));
                } else {
                    name = normalize(name, relName);
                }
            } else {
                name = normalize(name, relName);
                parts = splitPrefix(name);
                prefix = parts[0];
                name = parts[1];
                if (prefix) {
                    plugin = callDep(prefix);
                }
            }

            //Using ridiculous property names for space reasons
            return {
                f: prefix ? prefix + '!' + name : name, //fullName
                n: name,
                pr: prefix,
                p: plugin
            };
        };

        function makeConfig(name) {
            return function () {
                return (config && config.config && config.config[name]) || {};
            };
        }

        handlers = {
            require: function (name) {
                return makeRequire(name);
            },
            exports: function (name) {
                var e = defined[name];
                if (typeof e !== 'undefined') {
                    return e;
                } else {
                    return (defined[name] = {});
                }
            },
            module: function (name) {
                return {
                    id: name,
                    uri: '',
                    exports: defined[name],
                    config: makeConfig(name)
                };
            }
        };

        main = function (name, deps, callback, relName) {
            var cjsModule, depName, ret, map, i,
                args = [],
                callbackType = typeof callback,
                usingExports;

            //Use name if no relName
            relName = relName || name;

            //Call the callback to define the module, if necessary.
            if (callbackType === 'undefined' || callbackType === 'function') {
                //Pull out the defined dependencies and pass the ordered
                //values to the callback.
                //Default to [require, exports, module] if no deps
                deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
                for (i = 0; i < deps.length; i += 1) {
                    map = makeMap(deps[i], relName);
                    depName = map.f;

                    //Fast path CommonJS standard dependencies.
                    if (depName === "require") {
                        args[i] = handlers.require(name);
                    } else if (depName === "exports") {
                        //CommonJS module spec 1.1
                        args[i] = handlers.exports(name);
                        usingExports = true;
                    } else if (depName === "module") {
                        //CommonJS module spec 1.1
                        cjsModule = args[i] = handlers.module(name);
                    } else if (hasProp(defined, depName) ||
                        hasProp(waiting, depName) ||
                        hasProp(defining, depName)) {
                        args[i] = callDep(depName);
                    } else if (map.p) {
                        map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                        args[i] = defined[depName];
                    } else {
                        throw new Error(name + ' missing ' + depName);
                    }
                }

                ret = callback ? callback.apply(defined[name], args) : undefined;

                if (name) {
                    //If setting exports via "module" is in play,
                    //favor that over return value and exports. After that,
                    //favor a non-undefined return value over exports use.
                    if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                        defined[name] = cjsModule.exports;
                    } else if (ret !== undef || !usingExports) {
                        //Use the return value from the function.
                        defined[name] = ret;
                    }
                }
            } else if (name) {
                //May just be an object definition for the module. Only
                //worry about defining if have a module name.
                defined[name] = callback;
            }
        };

        requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
            if (typeof deps === "string") {
                if (handlers[deps]) {
                    //callback in this case is really relName
                    return handlers[deps](callback);
                }
                //Just return the module wanted. In this scenario, the
                //deps arg is the module name, and second arg (if passed)
                //is just the relName.
                //Normalize module name, if it contains . or ..
                return callDep(makeMap(deps, callback).f);
            } else if (!deps.splice) {
                //deps is a config object, not an array.
                config = deps;
                if (config.deps) {
                    req(config.deps, config.callback);
                }
                if (!callback) {
                    return;
                }

                if (callback.splice) {
                    //callback is an array, which means it is a dependency list.
                    //Adjust args if there are dependencies
                    deps = callback;
                    callback = relName;
                    relName = null;
                } else {
                    deps = undef;
                }
            }

            //Support require(['a'])
            callback = callback || function () {
            };

            //If relName is a function, it is an errback handler,
            //so remove it.
            if (typeof relName === 'function') {
                relName = forceSync;
                forceSync = alt;
            }

            //Simulate async callback;
            if (forceSync) {
                main(undef, deps, callback, relName);
            } else {
                //Using a non-zero value because of concern for what old browsers
                //do, and latest browsers "upgrade" to 4 if lower value is used:
                //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
                //If want a value immediately, use require('id') instead -- something
                //that works in almond on the global level, but not guaranteed and
                //unlikely to work in other AMD implementations.
                setTimeout(function () {
                    main(undef, deps, callback, relName);
                }, 4);
            }

            return req;
        };

        /**
         * Just drops the config on the floor, but returns req in case
         * the config return value is used.
         */
        req.config = function (cfg) {
            return req(cfg);
        };

        /**
         * Expose module registry for debugging and tooling
         */
        requirejs._defined = defined;

        define = function (name, deps, callback) {

            //This module may not have dependencies
            if (!deps.splice) {
                //deps is not an array, so probably means
                //an object literal or factory function for
                //the value. Adjust args.
                callback = deps;
                deps = [];
            }

            if (!hasProp(defined, name) && !hasProp(waiting, name)) {
                waiting[name] = [name, deps, callback];
            }
        };

        define.amd = {
            jQuery: true
        };
    }());

    define("node_modules/almond/almond.js", function () {
    });

// vim:ts=4:sts=4:sw=4:
    /*!
     *
     * Copyright 2009-2012 Kris Kowal under the terms of the MIT
     * license found at http://github.com/kriskowal/q/raw/master/LICENSE
     *
     * With parts by Tyler Close
     * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
     * at http://www.opensource.org/licenses/mit-license.html
     * Forked at ref_send.js version: 2009-05-11
     *
     * With parts by Mark Miller
     * Copyright (C) 2011 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     */

    (function (definition) {
        // Turn off strict mode for this function so we can assign to global.Q
        /* jshint strict: false */

        // This file will function properly as a <script> tag, or a module
        // using CommonJS and NodeJS or RequireJS module formats.  In
        // Common/Node/RequireJS, the module exports the Q API and when
        // executed as a simple <script>, it creates a Q global instead.

        // Montage Require
        if (typeof bootstrap === "function") {
            bootstrap("promise", definition);

            // CommonJS
        } else if (typeof exports === "object") {
            module.exports = definition();

            // RequireJS
        } else if (typeof define === "function" && define.amd) {
            define('q', definition);

            // SES (Secure EcmaScript)
        } else if (typeof ses !== "undefined") {
            if (!ses.ok()) {
                return;
            } else {
                ses.makeQ = definition;
            }

            // <script>
        } else {
            Q = definition();
        }

    })(function () {
        "use strict";

        var hasStacks = false;
        try {
            throw new Error();
        } catch (e) {
            hasStacks = !!e.stack;
        }

// All code after this point will be filtered from stack traces reported
// by Q.
        var qStartingLine = captureLine();
        var qFileName;

// shims

// used for fallback in "allResolved"
        var noop = function () {
        };

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
        var nextTick = (function () {
            // linked list of tasks (single, with head node)
            var head = {task: void 0, next: null};
            var tail = head;
            var flushing = false;
            var requestTick = void 0;
            var isNodeJS = false;

            function flush() {
                /* jshint loopfunc: true */

                while (head.next) {
                    head = head.next;
                    var task = head.task;
                    head.task = void 0;
                    var domain = head.domain;

                    if (domain) {
                        head.domain = void 0;
                        domain.enter();
                    }

                    try {
                        task();

                    } catch (e) {
                        if (isNodeJS) {
                            // In node, uncaught exceptions are considered fatal errors.
                            // Re-throw them synchronously to interrupt flushing!

                            // Ensure continuation if the uncaught exception is suppressed
                            // listening "uncaughtException" events (as domains does).
                            // Continue in next event to avoid tick recursion.
                            if (domain) {
                                domain.exit();
                            }
                            setTimeout(flush, 0);
                            if (domain) {
                                domain.enter();
                            }

                            throw e;

                        } else {
                            // In browsers, uncaught exceptions are not fatal.
                            // Re-throw them asynchronously to avoid slow-downs.
                            setTimeout(function () {
                                throw e;
                            }, 0);
                        }
                    }

                    if (domain) {
                        domain.exit();
                    }
                }

                flushing = false;
            }

            nextTick = function (task) {
                tail = tail.next = {
                    task: task,
                    domain: isNodeJS && process.domain,
                    next: null
                };

                if (!flushing) {
                    flushing = true;
                    requestTick();
                }
            };

            if (typeof process !== "undefined" && process.nextTick) {
                // Node.js before 0.9. Note that some fake-Node environments, like the
                // Mocha test runner, introduce a `process` global without a `nextTick`.
                isNodeJS = true;

                requestTick = function () {
                    process.nextTick(flush);
                };

            } else if (typeof setImmediate === "function") {
                // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
                if (typeof window !== "undefined") {
                    requestTick = setImmediate.bind(window, flush);
                } else {
                    requestTick = function () {
                        setImmediate(flush);
                    };
                }

            } else if (typeof MessageChannel !== "undefined") {
                // modern browsers
                // http://www.nonblocking.io/2011/06/windownexttick.html
                var channel = new MessageChannel();
                // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
                // working message ports the first time a page loads.
                channel.port1.onmessage = function () {
                    requestTick = requestPortTick;
                    channel.port1.onmessage = flush;
                    flush();
                };
                var requestPortTick = function () {
                    // Opera requires us to provide a message payload, regardless of
                    // whether we use it.
                    channel.port2.postMessage(0);
                };
                requestTick = function () {
                    setTimeout(flush, 0);
                    requestPortTick();
                };

            } else {
                // old browsers
                requestTick = function () {
                    setTimeout(flush, 0);
                };
            }

            return nextTick;
        })();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
        var call = Function.call;

        function uncurryThis(f) {
            return function () {
                return call.apply(f, arguments);
            };
        }

// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

        var array_slice = uncurryThis(Array.prototype.slice);

        var array_reduce = uncurryThis(
            Array.prototype.reduce || function (callback, basis) {
                var index = 0,
                    length = this.length;
                // concerning the initial value, if one is not provided
                if (arguments.length === 1) {
                    // seek to the first value in the array, accounting
                    // for the possibility that is is a sparse array
                    do {
                        if (index in this) {
                            basis = this[index++];
                            break;
                        }
                        if (++index >= length) {
                            throw new TypeError();
                        }
                    } while (1);
                }
                // reduce
                for (; index < length; index++) {
                    // account for the possibility that the array is sparse
                    if (index in this) {
                        basis = callback(basis, this[index], index);
                    }
                }
                return basis;
            }
        );

        var array_indexOf = uncurryThis(
            Array.prototype.indexOf || function (value) {
                // not a very good shim, but good enough for our one use of it
                for (var i = 0; i < this.length; i++) {
                    if (this[i] === value) {
                        return i;
                    }
                }
                return -1;
            }
        );

        var array_map = uncurryThis(
            Array.prototype.map || function (callback, thisp) {
                var self = this;
                var collect = [];
                array_reduce(self, function (undefined, value, index) {
                    collect.push(callback.call(thisp, value, index, self));
                }, void 0);
                return collect;
            }
        );

        var object_create = Object.create || function (prototype) {
            function Type() {
            }

            Type.prototype = prototype;
            return new Type();
        };

        var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

        var object_keys = Object.keys || function (object) {
            var keys = [];
            for (var key in object) {
                if (object_hasOwnProperty(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };

        var object_toString = uncurryThis(Object.prototype.toString);

        function isObject(value) {
            return value === Object(value);
        }

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
        function isStopIteration(exception) {
            return (
                object_toString(exception) === "[object StopIteration]" ||
                    exception instanceof QReturnValue
                );
        }

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
        var QReturnValue;
        if (typeof ReturnValue !== "undefined") {
            QReturnValue = ReturnValue;
        } else {
            QReturnValue = function (value) {
                this.value = value;
            };
        }

// long stack traces

        var STACK_JUMP_SEPARATOR = "From previous event:";

        function makeStackTraceLong(error, promise) {
            // If possible, transform the error stack trace by removing Node and Q
            // cruft, then concatenating with the stack trace of `promise`. See #57.
            if (hasStacks &&
                promise.stack &&
                typeof error === "object" &&
                error !== null &&
                error.stack &&
                error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
                ) {
                var stacks = [];
                for (var p = promise; !!p; p = p.source) {
                    if (p.stack) {
                        stacks.unshift(p.stack);
                    }
                }
                stacks.unshift(error.stack);

                var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
                error.stack = filterStackString(concatedStacks);
            }
        }

        function filterStackString(stackString) {
            var lines = stackString.split("\n");
            var desiredLines = [];
            for (var i = 0; i < lines.length; ++i) {
                var line = lines[i];

                if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
                    desiredLines.push(line);
                }
            }
            return desiredLines.join("\n");
        }

        function isNodeFrame(stackLine) {
            return stackLine.indexOf("(module.js:") !== -1 ||
                stackLine.indexOf("(node.js:") !== -1;
        }

        function getFileNameAndLineNumber(stackLine) {
            // Named functions: "at functionName (filename:lineNumber:columnNumber)"
            // In IE10 function name can have spaces ("Anonymous function") O_o
            var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
            if (attempt1) {
                return [attempt1[1], Number(attempt1[2])];
            }

            // Anonymous functions: "at filename:lineNumber:columnNumber"
            var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
            if (attempt2) {
                return [attempt2[1], Number(attempt2[2])];
            }

            // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
            var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
            if (attempt3) {
                return [attempt3[1], Number(attempt3[2])];
            }
        }

        function isInternalFrame(stackLine) {
            var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

            if (!fileNameAndLineNumber) {
                return false;
            }

            var fileName = fileNameAndLineNumber[0];
            var lineNumber = fileNameAndLineNumber[1];

            return fileName === qFileName &&
                lineNumber >= qStartingLine &&
                lineNumber <= qEndingLine;
        }

// discover own file name and line number range for filtering stack
// traces
        function captureLine() {
            if (!hasStacks) {
                return;
            }

            try {
                throw new Error();
            } catch (e) {
                var lines = e.stack.split("\n");
                var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
                var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
                if (!fileNameAndLineNumber) {
                    return;
                }

                qFileName = fileNameAndLineNumber[0];
                return fileNameAndLineNumber[1];
            }
        }

        function deprecate(callback, name, alternative) {
            return function () {
                if (typeof console !== "undefined" &&
                    typeof console.warn === "function") {
                    console.warn(name + " is deprecated, use " + alternative +
                        " instead.", new Error("").stack);
                }
                return callback.apply(callback, arguments);
            };
        }

// end of shims
// beginning of real work

        /**
         * Constructs a promise for an immediate reference, passes promises through, or
         * coerces promises from different systems.
         * @param value immediate reference or promise
         */
        function Q(value) {
            // If the object is already a Promise, return it directly.  This enables
            // the resolve function to both be used to created references from objects,
            // but to tolerably coerce non-promises to promises.
            if (isPromise(value)) {
                return value;
            }

            // assimilate thenables
            if (isPromiseAlike(value)) {
                return coerce(value);
            } else {
                return fulfill(value);
            }
        }

        Q.resolve = Q;

        /**
         * Performs a task in a future turn of the event loop.
         * @param {Function} task
         */
        Q.nextTick = nextTick;

        /**
         * Controls whether or not long stack traces will be on
         */
        Q.longStackSupport = false;

        /**
         * Constructs a {promise, resolve, reject} object.
         *
         * `resolve` is a callback to invoke with a more resolved value for the
         * promise. To fulfill the promise, invoke `resolve` with any value that is
         * not a thenable. To reject the promise, invoke `resolve` with a rejected
         * thenable, or invoke `reject` with the reason directly. To resolve the
         * promise to another thenable, thus putting it in the same state, invoke
         * `resolve` with that other thenable.
         */
        Q.defer = defer;
        function defer() {
            // if "messages" is an "Array", that indicates that the promise has not yet
            // been resolved.  If it is "undefined", it has been resolved.  Each
            // element of the messages array is itself an array of complete arguments to
            // forward to the resolved promise.  We coerce the resolution value to a
            // promise using the `resolve` function because it handles both fully
            // non-thenable values and other thenables gracefully.
            var messages = [], progressListeners = [], resolvedPromise;

            var deferred = object_create(defer.prototype);
            var promise = object_create(Promise.prototype);

            promise.promiseDispatch = function (resolve, op, operands) {
                var args = array_slice(arguments);
                if (messages) {
                    messages.push(args);
                    if (op === "when" && operands[1]) { // progress operand
                        progressListeners.push(operands[1]);
                    }
                } else {
                    nextTick(function () {
                        resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
                    });
                }
            };

            // XXX deprecated
            promise.valueOf = function () {
                if (messages) {
                    return promise;
                }
                var nearerValue = nearer(resolvedPromise);
                if (isPromise(nearerValue)) {
                    resolvedPromise = nearerValue; // shorten chain
                }
                return nearerValue;
            };

            promise.inspect = function () {
                if (!resolvedPromise) {
                    return { state: "pending" };
                }
                return resolvedPromise.inspect();
            };

            if (Q.longStackSupport && hasStacks) {
                try {
                    throw new Error();
                } catch (e) {
                    // NOTE: don't try to use `Error.captureStackTrace` or transfer the
                    // accessor around; that causes memory leaks as per GH-111. Just
                    // reify the stack trace as a string ASAP.
                    //
                    // At the same time, cut off the first line; it's always just
                    // "[object Promise]\n", as per the `toString`.
                    promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
                }
            }

            // NOTE: we do the checks for `resolvedPromise` in each method, instead of
            // consolidating them into `become`, since otherwise we'd create new
            // promises with the lines `become(whatever(value))`. See e.g. GH-252.

            function become(newPromise) {
                resolvedPromise = newPromise;
                promise.source = newPromise;

                array_reduce(messages, function (undefined, message) {
                    nextTick(function () {
                        newPromise.promiseDispatch.apply(newPromise, message);
                    });
                }, void 0);

                messages = void 0;
                progressListeners = void 0;
            }

            deferred.promise = promise;
            deferred.resolve = function (value) {
                if (resolvedPromise) {
                    return;
                }

                become(Q(value));
            };

            deferred.fulfill = function (value) {
                if (resolvedPromise) {
                    return;
                }

                become(fulfill(value));
            };
            deferred.reject = function (reason) {
                if (resolvedPromise) {
                    return;
                }

                become(reject(reason));
            };
            deferred.notify = function (progress) {
                if (resolvedPromise) {
                    return;
                }

                array_reduce(progressListeners, function (undefined, progressListener) {
                    nextTick(function () {
                        progressListener(progress);
                    });
                }, void 0);
            };

            return deferred;
        }

        /**
         * Creates a Node-style callback that will resolve or reject the deferred
         * promise.
         * @returns a nodeback
         */
        defer.prototype.makeNodeResolver = function () {
            var self = this;
            return function (error, value) {
                if (error) {
                    self.reject(error);
                } else if (arguments.length > 2) {
                    self.resolve(array_slice(arguments, 1));
                } else {
                    self.resolve(value);
                }
            };
        };

        /**
         * @param resolver {Function} a function that returns nothing and accepts
         * the resolve, reject, and notify functions for a deferred.
         * @returns a promise that may be resolved with the given resolve and reject
         * functions, or rejected by a thrown exception in resolver
         */
        Q.Promise = promise; // ES6
        Q.promise = promise;
        function promise(resolver) {
            if (typeof resolver !== "function") {
                throw new TypeError("resolver must be a function.");
            }
            var deferred = defer();
            try {
                resolver(deferred.resolve, deferred.reject, deferred.notify);
            } catch (reason) {
                deferred.reject(reason);
            }
            return deferred.promise;
        }

        promise.race = race; // ES6
        promise.all = all; // ES6
        promise.reject = reject; // ES6
        promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
        Q.passByCopy = function (object) {
            //freeze(object);
            //passByCopies.set(object, true);
            return object;
        };

        Promise.prototype.passByCopy = function () {
            //freeze(object);
            //passByCopies.set(object, true);
            return this;
        };

        /**
         * If two promises eventually fulfill to the same value, promises that value,
         * but otherwise rejects.
         * @param x {Any*}
         * @param y {Any*}
         * @returns {Any*} a promise for x and y if they are the same, but a rejection
         * otherwise.
         *
         */
        Q.join = function (x, y) {
            return Q(x).join(y);
        };

        Promise.prototype.join = function (that) {
            return Q([this, that]).spread(function (x, y) {
                if (x === y) {
                    // TODO: "===" should be Object.is or equiv
                    return x;
                } else {
                    throw new Error("Can't join: not the same: " + x + " " + y);
                }
            });
        };

        /**
         * Returns a promise for the first of an array of promises to become fulfilled.
         * @param answers {Array[Any*]} promises to race
         * @returns {Any*} the first promise to be fulfilled
         */
        Q.race = race;
        function race(answerPs) {
            return promise(function (resolve, reject) {
                // Switch to this once we can assume at least ES5
                // answerPs.forEach(function(answerP) {
                //     Q(answerP).then(resolve, reject);
                // });
                // Use this in the meantime
                for (var i = 0, len = answerPs.length; i < len; i++) {
                    Q(answerPs[i]).then(resolve, reject);
                }
            });
        }

        Promise.prototype.race = function () {
            return this.then(Q.race);
        };

        /**
         * Constructs a Promise with a promise descriptor object and optional fallback
         * function.  The descriptor contains methods like when(rejected), get(name),
         * set(name, value), post(name, args), and delete(name), which all
         * return either a value, a promise for a value, or a rejection.  The fallback
         * accepts the operation name, a resolver, and any further arguments that would
         * have been forwarded to the appropriate method above had a method been
         * provided with the proper name.  The API makes no guarantees about the nature
         * of the returned object, apart from that it is usable whereever promises are
         * bought and sold.
         */
        Q.makePromise = Promise;
        function Promise(descriptor, fallback, inspect) {
            if (fallback === void 0) {
                fallback = function (op) {
                    return reject(new Error(
                        "Promise does not support operation: " + op
                    ));
                };
            }
            if (inspect === void 0) {
                inspect = function () {
                    return {state: "unknown"};
                };
            }

            var promise = object_create(Promise.prototype);

            promise.promiseDispatch = function (resolve, op, args) {
                var result;
                try {
                    if (descriptor[op]) {
                        result = descriptor[op].apply(promise, args);
                    } else {
                        result = fallback.call(promise, op, args);
                    }
                } catch (exception) {
                    result = reject(exception);
                }
                if (resolve) {
                    resolve(result);
                }
            };

            promise.inspect = inspect;

            // XXX deprecated `valueOf` and `exception` support
            if (inspect) {
                var inspected = inspect();
                if (inspected.state === "rejected") {
                    promise.exception = inspected.reason;
                }

                promise.valueOf = function () {
                    var inspected = inspect();
                    if (inspected.state === "pending" ||
                        inspected.state === "rejected") {
                        return promise;
                    }
                    return inspected.value;
                };
            }

            return promise;
        }

        Promise.prototype.toString = function () {
            return "[object Promise]";
        };

        Promise.prototype.then = function (fulfilled, rejected, progressed) {
            var self = this;
            var deferred = defer();
            var done = false;   // ensure the untrusted promise makes at most a
            // single call to one of the callbacks

            function _fulfilled(value) {
                try {
                    return typeof fulfilled === "function" ? fulfilled(value) : value;
                } catch (exception) {
                    return reject(exception);
                }
            }

            function _rejected(exception) {
                if (typeof rejected === "function") {
                    makeStackTraceLong(exception, self);
                    try {
                        return rejected(exception);
                    } catch (newException) {
                        return reject(newException);
                    }
                }
                return reject(exception);
            }

            function _progressed(value) {
                return typeof progressed === "function" ? progressed(value) : value;
            }

            nextTick(function () {
                self.promiseDispatch(function (value) {
                    if (done) {
                        return;
                    }
                    done = true;

                    deferred.resolve(_fulfilled(value));
                }, "when", [function (exception) {
                    if (done) {
                        return;
                    }
                    done = true;

                    deferred.resolve(_rejected(exception));
                }]);
            });

            // Progress propagator need to be attached in the current tick.
            self.promiseDispatch(void 0, "when", [void 0, function (value) {
                var newValue;
                var threw = false;
                try {
                    newValue = _progressed(value);
                } catch (e) {
                    threw = true;
                    if (Q.onerror) {
                        Q.onerror(e);
                    } else {
                        throw e;
                    }
                }

                if (!threw) {
                    deferred.notify(newValue);
                }
            }]);

            return deferred.promise;
        };

        /**
         * Registers an observer on a promise.
         *
         * Guarantees:
         *
         * 1. that fulfilled and rejected will be called only once.
         * 2. that either the fulfilled callback or the rejected callback will be
         *    called, but not both.
         * 3. that fulfilled and rejected will not be called in this turn.
         *
         * @param value      promise or immediate reference to observe
         * @param fulfilled  function to be called with the fulfilled value
         * @param rejected   function to be called with the rejection exception
         * @param progressed function to be called on any progress notifications
         * @return promise for the return value from the invoked callback
         */
        Q.when = when;
        function when(value, fulfilled, rejected, progressed) {
            return Q(value).then(fulfilled, rejected, progressed);
        }

        Promise.prototype.thenResolve = function (value) {
            return this.then(function () {
                return value;
            });
        };

        Q.thenResolve = function (promise, value) {
            return Q(promise).thenResolve(value);
        };

        Promise.prototype.thenReject = function (reason) {
            return this.then(function () {
                throw reason;
            });
        };

        Q.thenReject = function (promise, reason) {
            return Q(promise).thenReject(reason);
        };

        /**
         * If an object is not a promise, it is as "near" as possible.
         * If a promise is rejected, it is as "near" as possible too.
         * If it’s a fulfilled promise, the fulfillment value is nearer.
         * If it’s a deferred promise and the deferred has been resolved, the
         * resolution is "nearer".
         * @param object
         * @returns most resolved (nearest) form of the object
         */

// XXX should we re-do this?
        Q.nearer = nearer;
        function nearer(value) {
            if (isPromise(value)) {
                var inspected = value.inspect();
                if (inspected.state === "fulfilled") {
                    return inspected.value;
                }
            }
            return value;
        }

        /**
         * @returns whether the given object is a promise.
         * Otherwise it is a fulfilled value.
         */
        Q.isPromise = isPromise;
        function isPromise(object) {
            return isObject(object) &&
                typeof object.promiseDispatch === "function" &&
                typeof object.inspect === "function";
        }

        Q.isPromiseAlike = isPromiseAlike;
        function isPromiseAlike(object) {
            return isObject(object) && typeof object.then === "function";
        }

        /**
         * @returns whether the given object is a pending promise, meaning not
         * fulfilled or rejected.
         */
        Q.isPending = isPending;
        function isPending(object) {
            return isPromise(object) && object.inspect().state === "pending";
        }

        Promise.prototype.isPending = function () {
            return this.inspect().state === "pending";
        };

        /**
         * @returns whether the given object is a value or fulfilled
         * promise.
         */
        Q.isFulfilled = isFulfilled;
        function isFulfilled(object) {
            return !isPromise(object) || object.inspect().state === "fulfilled";
        }

        Promise.prototype.isFulfilled = function () {
            return this.inspect().state === "fulfilled";
        };

        /**
         * @returns whether the given object is a rejected promise.
         */
        Q.isRejected = isRejected;
        function isRejected(object) {
            return isPromise(object) && object.inspect().state === "rejected";
        }

        Promise.prototype.isRejected = function () {
            return this.inspect().state === "rejected";
        };

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
        var unhandledReasons = [];
        var unhandledRejections = [];
        var trackUnhandledRejections = true;

        function resetUnhandledRejections() {
            unhandledReasons.length = 0;
            unhandledRejections.length = 0;

            if (!trackUnhandledRejections) {
                trackUnhandledRejections = true;
            }
        }

        function trackRejection(promise, reason) {
            if (!trackUnhandledRejections) {
                return;
            }

            unhandledRejections.push(promise);
            if (reason && typeof reason.stack !== "undefined") {
                unhandledReasons.push(reason.stack);
            } else {
                unhandledReasons.push("(no stack) " + reason);
            }
        }

        function untrackRejection(promise) {
            if (!trackUnhandledRejections) {
                return;
            }

            var at = array_indexOf(unhandledRejections, promise);
            if (at !== -1) {
                unhandledRejections.splice(at, 1);
                unhandledReasons.splice(at, 1);
            }
        }

        Q.resetUnhandledRejections = resetUnhandledRejections;

        Q.getUnhandledReasons = function () {
            // Make a copy so that consumers can't interfere with our internal state.
            return unhandledReasons.slice();
        };

        Q.stopUnhandledRejectionTracking = function () {
            resetUnhandledRejections();
            trackUnhandledRejections = false;
        };

        resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

        /**
         * Constructs a rejected promise.
         * @param reason value describing the failure
         */
        Q.reject = reject;
        function reject(reason) {
            var rejection = Promise({
                "when": function (rejected) {
                    // note that the error has been handled
                    if (rejected) {
                        untrackRejection(this);
                    }
                    return rejected ? rejected(reason) : this;
                }
            }, function fallback() {
                return this;
            }, function inspect() {
                return { state: "rejected", reason: reason };
            });

            // Note that the reason has not been handled.
            trackRejection(rejection, reason);

            return rejection;
        }

        /**
         * Constructs a fulfilled promise for an immediate reference.
         * @param value immediate reference
         */
        Q.fulfill = fulfill;
        function fulfill(value) {
            return Promise({
                "when": function () {
                    return value;
                },
                "get": function (name) {
                    return value[name];
                },
                "set": function (name, rhs) {
                    value[name] = rhs;
                },
                "delete": function (name) {
                    delete value[name];
                },
                "post": function (name, args) {
                    // Mark Miller proposes that post with no name should apply a
                    // promised function.
                    if (name === null || name === void 0) {
                        return value.apply(void 0, args);
                    } else {
                        return value[name].apply(value, args);
                    }
                },
                "apply": function (thisp, args) {
                    return value.apply(thisp, args);
                },
                "keys": function () {
                    return object_keys(value);
                }
            }, void 0, function inspect() {
                return { state: "fulfilled", value: value };
            });
        }

        /**
         * Converts thenables to Q promises.
         * @param promise thenable promise
         * @returns a Q promise
         */
        function coerce(promise) {
            var deferred = defer();
            nextTick(function () {
                try {
                    promise.then(deferred.resolve, deferred.reject, deferred.notify);
                } catch (exception) {
                    deferred.reject(exception);
                }
            });
            return deferred.promise;
        }

        /**
         * Annotates an object such that it will never be
         * transferred away from this process over any promise
         * communication channel.
         * @param object
         * @returns promise a wrapping of that object that
         * additionally responds to the "isDef" message
         * without a rejection.
         */
        Q.master = master;
        function master(object) {
            return Promise({
                "isDef": function () {
                }
            }, function fallback(op, args) {
                return dispatch(object, op, args);
            }, function () {
                return Q(object).inspect();
            });
        }

        /**
         * Spreads the values of a promised array of arguments into the
         * fulfillment callback.
         * @param fulfilled callback that receives variadic arguments from the
         * promised array
         * @param rejected callback that receives the exception if the promise
         * is rejected.
         * @returns a promise for the return value or thrown exception of
         * either callback.
         */
        Q.spread = spread;
        function spread(value, fulfilled, rejected) {
            return Q(value).spread(fulfilled, rejected);
        }

        Promise.prototype.spread = function (fulfilled, rejected) {
            return this.all().then(function (array) {
                return fulfilled.apply(void 0, array);
            }, rejected);
        };

        /**
         * The async function is a decorator for generator functions, turning
         * them into asynchronous generators.  Although generators are only part
         * of the newest ECMAScript 6 drafts, this code does not cause syntax
         * errors in older engines.  This code should continue to work and will
         * in fact improve over time as the language improves.
         *
         * ES6 generators are currently part of V8 version 3.19 with the
         * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
         * for longer, but under an older Python-inspired form.  This function
         * works on both kinds of generators.
         *
         * Decorates a generator function such that:
         *  - it may yield promises
         *  - execution will continue when that promise is fulfilled
         *  - the value of the yield expression will be the fulfilled value
         *  - it returns a promise for the return value (when the generator
         *    stops iterating)
         *  - the decorated function returns a promise for the return value
         *    of the generator or the first rejected promise among those
         *    yielded.
         *  - if an error is thrown in the generator, it propagates through
         *    every following yield until it is caught, or until it escapes
         *    the generator function altogether, and is translated into a
         *    rejection for the promise returned by the decorated generator.
         */
        Q.async = async;
        function async(makeGenerator) {
            return function () {
                // when verb is "send", arg is a value
                // when verb is "throw", arg is an exception
                function continuer(verb, arg) {
                    var result;

                    // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
                    // engine that has a deployed base of browsers that support generators.
                    // However, SM's generators use the Python-inspired semantics of
                    // outdated ES6 drafts.  We would like to support ES6, but we'd also
                    // like to make it possible to use generators in deployed browsers, so
                    // we also support Python-style generators.  At some point we can remove
                    // this block.

                    if (typeof StopIteration === "undefined") {
                        // ES6 Generators
                        try {
                            result = generator[verb](arg);
                        } catch (exception) {
                            return reject(exception);
                        }
                        if (result.done) {
                            return result.value;
                        } else {
                            return when(result.value, callback, errback);
                        }
                    } else {
                        // SpiderMonkey Generators
                        // FIXME: Remove this case when SM does ES6 generators.
                        try {
                            result = generator[verb](arg);
                        } catch (exception) {
                            if (isStopIteration(exception)) {
                                return exception.value;
                            } else {
                                return reject(exception);
                            }
                        }
                        return when(result, callback, errback);
                    }
                }

                var generator = makeGenerator.apply(this, arguments);
                var callback = continuer.bind(continuer, "next");
                var errback = continuer.bind(continuer, "throw");
                return callback();
            };
        }

        /**
         * The spawn function is a small wrapper around async that immediately
         * calls the generator and also ends the promise chain, so that any
         * unhandled errors are thrown instead of forwarded to the error
         * handler. This is useful because it's extremely common to run
         * generators at the top-level to work with libraries.
         */
        Q.spawn = spawn;
        function spawn(makeGenerator) {
            Q.done(Q.async(makeGenerator)());
        }

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
        /**
         * Throws a ReturnValue exception to stop an asynchronous generator.
         *
         * This interface is a stop-gap measure to support generator return
         * values in older Firefox/SpiderMonkey.  In browsers that support ES6
         * generators like Chromium 29, just use "return" in your generator
         * functions.
         *
         * @param value the return value for the surrounding generator
         * @throws ReturnValue exception with the value.
         * @example
         * // ES6 style
         * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
         * // Older SpiderMonkey style
         * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
         */
        Q["return"] = _return;
        function _return(value) {
            throw new QReturnValue(value);
        }

        /**
         * The promised function decorator ensures that any promise arguments
         * are settled and passed as values (`this` is also settled and passed
         * as a value).  It will also ensure that the result of a function is
         * always a promise.
         *
         * @example
         * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
         * add(Q(a), Q(B));
         *
         * @param {function} callback The function to decorate
         * @returns {function} a function that has been decorated.
         */
        Q.promised = promised;
        function promised(callback) {
            return function () {
                return spread([this, all(arguments)], function (self, args) {
                    return callback.apply(self, args);
                });
            };
        }

        /**
         * sends a message to a value in a future turn
         * @param object* the recipient
         * @param op the name of the message operation, e.g., "when",
         * @param args further arguments to be forwarded to the operation
         * @returns result {Promise} a promise for the result of the operation
         */
        Q.dispatch = dispatch;
        function dispatch(object, op, args) {
            return Q(object).dispatch(op, args);
        }

        Promise.prototype.dispatch = function (op, args) {
            var self = this;
            var deferred = defer();
            nextTick(function () {
                self.promiseDispatch(deferred.resolve, op, args);
            });
            return deferred.promise;
        };

        /**
         * Gets the value of a property in a future turn.
         * @param object    promise or immediate reference for target object
         * @param name      name of property to get
         * @return promise for the property value
         */
        Q.get = function (object, key) {
            return Q(object).dispatch("get", [key]);
        };

        Promise.prototype.get = function (key) {
            return this.dispatch("get", [key]);
        };

        /**
         * Sets the value of a property in a future turn.
         * @param object    promise or immediate reference for object object
         * @param name      name of property to set
         * @param value     new value of property
         * @return promise for the return value
         */
        Q.set = function (object, key, value) {
            return Q(object).dispatch("set", [key, value]);
        };

        Promise.prototype.set = function (key, value) {
            return this.dispatch("set", [key, value]);
        };

        /**
         * Deletes a property in a future turn.
         * @param object    promise or immediate reference for target object
         * @param name      name of property to delete
         * @return promise for the return value
         */
        Q.del = // XXX legacy
            Q["delete"] = function (object, key) {
                return Q(object).dispatch("delete", [key]);
            };

        Promise.prototype.del = // XXX legacy
            Promise.prototype["delete"] = function (key) {
                return this.dispatch("delete", [key]);
            };

        /**
         * Invokes a method in a future turn.
         * @param object    promise or immediate reference for target object
         * @param name      name of method to invoke
         * @param value     a value to post, typically an array of
         *                  invocation arguments for promises that
         *                  are ultimately backed with `resolve` values,
         *                  as opposed to those backed with URLs
         *                  wherein the posted value can be any
         *                  JSON serializable object.
         * @return promise for the return value
         */
// bound locally because it is used by other methods
        Q.mapply = // XXX As proposed by "Redsandro"
            Q.post = function (object, name, args) {
                return Q(object).dispatch("post", [name, args]);
            };

        Promise.prototype.mapply = // XXX As proposed by "Redsandro"
            Promise.prototype.post = function (name, args) {
                return this.dispatch("post", [name, args]);
            };

        /**
         * Invokes a method in a future turn.
         * @param object    promise or immediate reference for target object
         * @param name      name of method to invoke
         * @param ...args   array of invocation arguments
         * @return promise for the return value
         */
        Q.send = // XXX Mark Miller's proposed parlance
            Q.mcall = // XXX As proposed by "Redsandro"
                Q.invoke = function (object, name /*...args*/) {
                    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
                };

        Promise.prototype.send = // XXX Mark Miller's proposed parlance
            Promise.prototype.mcall = // XXX As proposed by "Redsandro"
                Promise.prototype.invoke = function (name /*...args*/) {
                    return this.dispatch("post", [name, array_slice(arguments, 1)]);
                };

        /**
         * Applies the promised function in a future turn.
         * @param object    promise or immediate reference for target function
         * @param args      array of application arguments
         */
        Q.fapply = function (object, args) {
            return Q(object).dispatch("apply", [void 0, args]);
        };

        Promise.prototype.fapply = function (args) {
            return this.dispatch("apply", [void 0, args]);
        };

        /**
         * Calls the promised function in a future turn.
         * @param object    promise or immediate reference for target function
         * @param ...args   array of application arguments
         */
        Q["try"] =
            Q.fcall = function (object /* ...args*/) {
                return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
            };

        Promise.prototype.fcall = function (/*...args*/) {
            return this.dispatch("apply", [void 0, array_slice(arguments)]);
        };

        /**
         * Binds the promised function, transforming return values into a fulfilled
         * promise and thrown errors into a rejected one.
         * @param object    promise or immediate reference for target function
         * @param ...args   array of application arguments
         */
        Q.fbind = function (object /*...args*/) {
            var promise = Q(object);
            var args = array_slice(arguments, 1);
            return function fbound() {
                return promise.dispatch("apply", [
                    this,
                    args.concat(array_slice(arguments))
                ]);
            };
        };
        Promise.prototype.fbind = function (/*...args*/) {
            var promise = this;
            var args = array_slice(arguments);
            return function fbound() {
                return promise.dispatch("apply", [
                    this,
                    args.concat(array_slice(arguments))
                ]);
            };
        };

        /**
         * Requests the names of the owned properties of a promised
         * object in a future turn.
         * @param object    promise or immediate reference for target object
         * @return promise for the keys of the eventually settled object
         */
        Q.keys = function (object) {
            return Q(object).dispatch("keys", []);
        };

        Promise.prototype.keys = function () {
            return this.dispatch("keys", []);
        };

        /**
         * Turns an array of promises into a promise for an array.  If any of
         * the promises gets rejected, the whole array is rejected immediately.
         * @param {Array*} an array (or promise for an array) of values (or
         * promises for values)
         * @returns a promise for an array of the corresponding values
         */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
        Q.all = all;
        function all(promises) {
            return when(promises, function (promises) {
                var countDown = 0;
                var deferred = defer();
                array_reduce(promises, function (undefined, promise, index) {
                    var snapshot;
                    if (
                        isPromise(promise) &&
                            (snapshot = promise.inspect()).state === "fulfilled"
                        ) {
                        promises[index] = snapshot.value;
                    } else {
                        ++countDown;
                        when(
                            promise,
                            function (value) {
                                promises[index] = value;
                                if (--countDown === 0) {
                                    deferred.resolve(promises);
                                }
                            },
                            deferred.reject,
                            function (progress) {
                                deferred.notify({ index: index, value: progress });
                            }
                        );
                    }
                }, void 0);
                if (countDown === 0) {
                    deferred.resolve(promises);
                }
                return deferred.promise;
            });
        }

        Promise.prototype.all = function () {
            return all(this);
        };

        /**
         * Waits for all promises to be settled, either fulfilled or
         * rejected.  This is distinct from `all` since that would stop
         * waiting at the first rejection.  The promise returned by
         * `allResolved` will never be rejected.
         * @param promises a promise for an array (or an array) of promises
         * (or values)
         * @return a promise for an array of promises
         */
        Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
        function allResolved(promises) {
            return when(promises, function (promises) {
                promises = array_map(promises, Q);
                return when(all(array_map(promises, function (promise) {
                    return when(promise, noop, noop);
                })), function () {
                    return promises;
                });
            });
        }

        Promise.prototype.allResolved = function () {
            return allResolved(this);
        };

        /**
         * @see Promise#allSettled
         */
        Q.allSettled = allSettled;
        function allSettled(promises) {
            return Q(promises).allSettled();
        }

        /**
         * Turns an array of promises into a promise for an array of their states (as
         * returned by `inspect`) when they have all settled.
         * @param {Array[Any*]} values an array (or promise for an array) of values (or
         * promises for values)
         * @returns {Array[State]} an array of states for the respective values.
         */
        Promise.prototype.allSettled = function () {
            return this.then(function (promises) {
                return all(array_map(promises, function (promise) {
                    promise = Q(promise);
                    function regardless() {
                        return promise.inspect();
                    }

                    return promise.then(regardless, regardless);
                }));
            });
        };

        /**
         * Captures the failure of a promise, giving an oportunity to recover
         * with a callback.  If the given promise is fulfilled, the returned
         * promise is fulfilled.
         * @param {Any*} promise for something
         * @param {Function} callback to fulfill the returned promise if the
         * given promise is rejected
         * @returns a promise for the return value of the callback
         */
        Q.fail = // XXX legacy
            Q["catch"] = function (object, rejected) {
                return Q(object).then(void 0, rejected);
            };

        Promise.prototype.fail = // XXX legacy
            Promise.prototype["catch"] = function (rejected) {
                return this.then(void 0, rejected);
            };

        /**
         * Attaches a listener that can respond to progress notifications from a
         * promise's originating deferred. This listener receives the exact arguments
         * passed to ``deferred.notify``.
         * @param {Any*} promise for something
         * @param {Function} callback to receive any progress notifications
         * @returns the given promise, unchanged
         */
        Q.progress = progress;
        function progress(object, progressed) {
            return Q(object).then(void 0, void 0, progressed);
        }

        Promise.prototype.progress = function (progressed) {
            return this.then(void 0, void 0, progressed);
        };

        /**
         * Provides an opportunity to observe the settling of a promise,
         * regardless of whether the promise is fulfilled or rejected.  Forwards
         * the resolution to the returned promise when the callback is done.
         * The callback can return a promise to defer completion.
         * @param {Any*} promise
         * @param {Function} callback to observe the resolution of the given
         * promise, takes no arguments.
         * @returns a promise for the resolution of the given promise when
         * ``fin`` is done.
         */
        Q.fin = // XXX legacy
            Q["finally"] = function (object, callback) {
                return Q(object)["finally"](callback);
            };

        Promise.prototype.fin = // XXX legacy
            Promise.prototype["finally"] = function (callback) {
                callback = Q(callback);
                return this.then(function (value) {
                    return callback.fcall().then(function () {
                        return value;
                    });
                }, function (reason) {
                    // TODO attempt to recycle the rejection with "this".
                    return callback.fcall().then(function () {
                        throw reason;
                    });
                });
            };

        /**
         * Terminates a chain of promises, forcing rejections to be
         * thrown as exceptions.
         * @param {Any*} promise at the end of a chain of promises
         * @returns nothing
         */
        Q.done = function (object, fulfilled, rejected, progress) {
            return Q(object).done(fulfilled, rejected, progress);
        };

        Promise.prototype.done = function (fulfilled, rejected, progress) {
            var onUnhandledError = function (error) {
                // forward to a future turn so that ``when``
                // does not catch it and turn it into a rejection.
                nextTick(function () {
                    makeStackTraceLong(error, promise);
                    if (Q.onerror) {
                        Q.onerror(error);
                    } else {
                        throw error;
                    }
                });
            };

            // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
            var promise = fulfilled || rejected || progress ?
                this.then(fulfilled, rejected, progress) :
                this;

            if (typeof process === "object" && process && process.domain) {
                onUnhandledError = process.domain.bind(onUnhandledError);
            }

            promise.then(void 0, onUnhandledError);
        };

        /**
         * Causes a promise to be rejected if it does not get fulfilled before
         * some milliseconds time out.
         * @param {Any*} promise
         * @param {Number} milliseconds timeout
         * @param {String} custom error message (optional)
         * @returns a promise for the resolution of the given promise if it is
         * fulfilled before the timeout, otherwise rejected.
         */
        Q.timeout = function (object, ms, message) {
            return Q(object).timeout(ms, message);
        };

        Promise.prototype.timeout = function (ms, message) {
            var deferred = defer();
            var timeoutId = setTimeout(function () {
                deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
            }, ms);

            this.then(function (value) {
                clearTimeout(timeoutId);
                deferred.resolve(value);
            }, function (exception) {
                clearTimeout(timeoutId);
                deferred.reject(exception);
            }, deferred.notify);

            return deferred.promise;
        };

        /**
         * Returns a promise for the given value (or promised value), some
         * milliseconds after it resolved. Passes rejections immediately.
         * @param {Any*} promise
         * @param {Number} milliseconds
         * @returns a promise for the resolution of the given promise after milliseconds
         * time has elapsed since the resolution of the given promise.
         * If the given promise rejects, that is passed immediately.
         */
        Q.delay = function (object, timeout) {
            if (timeout === void 0) {
                timeout = object;
                object = void 0;
            }
            return Q(object).delay(timeout);
        };

        Promise.prototype.delay = function (timeout) {
            return this.then(function (value) {
                var deferred = defer();
                setTimeout(function () {
                    deferred.resolve(value);
                }, timeout);
                return deferred.promise;
            });
        };

        /**
         * Passes a continuation to a Node function, which is called with the given
         * arguments provided as an array, and returns a promise.
         *
         *      Q.nfapply(FS.readFile, [__filename])
         *      .then(function (content) {
 *      })
         *
         */
        Q.nfapply = function (callback, args) {
            return Q(callback).nfapply(args);
        };

        Promise.prototype.nfapply = function (args) {
            var deferred = defer();
            var nodeArgs = array_slice(args);
            nodeArgs.push(deferred.makeNodeResolver());
            this.fapply(nodeArgs).fail(deferred.reject);
            return deferred.promise;
        };

        /**
         * Passes a continuation to a Node function, which is called with the given
         * arguments provided individually, and returns a promise.
         * @example
         * Q.nfcall(FS.readFile, __filename)
         * .then(function (content) {
 * })
         *
         */
        Q.nfcall = function (callback /*...args*/) {
            var args = array_slice(arguments, 1);
            return Q(callback).nfapply(args);
        };

        Promise.prototype.nfcall = function (/*...args*/) {
            var nodeArgs = array_slice(arguments);
            var deferred = defer();
            nodeArgs.push(deferred.makeNodeResolver());
            this.fapply(nodeArgs).fail(deferred.reject);
            return deferred.promise;
        };

        /**
         * Wraps a NodeJS continuation passing function and returns an equivalent
         * version that returns a promise.
         * @example
         * Q.nfbind(FS.readFile, __filename)("utf-8")
         * .then(console.log)
         * .done()
         */
        Q.nfbind =
            Q.denodeify = function (callback /*...args*/) {
                var baseArgs = array_slice(arguments, 1);
                return function () {
                    var nodeArgs = baseArgs.concat(array_slice(arguments));
                    var deferred = defer();
                    nodeArgs.push(deferred.makeNodeResolver());
                    Q(callback).fapply(nodeArgs).fail(deferred.reject);
                    return deferred.promise;
                };
            };

        Promise.prototype.nfbind =
            Promise.prototype.denodeify = function (/*...args*/) {
                var args = array_slice(arguments);
                args.unshift(this);
                return Q.denodeify.apply(void 0, args);
            };

        Q.nbind = function (callback, thisp /*...args*/) {
            var baseArgs = array_slice(arguments, 2);
            return function () {
                var nodeArgs = baseArgs.concat(array_slice(arguments));
                var deferred = defer();
                nodeArgs.push(deferred.makeNodeResolver());
                function bound() {
                    return callback.apply(thisp, arguments);
                }

                Q(bound).fapply(nodeArgs).fail(deferred.reject);
                return deferred.promise;
            };
        };

        Promise.prototype.nbind = function (/*thisp, ...args*/) {
            var args = array_slice(arguments, 0);
            args.unshift(this);
            return Q.nbind.apply(void 0, args);
        };

        /**
         * Calls a method of a Node-style object that accepts a Node-style
         * callback with a given array of arguments, plus a provided callback.
         * @param object an object that has the named method
         * @param {String} name name of the method of object
         * @param {Array} args arguments to pass to the method; the callback
         * will be provided by Q and appended to these arguments.
         * @returns a promise for the value or error
         */
        Q.nmapply = // XXX As proposed by "Redsandro"
            Q.npost = function (object, name, args) {
                return Q(object).npost(name, args);
            };

        Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
            Promise.prototype.npost = function (name, args) {
                var nodeArgs = array_slice(args || []);
                var deferred = defer();
                nodeArgs.push(deferred.makeNodeResolver());
                this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
                return deferred.promise;
            };

        /**
         * Calls a method of a Node-style object that accepts a Node-style
         * callback, forwarding the given variadic arguments, plus a provided
         * callback argument.
         * @param object an object that has the named method
         * @param {String} name name of the method of object
         * @param ...args arguments to pass to the method; the callback will
         * be provided by Q and appended to these arguments.
         * @returns a promise for the value or error
         */
        Q.nsend = // XXX Based on Mark Miller's proposed "send"
            Q.nmcall = // XXX Based on "Redsandro's" proposal
                Q.ninvoke = function (object, name /*...args*/) {
                    var nodeArgs = array_slice(arguments, 2);
                    var deferred = defer();
                    nodeArgs.push(deferred.makeNodeResolver());
                    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
                    return deferred.promise;
                };

        Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
            Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
                Promise.prototype.ninvoke = function (name /*...args*/) {
                    var nodeArgs = array_slice(arguments, 1);
                    var deferred = defer();
                    nodeArgs.push(deferred.makeNodeResolver());
                    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
                    return deferred.promise;
                };

        /**
         * If a function would like to support both Node continuation-passing-style and
         * promise-returning-style, it can end its internal promise chain with
         * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
         * elects to use a nodeback, the result will be sent there.  If they do not
         * pass a nodeback, they will receive the result promise.
         * @param object a result (or a promise for a result)
         * @param {Function} nodeback a Node.js-style callback
         * @returns either the promise or nothing
         */
        Q.nodeify = nodeify;
        function nodeify(object, nodeback) {
            return Q(object).nodeify(nodeback);
        }

        Promise.prototype.nodeify = function (nodeback) {
            if (nodeback) {
                this.then(function (value) {
                    nextTick(function () {
                        nodeback(null, value);
                    });
                }, function (error) {
                    nextTick(function () {
                        nodeback(error);
                    });
                });
            } else {
                return this;
            }
        };

// All code before this point will be filtered from stack traces.
        var qEndingLine = captureLine();

        return Q;

    });

    define('lib/util/lazyLoader', ['q'], function (q) {

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
    ;
    !function (exports, undefined) {

        var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        };
        var defaultMaxListeners = 10;

        function init() {
            this._events = {};
            if (this._conf) {
                configure.call(this, this._conf);
            }
        }

        function configure(conf) {
            if (conf) {

                this._conf = conf;

                conf.delimiter && (this.delimiter = conf.delimiter);
                conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
                conf.wildcard && (this.wildcard = conf.wildcard);
                conf.newListener && (this.newListener = conf.newListener);

                if (this.wildcard) {
                    this.listenerTree = {};
                }
            }
        }

        function EventEmitter(conf) {
            this._events = {};
            this.newListener = false;
            configure.call(this, conf);
        }

        //
        // Attention, function return type now is array, always !
        // It has zero elements if no any matches found and one or more
        // elements (leafs) if there are matches
        //
        function searchListenerTree(handlers, type, tree, i) {
            if (!tree) {
                return [];
            }
            var listeners = [], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
                typeLength = type.length, currentType = type[i], nextType = type[i + 1];
            if (i === typeLength && tree._listeners) {
                //
                // If at the end of the event(s) list and the tree has listeners
                // invoke those listeners.
                //
                if (typeof tree._listeners === 'function') {
                    handlers && handlers.push(tree._listeners);
                    return [tree];
                } else {
                    for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
                        handlers && handlers.push(tree._listeners[leaf]);
                    }
                    return [tree];
                }
            }

            if ((currentType === '*' || currentType === '**') || tree[currentType]) {
                //
                // If the event emitted is '*' at this part
                // or there is a concrete match at this patch
                //
                if (currentType === '*') {
                    for (branch in tree) {
                        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
                            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i + 1));
                        }
                    }
                    return listeners;
                } else if (currentType === '**') {
                    endReached = (i + 1 === typeLength || (i + 2 === typeLength && nextType === '*'));
                    if (endReached && tree._listeners) {
                        // The next element has a _listeners, add it to the handlers.
                        listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
                    }

                    for (branch in tree) {
                        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
                            if (branch === '*' || branch === '**') {
                                if (tree[branch]._listeners && !endReached) {
                                    listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
                                }
                                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
                            } else if (branch === nextType) {
                                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i + 2));
                            } else {
                                // No match on this one, shift into the tree but not in the type array.
                                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
                            }
                        }
                    }
                    return listeners;
                }

                listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i + 1));
            }

            xTree = tree['*'];
            if (xTree) {
                //
                // If the listener tree will allow any match for this part,
                // then recursively explore all branches of the tree
                //
                searchListenerTree(handlers, type, xTree, i + 1);
            }

            xxTree = tree['**'];
            if (xxTree) {
                if (i < typeLength) {
                    if (xxTree._listeners) {
                        // If we have a listener on a '**', it will catch all, so add its handler.
                        searchListenerTree(handlers, type, xxTree, typeLength);
                    }

                    // Build arrays of matching next branches and others.
                    for (branch in xxTree) {
                        if (branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
                            if (branch === nextType) {
                                // We know the next element will match, so jump twice.
                                searchListenerTree(handlers, type, xxTree[branch], i + 2);
                            } else if (branch === currentType) {
                                // Current node matches, move into the tree.
                                searchListenerTree(handlers, type, xxTree[branch], i + 1);
                            } else {
                                isolatedBranch = {};
                                isolatedBranch[branch] = xxTree[branch];
                                searchListenerTree(handlers, type, { '**': isolatedBranch }, i + 1);
                            }
                        }
                    }
                } else if (xxTree._listeners) {
                    // We have reached the end and still on a '**'
                    searchListenerTree(handlers, type, xxTree, typeLength);
                } else if (xxTree['*'] && xxTree['*']._listeners) {
                    searchListenerTree(handlers, type, xxTree['*'], typeLength);
                }
            }

            return listeners;
        }

        function growListenerTree(type, listener) {

            type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

            //
            // Looks for two consecutive '**', if so, don't add the event at all.
            //
            for (var i = 0, len = type.length; i + 1 < len; i++) {
                if (type[i] === '**' && type[i + 1] === '**') {
                    return;
                }
            }

            var tree = this.listenerTree;
            var name = type.shift();

            while (name) {

                if (!tree[name]) {
                    tree[name] = {};
                }

                tree = tree[name];

                if (type.length === 0) {

                    if (!tree._listeners) {
                        tree._listeners = listener;
                    }
                    else if (typeof tree._listeners === 'function') {
                        tree._listeners = [tree._listeners, listener];
                    }
                    else if (isArray(tree._listeners)) {

                        tree._listeners.push(listener);

                        if (!tree._listeners.warned) {

                            var m = defaultMaxListeners;

                            if (typeof this._events.maxListeners !== 'undefined') {
                                m = this._events.maxListeners;
                            }

                            if (m > 0 && tree._listeners.length > m) {

                                tree._listeners.warned = true;
                                console.error('(node) warning: possible EventEmitter memory ' +
                                    'leak detected. %d listeners added. ' +
                                    'Use emitter.setMaxListeners() to increase limit.',
                                    tree._listeners.length);
                                console.trace();
                            }
                        }
                    }
                    return true;
                }
                name = type.shift();
            }
            return true;
        }

        // By default EventEmitters will print a warning if more than
        // 10 listeners are added to it. This is a useful default which
        // helps finding memory leaks.
        //
        // Obviously not all Emitters should be limited to 10. This function allows
        // that to be increased. Set to zero for unlimited.

        EventEmitter.prototype.delimiter = '.';

        EventEmitter.prototype.setMaxListeners = function (n) {
            this._events || init.call(this);
            this._events.maxListeners = n;
            if (!this._conf) this._conf = {};
            this._conf.maxListeners = n;
        };

        EventEmitter.prototype.event = '';

        EventEmitter.prototype.once = function (event, fn) {
            this.many(event, 1, fn);
            return this;
        };

        EventEmitter.prototype.many = function (event, ttl, fn) {
            var self = this;

            if (typeof fn !== 'function') {
                throw new Error('many only accepts instances of Function');
            }

            function listener() {
                if (--ttl === 0) {
                    self.off(event, listener);
                }
                fn.apply(this, arguments);
            }

            listener._origin = fn;

            this.on(event, listener);

            return self;
        };

        EventEmitter.prototype.emit = function () {

            this._events || init.call(this);

            var type = arguments[0];

            if (type === 'newListener' && !this.newListener) {
                if (!this._events.newListener) {
                    return false;
                }
            }

            // Loop through the *_all* functions and invoke them.
            if (this._all) {
                var l = arguments.length;
                var args = new Array(l - 1);
                for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                for (i = 0, l = this._all.length; i < l; i++) {
                    this.event = type;
                    this._all[i].apply(this, args);
                }
            }

            // If there is no 'error' event listener then throw.
            if (type === 'error') {

                if (!this._all && !this._events.error && !(this.wildcard && this.listenerTree.error)) {

                    if (arguments[1] instanceof Error) {
                        throw arguments[1]; // Unhandled 'error' event
                    } else {
                        throw new Error("Uncaught, unspecified 'error' event.");
                    }
                    return false;
                }
            }

            var handler;

            if (this.wildcard) {
                handler = [];
                var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
                searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
            }
            else {
                handler = this._events[type];
            }

            if (typeof handler === 'function') {
                this.event = type;
                if (arguments.length === 1) {
                    handler.call(this);
                }
                else if (arguments.length > 1)
                    switch (arguments.length) {
                        case 2:
                            handler.call(this, arguments[1]);
                            break;
                        case 3:
                            handler.call(this, arguments[1], arguments[2]);
                            break;
                        // slower
                        default:
                            var l = arguments.length;
                            var args = new Array(l - 1);
                            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                            handler.apply(this, args);
                    }
                return true;
            }
            else if (handler) {
                var l = arguments.length;
                var args = new Array(l - 1);
                for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

                var listeners = handler.slice();
                for (var i = 0, l = listeners.length; i < l; i++) {
                    this.event = type;
                    listeners[i].apply(this, args);
                }
                return (listeners.length > 0) || this._all;
            }
            else {
                return this._all;
            }

        };

        EventEmitter.prototype.on = function (type, listener) {

            if (typeof type === 'function') {
                this.onAny(type);
                return this;
            }

            if (typeof listener !== 'function') {
                throw new Error('on only accepts instances of Function');
            }
            this._events || init.call(this);

            // To avoid recursion in the case that type == "newListeners"! Before
            // adding it to the listeners, first emit "newListeners".
            this.emit('newListener', type, listener);

            if (this.wildcard) {
                growListenerTree.call(this, type, listener);
                return this;
            }

            if (!this._events[type]) {
                // Optimize the case of one listener. Don't need the extra array object.
                this._events[type] = listener;
            }
            else if (typeof this._events[type] === 'function') {
                // Adding the second element, need to change to array.
                this._events[type] = [this._events[type], listener];
            }
            else if (isArray(this._events[type])) {
                // If we've already got an array, just append.
                this._events[type].push(listener);

                // Check for listener leak
                if (!this._events[type].warned) {

                    var m = defaultMaxListeners;

                    if (typeof this._events.maxListeners !== 'undefined') {
                        m = this._events.maxListeners;
                    }

                    if (m > 0 && this._events[type].length > m) {

                        this._events[type].warned = true;
                        console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            this._events[type].length);
                        console.trace();
                    }
                }
            }
            return this;
        };

        EventEmitter.prototype.onAny = function (fn) {

            if (!this._all) {
                this._all = [];
            }

            if (typeof fn !== 'function') {
                throw new Error('onAny only accepts instances of Function');
            }

            // Add the function to the event listener collection.
            this._all.push(fn);
            return this;
        };

        EventEmitter.prototype.addListener = EventEmitter.prototype.on;

        EventEmitter.prototype.off = function (type, listener) {
            if (typeof listener !== 'function') {
                throw new Error('removeListener only takes instances of Function');
            }

            var handlers, leafs = [];

            if (this.wildcard) {
                var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
                leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
            }
            else {
                // does not use listeners(), so no side effect of creating _events[type]
                if (!this._events[type]) return this;
                handlers = this._events[type];
                leafs.push({_listeners: handlers});
            }

            for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
                var leaf = leafs[iLeaf];
                handlers = leaf._listeners;
                if (isArray(handlers)) {

                    var position = -1;

                    for (var i = 0, length = handlers.length; i < length; i++) {
                        if (handlers[i] === listener ||
                            (handlers[i].listener && handlers[i].listener === listener) ||
                            (handlers[i]._origin && handlers[i]._origin === listener)) {
                            position = i;
                            break;
                        }
                    }

                    if (position < 0) {
                        continue;
                    }

                    if (this.wildcard) {
                        leaf._listeners.splice(position, 1);
                    }
                    else {
                        this._events[type].splice(position, 1);
                    }

                    if (handlers.length === 0) {
                        if (this.wildcard) {
                            delete leaf._listeners;
                        }
                        else {
                            delete this._events[type];
                        }
                    }
                    return this;
                }
                else if (handlers === listener ||
                    (handlers.listener && handlers.listener === listener) ||
                    (handlers._origin && handlers._origin === listener)) {
                    if (this.wildcard) {
                        delete leaf._listeners;
                    }
                    else {
                        delete this._events[type];
                    }
                }
            }

            return this;
        };

        EventEmitter.prototype.offAny = function (fn) {
            var i = 0, l = 0, fns;
            if (fn && this._all && this._all.length > 0) {
                fns = this._all;
                for (i = 0, l = fns.length; i < l; i++) {
                    if (fn === fns[i]) {
                        fns.splice(i, 1);
                        return this;
                    }
                }
            } else {
                this._all = [];
            }
            return this;
        };

        EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

        EventEmitter.prototype.removeAllListeners = function (type) {
            if (arguments.length === 0) {
                !this._events || init.call(this);
                return this;
            }

            if (this.wildcard) {
                var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
                var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

                for (var iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
                    var leaf = leafs[iLeaf];
                    leaf._listeners = null;
                }
            }
            else {
                if (!this._events[type]) return this;
                this._events[type] = null;
            }
            return this;
        };

        EventEmitter.prototype.listeners = function (type) {
            if (this.wildcard) {
                var handlers = [];
                var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
                searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
                return handlers;
            }

            this._events || init.call(this);

            if (!this._events[type]) this._events[type] = [];
            if (!isArray(this._events[type])) {
                this._events[type] = [this._events[type]];
            }
            return this._events[type];
        };

        EventEmitter.prototype.listenersAny = function () {

            if (this._all) {
                return this._all;
            }
            else {
                return [];
            }

        };

        if (typeof define === 'function' && define.amd) {
            define('eventemitter2', [], function () {
                return EventEmitter;
            });
        } else {
            exports.EventEmitter2 = EventEmitter;
        }

    }(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);

    /**
     * The NetworkService interface is used to provide a set of connection information for an HTTP service endpoint and if
     * available, service events, running on a networked device.
     *
     * @module
     * @see {link http://www.w3.org/TR/discovery-api/#networkservice}
     */
    define('lib/networkService', ['eventemitter2'], function (EventEmitter2) {

        'use strict';

        /**
         * The NetworkService interface is used to provide a set of connection information for an HTTP service endpoint and
         * if available, service events, running on a networked device.
         *
         * @constructor
         */
        var NetworkService = function (options) {
            EventEmitter2.call(this);

            if (!options) {
                throw new TypeError('Missing options argument.');
            }

            if (!options.socket) {
                throw new TypeError('Missing options.socket argument.');
            }

            if (!options.service) {
                throw new TypeError('Missing options.service argument.');
            }

            this._options = options;
            this.config = this._options.service.config;
            this.id = this._options.service.id;
            this.name = this._options.service.name;
            this.type = this._options.service.type;
            this.url = this._options.service.url;

            this._options.socket.on('pinguela:serviceDisappeared', this._onServiceDisappeared.bind(this));
        };

        NetworkService.prototype = new EventEmitter2();
        NetworkService.prototype.constructor = NetworkService;

        /**
         * Handles 'pinguela:service-unavailable' messages.
         *
         * @private
         */
        NetworkService.prototype._onServiceDisappeared = function (serviceId) {
            if (this.id === serviceId) {
                this.online = false;
                this.emit('unavailable', this);
            }
        };

        /**
         * The options object used to create this NetworkService instance.
         *
         * @type {Object}
         * @private
         */
        NetworkService.prototype._options = null;

        NetworkService.prototype.addEventListener = NetworkService.prototype.addListener;

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
         * indicates whether the service is either online, and therefore accessible on the local network, in which case
         * this attribute will return true or, offline, and therefore not accessible on the local network, either
         * temporarily or permanently, in which case this attribute will return false.
         *
         * @type {Boolean}
         */
        NetworkService.prototype.online = true;

//    /**
//     * When a current service renews its service registration within the current network.
//     *
//     * @type {Function}
//     * @see {link http://www.w3.org/TR/discovery-api/#event-available}
//     */
//    NetworkService.prototype.onavailable = function () {
//    };
//
//    /**
//     * When a valid UPnP Events Subscription Message is received on a user-agent generated callback url for a current service. This event never fires for Zeroconf-based services.
//     *
//     * @type {Function}
//     * @see {link http://www.w3.org/TR/discovery-api/#event-notify}
//     */
//    NetworkService.prototype.onnotify = function () {
//
//    };
//
//    /**
//     * When a current service gracefully leaves or otherwise expires from the current network.
//     *
//     * @type {EventHandler}
//     * @see {link http://www.w3.org/TR/discovery-api/#event-unavailable}
//     */
//    NetworkService.prototype.onunavailable = function () {
//
//    };

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

    /**
     * The NetworkServices interface represents a collection of zero or more indexed properties that are each a
     * user-authorized NetworkService object.
     *
     * @module NetworkServices
     * @see {link http://www.w3.org/TR/discovery-api/#networkservices}
     */
    define('lib/networkServices', ['eventemitter2', './networkService'], function (EventEmitter2, NetworkService) {

        'use strict';

        /**
         * The NetworkServices interface represents a collection of zero or more indexed properties that are each a
         * user-authorized NetworkService object.
         *
         * @constructor
         */
        var NetworkServices = function (options) {
            EventEmitter2.call(this);

            if (!options) {
                throw new TypeError('Missing options argument.');
            }

            if (!options.socket) {
                throw new TypeError('Missing options.socket argument.');
            }

            if (!options.services) {
                throw new TypeError('Missing options.services argument.');
            }

            if (typeof options.services.forEach !== 'function') {
                throw new TypeError('Expected options.services argument to be an array  .');
            }

            this.length = options.services.length;
            this.servicesAvailable = this.length;
            this._socket = options.socket;

            options.services.forEach(function (service, index) {
                var networkService = new NetworkService({
                    service: service,
                    socket: this._socket
                });

                this[index] = networkService;
            }, this);

            this._socket.on('disconnect', this._onSocketDisconnect.bind(this));
            this._socket.on('error', this._onSocketError.bind(this));
        };

        // Inherit from EventEmitter2 and restore constructor

        NetworkServices.prototype = new EventEmitter2();
        NetworkServices.prototype.constructor = NetworkServices;

        // Private members

        NetworkServices.prototype._onSocketError = function () {
            // TODO
        };

        NetworkServices.prototype._onSocketDisconnect = function () {
            // TODO
        };

        NetworkServices.prototype._onServiceFound = function (networkservice) {
            this.emit(this.prototype.servicefound, networkservice);
        };

        NetworkServices.prototype._onServiceLost = function (networkservice) {
            this.emit(this.prototype.servicefound, networkservice);
        };

        /**
         * The internal socket.io instance;
         *
         * @type {Object}
         * @private
         */
        NetworkServices.prototype._socket = null;

        // Public members

        NetworkServices.prototype.addEventListener = NetworkServices.prototype.addListener;

        /**
         * Returns the NetworkService object with the given identifier, or null if no service has that identifier.
         *
         * @type {Function}
         * @see {link http://www.w3.org/TR/discovery-api/#dom-networkservices-getservicebyid}
         */
        NetworkServices.prototype.getServiceById = function (id) {
            throw new Error('Not implemented.');
        };

        /**
         * Returns the current number of indexed properties in the current object's collection.
         *
         * @type {Number}
         */
        NetworkServices.prototype.length = 0;

        /**
         * When a new service that matches one of the requested type tokens is found in the current network.
         *
         * @type {String}
         * @see {link http://www.w3.org/TR/discovery-api/#event-servicefound}
         */
        NetworkServices.prototype.servicefound = 'servicefound';

        /**
         * When an existing service that matches one of the requested type tokens gracefully leaves or expires from the
         * current network.
         *
         * @type {String}
         * @see {link http://www.w3.org/TR/discovery-api/#event-servicelost}
         */
        NetworkServices.prototype.servicelost = 'servicelost';

        /**
         * Returns the current number of items matching one of the app-requested valid service type tokens in the list of
         * available service records.
         *
         * @type {Number}
         */
        NetworkServices.prototype.servicesAvailable = 0;

        /**
         * @exports NetworkServices
         */
        return NetworkServices;

    });

    /**
     * Defines the NavigatorNetworkService interface to enable Web pages to connect and communicate with Local-networked
     * Services provided over HTTP. This enables access to services and content provided by home network devices, including
     * the discovery and playback of content available to those devices, both from services such as traditional broadcast
     * media and internet based services as well as local services.
     *
     * @module getNetworkServices
     * @see {link http://www.w3.org/TR/discovery-api/#navigatornetworkservice}
     */
    define('lib/navigatorNetworkService', [
        './util/lazyLoader',
        './networkService',
        './networkServices',
        'q',
        'require'
    ], function (lazyLoader, NetworkService, NetworkServices, q) {

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

                onLoadError = function (error) {
                    deferred.reject(error);
                },

                onLoadSuccess = function (io) {
                    run(io);
                },

                run = function (io) {
                    var socket = io.connect(window.location.protocol + window.location.host),

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
                };


            if (window.io) {
                run(window.io);
            } else {
                lazyLoader('/socket.io/socket.io.js').then(onLoadSuccess, onLoadError);
            }

            return deferred.promise;
        };

        /**
         * @exports getNetworkServices
         */
        return NavigatorNetworkService;

    });

    define('lib/navigator.js', ['./navigatorNetworkService'], function (NavigatorNetworkService) {

        'use strict';

        if (navigator && typeof navigator.getNetworkServices !== 'function') {
            navigator.getNetworkServices = NavigatorNetworkService.getNetworkServices;
        }

        return navigator;

    });

    require("./lib/navigator.js");
}());