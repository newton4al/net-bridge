/**
 * Name: NetBridge
 * Description: NetBridge is used for making asynchronous network (ajax) calls on web applications.
 * Author: Wisdom Emenike
 * License: MIT
 * Version: 1.1.0
 * GitHub: https://github.com/iamwizzdom/net-bridge
 */

NetBridge = (function() {

    let NetBridge = function () {

        let permitNetwork = true;

        /**
         * return boolean
         */
        let getPermitNetwork = () => permitNetwork;

        /**
         *
         * @param status
         */
        let setPermitNetwork = (status) => {
            if (isBoolean(status)) permitNetwork = status;
        };

        /**
         *
         * @param variable
         */
        let isUndefined = (variable) => typeof variable === "undefined";

        /**
         *
         * @param variable
         */
        let isObject = (variable) => typeof variable === "object";

        /**
         *
         * @param variable
         */
        let isFunction = (variable) => typeof variable === "function";

        /**
         *
         * @param variable
         */
        let isBoolean = (variable) => typeof variable === "boolean";

        /**
         *
         * @param variable
         */
        let isString = (variable) => typeof variable === "string";

        /**
         *
         * @param variable
         */
        let isNumeric = (variable) => isNaN(variable) === false;

        /**
         *
         * @param variable
         */
        let isEmpty = (variable) => variable === false || variable === null ||
            variable.toString() === "0" || variable.toString() === "" || variable.toString() === " ";

        /**
         *
         * @param variable
         */
        let getType = (variable) => typeof variable;

        /**
         *
         * @param object
         * @returns {string}
         */
        let serialize = (object) => {
            let serial = "", x;
            for (x in object) {
                if (object.hasOwnProperty(x))
                    serial += (!isEmpty(serial) ? "&" : "") + x + "=" + object[x];
            }
            return serial;
        };

        /**
         *
         * @param request
         * @returns {boolean}
         */
        let isInRequestQueue = (request) => {
            let requestQueue = this.getRequestQueue(),
                size = requestQueue.length;
            if (size <= 0) return false;
            for (let x = 0; x < size; x++) {
                let queue = requestQueue[x], count = 0,
                    keys = Object.keys(queue).length;
                for (let n in queue) {
                    if (queue.hasOwnProperty(n) &&
                        request.hasOwnProperty(n))
                        if (queue[n] === request[n]) count++;
                }
                if (count === keys) return true;
            }
            return false;
        };

        let requestQueue = {queue: []};

        /**
         * return json
         */
        this.getRequestQueue = () => requestQueue.queue;

        /**
         *
         * @param queue
         */
        this.addToRequestQueue = (queue) => {

            let size = this.getRequestQueue().length, network = getPermitNetwork();
            if (!isObject(queue)) throw "NetBridge expects an object from its parameter, but got " + getType(queue);
            if (isUndefined(queue.url)) throw "NetBridge expects a 'url' attribute from the passed object";
            if (!isString(queue.url)) throw "NetBridge expects the 'url' attribute to be a string, but got " + getType(queue.url);
            if (isUndefined(queue.method)) throw "NetBridge expects a 'method' attribute from the passed object";
            if (!isString(queue.method)) throw "NetBridge expects the 'method' attribute to be a string, but got " + getType(queue.method);
            if (isInRequestQueue(queue)) return;
            if (!network && isFunction(queue.queue)) queue.queue();
            push(queue);
            if (size <= 0) sendRequest();

        };

        let shift = () => requestQueue.queue.shift();
        let push = (queue) => requestQueue.queue.push(queue);

        let sendRequest = () => {

            let queue = this.getRequestQueue(),

                __tm = null,

                send = (request) => {

                    if (!getPermitNetwork()) {
                        if (__tm !== null) clearTimeout(__tm);
                        __tm = setTimeout(() => {
                            send(request);
                        }, 100);
                        return;
                    }

                    setPermitNetwork(false);

                    let xhttp = new XMLHttpRequest();

                    // noinspection Annotator
                    if (isFunction(request['beforeSend'])) {
                        xhttp.onloadstart = () => {
                            // noinspection Annotator
                            request['beforeSend'](xhttp);
                        };
                    }

                    xhttp.onreadystatechange = function () {

                        let state = false,
                            status = false;

                        if (this.readyState === 0) {
                            console.error("NetBridge error: request not initialized (URL:: " + request.url + ")");
                            if (isFunction(request.error)) request.error(xhttp, this.status, this.statusText);
                        }

                        if (this.readyState === 4) state = true;

                        if (this.status === 403) {
                            console.error("NetBridge error: request forbidden (URL:: " + request.url + ")");
                            if (isFunction(request.error)) request.error(xhttp, this.status, this.statusText);
                        }

                        if (this.status === 404) {
                            console.error("NetBridge error: not found (URL:: " + request.url + ")");
                            if (isFunction(request.error)) request.error(xhttp, this.status, this.statusText);
                        }

                        if (this.status === 200) status = true;

                        if (state === true && status === true) {
                            if (isFunction(request.success)) request.success(this.responseText, this.status, xhttp);
                        }

                        if (isFunction(request.complete)) request.complete(xhttp, this.status);

                    };

                    xhttp.onloadend = () => {
                        setPermitNetwork(true);
                        // noinspection Annotator
                        if (isBoolean(request['persist']) && request['persist'] === true) push(request);
                        let _tm = setTimeout(() => {
                            let queue = this.getRequestQueue();
                            if (queue.length > 0) send(shift());
                            clearTimeout(_tm);
                        }, 100);
                    };

                    xhttp.msCaching = (isBoolean(request.cache) ? request.cache : false);

                    // noinspection Annotator
                    xhttp.open(
                        request.method,
                        request.url,
                        (isBoolean(request.async) ? request.async : true),
                        (isString(request['username']) ? request['username'] : ""),
                        (isString(request.password) ? request.password : ""),
                    );

                    if (isFunction(request.xhr)) request.xhr();

                    xhttp.setRequestHeader("Content-Type", (
                        (isBoolean(request.contentType) && request.contentType !== false ?
                                "application/x-www-form-urlencoded" : (
                                    isString(request.contentType) ?
                                        request.contentType :
                                        "application/x-www-form-urlencoded"
                                )
                        )
                    ));

                    if (isObject(request.headers)) {
                        for (let x in request.headers) {
                            if (request.headers.hasOwnProperty(x))
                                xhttp.setRequestHeader(x, request.headers[x]);
                        }
                    }

                    if (isNumeric(request.timeout)) xhttp.timeout = parseInt(request.timeout);

                    if (isFunction(request.ontimeout)) xhttp.ontimeout = request.ontimeout;

                    xhttp.send((isBoolean(request.processData) && request.processData === false ? request.data : serialize(request.data)));

                };

            if (queue.length > 0) send(shift());
        }
    };

    let mInstance = null;

    /**
     * return singleton
     */
    NetBridge.getInstance = () => (mInstance instanceof NetBridge ?
        mInstance : (mInstance = new NetBridge()));

    return NetBridge;

}());