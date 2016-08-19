/*global define, console*/
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
// our viewmodel for our utility viewmodel(config and such)
define(function (require) {
    "use strict";
    var $ = require("jquery");
    var toastr = require("toastr");
    //var ko = require("knockout");

    return function (config) {
        var self = this;
        // toastr.info("Is toastr working :)", "Yup, it's are working", {"positionClass": "toast-bottom-right"});

        self.getLanguage = function () {
            var culture;

            switch (config.options.culture) {
            case "en":
                culture = JSON.parse(require("text!scripts/languages/en.json"));
                break;
            }

            return culture;
        };//getLanguage

        self.loadTheme = function () {
            var theme;

            switch (config.options.theme) {
            case "flat-dark":
                theme = "themes/flat-dark/styles/filemanager.css";
                break;
            case "flat-oil":
                theme = "themes/flat-oil/styles/filemanager.css";
                break;
            case "flat-turquoise":
                theme = "themes/flat-turquoise/styles/filemanager.css";
                break;
            default:
                theme = "themes/default/styles/filemanager.css";
            }

            var cssLink = $("<link rel='stylesheet' type='text/css' href='" + theme + "'>");
            $("head").append(cssLink);

            return theme;
        };//loadTheme

        self.loadIeFix = function () {
            var theme;

            switch (config.options.theme) {
            case "flat-dark":
                theme = "themes/flat-dark/styles/ie.css";
                break;
            case "flat-oil":
                theme = "themes/flat-oil/styles/ie.css";
                break;
            case "flat-turquoise":
                theme = "themes/flat-turquoise/styles/ie.css";
                break;
            default:
                theme = "themes/default/styles/ie.css";
            }

            var cssLink = $("<link rel='stylesheet' type='text/css' href='" + theme + "'>");
            $("head").append(cssLink);

            return theme;
        };//loadIeFix

        // function to retrieve GET params
        self.urlParameters = function (name) {
            var results = new RegExp("[\\?&]" + name + "=([^&#]*)").exec(window.location.href);
            if (results) {
                return results[1];
            }
            return 0;
        };//urlParameters

        // Handle ajax request error.
        var handleAjaxError = function (err) {
            console.log("handle it?")
            $.each(err, function (ignore, e) {
                console.log("e -> ", e);
                toastr.error(e.title + ": " + e.code, e.detail, {"positionClass": "toast-bottom-right"});
            });
        };//handleAjaxError

        // This is our main access point for the api, everything should pass through this call that is a GET
        self.apiGet = function (options) {
            var url = config.options.fileConnector
                + "?mode=" + options.mode
                + "&path=" + options.path
                + "&old=" + options.old
                + "&new=" + options.new
                + "&name=" + encodeURIComponent(options.foldername)
                + "&time=" + Date.now();


            var ajaxOptions = {
                "url": url,
                "dataType": options.dataType || "json",
                "success": function (data) {
                    if (data.errors) {
                        handleAjaxError(data.errors);
                    } else {
                        options.success(data.data);
                    }
                },
                "error": function (err) {
                    if (options.error) {
                        options.error(err);
                    } else {
                        handleAjaxError(err);
                    }
                }
            };

            // console.log("config -> ", config.options.getParams);
            // console.log("ajaxOptions before -> ", ajaxOptions);
            if (config.options.getParams) {
                $.extend(ajaxOptions, config.options.getParams);
            }
            //console.log("ajaxOptions after -> ", ajaxOptions);

            $.ajax(ajaxOptions);
        };//apiGet

        self.getIconUrl = function (file) {
            var url = config.icons.path;
            if (file.isDirectory) {
                url += config.icons.directory;
            } else {
                url += file.fileType + ".png";
            }

            return url;
        };//getIconUrl

        self.getDownloadUrl = function (path) {
            return config.options.fileConnector
                + "?mode=download"
                + "&path=" + path
                + "&time=" + Date.now();
        };//getDownloadUrl
    };//function
});//define