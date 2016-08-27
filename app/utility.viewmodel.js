
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
// our viewmodel for our utility viewmodel(config and such)
var $ = require("jquery");
var toastr = require("toastr");

module.exports = function (appVM) {
    "use strict";
    var self = this;

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

    // Handle ajax request error.
    var handleAjaxError = function (err) {
        $.each(err, function (ignore, e) {
            toastr.error(e.title + ": " + e.code, e.detail, {"positionClass": "toast-bottom-right"});
        });//each error
    };//handleAjaxError

    // This is our main access point for the api, everything should pass through this call that is a GET
    self.apiGet = function (options) {
        var url = "";
        if (options.url) {
            url = appVM.config.options.fileConnector + options.url + "?path=" + options.path;
        } else {
            url = appVM.config.options.fileConnector
                    + "?mode=" + options.mode
                    + "&path=" + options.path
                    + "&old=" + options.old
                    + "&new=" + options.new
                    + "&name=" + encodeURIComponent(options.foldername)
                    + "&time=" + Date.now();
        }//if url, everything should have a url now

        var ajaxOptions = {
            "url": url,
            "dataType": options.dataType || "json",
            "success": function (data) {
                if (data.errors) {
                    handleAjaxError(data.errors);
                } else {
                    options.success(data.data);
                }//if
            }, //success
            "error": function (err) {
                if (options.error) {
                    options.error(err);
                } else {
                    handleAjaxError(err);
                }//f
            }//error
        }; //ajaxOptions

        if (appVM.config.options.getParams) {
            $.extend(ajaxOptions, appVM.config.options.getParams);
        }//if getParams

        $.ajax(ajaxOptions);
    };//apiGet

    // This is our main access point for the api, everything should pass through this call that is a POST
    self.apiPost = function (options) {
        var url = appVM.config.options.fileConnector
                + options.url
                + "?path=" + encodeURIComponent(options.path)
                + "&name=" + encodeURIComponent(options.name);

        var ajaxOptions = {
            "url": url,
            "method": "POST",
            "dataType": options.dataType || "json",
            "success": function (data) {
                if (data.errors) {
                    handleAjaxError(data.errors);
                } else {
                    options.success(data.data);
                } //if
            }, //success
            "error": function (err) {
                if (options.error) {
                    options.error(err);
                } else {
                    handleAjaxError(err);
                }//if
            }//error
        }; //ajaxOptions

        if (appVM.config.options.getParams) {
            $.extend(ajaxOptions, appVM.config.options.getParams);
        }//if

        $.ajax(ajaxOptions);
    };//apiPost

    // This is our main access point for the api, everything should pass through this call that is a PUT
    self.apiPut = function (options) {
        var url = appVM.config.options.fileConnector + options.url + "?path=" + options.path + "&new=" + options.new;

        var ajaxOptions = {
            "url": url,
            "method": "PUT",
            "dataType": options.dataType || "json",
            "success": function (data) {
                if (data.errors) {
                    handleAjaxError(data.errors);
                } else {
                    options.success(data.data);
                }//if
            }, //success
            "error": function (err) {
                if (options.error) {
                    options.error(err);
                } else {
                    handleAjaxError(err);
                }//if
            }//error
        }; //ajaxOptions

        if (appVM.config.options.getParams) {
            $.extend(ajaxOptions, appVM.config.options.getParams);
        }//if

        $.ajax(ajaxOptions);
    };//apiPut

    // This is our main access point for the api, everything should pass through this call that is a PATCH
    self.apiPatch = function (options) {
        var url = appVM.config.options.fileConnector
                + options.url
                + "?path="
                + options.path
                + "&newPath="
                + options.newPath;

        var ajaxOptions = {
            "url": url,
            "method": "PATCH",
            "dataType": options.dataType || "json",
            "success": function (data) {
                if (data.errors) {
                    handleAjaxError(data.errors);
                } else {
                    options.success(data.data);
                }//if
            }, //success
            "error": function (err) {
                if (options.error) {
                    options.error(err);
                } else {
                    handleAjaxError(err);
                }//if
            }//error
        }; //ajaxOptions

        if (appVM.config.options.getParams) {
            $.extend(ajaxOptions, appVM.config.options.getParams);
        }//if

        $.ajax(ajaxOptions);
    };//apiPatch

    // This is our main access point for the api, everything should pass through this call that is a DELETE
    self.apiDelete = function (options) {
        var url = appVM.config.options.fileConnector
                + options.url
                + "?path=" + options.path;

        var ajaxOptions = {
            "url": url,
            "method": "DELETE",
            "dataType": options.dataType || "json",
            "success": function (data) {
                if (data.errors) {
                    handleAjaxError(data.errors);
                } else {
                    options.success(data.data);
                }//if
            }, //success
            "error": function (err) {
                if (options.error) {
                    options.error(err);
                } else {
                    handleAjaxError(err);
                }//if
            }//error
        }; //ajaxOptions

        if (appVM.config.options.getParams) {
            $.extend(ajaxOptions, appVM.config.options.getParams);
        }//if

        $.ajax(ajaxOptions);
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