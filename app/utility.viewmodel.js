
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
// our viewmodel for our utility viewmodel(config and such)
var $ = require("jquery");
var toastr = require("toastr");

module.exports = function (appVM) {
    "use strict";
    var self = this;
    self.apiUrl = "";

    self.getLanguage = function () {
        var culture;

        switch (appVM.config.options.culture) {
            case "ar":
                culture = require("./lang/ar.json");
                break;
            case "bs":
                culture = require("./lang/bs.json");
                break;
            case "ca":
                culture = require("./lang/ca.json");
                break;
            case "cs":
                culture = require("./lang/cs.json");
                break;
            case "da":
                culture = require("./lang/da.json");
                break;
            case "de":
                culture = require("./lang/de.json");
                break;
            case "el":
                culture = require("./lang/el.json");
                break;
            case "en":
                culture = require("./lang/en.json");
                break;
            case "en-gb":
                culture = require("./lang/en-gb.json");
                break;
            case "es":
                culture = require("./lang/es.json");
                break;
            case "fi":
                culture = require("./lang/fi.json");
                break;
            case "fr":
                culture = require("./lang/fr.json");
                break;
            case "he":
                culture = require("./lang/he.json");
                break;
            case "hu":
                culture = require("./lang/hu.json");
                break;
            case "it":
                culture = require("./lang/it.json");
                break;
            case "ja":
                culture = require("./lang/ja.json");
                break;
            case "nl":
                culture = require("./lang/nl.json");
                break;
            case "pl":
                culture = require("./lang/pl.json");
                break;
            case "pt":
                culture = require("./lang/pt.json");
                break;
            case "ru":
                culture = require("./lang/ru.json");
                break;
            case "sv":
                culture = require("./lang/sv.json");
                break;
            case "tr":
                culture = require("./lang/tr.json");
                break;
            case "vn":
                culture = require("./lang/vn.json");
                break;
            case "zh-cn":
                culture = require("./lang/zh-cn.json");
                break;
            case "zh-tw":
                culture = require("./lang/zh-tw.json");
                break;
            default:
                culture = require("./lang/en.json");
                break;
        }//switch language

        return culture;
    };//getLanguage

    self.loadTheme = function () {
        var theme;

        switch (appVM.config.options.theme) {
            case "flat-dark":
                theme = "./themes/flat-dark.css";
                break;
            case "flat-oil":
                theme = "./themes/flat-oil.css";
                break;
            case "flat-turquoise":
                theme = "./themes/flat-turquoise.css";
                break;
            default:
                theme = "./themes/default.css";
        }//switch theme

        var cssLink = $("<link rel='stylesheet' type='text/css' href='" + theme + "'>");
        $("head").append(cssLink);

        return theme;
    };//loadTheme

    // return filename extension, I bet there is a robust library for this somewhere?
    self.getExtension = function (filename) {
        if (filename.split(".").length === 1) {
            return "";
        }//if
        return filename.split(".").pop().toLowerCase();
    };//getExtension

    // function to retrieve GET params, I bet there is a robust library for this somewhere?
    self.urlParameters = function (name) {
        var results = new RegExp("[\\?&]" + name + "=([^&#]*)").exec(window.location.href);
        if (results) {
            return results[1];
        }//if
        return 0;
    };//urlParameters

    self.normalizePath = function (path) {
        // Firstly, if path is just "/", just return it
        if (path === "/") {
            return path;
        }
        // First character needs to be a slash
        if (path.substr(0, 1) !== "/") {
            path = "/" + path;
        }
        // Last character should not be a slash
        if (path.substr(-1) === "/") {
            path = path.slice(0, -1);
        }
        return path;
    };//normalizePath

    // function to parse and return the exclusive path
    self.getExclusiveFolder = function () {
        var ef = decodeURI(self.urlParameters("exclusiveFolder"));
        // first we check if the parameter even exists
        ef = ef === "0" ? "/" : ef;

        return self.normalizePath(ef);
    };//getExclusiveFolder

    self.getRelativePath = function (path) {
        var ef = self.normalizePath(self.getExclusiveFolder());
        path = self.normalizePath(path || "/");

        // First, if the exclusive folder is simply the root, just return the path
        if (ef === "/") {
            return path;
        } else if (ef === path) {
            return "/";
        } else if (path.indexOf(ef) === -1) { //path is already relative
            return path;
        }
        // otherwise, remove the exclusive folder from the path
        return path.replace(ef, "");
    };//getRelativePath

    self.getFullPath = function (path) {
        var ef = self.normalizePath(self.getExclusiveFolder());
        path = self.normalizePath(path);

        // First, if the exclusive folder is simply the root, just return the path
        if (ef === "/") {
            return path;
        } else if (path.indexOf(ef) === -1) { //path is relative, so add the exclusive folder
            return self.normalizePath(ef + path);
        }
        // Path is already the full path if it contains the exclusive folder
        return path;
    };//getFullPath

    // Handle ajax request error.
    var handleAjaxError = function (err) {
        $.each(err, function (ignore, e) {
            toastr.error(e.title + ": " + e.code, e.detail, {"positionClass": "toast-bottom-right"});
        });//each error
    };//handleAjaxError

    // Function to get the proper api url
    var setApiUrl = function () {
        var cfg = appVM.config.api;
        if (cfg.production) {
            if (cfg.production.hostnames.indexOf(window.location.hostname) !== -1) {
                return self.apiUrl = cfg.production.url;
            }
            if (cfg.qa.hostnames.indexOf(window.location.hostname) !== -1) {
                return self.apiUrl = cfg.qa.url;
            }
            if (cfg.development.hostnames.indexOf(window.location.hostname) !== -1) {
                return self.apiUrl = cfg.development.url;
            }
            if (cfg.local.hostnames.indexOf(window.location.hostname) !== -1) {
                return self.apiUrl=  cfg.local.url;
            }
        }
        return self.apiUrl = appVM.config.api.local.url;
    }; // apiUrl
    setApiUrl();

    // There was to much duplicate code in these methods, this should help clean them up.
    self.apiExecute = function (urlExtra, method, options) {
        var ajaxOptions = {
            "url": self.apiUrl
                + options.url
                + "?path=" + encodeURIComponent(self.getFullPath(options.path || "/"))
                + urlExtra,
            "method": method,
            "dataType": options.dataType || "json",
            "success": function (data) {
                if (data.errors) {
                    handleAjaxError(data.errors);
                } else {
                    options.success(data.data);
                } // if
            }, // success
            "error": function (err) {
                if (options.error) {
                    options.error(err);
                } else {
                    handleAjaxError(err);
                } // if
            } // error
        }; // ajaxOptions

        if (appVM.config.options.getParams) {
            $.extend(ajaxOptions, appVM.config.options.getParams);
        } // if

        if (typeof ajaxOptions.url === "undefined") {
            debugger;
        }

        $.ajax(ajaxOptions);
    }; // apiExecute

    // This is our main access point for the api, everything should pass through this call that is a GET
    self.apiGet = function (options) {
        // debugger;
        self.apiExecute("", "GET", options);
    };//apiGet

    // This is our main access point for the api, everything should pass through this call that is a POST
    self.apiPost = function (options) {
        var urlExtra = "&name=" + encodeURIComponent(options.name);

        self.apiExecute(urlExtra, "POST", options);
    };//apiPost

    // This is our main access point for the api, everything should pass through this call that is a PUT
    self.apiPut = function (options) {
        var urlExtra = "&new=" + encodeURIComponent(options.new);

        self.apiExecute(urlExtra, "PUT", options);
    };//apiPut

    // This is our main access point for the api, everything should pass through this call that is a PATCH
    self.apiPatch = function (options) {
        var urlExtra = "&newPath=" + encodeURIComponent(options.newPath);

        self.apiExecute(urlExtra, "PATCH", options);
    };//apiPatch

    // This is our main access point for the api, everything should pass through this call that is a DELETE
    self.apiDelete = function (options) {
        self.apiExecute("", "DELETE", options);
    };//apiGet

    self.setDimensions = function () {
        var windowHeight = $(window).height(),
            $uploader = $("#uploader"),
            headerHeight = $uploader.height(),
            headerOffset = $uploader.offset().top,
            footerHeight = $("#footer").height(),
            ckEditorExtraHeight = 0;

        if (self.urlParameters("CKEditorCleanUpFuncNum")) {
            ckEditorExtraHeight += 60;
        }//if

        var newH = windowHeight - headerHeight - footerHeight - headerOffset - ckEditorExtraHeight;
        $("#splitter, #filetree, #fileinfo, .vsplitbar").height(newH);
    };//setDimensions

    $(window).resize(self.setDimensions);
};//function