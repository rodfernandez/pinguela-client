/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */

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

!function () {
    var t, e, n;
    !function (r) {
        function i(t, e) {
            return _.call(t, e)
        }

        function o(t, e) {
            var n, r, i, o, s, u, c, f, a, p, l, h = e && e.split("/"), d = g.map, v = d && d["*"] || {};
            if (t && "." === t.charAt(0))if (e) {
                for (h = h.slice(0, h.length - 1), t = t.split("/"), s = t.length - 1, g.nodeIdCompat && j.test(t[s]) && (t[s] = t[s].replace(j, "")), t = h.concat(t), a = 0; a < t.length; a += 1)if (l = t[a], "." === l)t.splice(a, 1), a -= 1; else if (".." === l) {
                    if (1 === a && (".." === t[2] || ".." === t[0]))break;
                    a > 0 && (t.splice(a - 1, 2), a -= 2)
                }
                t = t.join("/")
            } else 0 === t.indexOf("./") && (t = t.substring(2));
            if ((h || v) && d) {
                for (n = t.split("/"), a = n.length; a > 0; a -= 1) {
                    if (r = n.slice(0, a).join("/"), h)for (p = h.length; p > 0; p -= 1)if (i = d[h.slice(0, p).join("/")], i && (i = i[r])) {
                        o = i, u = a;
                        break
                    }
                    if (o)break;
                    !c && v && v[r] && (c = v[r], f = a)
                }
                !o && c && (o = c, u = f), o && (n.splice(0, u, o), t = n.join("/"))
            }
            return t
        }

        function s(t, e) {
            return function () {
                return h.apply(r, k.call(arguments, 0).concat([t, e]))
            }
        }

        function u(t) {
            return function (e) {
                return o(e, t)
            }
        }

        function c(t) {
            return function (e) {
                y[t] = e
            }
        }

        function f(t) {
            if (i(m, t)) {
                var e = m[t];
                delete m[t], w[t] = !0, l.apply(r, e)
            }
            if (!i(y, t) && !i(w, t))throw new Error("No " + t);
            return y[t]
        }

        function a(t) {
            var e, n = t ? t.indexOf("!") : -1;
            return n > -1 && (e = t.substring(0, n), t = t.substring(n + 1, t.length)), [e, t]
        }

        function p(t) {
            return function () {
                return g && g.config && g.config[t] || {}
            }
        }

        var l, h, d, v, y = {}, m = {}, g = {}, w = {}, _ = Object.prototype.hasOwnProperty, k = [].slice, j = /\.js$/;
        d = function (t, e) {
            var n, r = a(t), i = r[0];
            return t = r[1], i && (i = o(i, e), n = f(i)), i ? t = n && n.normalize ? n.normalize(t, u(e)) : o(t, e) : (t = o(t, e), r = a(t), i = r[0], t = r[1], i && (n = f(i))), {f: i ? i + "!" + t : t, n: t, pr: i, p: n}
        }, v = {require: function (t) {
            return s(t)
        }, exports: function (t) {
            var e = y[t];
            return"undefined" != typeof e ? e : y[t] = {}
        }, module: function (t) {
            return{id: t, uri: "", exports: y[t], config: p(t)}
        }}, l = function (t, e, n, o) {
            var u, a, p, l, h, g, _ = [], k = typeof n;
            if (o = o || t, "undefined" === k || "function" === k) {
                for (e = !e.length && n.length ? ["require", "exports", "module"] : e, h = 0; h < e.length; h += 1)if (l = d(e[h], o), a = l.f, "require" === a)_[h] = v.require(t); else if ("exports" === a)_[h] = v.exports(t), g = !0; else if ("module" === a)u = _[h] = v.module(t); else if (i(y, a) || i(m, a) || i(w, a))_[h] = f(a); else {
                    if (!l.p)throw new Error(t + " missing " + a);
                    l.p.load(l.n, s(o, !0), c(a), {}), _[h] = y[a]
                }
                p = n ? n.apply(y[t], _) : void 0, t && (u && u.exports !== r && u.exports !== y[t] ? y[t] = u.exports : p === r && g || (y[t] = p))
            } else t && (y[t] = n)
        }, t = e = h = function (t, e, n, i, o) {
            if ("string" == typeof t)return v[t] ? v[t](e) : f(d(t, e).f);
            if (!t.splice) {
                if (g = t, g.deps && h(g.deps, g.callback), !e)return;
                e.splice ? (t = e, e = n, n = null) : t = r
            }
            return e = e || function () {
            }, "function" == typeof n && (n = i, i = o), i ? l(r, t, e, n) : setTimeout(function () {
                l(r, t, e, n)
            }, 4), h
        }, h.config = function (t) {
            return h(t)
        }, t._defined = y, n = function (t, e, n) {
            e.splice || (n = e, e = []), i(y, t) || i(m, t) || (m[t] = [t, e, n])
        }, n.amd = {jQuery: !0}
    }(), n("node_modules/almond/almond.js", function () {
    }), function (t) {
        if ("function" == typeof bootstrap)bootstrap("promise", t); else if ("object" == typeof exports)module.exports = t(); else if ("function" == typeof n && n.amd)n("q", t); else if ("undefined" != typeof ses) {
            if (!ses.ok())return;
            ses.makeQ = t
        } else Q = t()
    }(function () {
        "use strict";
        function t(t) {
            return function () {
                return X.apply(t, arguments)
            }
        }

        function e(t) {
            return t === Object(t)
        }

        function n(t) {
            return"[object StopIteration]" === ee(t) || t instanceof B
        }

        function r(t, e) {
            if (U && e.stack && "object" == typeof t && null !== t && t.stack && -1 === t.stack.indexOf(ne)) {
                for (var n = [], r = e; r; r = r.source)r.stack && n.unshift(r.stack);
                n.unshift(t.stack);
                var o = n.join("\n" + ne + "\n");
                t.stack = i(o)
            }
        }

        function i(t) {
            for (var e = t.split("\n"), n = [], r = 0; r < e.length; ++r) {
                var i = e[r];
                u(i) || o(i) || !i || n.push(i)
            }
            return n.join("\n")
        }

        function o(t) {
            return-1 !== t.indexOf("(module.js:") || -1 !== t.indexOf("(node.js:")
        }

        function s(t) {
            var e = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(t);
            if (e)return[e[1], Number(e[2])];
            var n = /at ([^ ]+):(\d+):(?:\d+)$/.exec(t);
            if (n)return[n[1], Number(n[2])];
            var r = /.*@(.+):(\d+)$/.exec(t);
            return r ? [r[1], Number(r[2])] : void 0
        }

        function u(t) {
            var e = s(t);
            if (!e)return!1;
            var n = e[0], r = e[1];
            return n === $ && r >= Q && se >= r
        }

        function c() {
            if (U)try {
                throw new Error
            } catch (t) {
                var e = t.stack.split("\n"), n = e[0].indexOf("@") > 0 ? e[1] : e[2], r = s(n);
                if (!r)return;
                return $ = r[0], r[1]
            }
        }

        function f(t, e, n) {
            return function () {
                return"undefined" != typeof console && "function" == typeof console.warn && console.warn(e + " is deprecated, use " + n + " instead.", new Error("").stack), t.apply(t, arguments)
            }
        }

        function a(t) {
            return m(t) ? t : g(t) ? T(t) : S(t)
        }

        function p() {
            function t(t) {
                e = t, o.source = t, J(n, function (e, n) {
                    H(function () {
                        t.promiseDispatch.apply(t, n)
                    })
                }, void 0), n = void 0, r = void 0
            }

            var e, n = [], r = [], i = Y(p.prototype), o = Y(d.prototype);
            if (o.promiseDispatch = function (t, i, o) {
                var s = G(arguments);
                n ? (n.push(s), "when" === i && o[1] && r.push(o[1])) : H(function () {
                    e.promiseDispatch.apply(e, s)
                })
            }, o.valueOf = function () {
                if (n)return o;
                var t = y(e);
                return m(t) && (e = t), t
            }, o.inspect = function () {
                return e ? e.inspect() : {state: "pending"}
            }, a.longStackSupport && U)try {
                throw new Error
            } catch (s) {
                o.stack = s.stack.substring(s.stack.indexOf("\n") + 1)
            }
            return i.promise = o, i.resolve = function (n) {
                e || t(a(n))
            }, i.fulfill = function (n) {
                e || t(S(n))
            }, i.reject = function (n) {
                e || t(E(n))
            }, i.notify = function (t) {
                e || J(r, function (e, n) {
                    H(function () {
                        n(t)
                    })
                }, void 0)
            }, i
        }

        function l(t) {
            if ("function" != typeof t)throw new TypeError("resolver must be a function.");
            var e = p();
            try {
                t(e.resolve, e.reject, e.notify)
            } catch (n) {
                e.reject(n)
            }
            return e.promise
        }

        function h(t) {
            return l(function (e, n) {
                for (var r = 0, i = t.length; i > r; r++)a(t[r]).then(e, n)
            })
        }

        function d(t, e, n) {
            void 0 === e && (e = function (t) {
                return E(new Error("Promise does not support operation: " + t))
            }), void 0 === n && (n = function () {
                return{state: "unknown"}
            });
            var r = Y(d.prototype);
            if (r.promiseDispatch = function (n, i, o) {
                var s;
                try {
                    s = t[i] ? t[i].apply(r, o) : e.call(r, i, o)
                } catch (u) {
                    s = E(u)
                }
                n && n(s)
            }, r.inspect = n, n) {
                var i = n();
                "rejected" === i.state && (r.exception = i.reason), r.valueOf = function () {
                    var t = n();
                    return"pending" === t.state || "rejected" === t.state ? r : t.value
                }
            }
            return r
        }

        function v(t, e, n, r) {
            return a(t).then(e, n, r)
        }

        function y(t) {
            if (m(t)) {
                var e = t.inspect();
                if ("fulfilled" === e.state)return e.value
            }
            return t
        }

        function m(t) {
            return e(t) && "function" == typeof t.promiseDispatch && "function" == typeof t.inspect
        }

        function g(t) {
            return e(t) && "function" == typeof t.then
        }

        function w(t) {
            return m(t) && "pending" === t.inspect().state
        }

        function _(t) {
            return!m(t) || "fulfilled" === t.inspect().state
        }

        function k(t) {
            return m(t) && "rejected" === t.inspect().state
        }

        function j() {
            re.length = 0, ie.length = 0, oe || (oe = !0)
        }

        function b(t, e) {
            oe && (ie.push(t), re.push(e && "undefined" != typeof e.stack ? e.stack : "(no stack) " + e))
        }

        function x(t) {
            if (oe) {
                var e = K(ie, t);
                -1 !== e && (ie.splice(e, 1), re.splice(e, 1))
            }
        }

        function E(t) {
            var e = d({when: function (e) {
                return e && x(this), e ? e(t) : this
            }}, function () {
                return this
            }, function () {
                return{state: "rejected", reason: t}
            });
            return b(e, t), e
        }

        function S(t) {
            return d({when: function () {
                return t
            }, get: function (e) {
                return t[e]
            }, set: function (e, n) {
                t[e] = n
            }, "delete": function (e) {
                delete t[e]
            }, post: function (e, n) {
                return null === e || void 0 === e ? t.apply(void 0, n) : t[e].apply(t, n)
            }, apply: function (e, n) {
                return t.apply(e, n)
            }, keys: function () {
                return te(t)
            }}, void 0, function () {
                return{state: "fulfilled", value: t}
            })
        }

        function T(t) {
            var e = p();
            return H(function () {
                try {
                    t.then(e.resolve, e.reject, e.notify)
                } catch (n) {
                    e.reject(n)
                }
            }), e.promise
        }

        function L(t) {
            return d({isDef: function () {
            }}, function (e, n) {
                return M(t, e, n)
            }, function () {
                return a(t).inspect()
            })
        }

        function R(t, e, n) {
            return a(t).spread(e, n)
        }

        function A(t) {
            return function () {
                function e(t, e) {
                    var s;
                    if ("undefined" == typeof StopIteration) {
                        try {
                            s = r[t](e)
                        } catch (u) {
                            return E(u)
                        }
                        return s.done ? s.value : v(s.value, i, o)
                    }
                    try {
                        s = r[t](e)
                    } catch (u) {
                        return n(u) ? u.value : E(u)
                    }
                    return v(s, i, o)
                }

                var r = t.apply(this, arguments), i = e.bind(e, "next"), o = e.bind(e, "throw");
                return i()
            }
        }

        function O(t) {
            a.done(a.async(t)())
        }

        function N(t) {
            throw new B(t)
        }

        function D(t) {
            return function () {
                return R([this, P(arguments)], function (e, n) {
                    return t.apply(e, n)
                })
            }
        }

        function M(t, e, n) {
            return a(t).dispatch(e, n)
        }

        function P(t) {
            return v(t, function (t) {
                var e = 0, n = p();
                return J(t, function (r, i, o) {
                    var s;
                    m(i) && "fulfilled" === (s = i.inspect()).state ? t[o] = s.value : (++e, v(i, function (r) {
                        t[o] = r, 0 === --e && n.resolve(t)
                    }, n.reject, function (t) {
                        n.notify({index: o, value: t})
                    }))
                }, void 0), 0 === e && n.resolve(t), n.promise
            })
        }

        function q(t) {
            return v(t, function (t) {
                return t = W(t, a), v(P(W(t, function (t) {
                    return v(t, V, V)
                })), function () {
                    return t
                })
            })
        }

        function F(t) {
            return a(t).allSettled()
        }

        function I(t, e) {
            return a(t).then(void 0, void 0, e)
        }

        function C(t, e) {
            return a(t).nodeify(e)
        }

        var U = !1;
        try {
            throw new Error
        } catch (z) {
            U = !!z.stack
        }
        var $, B, Q = c(), V = function () {
        }, H = function () {
            function t() {
                for (; e.next;) {
                    e = e.next;
                    var n = e.task;
                    e.task = void 0;
                    var i = e.domain;
                    i && (e.domain = void 0, i.enter());
                    try {
                        n()
                    } catch (s) {
                        if (o)throw i && i.exit(), setTimeout(t, 0), i && i.enter(), s;
                        setTimeout(function () {
                            throw s
                        }, 0)
                    }
                    i && i.exit()
                }
                r = !1
            }

            var e = {task: void 0, next: null}, n = e, r = !1, i = void 0, o = !1;
            if (H = function (t) {
                n = n.next = {task: t, domain: o && process.domain, next: null}, r || (r = !0, i())
            }, "undefined" != typeof process && process.nextTick)o = !0, i = function () {
                process.nextTick(t)
            }; else if ("function" == typeof setImmediate)i = "undefined" != typeof window ? setImmediate.bind(window, t) : function () {
                setImmediate(t)
            }; else if ("undefined" != typeof MessageChannel) {
                var s = new MessageChannel;
                s.port1.onmessage = function () {
                    i = u, s.port1.onmessage = t, t()
                };
                var u = function () {
                    s.port2.postMessage(0)
                };
                i = function () {
                    setTimeout(t, 0), u()
                }
            } else i = function () {
                setTimeout(t, 0)
            };
            return H
        }(), X = Function.call, G = t(Array.prototype.slice), J = t(Array.prototype.reduce || function (t, e) {
            var n = 0, r = this.length;
            if (1 === arguments.length)for (; ;) {
                if (n in this) {
                    e = this[n++];
                    break
                }
                if (++n >= r)throw new TypeError
            }
            for (; r > n; n++)n in this && (e = t(e, this[n], n));
            return e
        }), K = t(Array.prototype.indexOf || function (t) {
            for (var e = 0; e < this.length; e++)if (this[e] === t)return e;
            return-1
        }), W = t(Array.prototype.map || function (t, e) {
            var n = this, r = [];
            return J(n, function (i, o, s) {
                r.push(t.call(e, o, s, n))
            }, void 0), r
        }), Y = Object.create || function (t) {
            function e() {
            }

            return e.prototype = t, new e
        }, Z = t(Object.prototype.hasOwnProperty), te = Object.keys || function (t) {
            var e = [];
            for (var n in t)Z(t, n) && e.push(n);
            return e
        }, ee = t(Object.prototype.toString);
        B = "undefined" != typeof ReturnValue ? ReturnValue : function (t) {
            this.value = t
        };
        var ne = "From previous event:";
        a.resolve = a, a.nextTick = H, a.longStackSupport = !1, a.defer = p, p.prototype.makeNodeResolver = function () {
            var t = this;
            return function (e, n) {
                e ? t.reject(e) : t.resolve(arguments.length > 2 ? G(arguments, 1) : n)
            }
        }, a.Promise = l, a.promise = l, l.race = h, l.all = P, l.reject = E, l.resolve = a, a.passByCopy = function (t) {
            return t
        }, d.prototype.passByCopy = function () {
            return this
        }, a.join = function (t, e) {
            return a(t).join(e)
        }, d.prototype.join = function (t) {
            return a([this, t]).spread(function (t, e) {
                if (t === e)return t;
                throw new Error("Can't join: not the same: " + t + " " + e)
            })
        }, a.race = h, d.prototype.race = function () {
            return this.then(a.race)
        }, a.makePromise = d, d.prototype.toString = function () {
            return"[object Promise]"
        }, d.prototype.then = function (t, e, n) {
            function i(e) {
                try {
                    return"function" == typeof t ? t(e) : e
                } catch (n) {
                    return E(n)
                }
            }

            function o(t) {
                if ("function" == typeof e) {
                    r(t, u);
                    try {
                        return e(t)
                    } catch (n) {
                        return E(n)
                    }
                }
                return E(t)
            }

            function s(t) {
                return"function" == typeof n ? n(t) : t
            }

            var u = this, c = p(), f = !1;
            return H(function () {
                u.promiseDispatch(function (t) {
                    f || (f = !0, c.resolve(i(t)))
                }, "when", [function (t) {
                    f || (f = !0, c.resolve(o(t)))
                }])
            }), u.promiseDispatch(void 0, "when", [void 0, function (t) {
                var e, n = !1;
                try {
                    e = s(t)
                } catch (r) {
                    if (n = !0, !a.onerror)throw r;
                    a.onerror(r)
                }
                n || c.notify(e)
            }]), c.promise
        }, a.when = v, d.prototype.thenResolve = function (t) {
            return this.then(function () {
                return t
            })
        }, a.thenResolve = function (t, e) {
            return a(t).thenResolve(e)
        }, d.prototype.thenReject = function (t) {
            return this.then(function () {
                throw t
            })
        }, a.thenReject = function (t, e) {
            return a(t).thenReject(e)
        }, a.nearer = y, a.isPromise = m, a.isPromiseAlike = g, a.isPending = w, d.prototype.isPending = function () {
            return"pending" === this.inspect().state
        }, a.isFulfilled = _, d.prototype.isFulfilled = function () {
            return"fulfilled" === this.inspect().state
        }, a.isRejected = k, d.prototype.isRejected = function () {
            return"rejected" === this.inspect().state
        };
        var re = [], ie = [], oe = !0;
        a.resetUnhandledRejections = j, a.getUnhandledReasons = function () {
            return re.slice()
        }, a.stopUnhandledRejectionTracking = function () {
            j(), oe = !1
        }, j(), a.reject = E, a.fulfill = S, a.master = L, a.spread = R, d.prototype.spread = function (t, e) {
            return this.all().then(function (e) {
                return t.apply(void 0, e)
            }, e)
        }, a.async = A, a.spawn = O, a["return"] = N, a.promised = D, a.dispatch = M, d.prototype.dispatch = function (t, e) {
            var n = this, r = p();
            return H(function () {
                n.promiseDispatch(r.resolve, t, e)
            }), r.promise
        }, a.get = function (t, e) {
            return a(t).dispatch("get", [e])
        }, d.prototype.get = function (t) {
            return this.dispatch("get", [t])
        }, a.set = function (t, e, n) {
            return a(t).dispatch("set", [e, n])
        }, d.prototype.set = function (t, e) {
            return this.dispatch("set", [t, e])
        }, a.del = a["delete"] = function (t, e) {
            return a(t).dispatch("delete", [e])
        }, d.prototype.del = d.prototype["delete"] = function (t) {
            return this.dispatch("delete", [t])
        }, a.mapply = a.post = function (t, e, n) {
            return a(t).dispatch("post", [e, n])
        }, d.prototype.mapply = d.prototype.post = function (t, e) {
            return this.dispatch("post", [t, e])
        }, a.send = a.mcall = a.invoke = function (t, e) {
            return a(t).dispatch("post", [e, G(arguments, 2)])
        }, d.prototype.send = d.prototype.mcall = d.prototype.invoke = function (t) {
            return this.dispatch("post", [t, G(arguments, 1)])
        }, a.fapply = function (t, e) {
            return a(t).dispatch("apply", [void 0, e])
        }, d.prototype.fapply = function (t) {
            return this.dispatch("apply", [void 0, t])
        }, a["try"] = a.fcall = function (t) {
            return a(t).dispatch("apply", [void 0, G(arguments, 1)])
        }, d.prototype.fcall = function () {
            return this.dispatch("apply", [void 0, G(arguments)])
        }, a.fbind = function (t) {
            var e = a(t), n = G(arguments, 1);
            return function () {
                return e.dispatch("apply", [this, n.concat(G(arguments))])
            }
        }, d.prototype.fbind = function () {
            var t = this, e = G(arguments);
            return function () {
                return t.dispatch("apply", [this, e.concat(G(arguments))])
            }
        }, a.keys = function (t) {
            return a(t).dispatch("keys", [])
        }, d.prototype.keys = function () {
            return this.dispatch("keys", [])
        }, a.all = P, d.prototype.all = function () {
            return P(this)
        }, a.allResolved = f(q, "allResolved", "allSettled"), d.prototype.allResolved = function () {
            return q(this)
        }, a.allSettled = F, d.prototype.allSettled = function () {
            return this.then(function (t) {
                return P(W(t, function (t) {
                    function e() {
                        return t.inspect()
                    }

                    return t = a(t), t.then(e, e)
                }))
            })
        }, a.fail = a["catch"] = function (t, e) {
            return a(t).then(void 0, e)
        }, d.prototype.fail = d.prototype["catch"] = function (t) {
            return this.then(void 0, t)
        }, a.progress = I, d.prototype.progress = function (t) {
            return this.then(void 0, void 0, t)
        }, a.fin = a["finally"] = function (t, e) {
            return a(t)["finally"](e)
        }, d.prototype.fin = d.prototype["finally"] = function (t) {
            return t = a(t), this.then(function (e) {
                return t.fcall().then(function () {
                    return e
                })
            }, function (e) {
                return t.fcall().then(function () {
                    throw e
                })
            })
        }, a.done = function (t, e, n, r) {
            return a(t).done(e, n, r)
        }, d.prototype.done = function (t, e, n) {
            var i = function (t) {
                H(function () {
                    if (r(t, o), !a.onerror)throw t;
                    a.onerror(t)
                })
            }, o = t || e || n ? this.then(t, e, n) : this;
            "object" == typeof process && process && process.domain && (i = process.domain.bind(i)), o.then(void 0, i)
        }, a.timeout = function (t, e, n) {
            return a(t).timeout(e, n)
        }, d.prototype.timeout = function (t, e) {
            var n = p(), r = setTimeout(function () {
                n.reject(new Error(e || "Timed out after " + t + " ms"))
            }, t);
            return this.then(function (t) {
                clearTimeout(r), n.resolve(t)
            }, function (t) {
                clearTimeout(r), n.reject(t)
            }, n.notify), n.promise
        }, a.delay = function (t, e) {
            return void 0 === e && (e = t, t = void 0), a(t).delay(e)
        }, d.prototype.delay = function (t) {
            return this.then(function (e) {
                var n = p();
                return setTimeout(function () {
                    n.resolve(e)
                }, t), n.promise
            })
        }, a.nfapply = function (t, e) {
            return a(t).nfapply(e)
        }, d.prototype.nfapply = function (t) {
            var e = p(), n = G(t);
            return n.push(e.makeNodeResolver()), this.fapply(n).fail(e.reject), e.promise
        }, a.nfcall = function (t) {
            var e = G(arguments, 1);
            return a(t).nfapply(e)
        }, d.prototype.nfcall = function () {
            var t = G(arguments), e = p();
            return t.push(e.makeNodeResolver()), this.fapply(t).fail(e.reject), e.promise
        }, a.nfbind = a.denodeify = function (t) {
            var e = G(arguments, 1);
            return function () {
                var n = e.concat(G(arguments)), r = p();
                return n.push(r.makeNodeResolver()), a(t).fapply(n).fail(r.reject), r.promise
            }
        }, d.prototype.nfbind = d.prototype.denodeify = function () {
            var t = G(arguments);
            return t.unshift(this), a.denodeify.apply(void 0, t)
        }, a.nbind = function (t, e) {
            var n = G(arguments, 2);
            return function () {
                function r() {
                    return t.apply(e, arguments)
                }

                var i = n.concat(G(arguments)), o = p();
                return i.push(o.makeNodeResolver()), a(r).fapply(i).fail(o.reject), o.promise
            }
        }, d.prototype.nbind = function () {
            var t = G(arguments, 0);
            return t.unshift(this), a.nbind.apply(void 0, t)
        }, a.nmapply = a.npost = function (t, e, n) {
            return a(t).npost(e, n)
        }, d.prototype.nmapply = d.prototype.npost = function (t, e) {
            var n = G(e || []), r = p();
            return n.push(r.makeNodeResolver()), this.dispatch("post", [t, n]).fail(r.reject), r.promise
        }, a.nsend = a.nmcall = a.ninvoke = function (t, e) {
            var n = G(arguments, 2), r = p();
            return n.push(r.makeNodeResolver()), a(t).dispatch("post", [e, n]).fail(r.reject), r.promise
        }, d.prototype.nsend = d.prototype.nmcall = d.prototype.ninvoke = function (t) {
            var e = G(arguments, 1), n = p();
            return e.push(n.makeNodeResolver()), this.dispatch("post", [t, e]).fail(n.reject), n.promise
        }, a.nodeify = C, d.prototype.nodeify = function (t) {
            return t ? void this.then(function (e) {
                H(function () {
                    t(null, e)
                })
            }, function (e) {
                H(function () {
                    t(e)
                })
            }) : this
        };
        var se = c();
        return a
    }), n("lib/util/lazyLoader", ["q"], function (t) {
        return function (e) {
            var n = t.defer(), r = new XMLHttpRequest, i = function (t) {
                var e = t.currentTarget;
                if (4 === e.readyState) {
                    if (200 !== e.status)return n.reject(new Error(e.statusText));
                    try {
                        window.eval(e.responseText)
                    } catch (r) {
                        n.reject(r)
                    }
                    n.resolve(window.io)
                }
            };
            return r.onreadystatechange = i, r.open("get", e, !0), r.send(), n.promise
        }
    }), !function (t) {
        function e() {
            this._events = {}, this._conf && r.call(this, this._conf)
        }

        function r(t) {
            t && (this._conf = t, t.delimiter && (this.delimiter = t.delimiter), t.maxListeners && (this._events.maxListeners = t.maxListeners), t.wildcard && (this.wildcard = t.wildcard), t.newListener && (this.newListener = t.newListener), this.wildcard && (this.listenerTree = {}))
        }

        function i(t) {
            this._events = {}, this.newListener = !1, r.call(this, t)
        }

        function o(t, e, n, r) {
            if (!n)return[];
            var i, s, u, c, f, a, p, l = [], h = e.length, d = e[r], v = e[r + 1];
            if (r === h && n._listeners) {
                if ("function" == typeof n._listeners)return t && t.push(n._listeners), [n];
                for (i = 0, s = n._listeners.length; s > i; i++)t && t.push(n._listeners[i]);
                return[n]
            }
            if ("*" === d || "**" === d || n[d]) {
                if ("*" === d) {
                    for (u in n)"_listeners" !== u && n.hasOwnProperty(u) && (l = l.concat(o(t, e, n[u], r + 1)));
                    return l
                }
                if ("**" === d) {
                    p = r + 1 === h || r + 2 === h && "*" === v, p && n._listeners && (l = l.concat(o(t, e, n, h)));
                    for (u in n)"_listeners" !== u && n.hasOwnProperty(u) && ("*" === u || "**" === u ? (n[u]._listeners && !p && (l = l.concat(o(t, e, n[u], h))), l = l.concat(o(t, e, n[u], r))) : l = l.concat(u === v ? o(t, e, n[u], r + 2) : o(t, e, n[u], r)));
                    return l
                }
                l = l.concat(o(t, e, n[d], r + 1))
            }
            if (c = n["*"], c && o(t, e, c, r + 1), f = n["**"])if (h > r) {
                f._listeners && o(t, e, f, h);
                for (u in f)"_listeners" !== u && f.hasOwnProperty(u) && (u === v ? o(t, e, f[u], r + 2) : u === d ? o(t, e, f[u], r + 1) : (a = {}, a[u] = f[u], o(t, e, {"**": a}, r + 1)))
            } else f._listeners ? o(t, e, f, h) : f["*"] && f["*"]._listeners && o(t, e, f["*"], h);
            return l
        }

        function s(t, e) {
            t = "string" == typeof t ? t.split(this.delimiter) : t.slice();
            for (var n = 0, r = t.length; r > n + 1; n++)if ("**" === t[n] && "**" === t[n + 1])return;
            for (var i = this.listenerTree, o = t.shift(); o;) {
                if (i[o] || (i[o] = {}), i = i[o], 0 === t.length) {
                    if (i._listeners) {
                        if ("function" == typeof i._listeners)i._listeners = [i._listeners, e]; else if (u(i._listeners) && (i._listeners.push(e), !i._listeners.warned)) {
                            var s = c;
                            "undefined" != typeof this._events.maxListeners && (s = this._events.maxListeners), s > 0 && i._listeners.length > s && (i._listeners.warned = !0, console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", i._listeners.length), console.trace())
                        }
                    } else i._listeners = e;
                    return!0
                }
                o = t.shift()
            }
            return!0
        }

        var u = Array.isArray ? Array.isArray : function (t) {
            return"[object Array]" === Object.prototype.toString.call(t)
        }, c = 10;
        i.prototype.delimiter = ".", i.prototype.setMaxListeners = function (t) {
            this._events || e.call(this), this._events.maxListeners = t, this._conf || (this._conf = {}), this._conf.maxListeners = t
        }, i.prototype.event = "", i.prototype.once = function (t, e) {
            return this.many(t, 1, e), this
        }, i.prototype.many = function (t, e, n) {
            function r() {
                0 === --e && i.off(t, r), n.apply(this, arguments)
            }

            var i = this;
            if ("function" != typeof n)throw new Error("many only accepts instances of Function");
            return r._origin = n, this.on(t, r), i
        }, i.prototype.emit = function () {
            this._events || e.call(this);
            var t = arguments[0];
            if ("newListener" === t && !this.newListener && !this._events.newListener)return!1;
            if (this._all) {
                for (var n = arguments.length, r = new Array(n - 1), i = 1; n > i; i++)r[i - 1] = arguments[i];
                for (i = 0, n = this._all.length; n > i; i++)this.event = t, this._all[i].apply(this, r)
            }
            if ("error" === t && !(this._all || this._events.error || this.wildcard && this.listenerTree.error))throw arguments[1]instanceof Error ? arguments[1] : new Error("Uncaught, unspecified 'error' event.");
            var s;
            if (this.wildcard) {
                s = [];
                var u = "string" == typeof t ? t.split(this.delimiter) : t.slice();
                o.call(this, s, u, this.listenerTree, 0)
            } else s = this._events[t];
            if ("function" == typeof s) {
                if (this.event = t, 1 === arguments.length)s.call(this); else if (arguments.length > 1)switch (arguments.length) {
                    case 2:
                        s.call(this, arguments[1]);
                        break;
                    case 3:
                        s.call(this, arguments[1], arguments[2]);
                        break;
                    default:
                        for (var n = arguments.length, r = new Array(n - 1), i = 1; n > i; i++)r[i - 1] = arguments[i];
                        s.apply(this, r)
                }
                return!0
            }
            if (s) {
                for (var n = arguments.length, r = new Array(n - 1), i = 1; n > i; i++)r[i - 1] = arguments[i];
                for (var c = s.slice(), i = 0, n = c.length; n > i; i++)this.event = t, c[i].apply(this, r);
                return c.length > 0 || this._all
            }
            return this._all
        }, i.prototype.on = function (t, n) {
            if ("function" == typeof t)return this.onAny(t), this;
            if ("function" != typeof n)throw new Error("on only accepts instances of Function");
            if (this._events || e.call(this), this.emit("newListener", t, n), this.wildcard)return s.call(this, t, n), this;
            if (this._events[t]) {
                if ("function" == typeof this._events[t])this._events[t] = [this._events[t], n]; else if (u(this._events[t]) && (this._events[t].push(n), !this._events[t].warned)) {
                    var r = c;
                    "undefined" != typeof this._events.maxListeners && (r = this._events.maxListeners), r > 0 && this._events[t].length > r && (this._events[t].warned = !0, console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[t].length), console.trace())
                }
            } else this._events[t] = n;
            return this
        }, i.prototype.onAny = function (t) {
            if (this._all || (this._all = []), "function" != typeof t)throw new Error("onAny only accepts instances of Function");
            return this._all.push(t), this
        }, i.prototype.addListener = i.prototype.on, i.prototype.off = function (t, e) {
            if ("function" != typeof e)throw new Error("removeListener only takes instances of Function");
            var n, r = [];
            if (this.wildcard) {
                var i = "string" == typeof t ? t.split(this.delimiter) : t.slice();
                r = o.call(this, null, i, this.listenerTree, 0)
            } else {
                if (!this._events[t])return this;
                n = this._events[t], r.push({_listeners: n})
            }
            for (var s = 0; s < r.length; s++) {
                var c = r[s];
                if (n = c._listeners, u(n)) {
                    for (var f = -1, a = 0, p = n.length; p > a; a++)if (n[a] === e || n[a].listener && n[a].listener === e || n[a]._origin && n[a]._origin === e) {
                        f = a;
                        break
                    }
                    if (0 > f)continue;
                    return this.wildcard ? c._listeners.splice(f, 1) : this._events[t].splice(f, 1), 0 === n.length && (this.wildcard ? delete c._listeners : delete this._events[t]), this
                }
                (n === e || n.listener && n.listener === e || n._origin && n._origin === e) && (this.wildcard ? delete c._listeners : delete this._events[t])
            }
            return this
        }, i.prototype.offAny = function (t) {
            var e, n = 0, r = 0;
            if (t && this._all && this._all.length > 0) {
                for (e = this._all, n = 0, r = e.length; r > n; n++)if (t === e[n])return e.splice(n, 1), this
            } else this._all = [];
            return this
        }, i.prototype.removeListener = i.prototype.off, i.prototype.removeAllListeners = function (t) {
            if (0 === arguments.length)return!this._events || e.call(this), this;
            if (this.wildcard)for (var n = "string" == typeof t ? t.split(this.delimiter) : t.slice(), r = o.call(this, null, n, this.listenerTree, 0), i = 0; i < r.length; i++) {
                var s = r[i];
                s._listeners = null
            } else {
                if (!this._events[t])return this;
                this._events[t] = null
            }
            return this
        }, i.prototype.listeners = function (t) {
            if (this.wildcard) {
                var n = [], r = "string" == typeof t ? t.split(this.delimiter) : t.slice();
                return o.call(this, n, r, this.listenerTree, 0), n
            }
            return this._events || e.call(this), this._events[t] || (this._events[t] = []), u(this._events[t]) || (this._events[t] = [this._events[t]]), this._events[t]
        }, i.prototype.listenersAny = function () {
            return this._all ? this._all : []
        }, "function" == typeof n && n.amd ? n("eventemitter2", [], function () {
            return i
        }) : t.EventEmitter2 = i
    }("undefined" != typeof process && "undefined" != typeof process.title && "undefined" != typeof exports ? exports : window), n("lib/networkService", ["eventemitter2"], function (t) {
        "use strict";
        var e = function (e) {
            if (t.call(this), !e)throw new TypeError("Missing options argument.");
            if (!e.socket)throw new TypeError("Missing options.socket argument.");
            if (!e.service)throw new TypeError("Missing options.service argument.");
            this._options = e, this.config = this._options.service.config, this.id = this._options.service.id, this.name = this._options.service.name, this.type = this._options.service.type, this.url = this._options.service.url, this._options.socket.on("pinguela:serviceDisappeared", this._onServiceDisappeared.bind(this))
        };
        return e.prototype = new t, e.prototype.constructor = e, e.prototype._onServiceDisappeared = function (t) {
            this.id === t && (this.online = !1, this.emit("unavailable", this))
        }, e.prototype._options = null, e.prototype.addEventListener = e.prototype.addListener, e.prototype.id = null, e.prototype.name = null, e.prototype.online = !0, e.prototype.type = null, e.prototype.url = null, e.prototype.config = null, e
    }), n("lib/networkServices", ["eventemitter2", "./networkService"], function (t, e) {
        "use strict";
        var n = function (n) {
            if (t.call(this), !n)throw new TypeError("Missing options argument.");
            if (!n.socket)throw new TypeError("Missing options.socket argument.");
            if (!n.services)throw new TypeError("Missing options.services argument.");
            if ("function" != typeof n.services.forEach)throw new TypeError("Expected options.services argument to be an array  .");
            this.length = n.services.length, this.servicesAvailable = this.length, this._socket = n.socket, n.services.forEach(function (t, n) {
                var r = new e({service: t, socket: this._socket});
                this[n] = r
            }, this), this._socket.on("disconnect", this._onSocketDisconnect.bind(this)), this._socket.on("error", this._onSocketError.bind(this))
        };
        return n.prototype = new t, n.prototype.constructor = n, n.prototype._onSocketError = function () {
        }, n.prototype._onSocketDisconnect = function () {
        }, n.prototype._onServiceFound = function (t) {
            this.emit(this.prototype.servicefound, t)
        }, n.prototype._onServiceLost = function (t) {
            this.emit(this.prototype.servicefound, t)
        }, n.prototype._socket = null, n.prototype.addEventListener = n.prototype.addListener, n.prototype.getServiceById = function () {
            throw new Error("Not implemented.")
        }, n.prototype.length = 0, n.prototype.servicefound = "servicefound", n.prototype.servicelost = "servicelost", n.prototype.servicesAvailable = 0, n
    }), n("lib/navigatorNetworkService", ["./util/lazyLoader", "./networkService", "./networkServices", "q", "require"], function (t, e, n, r) {
        "use strict";
        var i = {};
        return i.getNetworkServices = function (e, i, o) {
            var s = r.defer(), u = function (t) {
                s.reject(t)
            }, c = function (t) {
                f(t)
            }, f = function (t) {
                var r = t.connect(window.location.protocol + window.location.host), u = function () {
                    r.emit("pinguela:getNetworkServices", e)
                }, c = function (t) {
                    "function" == typeof o ? o(t) : s.reject(t)
                }, f = function (t) {
                    var e = {services: t, socket: r}, o = new n(e);
                    "function" == typeof i ? i(o) : s.resolve(o)
                };
                r.on("connect", u), r.on("pinguela:networkServices", f), r.on("error", c), r.socket && r.socket.connected && r.emit("pinguela:getNetworkServices", e)
            };
            return window.io ? f(window.io) : t("/socket.io/socket.io.js").then(c, u), s.promise
        }, i
    }), n("lib/navigator.js", ["./navigatorNetworkService"], function (t) {
        "use strict";
        return navigator && "function" != typeof navigator.getNetworkServices && (navigator.getNetworkServices = t.getNetworkServices), navigator
    }), e("./lib/navigator.js")
}();