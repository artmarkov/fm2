/*global define, console*/
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
// our viewmodel for our utility viewmodel(config and such)
define(function (require) {
    "use strict";
    var $ = require("jquery");
    //var ko = require("knockout");

    return function (config) {
        var self = this;

        self.getLanguage = function () {
            var culture;

            switch (config.options.culture) {
            case "en":
                culture = JSON.parse(require("text!scripts/languages/en.json"));
                break;
            }

            return culture;
        };

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
        };

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
        };
    };
});