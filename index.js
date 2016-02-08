'use strict';

var Promise = require('bluebird');

exports = module.exports = {};

exports.Promise = Promise;

/**
 * Inject prototype methods
 */
exports.inject = function() {
    if (!Function.prototype.$isGenerator) {
        Function.prototype.$isGenerator = function() {
            return exports.isGenerator(this);
        };
    }

    if (!Function.prototype.$call) {
        Function.prototype.$call = function(thisArg) {
            return exports.apply(this, thisArg, [].slice.call(arguments).slice(1));
        };
    }

    if (!Function.prototype.$apply) {
        Function.prototype.$apply = function(thisArg, argsArray) {
            return exports.apply(this, thisArg, argsArray);
        };
    }

    if (!Function.prototype.$async) {
        Function.prototype.$async = function(callback) {
            return exports.async(this, callback);
        };
    }

    return exports;
};

/**
 * @param gen
 * @returns {boolean}
 */
exports.isGenerator = function(gen) {
    return (gen instanceof (function* () {}).constructor);
};

/**
 * @param fn
 * @param thisArg
 */
exports.call = function(fn, thisArg /*...args*/) {
    return exports.apply(fn, thisArg, [].slice.call(arguments).slice(2));
};

/**
 * @param fn
 * @param thisArg
 * @param argsArray
 * @returns {*}
 */
exports.apply = function(fn, thisArg, argsArray) {
    if (exports.isGenerator(fn)) {
        return Promise.coroutine(fn).apply(thisArg, argsArray);
    }
    return Promise.promisify(fn).apply(thisArg, argsArray);
};

/**
 * @param gen
 * @param callback
 * @returns {Function}
 */
exports.async = function(gen, callback) {
    return function() {
        const promise = Promise.coroutine(gen).apply(null, arguments);

        if (callback) {
            return promise.done(function() {
                const args = [].slice.call(arguments);
                args.unshift(null);
                callback.apply(null, args);
            }, function(err) {
                callback(err);
            });
        }

        return promise.done();
    };
};
