/**
 * EventTarget is an object to which an event is dispatched when something has occurred. Each EventTarget has an
 * associated list of event listeners. An event listener associates a callback with a specific event. Each event
 * listener consists of a type (of the event), callback, and capture variable.
 *
 * @see {link http://www.w3.org/TR/domcore/#eventtarget}
 */

define(function () {

    'use strict';

    /**
     *
     * @constructor
     */
    var EventTarget = function () {
        this._element = document.createElement();
    };

    /**
     *
     * @type {Element}
     * @private
     */
    EventTarget.prototype._element = null;

    /**
     * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback
     * that will be invoked when the event is dispatched. When set to true, the capture argument prevents callback from
     * being invoked when the event's eventPhase attribute value is BUBBLING_PHASE. When false, callback will not be
     * invoked when event's eventPhase attribute value is CAPTURING_PHASE. Either way, callback will be invoked when
     * event's eventPhase attribute value is AT_TARGET.
     *
     * The event listener is appended to target's list of event listeners and is not appended if it is a duplicate (the
     * event listeners in the list are unique).
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/domcore/#dom-eventtarget-addeventlistener}
     */
    EventTarget.prototype.addEventListener = function () {
        this._element.prototype.addEventListener.apply(this, arguments);
    };

    /**
     * Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is
     * false or it's preventDefault() method was not invoked, and false otherwise.
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/domcore/#dom-eventtarget-dispatchevent}
     */
    EventTarget.prototype.dispatchEvent = function () {
        this._element.prototype.dispatchEvent.apply(this, arguments);
    };

    /**
     * Remove the event listener in target's list of event listeners with the same type, callback, and capture.
     *
     * @type {Function}
     * @see {link http://www.w3.org/TR/domcore/#dom-eventtarget-removeeventlistener}
     */
    EventTarget.prototype.removeEventListener = function () {
        this._element.prototype.removeEventListener.apply(this, arguments);
    };

    /**
     * @exports EventTarget
     */
    return EventTarget;

});
