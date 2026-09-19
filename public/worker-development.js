/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./worker/index.js":
/*!*************************!*\
  !*** ./worker/index.js ***!
  \*************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

eval(__webpack_require__.ts("self.addEventListener(\"push\", (event)=>{\n    if (!event.data) return;\n    let payload;\n    try {\n        payload = event.data.json();\n    } catch (e) {\n        payload = {\n            title: \"اعلان جدید\",\n            body: event.data.text()\n        };\n    }\n    event.waitUntil(self.registration.showNotification(payload.title || \"سالن آرایش\", {\n        body: payload.body || \"\",\n        icon: \"/icons/icon-192.png\",\n        badge: \"/icons/icon-192.png\",\n        dir: \"rtl\",\n        lang: \"fa\",\n        data: {\n            link: payload.link || \"/\"\n        }\n    }));\n});\nself.addEventListener(\"notificationclick\", (event)=>{\n    var _event_notification_data;\n    event.notification.close();\n    const link = ((_event_notification_data = event.notification.data) === null || _event_notification_data === void 0 ? void 0 : _event_notification_data.link) || \"/\";\n    event.waitUntil(self.clients.matchAll({\n        type: \"window\",\n        includeUncontrolled: true\n    }).then((clients)=>{\n        for (const client of clients){\n            if (client.url.includes(link) && \"focus\" in client) return client.focus();\n        }\n        if (self.clients.openWindow) return self.clients.openWindow(link);\n    }));\n});\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                /* unsupported import.meta.webpackHot */ undefined.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93b3JrZXIvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUFBLEtBQUtDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQ0M7SUFDN0IsSUFBSSxDQUFDQSxNQUFNQyxJQUFJLEVBQUU7SUFDakIsSUFBSUM7SUFDSixJQUFJO1FBQ0ZBLFVBQVVGLE1BQU1DLElBQUksQ0FBQ0UsSUFBSTtJQUMzQixFQUFFLFVBQU07UUFDTkQsVUFBVTtZQUFFRSxPQUFPO1lBQWNDLE1BQU1MLE1BQU1DLElBQUksQ0FBQ0ssSUFBSTtRQUFHO0lBQzNEO0lBRUFOLE1BQU1PLFNBQVMsQ0FDYlQsS0FBS1UsWUFBWSxDQUFDQyxnQkFBZ0IsQ0FBQ1AsUUFBUUUsS0FBSyxJQUFJLGNBQWM7UUFDaEVDLE1BQU1ILFFBQVFHLElBQUksSUFBSTtRQUN0QkssTUFBTTtRQUNOQyxPQUFPO1FBQ1BDLEtBQUs7UUFDTEMsTUFBTTtRQUNOWixNQUFNO1lBQUVhLE1BQU1aLFFBQVFZLElBQUksSUFBSTtRQUFJO0lBQ3BDO0FBRUo7QUFFQWhCLEtBQUtDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDQztRQUU3QkE7SUFEYkEsTUFBTWUsWUFBWSxDQUFDQyxLQUFLO0lBQ3hCLE1BQU1GLE9BQU9kLEVBQUFBLDJCQUFBQSxNQUFNZSxZQUFZLENBQUNkLElBQUksY0FBdkJELCtDQUFBQSx5QkFBeUJjLElBQUksS0FBSTtJQUM5Q2QsTUFBTU8sU0FBUyxDQUNiVCxLQUFLbUIsT0FBTyxDQUFDQyxRQUFRLENBQUM7UUFBRUMsTUFBTTtRQUFVQyxxQkFBcUI7SUFBSyxHQUFHQyxJQUFJLENBQUMsQ0FBQ0o7UUFDekUsS0FBSyxNQUFNSyxVQUFVTCxRQUFTO1lBQzVCLElBQUlLLE9BQU9DLEdBQUcsQ0FBQ0MsUUFBUSxDQUFDVixTQUFTLFdBQVdRLFFBQVEsT0FBT0EsT0FBT0csS0FBSztRQUN6RTtRQUNBLElBQUkzQixLQUFLbUIsT0FBTyxDQUFDUyxVQUFVLEVBQUUsT0FBTzVCLEtBQUttQixPQUFPLENBQUNTLFVBQVUsQ0FBQ1o7SUFDOUQ7QUFFSiIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi93b3JrZXIvaW5kZXguanM/ODA1ZSJdLCJzb3VyY2VzQ29udGVudCI6WyJzZWxmLmFkZEV2ZW50TGlzdGVuZXIoXCJwdXNoXCIsIChldmVudCkgPT4ge1xyXG4gIGlmICghZXZlbnQuZGF0YSkgcmV0dXJuO1xyXG4gIGxldCBwYXlsb2FkO1xyXG4gIHRyeSB7XHJcbiAgICBwYXlsb2FkID0gZXZlbnQuZGF0YS5qc29uKCk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICBwYXlsb2FkID0geyB0aXRsZTogXCLYp9i52YTYp9mGINis2K/bjNivXCIsIGJvZHk6IGV2ZW50LmRhdGEudGV4dCgpIH07XHJcbiAgfVxyXG5cclxuICBldmVudC53YWl0VW50aWwoXHJcbiAgICBzZWxmLnJlZ2lzdHJhdGlvbi5zaG93Tm90aWZpY2F0aW9uKHBheWxvYWQudGl0bGUgfHwgXCLYs9in2YTZhiDYotix2KfbjNi0XCIsIHtcclxuICAgICAgYm9keTogcGF5bG9hZC5ib2R5IHx8IFwiXCIsXHJcbiAgICAgIGljb246IFwiL2ljb25zL2ljb24tMTkyLnBuZ1wiLFxyXG4gICAgICBiYWRnZTogXCIvaWNvbnMvaWNvbi0xOTIucG5nXCIsXHJcbiAgICAgIGRpcjogXCJydGxcIixcclxuICAgICAgbGFuZzogXCJmYVwiLFxyXG4gICAgICBkYXRhOiB7IGxpbms6IHBheWxvYWQubGluayB8fCBcIi9cIiB9LFxyXG4gICAgfSksXHJcbiAgKTtcclxufSk7XHJcblxyXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoXCJub3RpZmljYXRpb25jbGlja1wiLCAoZXZlbnQpID0+IHtcclxuICBldmVudC5ub3RpZmljYXRpb24uY2xvc2UoKTtcclxuICBjb25zdCBsaW5rID0gZXZlbnQubm90aWZpY2F0aW9uLmRhdGE/LmxpbmsgfHwgXCIvXCI7XHJcbiAgZXZlbnQud2FpdFVudGlsKFxyXG4gICAgc2VsZi5jbGllbnRzLm1hdGNoQWxsKHsgdHlwZTogXCJ3aW5kb3dcIiwgaW5jbHVkZVVuY29udHJvbGxlZDogdHJ1ZSB9KS50aGVuKChjbGllbnRzKSA9PiB7XHJcbiAgICAgIGZvciAoY29uc3QgY2xpZW50IG9mIGNsaWVudHMpIHtcclxuICAgICAgICBpZiAoY2xpZW50LnVybC5pbmNsdWRlcyhsaW5rKSAmJiBcImZvY3VzXCIgaW4gY2xpZW50KSByZXR1cm4gY2xpZW50LmZvY3VzKCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNlbGYuY2xpZW50cy5vcGVuV2luZG93KSByZXR1cm4gc2VsZi5jbGllbnRzLm9wZW5XaW5kb3cobGluayk7XHJcbiAgICB9KSxcclxuICApO1xyXG59KTsiXSwibmFtZXMiOlsic2VsZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsImRhdGEiLCJwYXlsb2FkIiwianNvbiIsInRpdGxlIiwiYm9keSIsInRleHQiLCJ3YWl0VW50aWwiLCJyZWdpc3RyYXRpb24iLCJzaG93Tm90aWZpY2F0aW9uIiwiaWNvbiIsImJhZGdlIiwiZGlyIiwibGFuZyIsImxpbmsiLCJub3RpZmljYXRpb24iLCJjbG9zZSIsImNsaWVudHMiLCJtYXRjaEFsbCIsInR5cGUiLCJpbmNsdWRlVW5jb250cm9sbGVkIiwidGhlbiIsImNsaWVudCIsInVybCIsImluY2x1ZGVzIiwiZm9jdXMiLCJvcGVuV2luZG93Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./worker/index.js\n"));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	!function() {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = function() {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: function(script) { return script; }
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	!function() {
/******/ 		__webpack_require__.ts = function(script) { return __webpack_require__.tt().createScript(script); };
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	!function() {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push(function(options) {
/******/ 			var originalFactory = options.factory;
/******/ 			options.factory = function(moduleObject, moduleExports, webpackRequire) {
/******/ 				var hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				var cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : function() {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./worker/index.js");
/******/ 	
/******/ })()
;