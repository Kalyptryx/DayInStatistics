(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback).then((callbackId) => callbackId);
            const remove = async () => {
              const callbackId = await call;
              await removeListener({
                eventName,
                callbackId
              });
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/local-notifications/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    LocalNotificationsWeb: () => LocalNotificationsWeb
  });
  var LocalNotificationsWeb;
  var init_web = __esm({
    "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
      init_dist();
      LocalNotificationsWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.pending = [];
          this.deliveredNotifications = [];
          this.hasNotificationSupport = () => {
            if (!("Notification" in window) || !Notification.requestPermission) {
              return false;
            }
            if (Notification.permission !== "granted") {
              try {
                new Notification("");
              } catch (e) {
                if (e instanceof Error && e.name === "TypeError") {
                  return false;
                }
              }
            }
            return true;
          };
        }
        async getDeliveredNotifications() {
          const deliveredSchemas = [];
          for (const notification of this.deliveredNotifications) {
            const deliveredSchema = {
              title: notification.title,
              id: parseInt(notification.tag),
              body: notification.body
            };
            deliveredSchemas.push(deliveredSchema);
          }
          return {
            notifications: deliveredSchemas
          };
        }
        async removeDeliveredNotifications(delivered) {
          for (const toRemove of delivered.notifications) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
          }
        }
        async removeDeliveredNotificationsById(options) {
          for (const id of options.ids) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter((n) => n !== found);
          }
        }
        async removeAllDeliveredNotifications() {
          for (const notification of this.deliveredNotifications) {
            notification.close();
          }
          this.deliveredNotifications = [];
        }
        async getByIds(options) {
          const ids = options.ids.map((id) => String(id));
          const scheduled = this.pending.filter((n) => ids.includes(String(n.id)));
          const delivered = this.deliveredNotifications.filter((n) => ids.includes(n.tag)).map((n) => this.deliveredToSchema(n));
          return { notifications: [...scheduled, ...delivered] };
        }
        async getAll(options) {
          const scheduled = [...this.pending];
          const delivered = this.deliveredNotifications.map((n) => this.deliveredToSchema(n));
          if ((options === null || options === void 0 ? void 0 : options.state) === "SCHEDULED") {
            return { notifications: scheduled };
          }
          if ((options === null || options === void 0 ? void 0 : options.state) === "TRIGGERED") {
            return { notifications: delivered };
          }
          return { notifications: [...scheduled, ...delivered] };
        }
        deliveredToSchema(notification) {
          return {
            title: notification.title,
            id: parseInt(notification.tag),
            body: notification.body
          };
        }
        async createChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async listChannels() {
          throw this.unimplemented("Not implemented on web.");
        }
        async schedule(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          for (const notification of options.notifications) {
            this.sendNotification(notification);
          }
          return {
            notifications: options.notifications.map((notification) => ({
              id: notification.id
            }))
          };
        }
        async update(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const updated = [];
          for (const notification of options.notifications) {
            const index = this.pending.findIndex((n) => n.id === notification.id);
            if (index === -1) {
              continue;
            }
            this.pending.splice(index, 1);
            this.sendNotification(notification);
            updated.push(notification);
          }
          return {
            notifications: updated.map((notification) => ({ id: notification.id }))
          };
        }
        async getPending() {
          return {
            notifications: this.pending
          };
        }
        async cancelAll() {
          this.pending = [];
        }
        async registerActionTypes() {
          throw this.unimplemented("Not implemented on web.");
        }
        async cancel(pending) {
          this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
        }
        async areEnabled() {
          const { display } = await this.checkPermissions();
          return {
            value: display === "granted"
          };
        }
        async changeExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async checkExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(await Notification.requestPermission());
          return { display };
        }
        async checkPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(Notification.permission);
          return { display };
        }
        transformNotificationPermission(permission) {
          switch (permission) {
            case "granted":
              return "granted";
            case "denied":
              return "denied";
            default:
              return "prompt";
          }
        }
        sendPending() {
          var _a;
          const toRemove = [];
          const now = (/* @__PURE__ */ new Date()).getTime();
          for (const notification of this.pending) {
            if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
              this.buildNotification(notification);
              toRemove.push(notification);
            }
          }
          this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
        }
        sendNotification(notification) {
          var _a;
          if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
            const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
            this.pending.push(notification);
            setTimeout(() => {
              this.sendPending();
            }, diff);
            return;
          }
          this.buildNotification(notification);
        }
        buildNotification(notification) {
          const localNotification = new Notification(notification.title, {
            body: notification.body,
            tag: String(notification.id)
          });
          localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
          localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
          localNotification.addEventListener("close", () => {
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
          }, false);
          this.deliveredNotifications.push(localNotification);
          return localNotification;
        }
        onClick(notification) {
          const data = {
            actionId: "tap",
            notification
          };
          this.notifyListeners("localNotificationActionPerformed", data);
        }
        onShow(notification) {
          this.notifyListeners("localNotificationReceived", notification);
        }
      };
    }
  });

  // app.js
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/local-notifications/dist/esm/definitions.js
  var Weekday;
  (function(Weekday2) {
    Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
    Weekday2[Weekday2["Monday"] = 2] = "Monday";
    Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
    Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
    Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
    Weekday2[Weekday2["Friday"] = 6] = "Friday";
    Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
  })(Weekday || (Weekday = {}));

  // node_modules/@capacitor/local-notifications/dist/esm/index.js
  var LocalNotifications = registerPlugin("LocalNotifications", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.LocalNotificationsWeb())
  });

  // app.js
  (() => {
    "use strict";
    const STORAGE_KEY = "lebenskompass.entries.v1";
    const SETTINGS_KEY = "lebenskompass.settings.v1";
    const PHOTO_DB_NAME = "lebenskompass.photos.v1";
    const PHOTO_STORE = "photos";
    const MAX_DAILY_PHOTOS = 5;
    const MAX_PHOTO_BYTES = 15e5;
    const SCALE_HINT = "\u{1F641} \xDCberhaupt nicht / extrem schlecht \xB7 \u{1F610} Mittelm\xE4\xDFig / neutral \xB7 \u{1F929} Vollst\xE4ndig / ausgezeichnet";
    const SCALE_STRESS_HINT = "\u{1F60C} Sehr wenig Belastung \xB7 \u{1F92F} Extrem hohe Belastung";
    const SCALE_EMOJIS = ["\u{1F623}", "\u{1F61F}", "\u{1F641}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}", "\u{1F604}", "\u{1F929}", "\u{1F970}"];
    const STRESS_EMOJIS = ["\u{1F60C}", "\u{1F642}", "\u{1F60A}", "\u{1F610}", "\u{1F615}", "\u{1F61F}", "\u{1F623}", "\u{1F62B}", "\u{1F975}", "\u{1F92F}"];
    const REMINDER_DAYS_AHEAD = 30;
    const interestDetails = {
      movement: { emoji: "\u{1F3C3}", label: "Bewegung", question: "Wie hat sich Bewegung oder Aktivit\xE4t heute auf deinen Tag ausgewirkt?" },
      nature: { emoji: "\u{1F33F}", label: "Natur", question: "Hattest du heute einen Moment drau\xDFen oder in der Natur?" },
      animals: { emoji: "\u{1F43E}", label: "Tiere", question: "Wie hat sich deine Zeit mit Tieren heute angef\xFChlt?" },
      creativity: { emoji: "\u{1F3A8}", label: "Kreativit\xE4t", question: "Konntest du heute etwas Kreatives tun oder ausprobieren?" },
      music: { emoji: "\u{1F3B5}", label: "Musik", question: "Welche Rolle hat Musik heute f\xFCr deine Stimmung gespielt?" },
      reading: { emoji: "\u{1F4D6}", label: "Lesen & Schreiben", question: "Welche Rolle hatten Lesen oder Schreiben heute f\xFCr dich?" },
      gaming: { emoji: "\u{1F3AE}", label: "Gaming & Spiele", question: "Welche Rolle hatten Spiele heute f\xFCr deinen Tag?" },
      friends: { emoji: "\u{1FAF6}", label: "Freundschaften", question: "Wie verbunden hast du dich heute mit Freund:innen gef\xFChlt?" },
      family: { emoji: "\u{1F3E1}", label: "Familie", question: "Wie hat sich deine Zeit mit Familie oder vertrauten Menschen heute angef\xFChlt?" },
      learning: { emoji: "\u{1F4DA}", label: "Lernen", question: "Was hast du heute gelernt oder besser verstanden?" },
      work: { emoji: "\u{1F4A1}", label: "Projekte", question: "Wie stimmig hat sich deine Arbeit oder dein Projekt heute angef\xFChlt?" },
      mindfulness: { emoji: "\u{1F9D8}", label: "Achtsamkeit", question: "Gab es heute einen ruhigen Moment nur f\xFCr dich?" },
      hobbies: { emoji: "\u{1F9E9}", label: "Hobbys", question: "Hattest du heute Zeit f\xFCr etwas, das du gerne machst?" },
      cooking: { emoji: "\u{1F373}", label: "Kochen", question: "Wie hat dir eine Mahlzeit oder das Kochen heute getan?" },
      handcraft: { emoji: "\u{1F6E0}\uFE0F", label: "Handwerk", question: "Wie hat sich das praktische Arbeiten heute angef\xFChlt?" },
      other: { emoji: "\u2728", label: "Anderes", question: "Was hat dir heute Freude oder neue Energie gegeben?" }
    };
    const interestQuestionPools = {
      movement: [
        { id: "movement_feel", question: "Wie hat sich deine Bewegung heute angef\xFChlt?", type: "choice", options: ["Belebend", "Entspannend", "Anstrengend", "Spielerisch", "Neutral", "Heute keine Bewegung"] },
        { id: "movement_like", question: "Was hat dir heute an der Bewegung gefallen?", type: "multi", options: ["Frische Luft", "Musik", "Fortschritt", "Gemeinschaft", "Ruhe im Kopf", "Herausforderung", "Beweglichkeit", "Einfach anfangen"] }
      ],
      nature: [
        { id: "nature_good", question: "Was hat dir an deiner Zeit drau\xDFen oder in der Natur heute gutgetan?", type: "multi", options: ["Frische Luft", "Bewegung", "Ruhe", "Pflanzen oder Garten", "Landschaft", "Sonne oder Wetter", "Neue Eindr\xFCcke", "Heute war ich nicht drau\xDFen"] },
        { id: "nature_place", question: "Wo hast du heute Zeit drau\xDFen verbracht?", type: "choice", options: ["Im Garten oder auf dem Balkon", "Im Park oder Wald", "Am Wasser", "In der Natur unterwegs", "An einem anderen Ort drau\xDFen", "Heute war ich nicht drau\xDFen"] }
      ],
      animals: [
        { id: "animals_good", question: "Was hat dir der Kontakt mit Tieren heute gegeben?", type: "multi", options: ["N\xE4he", "Freude", "Ruhe", "Bewegung", "Verantwortung", "Tiere beobachten", "Gemeinsame Zeit", "Heute hatte ich keinen Tierkontakt"] },
        { id: "animals_place", question: "Wie bist du heute Tieren begegnet?", type: "choice", options: ["Zeit mit meinem Haustier", "Tiere bei anderen besucht", "Tiere drau\xDFen beobachtet", "Auf einem Hof oder im Tierpark", "Auf eine andere Weise", "Heute hatte ich keinen Tierkontakt"] }
      ],
      creativity: [
        { id: "creative_activity", question: "Was hast du heute kreativ gemacht?", type: "choice", options: ["Gezeichnet oder gemalt", "Gebastelt oder gebaut", "Fotografiert", "Geschrieben", "Musik gemacht", "Etwas anderes", "Heute nichts Kreatives"] },
        { id: "creative_feeling", question: "Was hat dich beim kreativen Tun begleitet?", type: "multi", options: ["Neugier", "Entspannung", "Konzentration", "Freude", "Ausprobieren", "Ein fertiges Ergebnis", "Freies Gestalten"] }
      ],
      music: [
        { id: "music_experience", question: "Wie hast du heute Musik erlebt?", type: "choice", options: ["Geh\xF6rt", "Gesungen", "Gespielt", "Gemacht oder produziert", "Mit anderen geteilt", "Heute keine Musik"] },
        { id: "music_gave", question: "Was hat dir Musik heute gegeben?", type: "multi", options: ["Energie", "Ruhe", "Freude", "Konzentration", "Trost", "Erinnerungen", "Gemeinschaft"] }
      ],
      reading: [
        { id: "reading_activity", question: "Was hast du heute gelesen oder geschrieben?", type: "choice", options: ["Roman oder Geschichte", "Sachtext", "Comic oder Manga", "Tagebuch oder Notizen", "Eigener Text", "Nichts davon"] },
        { id: "reading_like", question: "Was hat dir am Lesen oder Schreiben heute gefallen?", type: "multi", options: ["Eine spannende Idee", "Eine Figur", "Neue Informationen", "Entspannung", "Inspiration", "Die Sprache", "Eine eigene Erkenntnis"] }
      ],
      gaming: [
        { id: "gaming_style", question: "Wie hast du heute gespielt?", type: "choice", options: ["Allein", "Mit Freund:innen", "Online mit anderen", "Als Brett- oder Kartenspiel", "Heute nicht gespielt"] },
        { id: "gaming_like", question: "Was hat dir am Spielen gefallen?", type: "multi", options: ["Geschichte", "Strategie", "Teamarbeit", "Wettbewerb", "R\xE4tsel", "Erkunden", "Humor", "Entspannung"] }
      ],
      friends: [
        { id: "friend_contact", question: "Welche Art von Kontakt mit Freund:innen tat dir heute am besten?", type: "choice", options: ["Ein pers\xF6nliches Gespr\xE4ch", "Eine Nachricht", "Gemeinsame Aktivit\xE4t", "Ruhige Zeit nebeneinander", "Ein kurzer Gru\xDF", "Heute kein Kontakt"] },
        { id: "friend_quality", question: "Wie hat sich dein Kontakt mit Freund:innen heute angef\xFChlt?", type: "choice", options: ["Verbunden", "Unterst\xFCtzend", "Unkompliziert", "Anstrengend", "Missverst\xE4ndlich", "Eher distanziert", "Unterschiedlich", "Heute gab es keinen Kontakt"] }
      ],
      family: [
        { id: "family_contact", question: "Was habt ihr heute gemeinsam gemacht?", type: "choice", options: ["Gesprochen", "Gemeinsam gegessen", "Etwas unternommen", "Uns gegenseitig geholfen", "Ruhige Zeit verbracht", "Heute keine gemeinsame Zeit", "Etwas anderes"] },
        { id: "family_quality", question: "Wie hat sich deine Zeit mit Familie oder vertrauten Menschen heute angef\xFChlt?", type: "choice", options: ["Verbunden", "Unterst\xFCtzend", "Unkompliziert", "Anstrengend", "Missverst\xE4ndlich", "Eher distanziert", "Unterschiedlich", "Heute gab es keinen Kontakt"] }
      ],
      learning: [
        { id: "learning_start", question: "Was hat dir heute am meisten geholfen, anzufangen?", type: "choice", options: ["Ein klarer Plan", "Ein kleiner erster Schritt", "Eine Erinnerung", "Unterst\xFCtzung durch jemanden", "Zeitdruck", "Interesse an der Aufgabe", "Ich bin einfach gestartet"] },
        { id: "learning_distraction", question: "Was hat dich heute am ehesten abgelenkt?", type: "choice", options: ["Nachrichten oder soziale Medien", "M\xFCdigkeit", "Sorgen oder Gedanken", "Unterbrechungen", "Zu viele Aufgaben", "Eine unklare Aufgabe", "Nichts Besonderes"] }
      ],
      work: [
        { id: "work_start", question: "Was hat dir heute am meisten geholfen, bei einer Aufgabe anzufangen?", type: "choice", options: ["Ein klarer Plan", "Ein kleiner erster Schritt", "Eine Erinnerung", "Unterst\xFCtzung durch jemanden", "Zeitdruck", "Interesse an der Aufgabe", "Ich bin einfach gestartet"] },
        { id: "work_tomorrow", question: "Was m\xF6chtest du morgen zuerst angehen?", type: "choice", options: ["Eine wichtige Aufgabe", "Eine kleine, einfache Aufgabe", "Eine Pause oder Erholung", "Kontakt zu jemandem", "Bewegung", "Noch nicht entscheiden"] }
      ],
      mindfulness: [
        { id: "rest_helped", question: "Welche Dinge haben dir heute beim Erholen geholfen?", type: "multi", options: ["Schlaf", "Pause", "Bewegung", "Musik", "Lesen", "Natur", "Gespr\xE4ch", "Alleinsein", "Spielen", "Kreatives Tun"] },
        { id: "need_now", question: "Was brauchst du gerade am ehesten?", type: "choice", options: ["Ruhe", "Kontakt", "Bewegung", "Erholung", "Abwechslung", "Klarheit", "Unterst\xFCtzung", "Zeit f\xFCr mich"] }
      ],
      hobbies: [
        { id: "hobby_today", question: "Welche Hobbys hast du heute ausge\xFCbt?", type: "multi", options: ["Sport", "Bewegung drau\xDFen", "Kreatives Gestalten", "Musik", "Lesen oder Schreiben", "Gaming", "Kochen oder Backen", "Garten oder Natur", "Handwerk", "Sammeln", "Tiere", "Brett- oder Gesellschaftsspiele", "Ehrenamt", "Anderes Hobby", "Heute kein Hobby"] },
        { id: "hobby_like", question: "Was hat dir an deinem Hobby heute gefallen?", type: "multi", options: ["Entspannung", "Herausforderung", "Fortschritt", "Kreativit\xE4t", "Gemeinschaft", "Abwechslung", "Konzentration", "Erfolgserlebnis", "Einfach das Tun"] }
      ],
      cooking: [
        { id: "cooking_activity", question: "Was hast du heute in der K\xFCche zubereitet?", type: "choice", options: ["Eine Mahlzeit gekocht", "Etwas gebacken", "Einen Snack vorbereitet", "Mit anderen zusammen gekocht", "Etwas Neues ausprobiert", "Heute nichts zubereitet"] },
        { id: "cooking_like", question: "Was hat dir am Kochen oder Zubereiten gefallen?", type: "multi", options: ["Der Geschmack", "Etwas Neues ausprobieren", "F\xFCr andere kochen", "Gemeinsam kochen", "Einfachheit", "Der ruhige Moment", "Heute nichts davon"] }
      ],
      handcraft: [
        { id: "handcraft_activity", question: "Woran hast du heute praktisch oder handwerklich gearbeitet?", type: "choice", options: ["Etwas repariert", "Etwas gebaut oder montiert", "Gebastelt oder gestaltet", "Gen\xE4ht oder gestrickt", "Im Garten gearbeitet", "Etwas anderes", "Heute nichts davon"] },
        { id: "handcraft_like", question: "Was hat dir am praktischen Tun gefallen?", type: "multi", options: ["Mit den H\xE4nden arbeiten", "Etwas lernen", "Ein sichtbares Ergebnis", "Selbstst\xE4ndigkeit", "Kreativit\xE4t", "Etwas reparieren", "Anderen helfen", "Heute nichts davon"] }
      ],
      other: [
        { id: "day_good", question: "Was hat dir heute gutgetan?", type: "multi", options: ["Schlaf", "Bewegung", "Drau\xDFensein", "Musik", "Hobby", "Essen", "Ruhe", "Zeit mit anderen", "Zeit allein", "Erfolgserlebnis", "Humor"] },
        { id: "day_takeaway", question: "Was m\xF6chtest du aus dem heutigen Tag mitnehmen?", type: "multi", options: ["Einen sch\xF6nen Moment", "Eine Erkenntnis", "Ein Erfolgserlebnis", "Dankbarkeit", "Eine Idee", "Eine Entscheidung", "Nichts Bestimmtes"] }
      ]
    };
    const focusDetails = {
      stress: { emoji: "\u{1F30A}", label: "Stress & Balance", question: "Wie gut konntest du heute deine Belastung ausgleichen?" },
      sleep: { emoji: "\u{1F319}", label: "Schlaf & Erholung", question: "Wie erholt f\xFChlst du dich gerade?" },
      energy: { emoji: "\u26A1", label: "Energie", question: "Wie passend war deine Energie heute f\xFCr deinen Tag?" },
      motivation: { emoji: "\u{1F680}", label: "Motivation", question: "Wie motiviert hast du dich heute gef\xFChlt?" },
      social: { emoji: "\u{1FAF6}", label: "Verbundenheit", question: "Wie verbunden hast du dich heute mit anderen gef\xFChlt?" },
      growth: { emoji: "\u{1F331}", label: "Entwicklung", question: "Wie viel konntest du heute dazulernen oder dich entwickeln?" },
      confidence: { emoji: "\u2600\uFE0F", label: "Zuversicht", question: "Wie zuversichtlich f\xFChlst du dich mit Blick auf die n\xE4chste Zeit?" },
      physical: { emoji: "\u{1F49A}", label: "K\xF6rpergef\xFChl", question: "Wie gut hat sich dein K\xF6rper heute angef\xFChlt?" },
      relationship: { emoji: "\u{1F49E}", label: "Beziehungen", question: "Wie hat sich deine Beziehungssituation heute angef\xFChlt?" }
    };
    const situationLabels = {
      school: "Schule",
      university: "Studium / Universit\xE4t",
      training: "Ausbildung",
      work: "Beruf / Arbeit",
      care: "Sorge- oder Care-Arbeit",
      transition: "\xDCbergangsphase",
      other: "Etwas anderes"
    };
    const relationshipStatusLabels = {
      single: "Single",
      dating: "Dating",
      partnered: "In einer Partnerschaft",
      married: "Verheiratet",
      complicated: "Es ist kompliziert",
      separated: "Getrennt",
      prefer_not: "M\xF6chte ich nicht angeben"
    };
    const relationshipStatusesWithPartner = /* @__PURE__ */ new Set(["dating", "partnered", "married", "complicated", "separated"]);
    const choices = {
      mood: ["Ruhig", "Zufrieden", "Freudig", "Angespannt", "Ersch\xF6pft", "Gemischt"],
      social: ["Allein", "Mit Familie", "Mit Freund:innen", "Mit Kolleg:innen", "Mit anderen"],
      influences: ["Schlaf", "Bewegung", "Arbeit / Lernen", "Beziehungen", "Freizeit", "Gesundheit", "Finanzen", "Umgebung", "Anderes"]
    };
    const domains = [
      { id: "satisfaction", label: "Wohlbefinden", question: "Wie zufrieden warst du heute mit deinem Tag insgesamt?" },
      { id: "happiness", label: "Emotionales Wohlbefinden", question: "Wie gl\xFCcklich und ausgeglichen hast du dich heute gef\xFChlt?" },
      { id: "stress", label: "Stress", question: "Wie hoch war dein Stresslevel heute?", negative: true },
      { id: "worries", label: "Sorgen und \xC4ngste", question: "Wie stark haben dich Sorgen oder \xC4ngste heute belastet?", negative: true },
      { id: "workload", label: "Arbeitslast", question: "Wie hoch war deine Arbeits- und Aufgabenbelastung heute (Schule, Uni, Beruf oder Alltag)?", negative: true },
      { id: "motivation", label: "Motivation", question: "Wie motiviert hast du dich heute gef\xFChlt?" },
      { id: "energy", label: "Energie", question: "Wie viel Energie hattest du heute?" },
      { id: "sleep", label: "Schlafqualit\xE4t", question: "Wie erholsam war dein Schlaf in der vergangenen Nacht?" },
      { id: "social", label: "Soziale Kontakte", question: "Wie zufrieden warst du heute mit deinen sozialen Kontakten?" },
      { id: "relationship", label: "Beziehung", question: "Wie zufrieden warst du heute mit deiner Beziehungssituation?" },
      { id: "self", label: "Selbstwahrnehmung", question: "Wie wohl hast du dich heute mit dir selbst gef\xFChlt?" },
      { id: "growth", label: "Pers\xF6nliche Entwicklung", question: "Wie sehr hattest du das Gef\xFChl, heute etwas gelernt oder dich entwickelt zu haben?" },
      { id: "optimism", label: "Zukunftszuversicht", question: "Wie zuversichtlich blickst du gerade in die Zukunft?" },
      { id: "physical", label: "K\xF6rperliches Wohlbefinden", question: "Wie gut hast du dich heute k\xF6rperlich gef\xFChlt?" }
    ];
    const DAILY_CORE_DOMAIN_IDS = ["satisfaction", "happiness", "stress", "workload", "energy", "sleep"];
    const SCORE_DOMAIN_IDS = DAILY_CORE_DOMAIN_IDS;
    const FOCUS_DOMAIN_IDS = {
      stress: "stress",
      sleep: "sleep",
      energy: "energy",
      motivation: "motivation",
      social: "social",
      growth: "growth",
      confidence: "optimism",
      physical: "physical"
    };
    let entries = loadEntries();
    let settings = loadSettings();
    let profile = settings.profile && typeof settings.profile === "object" ? settings.profile : null;
    let activeRange = "month";
    let toastTimer;
    let setupStep = 1;
    let editingProfile = false;
    let wizardQuestions = [];
    let wizardAnswers = {};
    let wizardIndex = 0;
    let wizardMode = "interlude";
    let wizardTimer;
    let wizardBusy = false;
    let celebrationTimer;
    let mascotMarkupId = 0;
    let entryEditMode = false;
    let calendarDate = localDate();
    let calendarMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
    let calendarPeriod = "month";
    let calendarRenderToken = 0;
    let calendarTapDate = "";
    let calendarTapTime = 0;
    let reflectionDate = "";
    let lastMascotMood = "";
    function localDate(date = /* @__PURE__ */ new Date()) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    function moodEmoji(mood) {
      return {
        "Ruhig": "\u{1F60C}",
        "Zufrieden": "\u{1F642}",
        "Freudig": "\u{1F60A}",
        "Angespannt": "\u{1F62C}",
        "Ersch\xF6pft": "\u{1F634}",
        "Gemischt": "\u{1F3AD}"
      }[mood] || "\u{1F331}";
    }
    function isValidDate(value) {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = /* @__PURE__ */ new Date(`${value}T12:00:00`);
      return Number.isFinite(date.getTime()) && localDate(date) === value;
    }
    function loadEntries() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (!Array.isArray(parsed)) throw new Error("Die gespeicherten Eintr\xE4ge haben ein ung\xFCltiges Format.");
        const valid = parsed.filter((item) => item && isValidDate(item.date) && item.answers && typeof item.answers === "object");
        return [...new Map(valid.map((item) => [item.date, item])).values()];
      } catch (error) {
        console.error("Eintr\xE4ge konnten nicht gelesen werden.", error);
        return [];
      }
    }
    function loadSettings() {
      try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        return {
          ...saved,
          enabled: saved.enabled === void 0 ? true : Boolean(saved.enabled),
          time: isValidReminderTime(saved.time) ? saved.time : "20:00",
          theme: ["dark", "light", "system"].includes(saved.theme) ? saved.theme : "dark",
          compactDashboard: saved.compactDashboard !== false,
          reduceAnimations: Boolean(saved.reduceAnimations),
          mascotHints: saved.mascotHints !== false
        };
      } catch (error) {
        console.error("Einstellungen konnten nicht gelesen werden.", error);
        return { enabled: true, time: "20:00", theme: "dark" };
      }
    }
    function openPhotoDatabase() {
      if (!("indexedDB" in window)) return Promise.reject(new Error("Dieser Browser unterst\xFCtzt keine lokale Bildspeicherung."));
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(PHOTO_DB_NAME, 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(PHOTO_STORE)) {
            const store = database.createObjectStore(PHOTO_STORE, { keyPath: "id" });
            store.createIndex("date", "date", { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Der Bildspeicher konnte nicht ge\xF6ffnet werden."));
      });
    }
    async function getPhotosForDate(date) {
      const database = await openPhotoDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(PHOTO_STORE, "readonly");
        const request = transaction.objectStore(PHOTO_STORE).index("date").getAll(date);
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
        request.onerror = () => reject(request.error || new Error("Tagesbilder konnten nicht geladen werden."));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => database.close();
      });
    }
    async function getPhotosInRange(startDate, endDate) {
      const database = await openPhotoDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(PHOTO_STORE, "readonly");
        const request = transaction.objectStore(PHOTO_STORE).index("date").getAll(IDBKeyRange.bound(startDate, endDate));
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)));
        request.onerror = () => reject(request.error || new Error("Bilder des Zeitraums konnten nicht geladen werden."));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => database.close();
      });
    }
    async function getAllPhotos() {
      const database = await openPhotoDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(PHOTO_STORE, "readonly");
        const request = transaction.objectStore(PHOTO_STORE).getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)));
        request.onerror = () => reject(request.error || new Error("Gespeicherte Bilder konnten nicht geladen werden."));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => database.close();
      });
    }
    async function writePhotos(records) {
      if (!records.length) return;
      const database = await openPhotoDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(PHOTO_STORE, "readwrite");
        const store = transaction.objectStore(PHOTO_STORE);
        records.forEach((record) => store.put(record));
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error || new Error("Bilder konnten nicht gespeichert werden."));
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error || new Error("Das Speichern der Bilder wurde abgebrochen."));
        };
      });
    }
    async function removePhoto(id) {
      const database = await openPhotoDatabase();
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(PHOTO_STORE, "readwrite");
        transaction.objectStore(PHOTO_STORE).delete(id);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error || new Error("Das Bild konnte nicht gel\xF6scht werden."));
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error || new Error("Das L\xF6schen des Bildes wurde abgebrochen."));
        };
      });
    }
    async function preparePhoto(file) {
      if (!file.type.startsWith("image/")) throw new Error("Bitte w\xE4hle eine Bilddatei aus.");
      if (typeof createImageBitmap !== "function") {
        if (file.size > MAX_PHOTO_BYTES) throw new Error("Das Bild ist zu gro\xDF. Bitte w\xE4hle ein kleineres Bild.");
        return file;
      }
      const image = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Das Bild konnte nicht verarbeitet werden.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let quality = 0.82;
        let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (!blob) throw new Error("Das Bild konnte nicht komprimiert werden.");
        while (blob.size > MAX_PHOTO_BYTES && quality > 0.45) {
          quality -= 0.12;
          blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
          if (!blob) throw new Error("Das Bild konnte nicht komprimiert werden.");
        }
        if (blob.size > MAX_PHOTO_BYTES) throw new Error("Das Bild ist nach dem Komprimieren noch zu gro\xDF.");
        return blob;
      } finally {
        image.close();
      }
    }
    function clearPhotoUrls(container) {
      container.querySelectorAll("img[data-photo-url]").forEach((image) => URL.revokeObjectURL(image.dataset.photoUrl));
    }
    function renderPhotoGrid(container, photos, allowDelete) {
      clearPhotoUrls(container);
      container.replaceChildren();
      photos.forEach((photo) => {
        const item = document.createElement("figure");
        item.className = "photo-item";
        const image = document.createElement("img");
        image.alt = photo.name || `Tagesbild vom ${formatDate(photo.date)}`;
        image.loading = "lazy";
        image.src = URL.createObjectURL(photo.blob);
        image.dataset.photoUrl = image.src;
        item.append(image);
        const caption = document.createElement("figcaption");
        caption.textContent = allowDelete ? "Tagesmoment" : formatDate(photo.date, { day: "numeric", month: "short" });
        item.append(caption);
        if (allowDelete) {
          const remove = document.createElement("button");
          remove.className = "photo-remove";
          remove.type = "button";
          remove.dataset.deletePhoto = photo.id;
          remove.setAttribute("aria-label", "Bild entfernen");
          remove.textContent = "\xD7";
          item.append(remove);
        }
        container.append(item);
      });
    }
    function applyTheme() {
      const preference = settings.theme || "dark";
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = preference === "system" ? prefersDark ? "dark" : "light" : preference;
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#0b1110" : "#f5f7f4";
      document.querySelectorAll("[data-theme-option]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.themeOption === preference));
      });
    }
    function applyPreferences() {
      document.documentElement.classList.toggle("compact-dashboard", settings.compactDashboard !== false);
      document.documentElement.classList.toggle("reduce-motion", Boolean(settings.reduceAnimations));
      document.documentElement.classList.toggle("mascot-hidden", settings.mascotHints === false);
    }
    function mascotMarkup(mood = "happy") {
      const id = ++mascotMarkupId;
      const mouth = mood === "curious" ? '<path d="M75 79c0-4 3-6 5-6s5 2 5 6-3 6-5 6-5-2-5-6Z" fill="#8CEEFF"/>' : mood === "calm" ? '<path d="M72 81h16" fill="none" stroke="#8CEEFF" stroke-linecap="round" stroke-width="3"/>' : '<path d="M70 81c6 5 14 5 20 0" fill="none" stroke="#8CEEFF" stroke-linecap="round" stroke-width="3"/>';
      return `<svg viewBox="0 0 160 160" role="img" aria-label="Nori, dein kleiner Roboter-Begleiter">
      <defs>
        <linearGradient id="nori-shell-${id}" x1="30" y1="20" x2="124" y2="139" gradientUnits="userSpaceOnUse"><stop stop-color="#F7FCFF"/><stop offset=".58" stop-color="#C9D9E7"/><stop offset="1" stop-color="#8FA7BD"/></linearGradient>
        <linearGradient id="nori-visor-${id}" x1="48" y1="46" x2="112" y2="91" gradientUnits="userSpaceOnUse"><stop stop-color="#10283B"/><stop offset="1" stop-color="#071620"/></linearGradient>
        <linearGradient id="nori-glow-${id}" x1="55" y1="55" x2="108" y2="84" gradientUnits="userSpaceOnUse"><stop stop-color="#69F4FF"/><stop offset="1" stop-color="#55A7FF"/></linearGradient>
        <filter id="nori-shadow-${id}" x="10" y="12" width="140" height="145" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>
      <ellipse cx="80" cy="143" rx="43" ry="8" fill="#142C43" opacity=".18" filter="url(#nori-shadow-${id})"/>
      <circle cx="80" cy="19" r="5" fill="#50D8EA" class="robot-antenna-light"/>
      <path d="M80 24v11" stroke="#879BAF" stroke-width="5" stroke-linecap="round"/>
      <path d="M45 77V63c0-22 15-37 35-37s35 15 35 37v17c0 22-15 38-35 38S45 102 45 80v-3Z" fill="url(#nori-shell-${id})" stroke="#F7FBFF" stroke-width="3"/>
      <path d="M37 66h9v24h-9a7 7 0 0 1-7-7v-10a7 7 0 0 1 7-7Zm77 0h9a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7h-9V66Z" fill="#96ACC0" stroke="#DCE8F2" stroke-width="3"/>
      <rect x="49" y="48" width="62" height="44" rx="17" fill="url(#nori-visor-${id})" stroke="#E8F7FF" stroke-width="3"/>
      <ellipse cx="66" cy="67" rx="${mood === "curious" ? 6 : 5}" ry="${mood === "calm" ? 4 : 7}" fill="url(#nori-glow-${id})" class="robot-eye robot-eye-left"/>
      <ellipse cx="94" cy="67" rx="${mood === "curious" ? 4 : 5}" ry="${mood === "calm" ? 4 : 7}" fill="url(#nori-glow-${id})" class="robot-eye robot-eye-right"/>
      ${mouth}
      <path d="M60 100h40v19a10 10 0 0 1-10 10H70a10 10 0 0 1-10-10v-19Z" fill="url(#nori-shell-${id})" stroke="#F7FBFF" stroke-width="3"/>
      <path d="M69 108h22" stroke="#7D94A9" stroke-linecap="round" stroke-width="3"/>
      <path d="M74 116h12" stroke="#55CFE0" stroke-linecap="round" stroke-width="3"/>
      <path d="m126 34 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#74E5F4" class="robot-sparkle"/>
    </svg>`;
    }
    function pickMascotMood() {
      const moods = ["happy", "curious", "calm"];
      const choices2 = moods.filter((mood) => mood !== lastMascotMood);
      lastMascotMood = choices2[Math.floor(Math.random() * choices2.length)];
      return lastMascotMood;
    }
    function renderMascot() {
      document.querySelectorAll("[data-mascot]").forEach((element) => {
        const mood = ["happy", "curious", "calm"][Math.floor(Math.random() * 3)];
        element.dataset.mascotMood = mood;
        element.innerHTML = mascotMarkup(mood);
      });
      document.getElementById("brand-mascot").innerHTML = mascotMarkup(pickMascotMood());
    }
    function animateSidekickMood() {
      const art = document.querySelector("#sidekick-toggle .mascot-art");
      if (!art) return;
      const mood = pickMascotMood();
      art.dataset.mascotMood = mood;
      art.innerHTML = mascotMarkup(mood);
    }
    function showSetupStep(step) {
      setupStep = Math.max(1, Math.min(3, step));
      document.querySelectorAll(".setup-step").forEach((section) => {
        section.classList.toggle("active", Number(section.dataset.setupStep) === setupStep);
      });
      document.getElementById("setup-progress-copy").textContent = `Schritt ${setupStep} von 3`;
      document.getElementById("setup-progress-fill").style.width = `${setupStep / 3 * 100}%`;
      const name = document.getElementById("profile-name").value.trim();
      document.getElementById("mascot-greeting").textContent = name ? `Sch\xF6n, dass du da bist, ${name}! \u{1F44B}` : "Hallo! Ich bin Nori \u{1F44B}";
      document.getElementById("mascot-message").textContent = [
        "Ich begleite dich durch die Einrichtung. Teile nur, womit du dich wohlf\xFChlst \u2013 du kannst alles sp\xE4ter \xE4ndern.",
        "Erz\xE4hl mir ein bisschen von den Dingen und Menschen, die deinen Alltag ausmachen. \u{1F33F}",
        "W\xE4hle, was dich interessiert. Ich passe kleine Fragen und Einblicke daran an. Es gibt kein richtig oder falsch. \u2728"
      ][setupStep - 1];
    }
    function startOnboarding(edit = false) {
      editingProfile = edit;
      document.getElementById("onboarding-title").textContent = edit ? "Dein Kompass, deine Wahl" : "Richte deinen Kompass ein";
      document.getElementById("onboarding-form").reset();
      if (profile) {
        document.getElementById("profile-name").value = profile.name || "";
        document.getElementById("profile-age").value = profile.ageRange || "";
        document.getElementById("profile-relationship-status").value = profile.relationshipStatus || "";
        document.getElementById("profile-situation").value = profile.situation || "";
        document.getElementById("profile-context").value = profile.context || "";
        document.getElementById("profile-intention").value = profile.intention || "";
        document.getElementById("profile-reminder").value = profile.preferredTime || settings.time || "20:00";
        ["interests", "focus"].forEach((name) => {
          const selected = new Set(profile[name] || []);
          document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
            input.checked = selected.has(input.value);
          });
        });
      } else {
        document.getElementById("profile-reminder").value = settings.time || "20:00";
      }
      document.body.classList.add("onboarding-active");
      renderMascot();
      showSetupStep(1);
      navigate("onboarding");
    }
    async function finishOnboarding(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const nextProfile = {
        complete: true,
        name: form.elements.name.value.trim().slice(0, 32),
        ageRange: form.elements.ageRange.value,
        relationshipStatus: form.elements.relationshipStatus.value,
        situation: form.elements.situation.value,
        context: form.elements.context.value.trim().slice(0, 100),
        interests: [...form.querySelectorAll('input[name="interests"]:checked')].map((input) => input.value),
        focus: [...form.querySelectorAll('input[name="focus"]:checked')].map((input) => input.value),
        intention: form.elements.intention.value,
        preferredTime: isValidReminderTime(form.elements.preferredTime.value) ? form.elements.preferredTime.value : "20:00"
      };
      const updatedSettings = { ...settings, profile: nextProfile };
      updatedSettings.time = nextProfile.preferredTime;
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
        settings = updatedSettings;
        profile = nextProfile;
        document.body.classList.remove("onboarding-active");
        renderOverview();
        if (editingProfile) navigate("settings");
        else navigate("overview");
        showToast(editingProfile ? "Profil aktualisiert \u2728" : "Dein Kompass ist startklar \u2728");
      } catch (error) {
        console.error("Profil konnte nicht gespeichert werden.", error);
        showToast("Profil konnte nicht gespeichert werden. Pr\xFCfe den verf\xFCgbaren Ger\xE4tespeicher.");
        return;
      }
      if (!editingProfile && settings.enabled) {
        try {
          const permissionGranted = await requestNotificationPermissionWithConsent();
          if (permissionGranted) await syncNativeReminders();
          else {
            settings.enabled = false;
            saveSettings();
            showToast("Benachrichtigungen sind nicht freigegeben. Du kannst sie sp\xE4ter in den Einstellungen aktivieren.");
          }
        } catch (error) {
          console.error("Benachrichtigungen konnten nicht eingerichtet werden.", error);
          showToast("Dein Profil ist gespeichert, aber Benachrichtigungen konnten nicht eingerichtet werden.");
        }
      }
    }
    function saveEntries() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
    function saveSettings() {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);
    }
    function getDomainValue(entry, domain) {
      const value = Number(entry.answers[domain.id]);
      return Number.isFinite(value) && value >= 1 && value <= 10 ? value : null;
    }
    function getScore(entry, excludedDomainId = null) {
      const values = domains.filter(
        (domain) => SCORE_DOMAIN_IDS.includes(domain.id) && domain.id !== excludedDomainId
      ).map((domain) => {
        const value = getDomainValue(entry, domain);
        return value === null ? null : domain.negative ? 11 - value : value;
      }).filter((value) => value !== null);
      if (!values.length) return null;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    function getSortedEntries() {
      return [...entries].sort((a, b) => b.date.localeCompare(a.date));
    }
    function getRangeBounds(range = activeRange, offset = 0) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(12, 0, 0, 0);
      if (range === "week") {
        const end = new Date(today);
        end.setDate(end.getDate() - offset * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - (end.getDay() + 6) % 7);
        return { start: localDate(start), end: localDate(end) };
      }
      if (range === "year") {
        const year = today.getFullYear() - offset;
        const end = offset ? new Date(year, today.getMonth(), Math.min(today.getDate(), new Date(year, today.getMonth() + 1, 0).getDate())) : today;
        return { start: `${year}-01-01`, end: localDate(end) };
      }
      const monthStart = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const monthEnd = offset ? new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(today.getDate(), new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate())) : today;
      return { start: localDate(monthStart), end: localDate(monthEnd) };
    }
    function getRangeEntries(range = activeRange, offset = 0) {
      const sorted = getSortedEntries();
      if (range === "all") return sorted;
      const bounds = getRangeBounds(range, offset);
      return sorted.filter((entry) => entry.date >= bounds.start && entry.date <= bounds.end);
    }
    function formatDate(dateString, options = { weekday: "long", day: "numeric", month: "long" }) {
      const date = /* @__PURE__ */ new Date(`${dateString}T12:00:00`);
      return new Intl.DateTimeFormat("de-DE", options).format(date);
    }
    function navigate(viewName) {
      document.body.classList.toggle("onboarding-active", viewName === "onboarding");
      document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
      document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.navigate === viewName));
      if (viewName === "overview") renderOverview();
      if (viewName === "trends") renderTrends();
      if (viewName === "entries") renderEntries();
      if (viewName === "settings") {
        syncSettingsForm();
        renderProfileSummary();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
    }
    function questionForToday(date, excludedIds = []) {
      const day = Math.floor((/* @__PURE__ */ new Date(`${date}T12:00:00`)).getTime() / 864e5);
      const rotating = domains.filter(
        (domain) => !DAILY_CORE_DOMAIN_IDS.includes(domain.id) && domain.id !== "relationship" && !excludedIds.includes(domain.id)
      );
      const start = (day % rotating.length + rotating.length) % rotating.length;
      return Array.from(
        { length: Math.min(3, rotating.length) },
        (_, index) => rotating[(start + index) % rotating.length]
      );
    }
    function getAgeAdaptedMoodQuestion() {
      const ageRange = profile?.ageRange;
      if (ageRange === "6-10") {
        return { id: "mood", question: "Wie war dein Tag?", type: "choice", options: ["Toll", "Gut", "So mittel", "Schwierig", "Ganz unterschiedlich"] };
      }
      if (ageRange === "11-17" || ageRange === "under-18") {
        return { id: "mood", question: "Was hat heute am meisten zu deiner Stimmung beigetragen?", type: "choice", options: ["Freundschaften", "Familie", "Schule", "Freizeit oder Hobby", "Soziale Medien", "Schlaf oder Energie", "Etwas anderes"] };
      }
      if (ageRange === "65-plus") {
        return { id: "mood", question: "Was hat deinem Tag heute besonders gutgetan?", type: "choice", options: ["Kontakt mit Menschen", "Bewegung", "Ruhe", "Ein Hobby", "Zeit drau\xDFen", "Eine vertraute Routine", "Etwas Neues"] };
      }
      if (["18-24", "25-34", "35-44", "45-54", "55-64"].includes(ageRange)) {
        return { id: "mood", question: "Was hat heute am meisten Raum eingenommen?", type: "choice", options: ["Beruf oder Ausbildung", "Familie oder F\xFCrsorge", "Haushalt oder Organisation", "Beziehungen", "Gesundheit", "Freizeit und Interessen", "Pers\xF6nliche Ver\xE4nderung"] };
      }
      return { id: "mood", question: "Welche Stimmung beschreibt deinen Tag am ehesten?", type: "choice", options: choices.mood };
    }
    function isRelationshipTrackingEnabled() {
      return profile?.focus?.includes("relationship") || relationshipStatusesWithPartner.has(profile?.relationshipStatus);
    }
    function getRelationshipQuestion() {
      const status = profile?.relationshipStatus;
      if (status === "partnered" || status === "married") {
        return "Wie zufrieden warst du heute mit deiner Partnerschaft?";
      }
      if (status === "dating") return "Wie zufrieden warst du heute mit deiner Dating- oder Beziehungssituation?";
      if (status === "complicated" || status === "separated") {
        return "Wie stimmig hat sich deine Beziehungssituation heute angef\xFChlt?";
      }
      return "Wie zufrieden warst du heute mit deinen Beziehungen zu nahestehenden Menschen?";
    }
    function getDailyCoreDomains() {
      const core = DAILY_CORE_DOMAIN_IDS.map((id) => domains.find((domain) => domain.id === id)).filter(Boolean);
      if (isRelationshipTrackingEnabled()) {
        const relationship = domains.find((domain) => domain.id === "relationship");
        if (relationship) core.push(relationship);
      }
      return core;
    }
    function getPersonalQuestions(savedEntry, date, rotatingDomainIds = questionForToday(date).map((domain) => domain.id)) {
      if (!profile) return [];
      const interests = (profile.interests || []).filter((key) => interestDetails[key]?.question);
      const day = Math.floor((/* @__PURE__ */ new Date(`${date}T12:00:00`)).getTime() / 864e5);
      const firstInterest = interests.length ? (day % interests.length + interests.length) % interests.length : 0;
      const dailyInterests = Array.from({ length: Math.min(2, interests.length) }, (_, index) => {
        const key = interests[(firstInterest + index) % interests.length];
        const pool = interestQuestionPools[key];
        const question = pool[day % pool.length];
        return {
          ...question,
          key,
          id: `personal_${key}_${question.id}`,
          label: question.question,
          required: false,
          personal: true
        };
      });
      const focus = (profile.focus || []).filter((key) => key !== "relationship" && focusDetails[key]?.question && !DAILY_CORE_DOMAIN_IDS.includes(FOCUS_DOMAIN_IDS[key]) && !rotatingDomainIds.includes(FOCUS_DOMAIN_IDS[key])).slice(0, 1).map((key) => ({ key, ...focusDetails[key], id: `personal_${key}`, type: "scale", required: false, personal: true }));
      const previousIds = Object.keys(savedEntry?.answers || {}).filter((id) => id.startsWith("personal_")).map((id) => id.slice("personal_".length));
      const previousByKey = /* @__PURE__ */ new Map();
      previousIds.forEach((id) => {
        for (const key of interests) {
          const pool = interestQuestionPools[key];
          const question = pool.find((item) => `${key}_${item.id}` === id);
          if (question) {
            previousByKey.set(key, {
              ...question,
              key,
              id: `personal_${key}_${question.id}`,
              label: question.question,
              required: false,
              personal: true
            });
            return;
          }
          if (id === key) {
            previousByKey.set(key, {
              key,
              ...interestDetails[key],
              id: `personal_${key}`,
              type: "scale",
              required: false,
              personal: true
            });
            return;
          }
        }
      });
      const stableInterests = dailyInterests.map((item) => previousByKey.get(item.key) || item);
      return [...new Map([...focus, ...stableInterests].map((item) => [item.key, item])).values()].slice(0, 3);
    }
    function createQuestionCard(question, savedValue) {
      const card = document.createElement("div");
      card.className = "question-card";
      const usesTextInput = question.type === "text" || question.type === "textarea";
      const title = document.createElement(usesTextInput ? "label" : "p");
      title.className = "question-label";
      title.id = `question-label-${question.id}`;
      if (usesTextInput) title.htmlFor = `q-${question.id}`;
      title.textContent = question.question;
      card.append(title);
      if (question.type === "scale") {
        const hints = document.createElement("div");
        hints.className = "scale-hints";
        hints.textContent = question.negative ? SCALE_STRESS_HINT : SCALE_HINT;
        card.append(hints);
        const options = document.createElement("div");
        options.className = "scale-options";
        options.setAttribute("role", "radiogroup");
        options.setAttribute("aria-labelledby", title.id);
        for (let value = 1; value <= 10; value++) {
          const label = document.createElement("label");
          label.className = "scale-option";
          const emoji = (question.negative ? STRESS_EMOJIS : SCALE_EMOJIS)[value - 1];
          label.setAttribute("aria-label", `${value} von 10`);
          const input = document.createElement("input");
          input.type = "radio";
          input.name = question.id;
          input.id = `q-${question.id}-${value}`;
          input.value = String(value);
          input.setAttribute("aria-label", `${value} von 10`);
          input.required = Boolean(question.required);
          input.checked = Number(savedValue) === value;
          const ratingEmoji = document.createElement("span");
          ratingEmoji.setAttribute("aria-hidden", "true");
          ratingEmoji.textContent = emoji;
          label.append(input, ratingEmoji);
          options.append(label);
        }
        card.append(options);
      } else if (question.type === "choice" || question.type === "multi") {
        const options = document.createElement("div");
        options.className = "choice-options";
        options.setAttribute("role", question.type === "choice" ? "radiogroup" : "group");
        options.setAttribute("aria-labelledby", title.id);
        question.options.forEach((value, index) => {
          const label = document.createElement("label");
          label.className = "choice-option";
          const input = document.createElement("input");
          input.type = question.type === "multi" ? "checkbox" : "radio";
          input.name = question.id;
          input.id = `q-${question.id}-${index}`;
          input.value = value;
          input.required = question.required && question.type === "choice";
          input.checked = question.type === "multi" ? Array.isArray(savedValue) && savedValue.includes(value) : savedValue === value;
          const text = document.createElement("span");
          text.textContent = value;
          label.append(input, text);
          options.append(label);
        });
        card.append(options);
      } else {
        title.htmlFor = `q-${question.id}`;
        const input = document.createElement(question.type === "textarea" ? "textarea" : "input");
        input.id = `q-${question.id}`;
        input.name = question.id;
        input.maxLength = question.maxLength || 300;
        if (question.type !== "textarea") input.type = "text";
        input.value = typeof savedValue === "string" ? savedValue : "";
        if (question.type === "textarea") input.placeholder = "Wenn du m\xF6chtest, halte hier Gedanken fest \u2026";
        card.append(input);
        if (!question.required) {
          const optional = document.createElement("span");
          optional.className = "optional-label";
          optional.textContent = "Optional";
          title.append(optional);
        }
      }
      return card;
    }
    function renderQuestions(date, savedEntry) {
      const coreDomains = getDailyCoreDomains();
      const selectedFocus = (profile?.focus || []).find((key) => key !== "relationship" && focusDetails[key]?.question);
      const rotatingDomains = questionForToday(date, selectedFocus ? [FOCUS_DOMAIN_IDS[selectedFocus]].filter(Boolean) : []);
      const personalQuestions = getPersonalQuestions(savedEntry, date, rotatingDomains.map((domain) => domain.id));
      const groups = [
        {
          id: "core",
          title: "Deine festen Tageswerte \u{1F49A}",
          description: "Sechs Skalen bleiben gleich; bei ausgew\xE4hltem Beziehungsthema kommt eine passende siebte hinzu.",
          interlude: "Wir starten mit festen Tageswerten f\xFCr Wohlbefinden, Stress, Arbeitslast, Energie und Schlaf. So lassen sich Ver\xE4nderungen \xFCber die Zeit vergleichen.",
          questions: coreDomains.map((domain) => ({
            ...domain,
            question: domain.id === "relationship" ? getRelationshipQuestion() : domain.question,
            type: "scale",
            required: true
          }))
        },
        {
          id: "rotating",
          title: "Drei wechselnde Aspekte \u2728",
          description: "Drei kurze Skalenfragen beleuchten t\xE4glich andere Bereiche.",
          interlude: "Jetzt wechseln wir den Blickwinkel: Drei Fragen zu weiteren Bereichen helfen dir, neue Muster zu entdecken.",
          questions: rotatingDomains.map((question) => ({ ...question, type: "scale", required: true }))
        },
        ...personalQuestions.length ? [{
          id: "personal",
          title: "Deine pers\xF6nlichen Impulse \u{1F9ED}",
          description: "Diese freiwilligen Fragen orientieren sich an den Themen, die du ausgew\xE4hlt hast.",
          interlude: "Diese freiwilligen Fragen greifen deine pers\xF6nlichen Schwerpunkte und Interessen auf. Die Interessen wechseln im Lauf der Tage, damit verschiedene Themen Platz finden. Du kannst jede Frage \xFCberspringen.",
          questions: personalQuestions
        }] : [],
        {
          id: "reflection",
          title: "Was war heute pr\xE4gend? \u{1F33F}",
          description: "Die folgenden Fragen sind freiwillig und runden deinen R\xFCckblick ab.",
          interlude: "Zum Schluss kannst du besondere Momente, Kontakte oder Gedanken festhalten. Alles davon ist freiwillig.",
          questions: [
            getAgeAdaptedMoodQuestion(),
            { id: "social_context", question: "Mit wem hattest du heute Kontakt? (Mehrfachauswahl)", type: "multi", options: choices.social },
            { id: "influences", question: "Welche Bereiche haben dein Wohlbefinden heute beeinflusst? (Mehrfachauswahl)", type: "multi", options: choices.influences },
            { id: "meaningful", question: "Gab es heute einen Moment, der sich besonders bedeutsam angef\xFChlt hat?", type: "choice", options: ["Ja", "Nein", "Unsicher"] },
            { id: "reflection", question: "Was m\xF6chtest du aus dem heutigen Tag mitnehmen?", type: "text", maxLength: 180 },
            { id: "notes", question: "Pers\xF6nliche Notizen", type: "textarea", maxLength: 2e3 }
          ]
        }
      ];
      wizardQuestions = groups.flatMap((group) => group.questions.map((question) => ({
        ...question,
        groupId: group.id,
        groupTitle: group.title,
        groupDescription: group.description,
        groupInterlude: group.interlude
      })));
      wizardAnswers = { ...savedEntry?.answers || {} };
      wizardIndex = 0;
      wizardMode = "interlude";
      wizardBusy = false;
      clearTimeout(wizardTimer);
      document.getElementById("wizard-controls").hidden = false;
      renderWizard();
    }
    function currentWizardAnswer() {
      const question = wizardQuestions[wizardIndex];
      if (!question || wizardMode !== "question") return void 0;
      const panel = document.getElementById("wizard-panel");
      if (question.type === "multi") {
        return [...panel.querySelectorAll(`input[name="${question.id}"]:checked`)].map((input) => input.value);
      }
      if (question.type === "scale") {
        const selected = panel.querySelector(`input[name="${question.id}"]:checked`);
        return selected ? Number(selected.value) : void 0;
      }
      if (question.type === "choice") return panel.querySelector(`input[name="${question.id}"]:checked`)?.value;
      const value = panel.querySelector(`[name="${question.id}"]`)?.value.trim();
      return value || void 0;
    }
    function answerIsPresent(question, answer) {
      return question.type === "multi" ? Array.isArray(answer) && answer.length > 0 : answer !== void 0 && answer !== "";
    }
    function updateWizardControls() {
      const isIntro = wizardMode === "interlude";
      const question = wizardQuestions[wizardIndex];
      const isLast = wizardIndex === wizardQuestions.length - 1;
      const back = document.getElementById("wizard-back");
      const next = document.getElementById("wizard-next");
      const skip = document.getElementById("wizard-skip");
      const finish = document.getElementById("wizard-finish");
      back.disabled = isIntro || wizardIndex === 0;
      next.hidden = isLast && !isIntro;
      finish.hidden = isIntro || !isLast;
      skip.hidden = isIntro || Boolean(question?.required);
      if (isIntro) {
        next.textContent = wizardIndex === 0 ? "Los geht's \u2728" : "Weiter \u2192";
        next.disabled = wizardBusy;
        return;
      }
      const answer = currentWizardAnswer();
      const canContinue = !question.required || answerIsPresent(question, answer);
      next.textContent = "Weiter \u2192";
      next.disabled = !canContinue || wizardBusy;
      finish.disabled = !canContinue || wizardBusy;
      skip.disabled = wizardBusy;
    }
    function renderWizard() {
      const panel = document.getElementById("wizard-panel");
      const progress = document.getElementById("wizard-progress-fill");
      const stepLabel = document.getElementById("wizard-step-label");
      if (wizardMode === "interlude") {
        const question2 = wizardQuestions[wizardIndex];
        stepLabel.textContent = wizardIndex === 0 ? "Ein Moment nur f\xFCr dich" : `N\xE4chster Abschnitt \xB7 Frage ${wizardIndex + 1} von ${wizardQuestions.length}`;
        progress.style.width = `${Math.max(3, wizardIndex / wizardQuestions.length * 100)}%`;
        panel.innerHTML = `<section class="wizard-interlude"><div class="interlude-sparkles" aria-hidden="true">\u2726\u3000\u2727\u3000\u2726</div><div class="interlude-mascot mascot-art">${mascotMarkup()}</div><p class="eyebrow">${wizardIndex === 0 ? "BEREIT, WENN DU ES BIST" : "KURZ DURCHATMEN"}</p><h2>${wizardIndex === 0 ? "Dein Tag. Dein Tempo. \u{1F33F}" : escapeHtml(question2.groupTitle)}</h2><p>${wizardIndex === 0 ? "Es gibt kein Richtig oder Falsch. Dein R\xFCckblick besteht aus einzelnen Fragen \u2013 du kannst freiwillige Fragen \xFCberspringen." : escapeHtml(question2.groupInterlude)}</p><span class="interlude-duration">\u23F1 Etwa 5 Minuten \xB7 jederzeit pausierbar</span></section>`;
        updateWizardControls();
        return;
      }
      const question = wizardQuestions[wizardIndex];
      if (!question) return;
      stepLabel.textContent = `Frage ${wizardIndex + 1} von ${wizardQuestions.length}`;
      progress.style.width = `${(wizardIndex + 1) / wizardQuestions.length * 100}%`;
      const heading = document.createElement("div");
      heading.className = "wizard-heading";
      heading.innerHTML = `<p class="eyebrow">${escapeHtml(question.groupTitle)}</p><span class="wizard-question-emoji" aria-hidden="true">${getQuestionEmoji(question.id, question.label)}</span>`;
      const card = createQuestionCard(question, wizardAnswers[question.id]);
      card.classList.add("wizard-question");
      panel.replaceChildren(heading, card);
      if (question.type === "multi" || question.type === "textarea" || question.type === "text") {
        const hint = document.createElement("p");
        hint.className = "wizard-hint";
        hint.textContent = question.type === "multi" ? "W\xE4hle bis zu drei Antworten aus, die am besten passen." : "Deine Antwort ist freiwillig. Tippe auf Weiter, wenn du fertig bist.";
        panel.append(hint);
        if (question.type === "multi") updateMultiChoiceLimit(question);
      }
      updateWizardControls();
      requestAnimationFrame(() => card.classList.add("wizard-question-visible"));
    }
    function updateMultiChoiceLimit(question) {
      if (question?.type !== "multi") return;
      const panel = document.getElementById("wizard-panel");
      const inputs = [...panel.querySelectorAll(`input[name="${question.id}"]`)];
      const checkedCount = inputs.filter((input) => input.checked).length;
      inputs.forEach((input) => {
        input.disabled = checkedCount >= 3 && !input.checked;
      });
    }
    function showWizardSplash(message, callback) {
      const panel = document.getElementById("wizard-panel");
      panel.classList.add("wizard-panel-transitioning");
      panel.innerHTML = `<div class="question-transition-splash"><div class="transition-mascot mascot-art">${mascotMarkup()}</div><span>${escapeHtml(message)}</span></div>`;
      document.getElementById("wizard-controls").classList.add("wizard-controls-busy");
      wizardBusy = true;
      clearTimeout(wizardTimer);
      wizardTimer = setTimeout(() => {
        panel.classList.remove("wizard-panel-transitioning");
        document.getElementById("wizard-controls").classList.remove("wizard-controls-busy");
        wizardBusy = false;
        callback();
      }, 420);
    }
    function mascotNudge() {
      const nudges = ["Gut gemacht!", "Ganz in deinem Tempo.", "Ein Schritt nach dem anderen.", "Danke, dass du dir Zeit nimmst."];
      return nudges[wizardIndex % nudges.length];
    }
    function moveWizardForward(skip = false) {
      if (wizardBusy) return;
      if (wizardMode === "interlude") {
        wizardMode = "question";
        renderWizard();
        return;
      }
      const current = wizardQuestions[wizardIndex];
      if (!current) return;
      const answer = currentWizardAnswer();
      if (skip || answer === void 0) {
        if (current.required) return;
        delete wizardAnswers[current.id];
      } else {
        wizardAnswers[current.id] = answer;
      }
      const oldGroup = current.groupId;
      if (wizardIndex >= wizardQuestions.length - 1) return;
      wizardIndex++;
      const next = wizardQuestions[wizardIndex];
      wizardMode = next.groupId !== oldGroup ? "interlude" : "question";
      showWizardSplash(next.groupId !== oldGroup ? "Ein neuer Abschnitt wartet \u2026" : `${mascotNudge()} Nori ist bei dir.`, renderWizard);
    }
    function moveWizardBack() {
      if (wizardMode === "interlude" || wizardIndex === 0) return;
      const answer = currentWizardAnswer();
      const current = wizardQuestions[wizardIndex];
      if (answer !== void 0) wizardAnswers[current.id] = answer;
      else if (!current.required) delete wizardAnswers[current.id];
      wizardIndex--;
      wizardMode = "question";
      renderWizard();
    }
    function getQuestionEmoji(id, label) {
      const personal = [...Object.values(focusDetails), ...Object.values(interestDetails)].find((item) => item.label === label);
      if (personal) return personal.emoji;
      const personalInterest = Object.keys(interestDetails).find((key) => id.startsWith(`personal_${key}_`));
      if (personalInterest) return interestDetails[personalInterest].emoji;
      return {
        satisfaction: "\u{1F49A}",
        happiness: "\u{1F60A}",
        stress: "\u{1F30A}",
        worries: "\u{1F4AD}",
        motivation: "\u{1F680}",
        energy: "\u26A1",
        relationship: "\u{1F49E}",
        sleep: "\u{1F319}",
        social: "\u{1FAF6}",
        self: "\u{1FA9E}",
        growth: "\u{1F331}",
        optimism: "\u2600\uFE0F",
        physical: "\u{1F49A}",
        mood: "\u{1F3AD}",
        social_context: "\u{1FAF6}",
        influences: "\u{1F9ED}",
        meaningful: "\u{1F4AB}",
        reflection: "\u{1F4DD}",
        notes: "\u{1F4D4}"
      }[id] || "\u{1F33F}";
    }
    function openCheckin(date = localDate(), editExisting = false) {
      const today = localDate();
      const saved = entries.find((entry) => entry.date === date);
      if (date !== today) {
        showToast("Bewertungen und \xC4nderungen sind nur f\xFCr heute m\xF6glich. Fr\xFChere Tage kannst du im Kalender ansehen.");
        return;
      }
      if (saved && !editExisting) {
        showMascotMessage("Du hast heute schon einen R\xFCckblick ausgef\xFCllt. Nori bewahrt ihn f\xFCr dich auf; \xFCber \u201EHeutigen R\xFCckblick anpassen\u201C kannst du deine Antworten \xE4ndern.");
        return;
      }
      entryEditMode = Boolean(saved && editExisting);
      const input = document.getElementById("entry-date");
      input.value = date;
      document.getElementById("entry-date-label").textContent = formatDate(date);
      document.getElementById("edit-hint").textContent = saved ? "Du passt deinen heutigen Eintrag an. Es bleibt bei genau einem R\xFCckblick f\xFCr heute." : "Nur heute m\xF6glich. Der Eintrag l\xE4sst sich sp\xE4ter heute noch anpassen.";
      renderQuestions(date, saved);
      renderTodayPhotos();
      document.getElementById("checkin-mascot-message").textContent = profile?.name ? `${profile.name}, nimm dir Zeit \u2013 du kannst nur das beantworten, was sich heute passend anf\xFChlt. \u{1F331}` : "Nimm dir Zeit \u2013 du kannst nur das beantworten, was sich heute passend anf\xFChlt. \u{1F331}";
      navigate("checkin");
    }
    function showMascotMessage(message) {
      const sidekick = document.getElementById("mascot-sidekick");
      const messageElement = document.getElementById("mascot-sidekick-message");
      if (!sidekick || !messageElement) return;
      animateSidekickMood();
      messageElement.querySelector("span").textContent = message;
      messageElement.hidden = false;
      sidekick.setAttribute("aria-expanded", "true");
      document.getElementById("sidekick-toggle").setAttribute("aria-expanded", "true");
      document.getElementById("sidekick-toggle").setAttribute("aria-label", "Nori-Hinweis ausblenden");
      clearTimeout(sidekick.messageTimer);
      sidekick.messageTimer = setTimeout(() => {
        messageElement.hidden = true;
        sidekick.setAttribute("aria-expanded", "false");
        document.getElementById("sidekick-toggle").setAttribute("aria-expanded", "false");
        document.getElementById("sidekick-toggle").setAttribute("aria-label", "Nori-Hinweis einblenden");
      }, 5e3);
    }
    async function renderTodayPhotos() {
      const grid = document.getElementById("today-photo-grid");
      if (!grid) return;
      try {
        const photos = await getPhotosForDate(localDate());
        renderPhotoGrid(grid, photos, true);
        const remaining = Math.max(0, MAX_DAILY_PHOTOS - photos.length);
        document.getElementById("today-photo-input").disabled = remaining === 0;
        document.querySelector(".photo-add-button").textContent = remaining ? `\uFF0B Bilder hinzuf\xFCgen (${remaining} frei)` : "Tageslimit erreicht";
      } catch (error) {
        console.error("Tagesbilder konnten nicht angezeigt werden.", error);
        showToast(error.message || "Tagesbilder konnten nicht angezeigt werden.");
      }
    }
    async function addTodayPhotos(files) {
      if (!files.length) return;
      if (localDate() !== document.getElementById("entry-date").value) {
        showToast("Bilder k\xF6nnen nur dem heutigen Tag hinzugef\xFCgt werden.");
        return;
      }
      try {
        const existing = await getPhotosForDate(localDate());
        const selection = [...files].slice(0, Math.max(0, MAX_DAILY_PHOTOS - existing.length));
        if (!selection.length) {
          showToast("F\xFCr heute sind bereits f\xFCnf Bilder gespeichert.");
          return;
        }
        const records = [];
        for (const file of selection) {
          const blob = await preparePhoto(file);
          records.push({
            id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            date: localDate(),
            name: file.name.slice(0, 120),
            type: blob.type || file.type,
            blob,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        await writePhotos(records);
        await renderTodayPhotos();
        await renderCalendar();
        showToast(`${records.length} ${records.length === 1 ? "Bild" : "Bilder"} gespeichert`);
      } catch (error) {
        console.error("Tagesbilder konnten nicht gespeichert werden.", error);
        showToast(error.message || "Bilder konnten nicht gespeichert werden.");
      } finally {
        document.getElementById("today-photo-input").value = "";
      }
    }
    function showStreakCelebration(streak) {
      const overlay = document.getElementById("streak-celebration");
      const particles = overlay.querySelector(".celebration-particles");
      const icons = ["\u{1F525}", "\u2728", "\u{1F31F}", "\u{1F49A}", "\u{1F389}"];
      particles.replaceChildren(...Array.from({ length: 28 }, (_, index) => {
        const particle = document.createElement("span");
        particle.textContent = icons[index % icons.length];
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.setProperty("--fall-delay", `${Math.random() * 1.2}s`);
        particle.style.setProperty("--fall-duration", `${1.8 + Math.random() * 1.7}s`);
        return particle;
      }));
      document.getElementById("celebration-streak-count").textContent = `${streak} ${streak === 1 ? "Flamme" : "Flammen"}`;
      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => overlay.classList.add("celebration-active"));
      clearTimeout(celebrationTimer);
      celebrationTimer = setTimeout(hideStreakCelebration, 7500);
    }
    function hideStreakCelebration() {
      const overlay = document.getElementById("streak-celebration");
      if (!overlay || overlay.hidden) return;
      overlay.classList.remove("celebration-active");
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      clearTimeout(celebrationTimer);
    }
    function moveSidekick() {
      const sidekick = document.getElementById("mascot-sidekick");
      if (!sidekick || document.body.classList.contains("onboarding-active") || sidekick.getAttribute("aria-expanded") === "true") return;
      const positions = ["bottom-right", "bottom-left", "top-right", "top-left"];
      const current = sidekick.dataset.position || positions[0];
      const choices2 = positions.filter((position) => position !== current);
      sidekick.classList.add("mascot-teleporting");
      setTimeout(() => {
        sidekick.dataset.position = choices2[Math.floor(Math.random() * choices2.length)];
        animateSidekickMood();
        setTimeout(() => sidekick.classList.remove("mascot-teleporting"), 320);
      }, 320);
    }
    function renderOverview() {
      const today = localDate();
      document.getElementById("today-label").textContent = formatDate(today).toLocaleUpperCase("de-DE");
      document.getElementById("overview-title").textContent = profile?.name ? `Wie geht es dir, ${profile.name}?` : "Wie geht es dir?";
      const todayEntry = entries.find((entry) => entry.date === today);
      document.getElementById("today-status").textContent = todayEntry ? "R\xFCckblick abgeschlossen" : "Noch offen";
      document.getElementById("start-today").textContent = todayEntry ? "Heute schon ausgef\xFCllt \u2713" : "R\xFCckblick starten \u2192";
      document.getElementById("start-today").disabled = Boolean(todayEntry);
      document.getElementById("edit-today").hidden = !todayEntry;
      const sorted = getSortedEntries();
      const currentScore = todayEntry ? getScore(todayEntry) : null;
      const last7 = sorted.filter((entry) => entry.date <= today && entry.date >= localDate(new Date(Date.now() - 6 * 864e5)));
      const avg7 = average(last7.map(getScore));
      const streak = calculateStreak(sorted);
      const score = currentScore ?? avg7;
      document.getElementById("overview-score").innerHTML = scoreRing(score, currentScore === null ? "Dein 7-Tage-Mittel" : "Dein heutiger Eindruck", getScoreEmoji(score));
      const personalTopics = (profile?.focus || []).map((key) => focusDetails[key]?.label).filter(Boolean);
      document.getElementById("focus-summary").textContent = personalTopics.length ? `Deine Themen: ${personalTopics.join(" \xB7 ")}` : profile?.interests?.length ? `Deine Interessen: ${profile.interests.map((key) => interestDetails[key]?.label).filter(Boolean).join(" \xB7 ")}` : "Dein t\xE4glicher Moment f\xFCr Reflexion.";
      const stats = [
        { emoji: "\u{1F4C5}", label: "Letzte 7 Tage", value: avg7 === null ? "\u2013" : avg7.toFixed(1), unit: avg7 === null ? "noch keine Daten" : "Durchschnitt / 10" },
        { emoji: "\u{1F525}", label: "Dein Feuerlauf", value: String(streak), unit: streak === 1 ? "Tag in Folge" : "Tage in Folge" }
      ];
      document.getElementById("overview-stats").innerHTML = stats.map(statCard).join("");
      renderStreak(sorted, streak);
      document.getElementById("header-streak-count").textContent = String(streak);
      const headerStreak = document.getElementById("header-streak");
      headerStreak.dataset.todayRefreshed = String(Boolean(todayEntry));
      const streakOverlay = document.getElementById("streak-fullscreen");
      streakOverlay.dataset.todayRefreshed = String(Boolean(todayEntry));
      document.querySelector(".streak-fullscreen-copy").textContent = todayEntry ? "Die heutige Flamme ist aufgefrischt. Jede Flamme steht f\xFCr einen Tag, an dem du deinen R\xFCckblick festgehalten hast." : "Heute ist noch keine Flamme dazugekommen. Jede Flamme steht f\xFCr einen Tag, an dem du deinen R\xFCckblick festgehalten hast.";
      headerStreak.setAttribute("aria-label", todayEntry ? `Flammen-Streak: ${streak} ${streak === 1 ? "Tag" : "Tage"}, heute aufgefrischt` : `Flammen-Streak: ${streak} ${streak === 1 ? "Tag" : "Tage"}, heute noch nicht aufgefrischt`);
      document.getElementById("streak-fullscreen-count").textContent = `${streak} ${streak === 1 ? "Tag" : "Tage"}`;
      const twoWeeks = [...sorted].filter((entry) => entry.date <= today && entry.date >= localDate(new Date(Date.now() - 13 * 864e5))).sort((a, b) => a.date.localeCompare(b.date));
      renderChart(document.getElementById("overview-chart"), twoWeeks, 220, 150);
    }
    function renderStreak(sorted, streak) {
      const today = /* @__PURE__ */ new Date();
      const mondayOffset = (today.getDay() + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - mondayOffset);
      const recentDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        const day = localDate(date);
        const complete = sorted.some((entry) => entry.date === day);
        return `<span class="streak-day${complete ? " complete" : ""}${day === localDate() ? " current" : ""}" aria-label="${escapeHtml(formatDate(day))}: ${complete ? "Eintrag" : "kein Eintrag"}" title="${escapeHtml(formatDate(day))}">${complete ? "\u{1F525}" : "\xB7"}</span>`;
      });
      document.getElementById("streak-days").innerHTML = recentDays.join("");
    }
    function statCard(item) {
      return `<article class="stat-card"><div class="stat-label">${item.emoji ? `<span class="stat-emoji">${item.emoji}</span>` : ""}${escapeHtml(item.label)}</div><div class="stat-value">${escapeHtml(item.value)}<small>${escapeHtml(item.unit)}</small></div></article>`;
    }
    function getScoreEmoji(score) {
      if (score === null) return "\u{1F331}";
      if (score >= 8) return "\u2600\uFE0F";
      if (score >= 6) return "\u{1F324}\uFE0F";
      if (score >= 4) return "\u2601\uFE0F";
      return "\u{1F327}\uFE0F";
    }
    function scoreRing(score, label, emoji) {
      const percent = score === null ? 0 : Math.max(0, Math.min(100, score * 10));
      const description = score === null ? "Noch keine Bewertung" : `Durchschnitt ${score.toFixed(1)} von 10`;
      return `<section class="score-card-inner"><div class="score-ring" style="--score:${percent}%" role="img" aria-label="${description}"><span>${emoji}</span></div><div class="score-copy"><p class="eyebrow">DEIN KOMPASSMOMENT ${emoji}</p><strong>${score === null ? "Dein erster Eintrag wartet" : `${score.toFixed(1)} <small>/ 10</small>`}</strong><p>${escapeHtml(label)}</p></div></section>`;
    }
    function average(values) {
      const valid = values.filter((value) => Number.isFinite(value));
      return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
    }
    function calculateStreak(sorted) {
      const dates = new Set(sorted.map((entry) => entry.date));
      let cursor = /* @__PURE__ */ new Date();
      if (!dates.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
      let count = 0;
      while (dates.has(localDate(cursor))) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return count;
    }
    function renderChart(element, data, width, height) {
      if (!data.length) {
        element.innerHTML = `<div class="chart-empty">Dein Verlauf erscheint hier, sobald du Eintr\xE4ge hast.</div>`;
        return;
      }
      const margin = { top: 10, right: 16, bottom: 26, left: 25 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const x = (index) => margin.left + (data.length === 1 ? plotWidth / 2 : index / (data.length - 1) * plotWidth);
      const y = (value) => margin.top + (10 - value) / 9 * plotHeight;
      const grid = [1, 5, 10].map((value) => `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}" stroke="#e9eeea" stroke-dasharray="3 4"/><text x="2" y="${y(value) + 3}" font-size="9" fill="#89958e">${value}</text>`).join("");
      const points = data.map((entry, index) => ({ entry, index, value: getScore(entry) })).filter((point) => point.value !== null);
      let path = "";
      points.forEach((point, index) => {
        const previous = points[index - 1];
        const contiguous = previous && (/* @__PURE__ */ new Date(`${point.entry.date}T12:00:00`) - /* @__PURE__ */ new Date(`${previous.entry.date}T12:00:00`)) / 864e5 === 1;
        path += `${contiguous ? "L" : "M"}${x(point.index).toFixed(1)},${y(point.value).toFixed(1)} `;
      });
      const circles = points.map((point) => `<circle cx="${x(point.index)}" cy="${y(point.value)}" r="3.5" fill="#376b59"><title>${escapeHtml(formatDate(point.entry.date, { day: "numeric", month: "short" }))}: ${point.value.toFixed(1)}/10</title></circle>`).join("");
      const labelIndexes = /* @__PURE__ */ new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
      const labels = [...labelIndexes].map((index) => `<text x="${x(index)}" y="${height - 5}" text-anchor="${index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}" font-size="9" fill="#89958e">${escapeHtml(formatDate(data[index].date, { day: "numeric", month: "short" }))}</text>`).join("");
      element.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Diagramm deines t\xE4glichen Wohlbefindens">${grid}<path d="${path}" fill="none" stroke="#4d8268" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${circles}${labels}</svg>`;
    }
    function renderMultiChart(element, data, width, height, seriesIds = null) {
      if (!data.length) {
        element.innerHTML = `<div class="chart-empty">Dein Verlauf erscheint hier, sobald du Eintr\xE4ge hast.</div>`;
        return;
      }
      const margin = { top: 12, right: 12, bottom: 28, left: 25 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const x = (index) => margin.left + (data.length === 1 ? plotWidth / 2 : index / (data.length - 1) * plotWidth);
      const y = (value) => margin.top + (10 - value) / 9 * plotHeight;
      const grid = [1, 5, 10].map(
        (value) => `<line x1="${margin.left}" x2="${width - margin.right}" y1="${y(value)}" y2="${y(value)}" stroke="#e9eeea" stroke-dasharray="3 4"/><text x="2" y="${y(value) + 3}" font-size="9" fill="#89958e">${value}</text>`
      ).join("");
      const allSeries = [
        { id: "wellbeing", label: "Wohlbefinden", color: "#47b889", value: (entry) => getScore(entry) },
        { id: "stress", label: "Stress", color: "#ef8b71", value: (entry) => getDomainValue(entry, domains.find((domain) => domain.id === "stress")) },
        { id: "workload", label: "Arbeitslast", color: "#8f82ed", value: (entry) => getDomainValue(entry, domains.find((domain) => domain.id === "workload")) },
        { id: "relationship", label: "Beziehung", color: "#d276a2", value: (entry) => getDomainValue(entry, domains.find((domain) => domain.id === "relationship")) }
      ];
      const series = seriesIds ? allSeries.filter((item) => seriesIds.includes(item.id)) : allSeries;
      const lines = series.map((item) => {
        const points = data.map((entry, index) => ({ entry, index, value: item.value(entry) }));
        let path = "";
        let previous = null;
        points.forEach((point) => {
          if (point.value === null) {
            previous = null;
            return;
          }
          const contiguous = previous && (/* @__PURE__ */ new Date(`${point.entry.date}T12:00:00`) - /* @__PURE__ */ new Date(`${previous.entry.date}T12:00:00`)) / 864e5 === 1;
          path += `${contiguous ? "L" : "M"}${x(point.index).toFixed(1)},${y(point.value).toFixed(1)} `;
          previous = point;
        });
        const circles = points.filter((point) => point.value !== null).map(
          (point) => `<circle class="series-point" cx="${x(point.index)}" cy="${y(point.value)}" r="3" style="--series-color:${item.color}"><title>${escapeHtml(formatDate(point.entry.date, { day: "numeric", month: "short" }))} \xB7 ${item.label}: ${point.value.toFixed(1)}/10</title></circle>`
        ).join("");
        return `<path class="series-path" d="${path}" style="--series-color:${item.color}" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${circles}`;
      }).join("");
      const labelIndexes = /* @__PURE__ */ new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
      const labels = [...labelIndexes].map(
        (index) => `<text x="${x(index)}" y="${height - 5}" text-anchor="${index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}" font-size="9" fill="#89958e">${escapeHtml(formatDate(data[index].date, { day: "numeric", month: "short" }))}</text>`
      ).join("");
      element.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Liniendiagramm f\xFCr ${series.map((item) => item.label).join(", ")}">${grid}${lines}${labels}</svg>`;
    }
    function renderTrends() {
      document.querySelectorAll("#range-switch button").forEach((button) => button.classList.toggle("selected", button.dataset.range === activeRange));
      const data = getRangeEntries(activeRange);
      const scores = data.map(getScore);
      const avg = average(scores);
      document.getElementById("trend-score").innerHTML = scoreRing(avg, "Durchschnitt im gew\xE4hlten Zeitraum", getScoreEmoji(avg));
      const previousAverage = activeRange === "all" ? null : average(getRangeEntries(activeRange, 1).map(getScore));
      const change = avg !== null && previousAverage !== null ? avg - previousAverage : null;
      const rangeLabel = { week: "dieser Woche", month: "diesem Monat", year: "diesem Jahr", all: "insgesamt" }[activeRange];
      document.getElementById("trend-stats").innerHTML = [
        statCard({ label: "Durchschnitt", value: avg === null ? "\u2013" : avg.toFixed(1), unit: avg === null ? "noch keine Daten" : "von 10" }),
        statCard({ label: "Erfasste Tage", value: String(data.length), unit: rangeLabel }),
        statCard({ label: "Vergleich zum Zeitraum davor", value: change === null ? "\u2013" : `${change > 0 ? "+" : ""}${change.toFixed(1)}`, unit: change === null ? "noch keine Vergleichsdaten" : "Punkte / 10" })
      ].join("");
      const chronological = [...data].sort((a, b) => a.date.localeCompare(b.date));
      renderMultiChart(document.getElementById("trend-wellbeing-chart"), chronological, 620, 220, ["wellbeing"]);
      renderMultiChart(document.getElementById("trend-stress-chart"), chronological, 620, 220, ["stress"]);
      renderMultiChart(document.getElementById("trend-workload-chart"), chronological, 620, 220, ["workload"]);
      const relationshipSlide = document.getElementById("trend-relationship-slide");
      const hasRelationshipData = chronological.some((entry) => getDomainValue(entry, domains.find((domain) => domain.id === "relationship")) !== null);
      relationshipSlide.hidden = !isRelationshipTrackingEnabled() && !hasRelationshipData;
      const relationshipChart = document.getElementById("trend-relationship-chart");
      if (relationshipSlide.hidden) {
        relationshipChart.replaceChildren();
      } else if (hasRelationshipData) {
        renderMultiChart(relationshipChart, chronological, 620, 220, ["relationship"]);
      } else {
        relationshipChart.innerHTML = `<div class="chart-empty">Dein Beziehungsverlauf erscheint hier, sobald du passende Tageswerte erfasst hast.</div>`;
      }
      const visibleSlides = [...document.querySelectorAll(".trend-chart-carousel .insight-slide")].filter((slide) => !slide.hidden);
      document.querySelector(".trend-chart-dots").innerHTML = visibleSlides.map(
        (_, index) => `<span${index === 0 ? ' class="active"' : ""}></span>`
      ).join("");
      document.getElementById("domain-period").textContent = activeRange === "all" ? "Alle erfassten Eintr\xE4ge" : `Durchschnitt in ${rangeLabel}`;
      const barContainer = document.getElementById("domain-bars");
      barContainer.replaceChildren();
      domains.filter((domain) => data.some((entry) => getDomainValue(entry, domain) !== null)).forEach((domain) => {
        const values = data.map((entry) => getDomainValue(entry, domain)).filter((value) => value !== null);
        const rawMean = average(values);
        const mean = rawMean === null ? null : domain.negative ? 11 - rawMean : rawMean;
        const card = document.createElement("article");
        card.className = "domain-donut-card";
        const percent = mean === null ? 0 : Math.round(mean * 10);
        const description = mean === null ? "Noch keine Daten" : `${mean.toFixed(1)} von 10`;
        card.innerHTML = `<div class="domain-donut" style="--score:${percent}%" role="img" aria-label="${escapeHtml(domain.label)}: ${description}"><span>${mean === null ? "\u2013" : mean.toFixed(1)}</span></div><strong><span>${getDomainEmoji(domain.id)}</span>${escapeHtml(domain.label)}</strong><small>${mean === null ? "Noch keine Daten" : domain.negative ? "Balance" : "von 10"}</small>`;
        barContainer.append(card);
      });
      renderCorrelations(data);
      renderEntries();
    }
    function getCalendarMonthBounds() {
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      return {
        start: localDate(new Date(year, month, 1)),
        end: localDate(new Date(year, month + 1, 0))
      };
    }
    function getPeriodBounds(date, period) {
      const selected = /* @__PURE__ */ new Date(`${date}T12:00:00`);
      if (period === "day") return { start: date, end: date, label: formatDate(date) };
      if (period === "week") {
        const monday = new Date(selected);
        monday.setDate(selected.getDate() - (selected.getDay() + 6) % 7);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: localDate(monday), end: localDate(sunday), label: `${formatDate(localDate(monday), { day: "numeric", month: "short" })} \u2013 ${formatDate(localDate(sunday), { day: "numeric", month: "short", year: "numeric" })}` };
      }
      if (period === "year") {
        const start2 = `${selected.getFullYear()}-01-01`;
        const end2 = `${selected.getFullYear()}-12-31`;
        return { start: start2, end: end2, label: String(selected.getFullYear()) };
      }
      const start = localDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
      const end = localDate(new Date(selected.getFullYear(), selected.getMonth() + 1, 0));
      return { start, end, label: new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(selected) };
    }
    async function renderCalendar() {
      const token = ++calendarRenderToken;
      const monthBounds = getCalendarMonthBounds();
      const monthLabel = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(calendarMonth);
      document.getElementById("calendar-month-label").textContent = monthLabel;
      const now = /* @__PURE__ */ new Date();
      document.getElementById("calendar-next").disabled = calendarMonth.getFullYear() === now.getFullYear() && calendarMonth.getMonth() === now.getMonth();
      const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));
      const first = /* @__PURE__ */ new Date(`${monthBounds.start}T12:00:00`);
      const last = /* @__PURE__ */ new Date(`${monthBounds.end}T12:00:00`);
      const leading = (first.getDay() + 6) % 7;
      const cells = [];
      for (let index = 0; index < leading; index++) cells.push(`<span class="calendar-blank" aria-hidden="true"></span>`);
      for (let day = 1; day <= last.getDate(); day++) {
        const date = localDate(new Date(first.getFullYear(), first.getMonth(), day));
        const entry = entriesByDate.get(date);
        const score = entry ? getScore(entry) : null;
        const percent = score === null ? 0 : Math.round(score * 10);
        const future = date > localDate();
        const selected = date === calendarDate;
        cells.push(`<button class="calendar-day${selected ? " selected" : ""}${future ? " future" : ""}" type="button" role="gridcell" data-calendar-date="${date}" aria-label="${escapeHtml(formatDate(date))}${score === null ? ", kein Eintrag" : `, ${score.toFixed(1)} von 10, doppeltippen f\xFCr den Tagesr\xFCckblick`}"${future ? " disabled" : ""}><span class="calendar-day-number">${day}</span><span class="calendar-score-dot${entry ? " has-score" : ""}" style="--score:${percent}%" aria-hidden="true"></span></button>`);
      }
      document.getElementById("calendar-grid").innerHTML = cells.join("");
      document.querySelectorAll("#calendar-period-switch button").forEach((button) => button.classList.toggle("selected", button.dataset.calendarPeriod === calendarPeriod));
      const bounds = getPeriodBounds(calendarDate, calendarPeriod);
      const periodEntries = entries.filter((entry) => entry.date >= bounds.start && entry.date <= bounds.end);
      const periodAverage = average(periodEntries.map(getScore));
      const periodPhotos = await getPhotosInRange(bounds.start, bounds.end).catch((error) => {
        console.error("Bilder f\xFCr den Kalenderzeitraum konnten nicht geladen werden.", error);
        showToast(error.message || "Bilder konnten nicht geladen werden.");
        return [];
      });
      if (token !== calendarRenderToken) return;
      const selectedEntry = entriesByDate.get(calendarDate);
      const selectedScore = selectedEntry ? getScore(selectedEntry) : null;
      const detailText = calendarPeriod === "day" ? selectedScore !== null ? `${getScoreEmoji(selectedScore)} Tageswert: ${selectedScore.toFixed(1)} / 10${selectedEntry.answers.mood ? ` \xB7 ${moodEmoji(selectedEntry.answers.mood)} ${escapeHtml(selectedEntry.answers.mood)}` : ""}` : selectedEntry ? "Ein R\xFCckblick ist vorhanden, enth\xE4lt aber noch keinen auswertbaren Skalenwert." : "F\xFCr diesen Tag gibt es keinen Eintrag. Fehlende Tage bleiben neutral." : `${periodEntries.length} ${periodEntries.length === 1 ? "Eintrag" : "Eintr\xE4ge"} \xB7 Durchschnitt ${periodAverage === null ? "\u2013" : `${periodAverage.toFixed(1)} / 10`}`;
      document.getElementById("calendar-summary").innerHTML = `<div class="calendar-summary-heading"><div><p class="eyebrow">${calendarPeriod === "day" ? "TAGESR\xDCCKBLICK" : "ZEITRAUM"} \xB7 ${escapeHtml(bounds.label.toLocaleUpperCase("de-DE"))}</p><h3>${escapeHtml(formatDate(calendarDate))}</h3></div><span class="calendar-summary-ring" style="--score:${selectedScore === null ? "0%" : `${selectedScore * 10}%`}" aria-hidden="true"><span>${selectedScore === null ? "\u25CB" : getScoreEmoji(selectedScore)}</span></span></div><p>${detailText}</p>${calendarDate === localDate() ? `<button class="button button-secondary button-small" type="button" data-edit-date="${calendarDate}">${selectedEntry ? "Heutigen R\xFCckblick anpassen" : "Heutigen R\xFCckblick starten"}</button>` : ""}`;
      document.getElementById("calendar-photos-title").textContent = `\u{1F4F7} Bilder \xB7 ${bounds.label}`;
      renderPhotoGrid(document.getElementById("period-photo-grid"), periodPhotos, false);
    }
    async function openDayReflection(date) {
      const entry = entries.find((item) => item.date === date);
      if (!entry) {
        showToast("F\xFCr diesen Tag ist kein Tagesr\xFCckblick gespeichert.");
        return;
      }
      reflectionDate = date;
      const overlay = document.getElementById("reflection-overlay");
      const answers = document.getElementById("reflection-answers");
      const questionMap = new Map([
        ...domains,
        ...Object.values(interestQuestionPools).flat().map((question) => ({ ...question, label: question.question })),
        ...getPersonalQuestions(entry, entry.date),
        { ...getAgeAdaptedMoodQuestion(), label: getAgeAdaptedMoodQuestion().question },
        { id: "social_context", label: "Soziale Kontakte" },
        { id: "influences", label: "Einfl\xFCsse des Tages" },
        { id: "meaningful", label: "Bedeutsamer Moment" },
        { id: "reflection", label: "Was du aus dem Tag mitnimmst" },
        { id: "notes", label: "Pers\xF6nliche Notizen" }
      ].map((question) => [question.id, question]));
      const savedAnswers = Object.entries(entry.answers || {}).filter(
        ([, value]) => value !== null && value !== void 0 && value !== "" && (!Array.isArray(value) || value.length > 0)
      );
      answers.innerHTML = savedAnswers.length ? savedAnswers.map(([id, value]) => {
        const question = questionMap.get(id);
        const label = entry.questionLabels?.[id] || question?.label || id.replaceAll("_", " ");
        const displayValue = Array.isArray(value) ? value.map((item) => escapeHtml(item)).join(" \xB7 ") : typeof value === "number" ? `${question?.negative ? STRESS_EMOJIS[value - 1] : SCALE_EMOJIS[value - 1] || "\u{1F331}"} ${value} / 10` : escapeHtml(value);
        return `<article class="reflection-answer"><strong>${escapeHtml(label)}</strong><p>${displayValue}</p></article>`;
      }).join("") : `<p class="chart-footnote">Dieser Eintrag enth\xE4lt keine gespeicherten Antworten.</p>`;
      document.getElementById("reflection-title").textContent = formatDate(date);
      document.getElementById("reflection-photos-section").hidden = true;
      document.getElementById("reflection-photos").replaceChildren();
      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        overlay.classList.add("reflection-active");
        document.getElementById("reflection-close").focus();
      });
      try {
        const photos = await getPhotosInRange(date, date);
        if (reflectionDate !== date) return;
        const photoSection = document.getElementById("reflection-photos-section");
        photoSection.hidden = photos.length === 0;
        renderPhotoGrid(document.getElementById("reflection-photos"), photos, false);
      } catch (error) {
        console.error("Tagesbilder konnten nicht geladen werden.", error);
        showToast("Die Bilder f\xFCr diesen Tagesr\xFCckblick konnten nicht geladen werden.");
      }
    }
    function closeDayReflection() {
      const overlay = document.getElementById("reflection-overlay");
      overlay.classList.remove("reflection-active");
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      reflectionDate = "";
    }
    function renderProfileSummary() {
      const topics = [...profile?.focus || [], ...profile?.interests || []].map((key) => focusDetails[key]?.label || interestDetails[key]?.label).filter(Boolean);
      document.getElementById("profile-summary").textContent = [
        profile?.name ? `F\xFCr ${profile.name}` : "",
        situationLabels[profile?.situation] ? `Alltag: ${situationLabels[profile.situation]}` : "",
        profile?.relationshipStatus && profile.relationshipStatus !== "prefer_not" && relationshipStatusLabels[profile.relationshipStatus] ? `Beziehungsstatus: ${relationshipStatusLabels[profile.relationshipStatus]}` : "",
        topics.length ? `${topics.length} pers\xF6nliche Themen` : "Noch keine Themen ausgew\xE4hlt"
      ].filter(Boolean).join(" \xB7 ");
    }
    function getDomainEmoji(id) {
      return {
        satisfaction: "\u2728",
        happiness: "\u{1F60A}",
        stress: "\u{1F30A}",
        worries: "\u{1F4AD}",
        motivation: "\u{1F680}",
        energy: "\u26A1",
        relationship: "\u{1F49E}",
        sleep: "\u{1F319}",
        social: "\u{1FAF6}",
        self: "\u{1FA9E}",
        growth: "\u{1F331}",
        optimism: "\u2600\uFE0F",
        physical: "\u{1F49A}"
      }[id] || "\u{1F33F}";
    }
    function renderCorrelations(data) {
      const container = document.getElementById("correlations");
      const results = domains.filter((domain) => !["satisfaction", "happiness"].includes(domain.id)).map((domain) => {
        const paired = data.map((entry) => {
          const score = getScore(entry, domain.id);
          const raw = getDomainValue(entry, domain);
          return [raw, score];
        }).filter((pair) => Number.isFinite(pair[0]) && Number.isFinite(pair[1]));
        return { domain, count: paired.length, value: correlation(paired) };
      }).filter((result) => result.count >= 5 && result.value !== null).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 5);
      if (results.length === 0) {
        container.innerHTML = `<p class="chart-footnote">Sobald mindestens f\xFCnf Tage mit passenden Antworten vorliegen, werden hier m\xF6gliche Zusammenh\xE4nge angezeigt.</p>`;
        return;
      }
      container.innerHTML = results.map((result) => {
        const relation = Math.abs(result.value) < 0.2 ? "Kaum linearer Zusammenhang" : result.value > 0 ? "Tendenziell gemeinsam h\xF6her" : "Tendenziell gegenl\xE4ufig";
        return `<div class="correlation-row"><span>${escapeHtml(result.domain.label)} <small>(${result.count} Tage)</small></span><strong>${relation} \xB7 r ${result.value.toFixed(2)}</strong></div>`;
      }).join("");
    }
    function correlation(pairs) {
      if (pairs.length < 5) return null;
      const meanX = average(pairs.map((pair) => pair[0]));
      const meanY = average(pairs.map((pair) => pair[1]));
      const numerator = pairs.reduce((sum, pair) => sum + (pair[0] - meanX) * (pair[1] - meanY), 0);
      const denomX = Math.sqrt(pairs.reduce((sum, pair) => sum + (pair[0] - meanX) ** 2, 0));
      const denomY = Math.sqrt(pairs.reduce((sum, pair) => sum + (pair[1] - meanY) ** 2, 0));
      return denomX && denomY ? numerator / (denomX * denomY) : null;
    }
    function renderEntries() {
      const sorted = getSortedEntries();
      const list = document.getElementById("entries-list");
      document.getElementById("entries-empty").hidden = sorted.length > 0;
      list.innerHTML = sorted.map((entry) => {
        const date = /* @__PURE__ */ new Date(`${entry.date}T12:00:00`);
        const score = getScore(entry);
        const mood = entry.answers.mood ? ` \xB7 ${moodEmoji(entry.answers.mood)} ${escapeHtml(entry.answers.mood)}` : "";
        const isToday = entry.date === localDate();
        return `<article class="entry-row"><div class="entry-date"><strong>${date.getDate()}</strong><small>${escapeHtml(new Intl.DateTimeFormat("de-DE", { month: "short" }).format(date))}</small><span class="entry-flame" aria-label="Flamme f\xFCr diesen ausgef\xFCllten Tag">\u{1F525}</span></div><div class="entry-summary"><strong>${escapeHtml(formatDate(entry.date, { weekday: "long" }))}${mood}</strong><small>${escapeHtml(formatDate(entry.date, { year: "numeric", month: "long" }))}</small></div><div class="entry-score">${score === null ? "\u2013" : score.toFixed(1)}<small>von 10</small></div><button class="entry-edit" type="button" data-${isToday ? "edit" : "calendar"}-date="${escapeHtml(entry.date)}">${isToday ? "Anpassen" : "Ansehen"}</button></article>`;
      }).join("");
      renderCalendar().catch((error) => {
        console.error("Kalender konnte nicht aktualisiert werden.", error);
        showToast(error.message || "Kalender konnte nicht geladen werden.");
      });
    }
    function showStreakDetails() {
      const overlay = document.getElementById("streak-fullscreen");
      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => overlay.classList.add("streak-fullscreen-active"));
    }
    function hideStreakDetails() {
      const overlay = document.getElementById("streak-fullscreen");
      overlay.classList.remove("streak-fullscreen-active");
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
    }
    function syncSettingsForm() {
      document.getElementById("reminder-enabled").checked = Boolean(settings.enabled);
      document.getElementById("reminder-time").value = settings.time || "20:00";
      document.getElementById("reminder-status").textContent = "";
      document.getElementById("compact-dashboard").checked = settings.compactDashboard !== false;
      document.getElementById("reduce-animations").checked = Boolean(settings.reduceAnimations);
      document.getElementById("mascot-hints").checked = settings.mascotHints !== false;
    }
    function updatePreference(key, value) {
      settings = { ...settings, [key]: value };
      saveSettings();
      applyPreferences();
      showToast("Einstellung gespeichert");
    }
    function isValidReminderTime(time) {
      if (!/^\d{2}:\d{2}$/.test(time)) return false;
      const [hour, minute] = time.split(":").map(Number);
      return hour >= 18 && hour <= 20 && minute < 60;
    }
    function getReminderEvents(date) {
      const day = /* @__PURE__ */ new Date(`${date}T12:00:00`);
      const weekend = day.getDay() === 0 || day.getDay() === 6;
      const [startHour, startMinute] = (settings.time || "20:00").split(":").map(Number);
      const start = new Date(day);
      start.setHours(startHour, startMinute, 0, 0);
      const earlyHours = [weekend ? 10 : 7, 17, 19];
      const events = earlyHours.map((hour) => {
        const at = new Date(day);
        at.setHours(hour, 0, 0, 0);
        return { at, kind: hour === (weekend ? 10 : 7) ? "morning" : "evening" };
      }).filter((event) => event.at < start);
      for (let hour = 0; hour < 4; hour++) {
        const at = new Date(start);
        at.setHours(startHour + hour);
        events.push({ at, kind: "countdown", remaining: 4 - hour });
      }
      return events;
    }
    function reminderId(at, kind) {
      const date = localDate(at);
      const dayNumber = Math.floor((/* @__PURE__ */ new Date(`${date}T12:00:00`)).getTime() / 864e5);
      const minuteOfDay = at.getHours() * 60 + at.getMinutes();
      return dayNumber * 5e3 + minuteOfDay * 2 + (kind === "countdown" ? 1 : 0);
    }
    function reminderBody(event) {
      if (event.kind === "countdown") {
        return `Noch ${event.remaining} ${event.remaining === 1 ? "Stunde" : "Stunden"} bis Mitternacht. Dein heutiger R\xFCckblick ist noch offen.`;
      }
      if (event.kind === "morning") {
        return `Dein heutiger R\xFCckblick wartet auf dich. Nori erinnert dich heute Abend noch einmal. \u{1F331}`;
      }
      return "Dein R\xFCckblick ist heute noch offen. Nimm dir f\xFCnf Minuten f\xFCr dich. \u{1F33F}";
    }
    function getUpcomingReminderNotifications() {
      const now = /* @__PURE__ */ new Date();
      const notifications = [];
      for (let offset = 0; offset < REMINDER_DAYS_AHEAD; offset++) {
        const day = new Date(now);
        day.setHours(12, 0, 0, 0);
        day.setDate(day.getDate() + offset);
        const date = localDate(day);
        if (entries.some((entry) => entry.date === date)) continue;
        getReminderEvents(date).forEach((event) => {
          if (event.at <= now) return;
          const key = `${date}-${event.at.getHours()}-${event.at.getMinutes()}-${event.kind}`;
          notifications.push({
            id: reminderId(event.at, event.kind),
            title: event.kind === "countdown" ? "Dein R\xFCckblick l\xE4uft ab" : "Zeit f\xFCr deinen R\xFCckblick",
            body: reminderBody(event),
            schedule: { at: event.at, allowWhileIdle: true, isExactNotification: true },
            extra: { date, key }
          });
        });
      }
      return notifications;
    }
    async function ensureNotificationPermission() {
      if (Capacitor.isNativePlatform()) {
        let permission = await LocalNotifications.checkPermissions();
        if (permission.display !== "granted") permission = await LocalNotifications.requestPermissions();
        return permission.display === "granted";
      }
      if (!("Notification" in window)) return false;
      if (Notification.permission === "granted") return true;
      return await Notification.requestPermission() === "granted";
    }
    function askNotificationConsent() {
      const dialog = document.getElementById("notification-consent");
      dialog.returnValue = "";
      return new Promise((resolve) => {
        dialog.addEventListener("close", () => resolve(dialog.returnValue === "allow"), { once: true });
        dialog.showModal();
      });
    }
    async function requestNotificationPermissionWithConsent() {
      const permission = Capacitor.isNativePlatform() ? await LocalNotifications.checkPermissions() : "Notification" in window ? { display: Notification.permission } : { display: "denied" };
      if (permission.display === "granted") return true;
      if (!await askNotificationConsent()) return false;
      return ensureNotificationPermission();
    }
    async function syncNativeReminders() {
      if (!Capacitor.isNativePlatform()) return null;
      await LocalNotifications.cancelAll();
      if (!settings.enabled || !profile?.complete) return null;
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== "granted") return null;
      const notifications = getUpcomingReminderNotifications();
      if (!notifications.length) return null;
      const result = await LocalNotifications.schedule({ notifications });
      if (result.warning) console.warn("Android hat Erinnerungen ohne exakten Alarm geplant.", result.warning);
      return result.warning || null;
    }
    function refreshNativeReminders() {
      if (!Capacitor.isNativePlatform() || !profile?.complete || !settings.enabled) return;
      syncNativeReminders().catch((error) => console.error("Android-Erinnerungen konnten nach dem \xD6ffnen nicht aktualisiert werden.", error));
    }
    function setTheme(theme) {
      settings.theme = theme;
      saveSettings();
      applyTheme();
    }
    async function saveReminder() {
      const enabled = document.getElementById("reminder-enabled").checked;
      const time = document.getElementById("reminder-time").value;
      if (!isValidReminderTime(time)) {
        document.getElementById("reminder-status").textContent = "W\xE4hle f\xFCr den Countdown eine Startzeit zwischen 18:00 und 20:59 Uhr.";
        return;
      }
      if (enabled) {
        let permissionGranted;
        try {
          permissionGranted = await requestNotificationPermissionWithConsent();
        } catch (error) {
          console.error("Benachrichtigungsberechtigung konnte nicht gepr\xFCft werden.", error);
          document.getElementById("reminder-status").textContent = "Die Benachrichtigungsberechtigung konnte nicht gepr\xFCft werden.";
          return;
        }
        if (!permissionGranted) {
          document.getElementById("reminder-enabled").checked = false;
          settings = { ...settings, enabled: false };
          saveSettings();
          document.getElementById("reminder-status").textContent = "Benachrichtigungen wurden nicht freigegeben. Du kannst den R\xFCckblick weiterhin manuell \xF6ffnen.";
          if (Capacitor.isNativePlatform()) {
            try {
              await syncNativeReminders();
            } catch (error) {
              console.error("Erinnerungen nach Ablehnung konnten nicht entfernt werden.", error);
              document.getElementById("reminder-status").textContent = "Benachrichtigungen sind ausgeschaltet, aber bereits geplante Erinnerungen konnten nicht entfernt werden.";
            }
          }
          return;
        }
      }
      settings = {
        ...settings,
        enabled,
        time,
        ...profile ? { profile: { ...profile, preferredTime: time } } : {}
      };
      if (profile) profile = settings.profile;
      saveSettings();
      if (Capacitor.isNativePlatform()) {
        try {
          const warning = await syncNativeReminders();
          document.getElementById("reminder-status").textContent = !enabled ? "Erinnerungen ausgeschaltet." : warning ? "Erinnerungen sind aktiviert. Android kann sie ohne Freigabe f\xFCr exakte Alarme versp\xE4tet anzeigen." : `Erinnerungen gespeichert: werktags 7 Uhr, am Wochenende 10 Uhr und ab ${time} st\xFCndlich.`;
        } catch (error) {
          console.error("Android-Erinnerungen konnten nicht geplant werden.", error);
          document.getElementById("reminder-status").textContent = "Erinnerungen konnten nicht geplant werden. Pr\xFCfe die Android-Benachrichtigungseinstellungen.";
          return;
        }
      } else {
        document.getElementById("reminder-status").textContent = enabled ? `Erinnerungen gespeichert: werktags 7 Uhr, am Wochenende 10 Uhr und ab ${time} st\xFCndlich. Im Browser nur bei ge\xF6ffneter App.` : "Erinnerung ausgeschaltet.";
      }
      showToast(enabled ? "Erinnerung gespeichert" : "Erinnerung ausgeschaltet");
    }
    function checkReminder() {
      if (Capacitor.isNativePlatform() || !settings.enabled || !("Notification" in window) || Notification.permission !== "granted") return;
      const now = /* @__PURE__ */ new Date();
      const today = localDate(now);
      if (entries.some((entry) => entry.date === today)) return;
      const event = getReminderEvents(today).find(
        (item) => item.at.getHours() === now.getHours() && item.at.getMinutes() === now.getMinutes()
      );
      if (!event) return;
      const key = `${today}-${now.getHours()}-${now.getMinutes()}-${event.kind}`;
      if (settings.lastNotifiedKey === key) return;
      const message = { body: reminderBody(event) };
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => registration.showNotification(event.kind === "countdown" ? "Dein R\xFCckblick l\xE4uft ab" : "Zeit f\xFCr deinen R\xFCckblick", message)).catch((error) => console.error("Browser-Erinnerung konnte nicht angezeigt werden.", error));
      } else {
        new Notification(event.kind === "countdown" ? "Dein R\xFCckblick l\xE4uft ab" : "Zeit f\xFCr deinen R\xFCckblick", message);
      }
      settings.lastNotifiedKey = key;
      saveSettings();
    }
    function blobToDataUrl(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("Ein Bild konnte nicht exportiert werden."));
        reader.readAsDataURL(blob);
      });
    }
    async function exportData() {
      try {
        const photos = await getAllPhotos();
        const exportedPhotos = [];
        for (const photo of photos) {
          exportedPhotos.push({
            id: photo.id,
            date: photo.date,
            name: photo.name,
            type: photo.type,
            dataUrl: await blobToDataUrl(photo.blob)
          });
        }
        const blob = new Blob([JSON.stringify({ version: 2, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), entries, profile, photos: exportedPhotos }, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dayinstatistics-export-${localDate()}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1e3);
        showToast("Datenexport mit Eintr\xE4gen und Bildern erstellt");
      } catch (error) {
        console.error("Datenexport fehlgeschlagen.", error);
        showToast(error.message || "Daten konnten nicht exportiert werden.");
      }
    }
    async function importData(file) {
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!imported || ![1, 2].includes(imported.version) || !Array.isArray(imported.entries)) throw new Error("Die Datei entspricht nicht dem erwarteten DayInStatistics-Export.");
        const validEntries = imported.entries.filter((entry) => entry && isValidDate(entry.date) && entry.answers && typeof entry.answers === "object");
        if (validEntries.length !== imported.entries.length) throw new Error("Die Datei enth\xE4lt ung\xFCltige Eintr\xE4ge und wurde nicht importiert.");
        const importedPhotos = imported.photos === void 0 ? [] : imported.photos;
        if (!Array.isArray(importedPhotos)) throw new Error("Die Bilder in der Datei haben ein ung\xFCltiges Format.");
        const photoRecords = importedPhotos.map((photo) => {
          if (!photo || typeof photo.id !== "string" || !isValidDate(photo.date) || typeof photo.dataUrl !== "string" || !/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl)) {
            throw new Error("Die Datei enth\xE4lt ein ung\xFCltiges Bild und wurde nicht vollst\xE4ndig importiert.");
          }
          const [header, encoded] = photo.dataUrl.split(",");
          const mime = header.slice(5, header.indexOf(";"));
          const binary = atob(encoded);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
          const blob = new Blob([bytes], { type: mime });
          if (blob.size > MAX_PHOTO_BYTES) throw new Error("Ein Bild in der Datei \xFCberschreitet die zul\xE4ssige Gr\xF6\xDFe.");
          return {
            id: photo.id.slice(0, 100),
            date: photo.date,
            name: typeof photo.name === "string" ? photo.name.slice(0, 120) : "",
            type: mime,
            blob,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        });
        if (imported.profile !== void 0) {
          const importedProfile = imported.profile;
          if (!importedProfile || typeof importedProfile !== "object" || importedProfile.complete !== true || !Array.isArray(importedProfile.interests) || !Array.isArray(importedProfile.focus) || !importedProfile.interests.every((key) => Object.prototype.hasOwnProperty.call(interestDetails, key)) || !importedProfile.focus.every((key) => Object.prototype.hasOwnProperty.call(focusDetails, key)) || importedProfile.name !== void 0 && typeof importedProfile.name !== "string" || importedProfile.relationshipStatus !== void 0 && !Object.prototype.hasOwnProperty.call(relationshipStatusLabels, importedProfile.relationshipStatus) || importedProfile.situation && !Object.prototype.hasOwnProperty.call(situationLabels, importedProfile.situation)) {
            throw new Error("Das Profil in der Datei ist ung\xFCltig und wurde nicht importiert.");
          }
          profile = {
            complete: true,
            name: (importedProfile.name || "").slice(0, 32),
            ageRange: typeof importedProfile.ageRange === "string" ? importedProfile.ageRange : "",
            relationshipStatus: Object.prototype.hasOwnProperty.call(relationshipStatusLabels, importedProfile.relationshipStatus) ? importedProfile.relationshipStatus : "",
            situation: importedProfile.situation || "",
            context: typeof importedProfile.context === "string" ? importedProfile.context.slice(0, 100) : "",
            interests: importedProfile.interests,
            focus: importedProfile.focus,
            intention: typeof importedProfile.intention === "string" ? importedProfile.intention : "",
            preferredTime: /^\d{2}:\d{2}$/.test(importedProfile.preferredTime) ? importedProfile.preferredTime : settings.time
          };
          settings = { ...settings, time: profile.preferredTime, profile };
          saveSettings();
        }
        const byDate = new Map(entries.map((entry) => [entry.date, entry]));
        validEntries.forEach((entry) => byDate.set(entry.date, entry));
        entries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
        await writePhotos(photoRecords);
        saveEntries();
        renderEntries();
        renderOverview();
        renderProfileSummary();
        showToast(`${validEntries.length} Eintr\xE4ge und ${photoRecords.length} Bilder importiert`);
      } catch (error) {
        console.error("Import fehlgeschlagen.", error);
        showToast(error.message || "Import fehlgeschlagen");
      } finally {
        document.getElementById("import-file").value = "";
      }
    }
    document.querySelectorAll("[data-navigate]").forEach((button) => button.addEventListener("click", () => {
      const view = button.dataset.navigate;
      if (view === "checkin") openCheckin(localDate(), entries.some((entry) => entry.date === localDate()));
      else navigate(view);
    }));
    document.getElementById("header-reminder").addEventListener("click", () => navigate("settings"));
    document.getElementById("header-streak").addEventListener("click", showStreakDetails);
    document.getElementById("streak-close").addEventListener("click", hideStreakDetails);
    document.getElementById("streak-fullscreen").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) hideStreakDetails();
    });
    document.getElementById("streak-start-today").addEventListener("click", () => {
      hideStreakDetails();
      openCheckin(localDate(), entries.some((entry) => entry.date === localDate()));
    });
    document.getElementById("onboarding-form").addEventListener("click", (event) => {
      if (event.target.closest("[data-setup-next]")) showSetupStep(setupStep + 1);
      if (event.target.closest("[data-setup-back]")) showSetupStep(setupStep - 1);
    });
    document.getElementById("onboarding-form").addEventListener("input", (event) => {
      if (event.target.name === "name") {
        const name = event.target.value.trim();
        document.getElementById("mascot-greeting").textContent = name ? `Sch\xF6n, dass du da bist, ${name}! \u{1F44B}` : "Hallo! Ich bin Nori \u{1F44B}";
      }
    });
    document.getElementById("onboarding-form").addEventListener("submit", finishOnboarding);
    document.getElementById("edit-profile").addEventListener("click", () => startOnboarding(true));
    document.getElementById("sidekick-toggle").addEventListener("click", (event) => {
      const message = document.getElementById("mascot-sidekick-message");
      const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
      if (expanded) {
        message.hidden = true;
        document.getElementById("mascot-sidekick").setAttribute("aria-expanded", "false");
        event.currentTarget.setAttribute("aria-expanded", "false");
        event.currentTarget.setAttribute("aria-label", "Nori-Hinweis einblenden");
        clearTimeout(document.getElementById("mascot-sidekick").messageTimer);
        return;
      }
      const replies = [
        "Sch\xF6n, dass du dir einen Moment f\xFCr dich nimmst. \u{1F331}",
        "Ein Tag muss nicht perfekt sein, um wertvoll zu sein. \u2728",
        "Wie auch immer es heute war: Du darfst es in deinem Tempo anschauen. \u{1F324}\uFE0F",
        "Manchmal reicht es, erst einmal neugierig hinzuschauen. \u{1F9ED}",
        "Auch kleine Momente geh\xF6ren zu deiner Geschichte. \u{1F33F}",
        "Vergiss nicht: Pausen d\xFCrfen Teil deines Tages sein. \u2601\uFE0F"
      ];
      showMascotMessage(replies[Math.floor(Math.random() * replies.length)]);
    });
    document.getElementById("start-today").addEventListener("click", () => openCheckin());
    document.getElementById("edit-today").addEventListener("click", () => openCheckin(localDate(), true));
    document.getElementById("new-entry").addEventListener("click", () => openCheckin(localDate(), entries.some((entry) => entry.date === localDate())));
    document.getElementById("today-photo-input").addEventListener("change", (event) => addTodayPhotos([...event.target.files]));
    document.getElementById("today-photo-grid").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-delete-photo]");
      if (!button) return;
      try {
        await removePhoto(button.dataset.deletePhoto);
        await renderTodayPhotos();
        await renderCalendar();
        showToast("Bild entfernt");
      } catch (error) {
        console.error("Tagesbild konnte nicht entfernt werden.", error);
        showToast(error.message || "Bild konnte nicht entfernt werden.");
      }
    });
    document.getElementById("cancel-checkin").addEventListener("click", () => navigate("overview"));
    document.getElementById("wizard-back").addEventListener("click", moveWizardBack);
    document.getElementById("wizard-next").addEventListener("click", () => moveWizardForward());
    document.getElementById("wizard-skip").addEventListener("click", () => moveWizardForward(true));
    document.getElementById("wizard-panel").addEventListener("change", (event) => {
      const question = wizardQuestions[wizardIndex];
      if (!question || wizardMode !== "question") return;
      if (event.target.type === "radio") {
        updateWizardControls();
        if (!wizardBusy && answerIsPresent(question, currentWizardAnswer())) {
          wizardBusy = true;
          const controls = document.getElementById("wizard-controls");
          controls.classList.add("wizard-controls-busy");
          wizardTimer = window.setTimeout(() => {
            wizardBusy = false;
            controls.classList.remove("wizard-controls-busy");
            if (wizardMode === "question") moveWizardForward();
          }, 280);
        }
      } else {
        if (question.type === "multi") updateMultiChoiceLimit(question);
        updateWizardControls();
      }
    });
    document.getElementById("wizard-panel").addEventListener("input", updateWizardControls);
    document.getElementById("wizard-panel").addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") return;
      event.preventDefault();
      if (!document.getElementById("wizard-next").disabled) moveWizardForward();
    });
    document.getElementById("checkin-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const date = document.getElementById("entry-date").value;
      if (!date) return showToast("Bitte w\xE4hle ein Datum.");
      const today = localDate();
      entries = loadEntries();
      const index = entries.findIndex((item) => item.date === date);
      if (date !== today) return showToast("Bewertungen und \xC4nderungen sind nur f\xFCr heute m\xF6glich.");
      if (index >= 0 && !entryEditMode) {
        showMascotMessage("Du hast heute schon einen R\xFCckblick ausgef\xFCllt. Ein zweiter Eintrag ist nicht m\xF6glich \u2013 du kannst den vorhandenen R\xFCckblick anpassen.");
        return;
      }
      if (index < 0 && entryEditMode) entryEditMode = false;
      const question = wizardQuestions[wizardIndex];
      if (question) {
        const currentAnswer = currentWizardAnswer();
        if (currentAnswer !== void 0) wizardAnswers[question.id] = currentAnswer;
        else if (!question.required) delete wizardAnswers[question.id];
      }
      const missingIndex = wizardQuestions.findIndex((item) => item.required && !answerIsPresent(item, wizardAnswers[item.id]));
      if (missingIndex !== -1) {
        wizardIndex = missingIndex;
        wizardMode = "question";
        renderWizard();
        showToast("Bitte beantworte noch die offene Kernfrage.");
        return;
      }
      const answers = { ...wizardAnswers };
      const questionLabels = Object.fromEntries(wizardQuestions.filter((question2) => question2.id === "relationship" || question2.id === "mood" || question2.personal).map((question2) => [question2.id, question2.question]));
      const entry = { date, answers, questionLabels, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      const isNewToday = date === today && index < 0;
      if (index >= 0) entries[index] = entry;
      else entries.push(entry);
      try {
        saveEntries();
        entryEditMode = false;
        showToast("Dein R\xFCckblick wurde gespeichert");
        navigate("overview");
        if (isNewToday) showStreakCelebration(calculateStreak(getSortedEntries()));
        if (Capacitor.isNativePlatform()) {
          syncNativeReminders().catch((error) => {
            console.error("Erinnerungen nach dem Speichern konnten nicht aktualisiert werden.", error);
            showToast("Der R\xFCckblick ist gespeichert, aber die Erinnerungen konnten nicht aktualisiert werden.");
          });
        }
      } catch (error) {
        console.error("Der Eintrag konnte nicht gespeichert werden.", error);
        showToast("Speichern fehlgeschlagen. Pr\xFCfe den verf\xFCgbaren Ger\xE4tespeicher.");
      }
    });
    document.getElementById("range-switch").addEventListener("click", (event) => {
      const button = event.target.closest("[data-range]");
      if (!button) return;
      activeRange = button.dataset.range;
      renderTrends();
    });
    const insightCarousel = document.querySelector(".insight-carousel");
    insightCarousel.addEventListener("scroll", () => {
      const slides = [...insightCarousel.querySelectorAll(".insight-slide")].filter((slide) => !slide.hidden);
      const dots = [...document.querySelectorAll(".trend-chart-dots span")];
      const carouselRect = insightCarousel.getBoundingClientRect();
      const center = carouselRect.left + insightCarousel.clientWidth / 2;
      let activeIndex = 0;
      let closestDistance = Infinity;
      slides.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeIndex = index;
        }
      });
      dots.forEach((dot, index) => dot.classList.toggle("active", index === activeIndex));
    }, { passive: true });
    document.getElementById("entries-list").addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-edit-date]");
      if (editButton) openCheckin(editButton.dataset.editDate, true);
      const calendarButton = event.target.closest("[data-calendar-date]");
      if (calendarButton) {
        calendarDate = calendarButton.dataset.calendarDate;
        calendarMonth = /* @__PURE__ */ new Date(`${calendarDate}T12:00:00`);
        calendarMonth.setDate(1);
        calendarPeriod = "day";
        renderCalendar().catch((error) => {
          console.error("Kalendertag konnte nicht ge\xF6ffnet werden.", error);
          showToast(error.message || "Kalendertag konnte nicht ge\xF6ffnet werden.");
        });
      }
    });
    document.getElementById("calendar-grid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-calendar-date]");
      if (!button) return;
      calendarDate = button.dataset.calendarDate;
      document.querySelectorAll("#calendar-grid .calendar-day.selected").forEach((day) => day.classList.remove("selected"));
      button.classList.add("selected");
      const now = Date.now();
      const isDoubleTap = calendarTapDate === calendarDate && now - calendarTapTime < 500;
      calendarTapDate = isDoubleTap ? "" : calendarDate;
      calendarTapTime = now;
      if (isDoubleTap) {
        openDayReflection(calendarDate).catch((error) => {
          console.error("Tagesr\xFCckblick konnte nicht ge\xF6ffnet werden.", error);
          showToast("Der Tagesr\xFCckblick konnte nicht ge\xF6ffnet werden.");
        });
      }
    });
    document.getElementById("calendar-period-switch").addEventListener("click", (event) => {
      const button = event.target.closest("[data-calendar-period]");
      if (!button) return;
      calendarPeriod = button.dataset.calendarPeriod;
      renderCalendar().catch((error) => {
        console.error("Kalenderzeitraum konnte nicht angezeigt werden.", error);
        showToast(error.message || "Kalenderzeitraum konnte nicht angezeigt werden.");
      });
    });
    document.getElementById("calendar-previous").addEventListener("click", () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
      calendarDate = localDate(calendarMonth);
      renderCalendar().catch((error) => {
        console.error("Vorheriger Kalendermonat konnte nicht angezeigt werden.", error);
        showToast(error.message || "Monat konnte nicht angezeigt werden.");
      });
    });
    document.getElementById("calendar-next").addEventListener("click", () => {
      const currentMonth = /* @__PURE__ */ new Date();
      if (calendarMonth.getFullYear() > currentMonth.getFullYear() || calendarMonth.getFullYear() === currentMonth.getFullYear() && calendarMonth.getMonth() >= currentMonth.getMonth()) return;
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
      calendarDate = localDate(calendarMonth);
      renderCalendar().catch((error) => {
        console.error("N\xE4chster Kalendermonat konnte nicht angezeigt werden.", error);
        showToast(error.message || "Monat konnte nicht angezeigt werden.");
      });
    });
    document.getElementById("calendar-summary").addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-date]");
      if (!button) return;
      openCheckin(button.dataset.editDate, entries.some((entry) => entry.date === button.dataset.editDate));
    });
    document.getElementById("save-reminder").addEventListener("click", saveReminder);
    document.getElementById("compact-dashboard").addEventListener("change", (event) => updatePreference("compactDashboard", event.currentTarget.checked));
    document.getElementById("reduce-animations").addEventListener("change", (event) => updatePreference("reduceAnimations", event.currentTarget.checked));
    document.getElementById("mascot-hints").addEventListener("change", (event) => updatePreference("mascotHints", event.currentTarget.checked));
    document.getElementById("open-terms").addEventListener("click", () => document.getElementById("terms-dialog").showModal());
    document.getElementById("terms-dialog").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
    document.getElementById("reflection-close").addEventListener("click", closeDayReflection);
    document.getElementById("reflection-overlay").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeDayReflection();
    });
    document.querySelector(".theme-options").addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme-option]");
      if (button) setTheme(button.dataset.themeOption);
    });
    document.getElementById("export-data").addEventListener("click", exportData);
    document.getElementById("import-file").addEventListener("change", (event) => importData(event.target.files[0]));
    document.getElementById("celebration-close").addEventListener("click", hideStreakCelebration);
    document.getElementById("streak-celebration").addEventListener("click", (event) => {
      if (event.target === event.currentTarget) hideStreakCelebration();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideStreakCelebration();
        hideStreakDetails();
        closeDayReflection();
      }
    });
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
        const date = event.notification.extra?.date;
        openCheckin(date === localDate() ? date : localDate());
      }).catch((error) => console.error("Benachrichtigungsaktionen konnten nicht registriert werden.", error));
    }
    renderMascot();
    applyTheme();
    applyPreferences();
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const refreshSystemTheme = () => {
      if (settings.theme === "system") applyTheme();
    };
    if (typeof systemThemeQuery.addEventListener === "function") {
      systemThemeQuery.addEventListener("change", refreshSystemTheme);
    } else {
      systemThemeQuery.addListener(refreshSystemTheme);
    }
    window.addEventListener("focus", refreshSystemTheme);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refreshSystemTheme();
        refreshNativeReminders();
      }
    });
    if (profile?.complete) {
      renderOverview();
      renderProfileSummary();
    } else {
      startOnboarding(false);
    }
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js").catch((error) => console.error("Offline-Unterst\xFCtzung konnte nicht gestartet werden.", error));
    }
    checkReminder();
    setInterval(checkReminder, 1e4);
    document.addEventListener("visibilitychange", checkReminder);
    setInterval(moveSidekick, 18e3 + Math.random() * 8e3);
    const splash = document.getElementById("app-splash");
    const finishSplash = () => {
      if (splash.hidden) return;
      splash.classList.add("app-splash-leaving");
      splash.setAttribute("aria-hidden", "true");
      window.setTimeout(() => {
        splash.hidden = true;
      }, 360);
    };
    splash.addEventListener("click", finishSplash);
    window.setTimeout(finishSplash, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 450 : 1800);
    refreshNativeReminders();
  })();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
