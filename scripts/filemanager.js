/*property
    $, ALLOWED_FILE_TYPE, CKEDITOR, Capabilities, Code, Content,
    DISALLOWED_FILE_TYPE, ERROR_REPLACING_FILE, ERROR_SERVER,
    ERROR_UPLOADING_FILE, Error, Filename, Height, INVALID_FILE_TYPE,
    ImageDialog, IsDirectory, Name, Parent, Path, Preview, Properties,
    Protected, SetUrl, Size, UPLOAD_IMAGES_ONLY, Width, acceptedFiles,
    activeEditor, addClass, addRemoveLinks, advanced, after, ajax, ajaxForm,
    allowChangeExtensions, allowFolderDownload, allowNoExtension,
    alwaysShowScrollbar, apiGet, append, async, attr, audios, audiosExt,
    autoExpandHorizontalScroll, autoProcessQueue, autoload, axis, baseUrl,
    before, beforeSubmit, bind, blur, browse, browseOnly, browser, button,
    buttons, bytes, cache, callFunction, callback, callbacks, cancel,
    capabilities, change, charAt, chars_only_latin, children, clearInterval,
    click, clone, close, closest, colorbox, complete, confirmation_delete,
    contextMenu, copied, copy_to_clipboard, could_not_retrieve_folder,
    create_folder, created, css, culture, current_folder, customScrollbar,
    data, dataType, datafunc, defaultViewMode, default_foldername, del, delay,
    dictCancelUpload, dictDefaultMessage, dictFileTooBig, dictInvalidFileType,
    dictMaxFilesExceeded, dictRemoveFile, dimensions, directory, document,
    documentElement, download, dropzone, dz_dictDefaultMessage,
    dz_dictInvalidFileType, dz_dictMaxFilesExceeded, each, edit, editExt,
    empty, enable, enabled, error, exec, expandedFolder, extend, extra_js,
    extra_js_async, extras, fadeIn, fadeOut, fck_select_integration,
    fileConnector, fileRoot, fileSizeLimit, fileTree, file_size_limit,
    file_too_big, files, find, fn, folderCallback, foldername, gb, get,
    getElementById, getIconUrl, getImageData, getJSON, getMilliseconds,
    getParams, getQueuedFiles, getRejectedFiles, getTime, getUploadingFiles,
    getValue, getWindowArg, grid_view, hasClass, hasOwnProperty, height,
    help_move, hide, host, href, html, icons, images, imagesExt, imagesOnly,
    inArray, indexOf, init, innerHTML, items, join, kb, lang, lastIndexOf,
    left, length, listFiles, list_view, liveUpdate, load, loading_data,
    location, log, logger, mCustomScrollbar, maxFiles, maxFilesize, mb, menu,
    minLeft, minRight, mode, modified, move, msie, multiFolder, multiple, name,
    new_filename, new_folder, next, no, no_foldername, now, number, offset,
    onInit, opacity, opener, options, overlayspeed, parallelUploads, paramName,
    parent, parentfolder, parseJSON, path, pathname, pdfs, pdfsExt,
    pdfsReaderHeight, pdfsReaderWidth, persistent, pop, prepend, prev,
    processQueue, prompt, prompt_foldername, protocol, push, quickSelect,
    quit_editor, remove, removeAttr, removeClass, removeFile, rename, replace,
    replaceWith, resize, reverse, root, round, save, scrollButtons, search,
    searchBox, search_reset, security, select, select_from_left, sending,
    serializeArray, serverRoot, setAttribute, setDefaults, show,
    showAudioPlayer, showConfirmation, showFullPath, showPdfReader,
    showPreviewImage, showTitleAttr, showVideoPlayer, size, sizeLeft, slice,
    split, splitter, splitterMinWidth, submit, substr, substring, success,
    successful_added_file, successful_added_folder, successful_delete,
    successful_edit, successful_moved, successful_rename, successful_replace,
    support_fm, tablesorter, target, text, textExtraction, theme, tinyMCE,
    tinyMCEPopup, toLowerCase, toString, tools, top, totaluploadprogress,
    trigger, type, unbind, updateOnContentResize, upload, uploadPolicy,
    uploadRestrictions, url, urlParameters, userAgent, userconfig, val, value,
    version, videos, videosExt, videosPlayerHeight, videosPlayerWidth, width,
    windowManager, wrapInner, yes
*/
/**
 *    Filemanager JS core
 *
 *    filemanager.js
 *
 *    @license    MIT License
 *    @author        Jason Huck - Core Five Labs
 *    @author        Simon Georget <simon (at) linea21 (dot) com>
 *    @copyright    Authors
 */

(function ($) {
    "use strict";
    var _$ = {},
        userconfig = "",
        HEAD_included_files,
        codeMirrorEditor,
        fileConnector,
        fileRoot,
        baseUrl,
        capabilities,
        start,
        lg = [],
        fullexpandedFolder,
        config,
        configd;
    // function to retrieve GET params
    _$.urlParameters = function (name) {
        var results = new RegExp("[\\?&]" + name + "=([^&#]*)").exec(window.location.href);
        if (results) {
            return results[1];
        }
        return 0;
    };

    /*---------------------------------------------------------
      Setup, Layout, and Status Functions
    ---------------------------------------------------------*/

    // We retrieve config settings from filemanager.config.js
    var loadConfigFile = function (type) {
        var json = null,
            url;
        type = (type === undefined)
            ? "user"
            : type;

        if (type === "user") {
            if (_$.urlParameters("config") !== 0) {
                url = "./scripts/" + _$.urlParameters("config");
                _$.userconfig = _$.urlParameters("config");
            } else {
                url = "./scripts/filemanager.config.json";
                _$.userconfig = "filemanager.config.json";
            }
        } else {
            url = "./scripts/filemanager.config.default.json";
        }

        // WORKING 20160817 jlaustill
        $.ajax({
            "async": false,
            "url": url,
            "dataType": "json",
            "cache": false,
            "success": function (data) {
                //console.log("data -> ", data);
                json = data;
            }
        });
        return json;
    };

    // loading default configuration file
    configd = loadConfigFile("default");
    // loading user configuration file
    config = loadConfigFile();
    // we remove version from user config file
    if (config !== null) {
        delete config.version;
    }



    if (!config.options.fileRoot) {
        fileRoot = "/" + document.location.pathname.substring(1, document.location.pathname.lastIndexOf("/") + 1) + "userfiles/";
    } else {
        if (!config.options.serverRoot) {
            fileRoot = config.options.fileRoot;
        } else {
            fileRoot = "/" + config.options.fileRoot;
        }
        // we remove double slashes - can happen when using PHP SetFileRoot() function with fileRoot = '/' value
        fileRoot = fileRoot.replace(/\/\//g, "\/");
    }

    // we merge default config and user config file
    config = $.extend({}, configd, config);

    //noinspection JSUnresolvedVariable
    if (config.options.logger) {
        start = Date.now();
    }

    // <head> included files collector
    HEAD_included_files = [];


    /**
     * function to load a given css file into header
     * if not already included
     */
    function loadCSS(href) {
        // we check if already included
        if ($.inArray(href, HEAD_included_files) === -1) {
            var cssLink = $("<link rel='stylesheet' type='text/css' href='" + href + "'>");
            $("head").append(cssLink);
            HEAD_included_files.push(href);
        }
    }

    /**
    * function to load a given js file into header
    * if not already included
    */
    function loadJS(src) {
        // we check if already included
        if ($.inArray(src, HEAD_included_files) === -1) {
            var jsLink = $("<script type='text/javascript' src='" + src + "'>");
            $("head").append(jsLink);
            HEAD_included_files.push(src);
        }
    }

    /**
     * determine path when using baseUrl and
     * setFileRoot connector function to give back
     * a valid path on selectItem calls
     *
     */
    function smartPath(url, path) {
        var a = url.split("/"),
            rvalue,
            separator = "/" + a[a.length - 2] + "/",
            pos = path.indexOf(separator);
        // separator is not found
        // this can happen when not set dynamically with setFileRoot function - see  : https://github.com/simogeo/Filemanager/issues/354
        if (pos === -1) {
            rvalue = url + path;
        } else {
            rvalue = url + path.substring(pos + separator.length);
        }
        if (config.options.logger) {
            console.log("url : " + url
                    + " - path : " + path
                    + " - separator : " + separator
                    + " -  pos : " + pos
                    + " - returned value : " + rvalue);
        }

        return rvalue;
    }

    // Sets paths to connectors based on language selection.
    fileConnector = config.options.fileConnector || "connectors/" + config.options.lang + "/filemanager." + config.options.lang;

    // Handle ajax request error.
    var handleAjaxError = function () {
        $.prompt(lg.ERROR_SERVER);
    };

    // This is our main access point for the api, everything should pass through this call that is a GET
    _$.apiGet = function (options) {
        var url = fileConnector
                + "?mode=" + options.mode
                + "&path=" + options.path
                + "&config=" + _$.userconfig
                + "&name=" + encodeURIComponent(options.foldername)
                + "&time=" + Date.now();


        var ajaxOptions = {
            "url": url,
            "dataType": options.dataType || "json",
            //'async': false,
            "success": function (data) {
                options.success(data.data);
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
        console.log("ajaxOptions after -> ", ajaxOptions);

        $.ajax(ajaxOptions);
    };

    _$.getIconUrl = function (file) {
        var url = config.icons.path;
        if (file.IsDirectory) {
            url += config.icons.directory;
        } else {
            url += file["File Type"] + ".png";
        }

        return url;
    };

    // Read capabilities from config files if exists
    // else apply default settings
    capabilities = config.options.capabilities || ["select", "download", "rename", "move", "delete", "replace"];

    // Test if a given url exists
    function file_exists() {
        // http://kevin.vanzonneveld.net
        // +   original by: Enrique Gonzalez
        // +      input by: Jani Hartikainen
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // %        note 1: This function uses XmlHttpRequest and cannot retrieve resource from different domain.
        // %        note 1: Synchronous so may lock up browser, mainly here for study purposes.
        // *     example 1: file_exists('http://kevin.vanzonneveld.net/pj_test_supportfile_1.htm');
        // *     returns 1: '123'
        // var req = this.window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
        // if (!req) {
        //     throw new Error('XMLHttpRequest not supported');
        // }
        //
        // // HEAD Results are usually shorter (faster) than GET
        // req.open('HEAD', url, false);
        // req.send(null);
        // if (req.status === 200) {
        //     return true;
        // }

        return true;
    }

    // Get localized messages from file
    // through culture var or from URL
    if (_$.urlParameters("langCode") !== 0) {
        if (file_exists("scripts/languages/" + _$.urlParameters("langCode") + ".js")) {
            config.options.culture = _$.urlParameters("langCode");
        } else {
            var urlLang = _$.urlParameters("langCode").substring(0, 2);
            if (file_exists("scripts/languages/" + urlLang + ".js")) {
                config.options.culture = urlLang;
            }
        }
    }

    // WORKING 20160817 jlaustill
    $.ajax({
        url: "scripts/languages/" + config.options.culture + ".js",
        async: false,
        dataType: "json",
        success: function (json) {
            console.log("load language -> ", json);
            lg = json;
        }
    });

    // Options for alert, prompt, and confirm dialogues.
    $.prompt.setDefaults({
        overlayspeed: "fast",
        show: "fadeIn",
        opacity: 0.4,
        persistent: false
    });

    // Forces columns to fill the layout vertically.
    // Called on initial page load and on resize.
    var setDimensions = function () {
        var bheight = 53,
            $uploader = $("#uploader");

        if (_$.urlParameters("CKEditorCleanUpFuncNum")) {
            bheight += 60;
        }

        var newH = $(window).height() - $uploader.height() - $uploader.offset().top - bheight;
        $("#splitter, #filetree, #fileinfo, .vsplitbar").height(newH);
        var newW = $("#splitter").width() - $("div.vsplitbar").width() - $("#filetree").width();
        $("#fileinfo").width(newW);
    };

    // Display Min Path
    var displayPath = function (path, reduce) {

        reduce = reduce === undefined;

        if (config.options.showFullPath === false) {
            // if a "displayPathDecorator" function is defined, use it to decorate path
            // if ('function' === typeof displayPathDecorator) {
            //     return displayPathDecorator(path.replace(fileRoot, "/"));
            // }
            path = path.replace(fileRoot, "/");
            if (path.length > 50 && reduce === true) {
                var n = path.split("/");
                path = "/" + n[1] + "/" + n[2] + "/(...)/" + n[n.length - 2] + "/";
            }
            return path;
        }
        return path;
    };

    // Set the view buttons state
    function setViewButtonsFor(viewMode) {
        if (viewMode === "grid") {
            $("#grid").addClass("ON");
            $("#list").removeClass("ON");
        } else {
            $("#list").addClass("ON");
            $("#grid").removeClass("ON");
        }
    }

    // preg_replace
    // Code from : http://xuxu.fr/2006/05/20/preg-replace-javascript/
    function preg_replace(array_pattern, array_pattern_replace, str) {
        var new_str = String(str),
            reg_exp,
            val_to_replace,
            i;
        for (i = 0; i < array_pattern.length; i++) {
            reg_exp = new RegExp(array_pattern[i], "g");
            val_to_replace = array_pattern_replace[i];
            new_str = new_str.replace(reg_exp, val_to_replace);
        }
        return new_str;
    }

    // cleanString (), on the same model as server side (connector)
    // cleanString
    var cleanString = function (str) {
        var cleaned,
            p_search = ["Š", "š", "Đ", "đ", "Ž", "ž", "Č", "č", "Ć", "ć", "À",
                    "Á", "Â", "Ã", "Ä", "Å", "Æ", "Ç", "È", "É", "Ê", "Ë", "Ì", "Í", "Î", "Ï",
                    "Ñ", "Ò", "Ó", "Ô", "Õ", "Ö", "Ő", "Ø", "Ù", "Ú", "Û", "Ü", "Ý", "Þ", "ß",
                    "à", "á", "â", "ã", "ä", "å", "æ", "ç", "è", "é", "ê", "ë", "ì", "í",
                    "î", "ï", "ð", "ñ", "ò", "ó", "ô", "õ", "ö", "ő", "ø", "ù", "ú", "û", "ü",
                    "ý", "ý", "þ", "ÿ", "Ŕ", "ŕ", " ", "'", "/"],
            p_replace = ["S", "s", "Dj", "dj", "Z", "z", "C", "c", "C", "c", "A",
                    "A", "A", "A", "A", "A", "A", "C", "E", "E", "E", "E", "I", "I", "I", "I",
                    "N", "O", "O", "O", "O", "O", "O", "O", "U", "U", "U", "U", "Y", "B", "Ss",
                    "a", "a", "a", "a", "a", "a", "a", "c", "e", "e", "e", "e", "i", "i",
                    "i", "i", "o", "n", "o", "o", "o", "o", "o", "o", "o", "u", "u", "u", "u",
                    "y", "y", "b", "y", "R", "r", "_", "_", ""];

        cleaned = preg_replace(p_search, p_replace, str);

        // allow only latin alphabet
        if (config.options.chars_only_latin) {
            cleaned = cleaned.replace(/[^_a-zA-Z0-9]/g, "");
        }

        cleaned = cleaned.replace(/[_]+/g, "_");

        return cleaned;
    };

    // nameFormat (), separate filename from extension before calling cleanString()
    // nameFormat
    function nameFormat(input) {
        var filename;
        if (input.lastIndexOf(".") !== -1) {
            filename = cleanString(input.substr(0, input.lastIndexOf(".")));
            filename += "." + input.split(".").pop();
        } else {
            filename = cleanString(input);
        }
        return filename;
    }

    //Converts bytes to kb, mb, or gb as needed for display.
    function formatBytes(bytes) {
        var n = parseFloat(bytes),
            d = parseFloat(1024),
            c = 0,
            u = [lg.bytes, lg.kb, lg.mb, lg.gb];

        while (true) {
            if (n < d) {
                n = Math.round(n * 100) / 100;
                return n + u[c];
            }
            n /= d;
            c += 1;
        }
    }

    // Handle Error. Freeze interactive buttons and display
    // error message. Also called when auth() function return false (Code == "-1")
    function handleError(errMsg) {
        $("#fileinfo").html("<h1>" + errMsg + "</h1>");
        $("#newfile").attr("disabled", "disabled");
        $("#upload").attr("disabled", "disabled");
        $("#newfolder").attr("disabled", "disabled");
    }

    // Test if Data structure has the 'cap' capability
    // 'cap' is one of 'select', 'rename', 'delete', 'download', move
    function has_capability(data, cap) {
        if (data["File Type"] === "dir" && cap === "replace") {
            return false;
        }
        if (data["File Type"] === "dir" && cap === "download") {
            return config.security.allowFolderDownload === true;
        }
        if (data.Capabilities === undefined) {
            return true;
        }
        return $.inArray(cap, data.Capabilities) > -1;
    }

    // return filename extension
    function getExtension(filename) {
        if (filename.split(".").length === 1) {
            return "";
        }
        return filename.split(".").pop().toLowerCase();
    }

    // Test if file is authorized
    function isAuthorizedFile(filename) {
        var ext = getExtension(filename);

        // no extension is allowed
        if (ext === "" && config.security.allowNoExtension === true) {
            return true;
        }
        if (config.security.uploadPolicy === "DISALLOW_ALL") {
            if ($.inArray(ext, config.security.uploadRestrictions) !== -1) {
                return true;
            }
        }
        if (config.security.uploadPolicy === "ALLOW_ALL") {
            if ($.inArray(ext, config.security.uploadRestrictions) === -1) {
                return true;
            }
        }
        return false;
    }

    // from http://phpjs.org/functions/basename:360
    // function basename(path, suffix) {
    //     var b = path.replace(/^.*[\/\\]/g, '');
    //
    //     if (typeof suffix === 'string' && b.substr(b.length - suffix.length) === suffix) {
    //         b = b.substr(0, b.length - suffix.length);
    //     }
    //     return b;
    // }

    // return filename without extension {
    function getFilename(filename) {
        if (filename.lastIndexOf(".") !== -1) {
            return filename.substring(0, filename.lastIndexOf("."));
        }
        return filename;
    }

    //Test if is editable file
    function isEditableFile(filename) {
        return $.inArray(getExtension(filename), config.edit.editExt) !== -1;
    }

    // Test if is image file
    // function isImageFile(filename) {
    //     if ($.inArray(getExtension(filename), config.images.imagesExt) !== -1) {
    //         return true;
    //     }
    //     return false;
    // }

    // Test if file is supported web video file
    function isVideoFile(filename) {
        return $.inArray(getExtension(filename), config.videos.videosExt) !== -1;
    }

    // Test if file is supported web audio file
    function isAudioFile(filename) {
        return $.inArray(getExtension(filename), config.audios.audiosExt) !== -1;
    }

    // Test if file is pdf file
    function isPdfFile(filename) {
        return $.inArray(getExtension(filename), config.pdfs.pdfsExt) !== -1;
    }

    // Return HTML video player
    function getVideoPlayer(data) {
        var code = "<video width=" + config.videos.videosPlayerWidth
                + " height=" + config.videos.videosPlayerHeight
                + " src='" + data.Path + "' controls='controls'>";
        code += "<img src='" + data.Preview + "' />";
        code += "</video>";

        $("#fileinfo img").remove();
        $("#fileinfo #preview #main-title").before(code);
    }

    //Return HTML audio player
    function getAudioPlayer(data) {
        var code = "<audio src='" + data.Path
                + "' controls='controls'>";
        code += "<img src='" + data.Preview + "' />";
        code += "</audio>";

        $("#fileinfo img").remove();
        $("#fileinfo #preview #main-title").before(code);
    }

    //Return PDF Reader
    function getPdfReader(data) {
        var code = "<iframe id='fm-pdf-viewer' src = 'scripts/ViewerJS/index.html#" + data.Path
                + "' width='" + config.pdfs.pdfsReaderWidth
                + "' height='" + config.pdfs.pdfsReaderHeight
                + "' allowfullscreen webkitallowfullscreen></iframe>";

        $("#fileinfo img").remove();
        $("#fileinfo #preview #main-title").before(code);
    }

    // Display icons on list view
    // retrieving them from filetree
    // Called using SetInterval
    function display_icons(timer) {
        $("#fileinfo").find("td:first-child").each(function () {
            var path = $(this).attr("data-path"),
                treenode = $("#filetree").find("a[data-path='" + path + "']").parent();

            if (treenode.css("background-image") !== undefined) {
                $(this).css("background-image", treenode.css("background-image"));
                window.clearInterval(timer);
            }
        });
    }



    /*---------------------------------------------------------
      Functions to Update the File Tree
    ---------------------------------------------------------*/

    // Adds a new node as the first item beneath the specified
    // parent node. Called after a successful file upload.
    function addNode(path, name) {
        var needsCreateFileTree = false;
        var ext = getExtension(name),
            thisNode = $("#filetree").find("a[data-path='" + path + "']"),
            parentNode = thisNode.parent(),
            newNode = "<li class='file ext_" + ext + "'><a data-path='" + path + name + "' href='#' class=''>" + name + "</a></li>";

        // if is root folder
        // TODO optimize
        if (!parentNode.find("ul").size()) {
            parentNode = $("#filetree").find("ul.jqueryFileTree");

            parentNode.prepend(newNode);
            //createFileTree();
            needsCreateFileTree = true;

        } else {
            parentNode.find("ul").prepend(newNode);
            thisNode.click().click();
        }

        //getFolderInfo(path); // update list in main window

        if (config.options.showConfirmation) {
            $.prompt(lg.successful_added_file);
        }
        return needsCreateFileTree;
    }

    // Updates the specified node with a new name. Called after
    // a successful rename operation.
    function updateNode(oldPath, newPath, newName) {
        var thisNode = $("#filetree").find("a[data-path='" + oldPath + "']"),
            parentNode = thisNode.parent().parent().prev("a");
        thisNode.attr("data-path", newPath).text(newName);

        // we work directly on root folder
        // TODO optimize by binding only the renamed element
        if (parentNode.length === 0) {
            //createFileTree();
            return true;
        } else {
            parentNode.click().click();
            return false;
        }
    }

    // Removes the specified node. Called after a successful
    // delete operation.
    var removeNode = function (path) {
        $("#filetree")
            .find("a[data-path='" + path + "']")
            .parent()
            .fadeOut("slow", function () {
                $(this).remove();
            });
        //// if the actual view is the deleted folder, we display parent folder
        //if ($("#uploader h1").attr("data-path") === path) {
        //    var a =  path.split("/");
        //    var parent = a.slice(0, length - 2).join("/") + "/";
        //    getFolderInfo(parent);
        //}
        // grid case
        if ($("#fileinfo").data("view") === "grid") {
            $("#contents img[data-path='" + path + "']").parent().parent()
                .fadeOut("slow", function () {
                    $(this).remove();
                });
        } else { // list case
            $("table#contents")
                .find("td[data-path='" + path + "']")
                .parent()
                .fadeOut("slow", function () {
                    $(this).remove();
                });
        }
        //// remove fileinfo when item to remove is currently selected
        //if ($("#preview").length) {
        //    getFolderInfo(path.substr(0, path.lastIndexOf("/") + 1));
        //}
    };

    // Retrieves data for all items within the given folder and
    // creates a list view. Binds contextual menu options.
    // TODO: consider stylesheet switching to switch between grid
    // and list views with sorting options.
    function getFolderInfo(path) {
        // Update location for status, upload, & new folder functions.
        setUploader(path);

        // Display an activity indicator.
        var loading = '<img id="activity" src="themes/' + config.options.theme + '/images/wait30trans.gif" width="30" height="30" />';

        // test if scrollbar plugin is enabled
        if ($("#fileinfo .mCSB_container").length > 0) {
            $("#fileinfo .mCSB_container").html(loading);
        } else {
            $("#fileinfo").html(loading);
        }

        $("#loading-wrap").fadeOut(800); // we remove loading screen div

        // Retrieve the data and generate the markup.
        //var d = new Date(); // to prevent IE cache issues
        //var url = fileConnector + "?path=" + encodeURIComponent(path) + "&config=" + userconfig + "&mode=getfolder&showThumbs=" + config.options.showThumbs + "&time=" + d.getMilliseconds();
        //if (_$.urlParameters("type")) {
        //    url += "&type=" + _$.urlParameters("type");
        //}
        _$.apiGet({
            mode: "getfolder",
            path: encodeURIComponent(path),
            success: function(data) {
                var result = "",
                    cap,
                    props,
                    cap_classes,
                    scaledWidth,
                    actualWidth,
                    title,
                    counter = 0,
                    totalSize = 0,
                    key;

                // Is there any error or user is unauthorized?
                if (data.Code === "-1") {
                    handleError(data.Error);
                    return;
                }

                setDimensions(); //fix dimensions before all images load

                if (data) {
                    if ($("#fileinfo").data("view") === "grid") {
                        result += '<ul id="contents" class="grid">';

                        for (key in data) {
                            if (data.hasOwnProperty(key)) {
                                counter++;
                                props = data[key].Properties;
                                cap_classes = "";
                                for (cap in capabilities) {
                                    if (capabilities
                                        .hasOwnProperty(cap) &&
                                        has_capability(data[key], capabilities[cap])) {
                                        cap_classes += " cap_" + capabilities[cap];
                                    }
                                }

                                scaledWidth = 64;
                                actualWidth = props.Width;
                                if (actualWidth > 1 && actualWidth < scaledWidth) {
                                    scaledWidth = actualWidth;
                                }

                                if (config.options.showTitleAttr) {
                                    title = ' title="' + data[key].Path + '"';
                                } else {
                                    title = "";
                                }

                                result += '<li class="' +
                                    cap_classes +
                                    '"' +
                                    title +
                                    '"><div class="clip"><img src="' +
                                    _$.getIconUrl(data[key]) +
                                    '" width="' +
                                    scaledWidth +
                                    '" alt="' +
                                    data[key].Path +
                                    '" data-path="' +
                                    data[key].Path +
                                    '" /></div><p>' +
                                    data[key].Filename +
                                    "</p>";
                                if (props.Width && props.Width !== "") {
                                    result += '<span class="meta dimensions">' +
                                        props.Width +
                                        "x" +
                                        props.Height +
                                        "</span>";
                                }
                                if (props.Size && props.Size !== "") {
                                    result += '<span class="meta size">' + props.Size + "</span>";
                                }
                                if (props.Size && props.Size !== "") {
                                    totalSize += props.Size;
                                }
                                if (props["Date Created"] && props["Date Created"] !== "") {
                                    result += '<span class="meta created">' + props["Date Created"] + "</span>";
                                }
                                if (props["Date Modified"] && props["Date Modified"] !== "") {
                                    result += '<span class="meta modified">' + props["Date Modified"] + "</span>";
                                }
                                result += "</li>";
                            } //if hasOwnProperty
                        } //for key in data

                        result += "</ul>";
                    } else {
                        result += '<table id="contents" class="list">';
                        result += '<thead><tr><th class="headerSortDown"><span>' +
                            lg.name +
                            "</span></th><th><span>" +
                            lg.dimensions +
                            "</span></th><th><span>" +
                            lg.size +
                            "</span></th><th><span>" +
                            lg.modified +
                            "</span></th></tr></thead>";
                        result += "<tbody>";

                        for (key in data) {
                            if (data.hasOwnProperty(key)) {
                                counter++;
                                path = data[key].Path;
                                props = data[key].Properties;
                                cap_classes = "";
                                if (config.options.showTitleAttr) {
                                    title = ' title="' + data[key].Path + '"';
                                } else {
                                    title = "";
                                }

                                for (cap in capabilities) {
                                    if (capabilities
                                        .hasOwnProperty(cap) &&
                                        has_capability(data[key], capabilities[cap])) {
                                        cap_classes += " cap_" + capabilities[cap];
                                    }
                                }
                                result += '<tr class="' + cap_classes + '">';
                                result += '<td data-path="' +
                                    data[key].Path +
                                    '"' +
                                    title +
                                    '">' +
                                    data[key].Filename +
                                    "</td>";

                                if (props.Width && props.Width !== "") {
                                    result += ("<td>" + props.Width + "x" + props.Height + "</td>");
                                } else {
                                    result += "<td></td>";
                                }

                                if (props.Size && props.Size !== "") {
                                    result += '<td><abbr title="' +
                                        props.Size +
                                        '">' +
                                        formatBytes(props.Size) +
                                        "</abbr></td>";
                                    totalSize += props.Size;
                                } else {
                                    result += "<td></td>";
                                }

                                if (props["Date Modified"] && props["Date Modified"] !== "") {
                                    result += "<td>" + props["Date Modified"] + "</td>";
                                } else {
                                    result += "<td></td>";
                                }

                                result += "</tr>";
                            }
                        }

                        result += "</tbody>";
                        result += "</table>";
                    }
                } else {
                    result += "<h1>" + lg.could_not_retrieve_folder + "</h1>";
                }

                // Add the new markup to the DOM.
                // test if scrollbar plugin is enabled
                if ($("#fileinfo .mCSB_container").length > 0) {
                    $("#fileinfo .mCSB_container").html(result);
                } else {
                    $("#fileinfo").html(result);
                }

                // update #folder-info
                $("#items-counter").text(counter);
                $("#items-size").text(Math.round(totalSize / 1024 / 1024 * 100) / 100);

                // Bind click events to create detail views and add
                // contextual menu options.
                if ($("#fileinfo").data("view") === "grid") {
                    $("#fileinfo")
                        .find("#contents li")
                        .click(function() {
                            path = $(this).find("img").attr("data-path");
                            if (config.options.quickSelect &&
                                data[path]["File Type"] !== "dir" &&
                                $(this).hasClass("cap_select")) {
                                selectItem(data[path]);
                            } else {
                                getDetailView(path);
                            }
                        })
                        .each(function() {
                            $(this)
                                .contextMenu(
                                    { menu: getContextMenuOptions($(this)) },
                                    function(action, el) {
                                        path = $(el).find("img").attr("data-path");
                                        setMenus(action, path);
                                    }
                                );
                        });
                } else {
                    $("#fileinfo tbody tr")
                        .click(function() {
                            path = $("td:first-child", this).attr("data-path");
                            if (config.options.quickSelect &&
                                data[path]["File Type"] !== "dir" &&
                                $(this).hasClass("cap_select")) {
                                selectItem(data[path]);
                            } else {
                                getDetailView(path);
                            }
                        })
                        .each(function() {
                            $(this)
                                .contextMenu(
                                    { menu: getContextMenuOptions($(this)) },
                                    function(action, el) {
                                        path = $("td:first-child", el).attr("data-path");
                                        setMenus(action, path);
                                    }
                                );
                        });

                    $("#fileinfo")
                        .find("table")
                        .tablesorter({
                            textExtraction: function(node) {
                                if ($(node).find("abbr").size()) {
                                    return $(node).find("abbr").attr("title");
                                }
                                return node.innerHTML;
                            }
                        });
                    // Calling display_icons() function
                    // to get icons from filteree
                    // Necessary to fix bug #170
                    // https://github.com/simogeo/Filemanager/issues/170
                    var timer = setInterval(function() {
                            display_icons(timer);
                        },
                        300);
                }
            }
        });
    }

    // Adds a new folder as the first item beneath the
    // specified parent node. Called after a new folder is
    // successfully created.
    function addFolder(parent, name) {
        var newNode = '<li class="directory collapsed"><a data-path="' + parent + name
            + '/" href="#">' + name + '</a><ul class="jqueryFileTree" style="display: block;"></ul></li>';
        var parentNode = $("#filetree").find('a[data-path="' + parent + '"]');
        if (parent !== fileRoot) {
            parentNode.next("ul").prepend(newNode).prev("a").click().click();
        } else {
            $("#filetree ul.jqueryFileTree").prepend(newNode);
            $("#filetree").find('li a[data-path="' + parent + name + '/"]').attr("class", "cap_rename cap_delete").click(function () {
                getFolderInfo(parent + name + "/");
            }).each(function () {
                $(this).contextMenu(
                    { menu: getContextMenuOptions($(this)) },
                    function (action, el) {
                        var path = $(el).attr("data-path");
                        setMenus(action, path);
                    }
                );
            });
        }

        if (config.options.showConfirmation) {
            $.prompt(lg.successful_added_folder);
        }
    }

    // Sets the folder status, upload, and new folder functions
    // to the path specified. Called on initial page load and
    // whenever a new directory is selected.
    function setUploader(path) {
        $("#currentpath").val(path);
        $("#uploader h1").text(lg.current_folder + displayPath(path)).attr("title", displayPath(path, false)).attr("data-path", path);

        $("#newfolder").unbind().click(function () {
            var foldername = lg.default_foldername,
                msg = lg.prompt_foldername + " : <input id='fname' name='fname' type='text' value='" + foldername + "' />";

            var getFolderName = function (v, m) {
                if (v !== 1) {
                    return false;
                }
                var fname = m.children("#fname").val();

                if (fname !== "") {
                    foldername = cleanString(fname);
                    var d = new Date(); // to prevent IE cache issues
                    $.getJSON(fileConnector + "?mode=addfolder&path=" + $("#currentpath").val()
                            + "&config=" + userconfig
                            + "&name=" + encodeURIComponent(foldername)
                            + "&time=" + d.getMilliseconds(), function (result) {
                        if (result.Code === 0) {
                            addFolder(result.Parent, result.Name);
                            getFolderInfo(result.Parent);

                            // seems to be necessary when dealing w/ files located on s3 (need to look into a cleaner solution going forward)
                            $("#filetree").find("a[data-path='" + result.Parent + "/']").click().click();
                        } else {
                            $.prompt(result.Error);
                        }
                    });
                } else {
                    $.prompt(lg.no_foldername);
                }
                return false;
            };
            var btns = {};
            btns[lg.create_folder] = true;
            btns[lg.cancel] = false;
            $.prompt(msg, {
                callback: getFolderName,
                buttons: btns
            });
        });
    }

    // Binds specific actions to the toolbar in detail views.
    // Called when detail views are loaded.
    function bindToolbar(data) {

        // this little bit is purely cosmetic
        $("#fileinfo button").each(function () {
            // check if span doesn't exist yet, when bindToolbar called from renameItem for example
            if ($(this).find("span").length === 0) {
                $(this).wrapInner("<span></span>");
            }
        });

        if (!has_capability(data, "select")) {
            $("#fileinfo").find("button#select").hide();
        } else {
            $("#fileinfo").find("button#select").click(function () {
                selectItem(data);
            }).show();
            if (window.opener || window.tinyMCEPopup) {
                $("#preview img").attr("title", lg.select);
                $("#preview img").click(function () {
                    selectItem(data);
                }).css("cursor", "pointer");
            }
        }

        if (!has_capability(data, "rename")) {
            $("#fileinfo").find("button#rename").hide();
        } else {
            $("#fileinfo").find("button#rename").click(function () {
                var newName = renameItem(data);
                if (newName.length) {
                    $("#fileinfo > h1").text(newName);
                }
            }).show();
        }

        if (!has_capability(data, "move")) {
            $("#fileinfo").find("button#move").hide();
        } else {
            $("#fileinfo").find("button#move").click(function () {
                var newName = moveItem(data);
                if (newName.length) {
                    $("#fileinfo > h1").text(newName);
                }
            }).show();
        }

        // @todo
        if (!has_capability(data, "replace")) {
            $("#fileinfo").find("button#replace").hide();
        } else {
            $("#fileinfo").find("button#replace").click(function () {
                replaceItem(data);
            }).show();
        }

        if (!has_capability(data, "delete")) {
            $("#fileinfo").find("button#delete").hide();
        } else {
            $("#fileinfo").find("button#delete").click(function () {
                if (deleteItem(data)) {
                    $("#fileinfo").html("<h1>" + lg.select_from_left + "</h1>");
                }
            }).show();
        }

        if (!has_capability(data, "download")) {
            $("#fileinfo").find("button#download").hide();
        } else {
            $("#fileinfo").find("button#download").click(function () {
                window.location = fileConnector + "?mode=download&path=" + encodeURIComponent(data.Path) + "&config=" + userconfig;
            }).show();
        }
    }

    //Create FileTree and bind elements
    //called during initialization and also when adding a file
    //directly in root folder (via addNode)
    function createFileTree() {
        var el;
        if ($("#filetree .mCSB_container").length > 0) {
            el = "#filetree .mCSB_container";
        } else {
            el = "#filetree";
        }
        // Creates file tree.
        $(el).fileTree({
            root: fileRoot,
            datafunc: populateFileTree,
            multiFolder: false,
            folderCallback: function(path) {
                getFolderInfo(path);
            },
            expandedFolder: fullexpandedFolder,
            after: function () {
                $("#filetree").find("li a").each(function () {
                    $(this).contextMenu(
                        {menu: getContextMenuOptions($(this))},
                        function (action, iel) {
                            var path = $(iel).attr("data-path");
                            setMenus(action, path);
                        }
                    );
                });
                //Search function
                if (config.options.searchBox === true) {
                    $("#q").liveUpdate("#filetree ul").blur();
                    $("#search span.q-inactive").html(lg.search);
                    $("#search a.q-reset").attr("title", lg.search_reset);
                }
            }
        }, function (file) {
            getFileInfo(file);
        });
    }


    /*---------------------------------------------------------
      Item Actions
    ---------------------------------------------------------*/

    // Calls the SetUrl function for FCKEditor compatibility,
    // passes file path, dimensions, and alt text back to the
    // opening window. Triggered by clicking the "Select"
    // button in detail views or choosing the "Select"
    // contextual menu option in list views.
    // NOTE: closes the window when finished.
    function selectItem(data) {
        var url;
        if (config.options.baseUrl !== false) {
            url = smartPath(baseUrl, data.Path.replace(fileRoot, ""));
        } else {
            url = data.Path;
        }

        if (window.opener || window.tinyMCEPopup || _$.urlParameters("field_name") || _$.urlParameters("CKEditorCleanUpFuncNum") || _$.urlParameters("CKEditor")) {
            if (window.tinyMCEPopup) {
                // use TinyMCE > 3.0 integration method
                var win = window.tinyMCEPopup.getWindowArg("window");
                win.document.getElementById(window.tinyMCEPopup.getWindowArg("input")).value = url;
                if (win.ImageDialog !== undefined) {
                    // Update image dimensions
                    if (win.ImageDialog.getImageData) {
                        win.ImageDialog.getImageData();
                    }

                    // Preview if necessary
                    if (win.ImageDialog.showPreviewImage) {
                        win.ImageDialog.showPreviewImage(url);
                    }
                }
                window.tinyMCEPopup.close();
                return;
            }
            // tinymce 4 and colorbox
            if (_$.urlParameters("field_name")) {
                parent.document.getElementById(_$.urlParameters("field_name")).value = url;

                if (parent.tinyMCE !== undefined) {
                    parent.tinyMCE.activeEditor.windowManager.close();
                }
                if (parent.$.fn.colorbox !== undefined) {
                    parent.$.fn.colorbox.close();
                }
            } else if (_$.urlParameters("CKEditor")) {
                // use CKEditor 3.0 + integration method
                if (window.opener) {
                    // Popup
                    window.opener.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorFuncNum"), url);
                } else {
                    // Modal (in iframe)
                    parent.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorFuncNum"), url);
                    parent.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorCleanUpFuncNum"));
                }
            } else {
                // use FCKEditor 2.0 integration method
                if (data.Properties.Width !== "") {
                    var p = url;
                    var w = data.Properties.Width;
                    var h = data.Properties.Height;
                    window.opener.SetUrl(p, w, h);
                } else {
                    window.opener.SetUrl(url);
                }
            }

            if (window.opener) {
                window.close();
            }
        } else {
            $.prompt(lg.fck_select_integration);
        }
    }//selectItem

    // Renames the current item and returns the new name.
    // Called by clicking the "Rename" button in detail views
    // or choosing the "Rename" contextual menu option in
    // list views.
    function renameItem(data) {
        var finalName = "",
            rname;
        var fileName = config.security.allowChangeExtensions
            ? data.Filename
            : getFilename(data.Filename);
        var msg = lg.new_filename + " : <input id='rname' name='rname' type='text' value='" + fileName + " />";

        var getNewName = function (v, m) {
            if (v !== 1) {
                return false;
            }
            rname = m.children("#rname").val();

            if (rname !== "") {
                var givenName = rname;

                if (!config.security.allowChangeExtensions) {
                    givenName = nameFormat(rname);
                    var suffix = getExtension(data.Filename);
                    if (suffix.length > 0) {
                        givenName = givenName + "." + suffix;
                    }
                }

                 // File only - Check if file extension is allowed
                if (data.Path.charAt(data.Path.length - 1) !== "/"  && !isAuthorizedFile(givenName)) {
                    var str = "<p>" + lg.INVALID_FILE_TYPE + "</p>";
                    if (config.security.uploadPolicy === "DISALLOW_ALL") {
                        str += "<p>" + lg.ALLOWED_FILE_TYPE + config.security.uploadRestrictions.join(", ") + ".</p>";
                    }
                    if (config.security.uploadPolicy === "ALLOW_ALL") {
                        str += "<p>" + lg.DISALLOWED_FILE_TYPE + config.security.uploadRestrictions.join(", ") + ".</p>";
                    }
                    $("#filepath").val("");
                    $.prompt(str);
                    return false;
                }

                //var oldPath = data.Path;
                var connectString = fileConnector + "?mode=rename&old=" + encodeURIComponent(data.Path) + "&new=" + encodeURIComponent(givenName) + "&config=" + userconfig;

                $.ajax({
                    type: "GET",
                    url: connectString,
                    dataType: "json",
                    async: false,
                    success: function (result) {
                        if (result.Code === 0) {
                            var newPath = result["New Path"];
                            var newName = result["New Name"];
                            var oldPath = result["Old Path"];

                            var needcreateFileTree = updateNode(oldPath, newPath, newName);
                            if (needcreateFileTree) {
                                createFileTree();
                            }

                            var title = $("#preview h1").attr("title");

                            if (title !== undefined && title === oldPath) {
                                $("#preview h1").text(newName);
                            }

                            if ($("#fileinfo").data("view") === "grid") {
                                $("#fileinfo img[data-path='" + oldPath + "']").parent().next("p").text(newName);
                                $("#fileinfo img[data-path='" + oldPath + "']").attr("data-path", newPath);
                            } else {
                                $("#fileinfo td[data-path='" + oldPath + "']").text(newName);
                                $("#fileinfo td[data-path='" + oldPath + "']").attr("data-path", newPath);
                            }
                            $("#preview h1").html(newName);

                            // actualized data for binding
                            data.Path = newPath;
                            data.Filename = newName;

                            // Bind toolbar functions.
                            $("#fileinfo").find("button#rename, button#delete, button#download").unbind();
                            bindToolbar(data);

                            if (config.options.showConfirmation) {
                                $.prompt(lg.successful_rename);
                            }
                        } else {
                            $.prompt(result.Error);
                        }

                        finalName = result["New Name"];
                    }
                });
            }
            return false;
        };
        var btns = {};
        btns[lg.rename] = true;
        btns[lg.cancel] = false;
        $.prompt(msg, {
            callback: getNewName,
            buttons: btns
        });

        return finalName;
    }

    // Replace the current file and keep the same name.
    // Called by clicking the "Replace" button in detail views
    // or choosing the "Replace" contextual menu option in
    // list views.
    function replaceItem(data) {

        // @todo remove all this
        // remove dynamic form if already exists
        //$('#file-replacement').remove();


        // we create a dynamic form with input File
        //    $form = $('<form id="file-replacement" method="post">');
        //    $form.append('<input id="fileR" name="fileR" type="file" />');
        //    $form.append('<input id="mode" name="mode" type="hidden" value="replace" /> ');
        //    $form.append('<input id="newfilepath" name="newfilepath" type="hidden" value="' + data["Path"] + '" />');
        //    $('body').prepend($form);

        // we auto-submit form when user filled it up
        $("#fileR").bind("change", function () {
            $(this).closest("form#toolbar").submit();
        });

        // we set the connector to send data to
        $("#toolbar").attr("action", fileConnector);
        $("#toolbar").attr("method", "post");

        // submission script
        $("#toolbar").ajaxForm({
            target: "#uploadresponse",
            beforeSubmit: function (ignore, form) {

                var newFile = $("#fileR", form).val();

                // Test if a value is given
                if (newFile === "") {
                    return false;
                }

                // Check if file extension is matching with the original
                if (getExtension(newFile) !== data["File Type"]) {
                    $.prompt(lg.ERROR_REPLACING_FILE + " ." + getExtension(data.Filename));
                    return false;
                }
                $("#replace").attr("disabled", true);
                $("#upload span").addClass("loading").text(lg.loading_data);

                // if config.upload.fileSizeLimit == auto we delegate size test to connector
                if (FileReader !== undefined && config.upload.fileSizeLimit !== "auto") {
                    // Check file size using html5 FileReader API
                    var size = $("#fileR", form).get(0).files[0].size;
                    if (size > config.upload.fileSizeLimit * 1024 * 1024) {
                        $.prompt("<p>" + lg.file_too_big + "</p><p>" + lg.file_size_limit + config.upload.fileSizeLimit + " " + lg.mb + ".</p>");
                        $("#upload").removeAttr("disabled").find("span").removeClass("loading").text(lg.upload);
                        return false;
                    }
                }
                return false;
            },
            error: function () {
                $("#upload").removeAttr("disabled").find("span").removeClass("loading").text(lg.upload);
                $.prompt(lg.ERROR_UPLOADING_FILE);
            },
            success: function () {
                data = $.parseJSON($("#uploadresponse").find("textarea").text());

                if (data.Code === 0) {
                    var fullpath = data.Path + "/" + data.Name;

                    // Reloading file info
                    getFileInfo(fullpath);
                    // Visual effects for user to see action is successful
                    $("#preview").find("img").hide().fadeIn("slow"); // on right panel
                    $("ul.jqueryFileTree").find("li a[data-path='" + fullpath + "']").parent().hide().fadeIn("slow"); // on fileTree

                    if (config.options.showConfirmation) {
                        $.prompt(lg.successful_replace);
                    }
                } else {
                    $.prompt(data.Error);
                }
                $("#replace").removeAttr("disabled");
                $("#upload span").removeClass("loading").text(lg.upload);
            }
        });

        // we pass data path value - original file
        $("#newfilepath").val(data.Path);

        // we open the input file dialog window
        $("#fileR").click();
    }

    // Move the current item to specified dir and returns the new name.
    // Called by clicking the "Move" button in detail views
    // or choosing the "Move" contextual menu option in
    // list views.
    function moveItem(data) {
        var finalName = "",
            rname;
        var msg = lg.move + " : <input id='rname' name='rname' type='text' value='' />";
        msg += "<div class='prompt-info'>" + lg.help_move + "</div>";

        var doMove = function (v, m) {
            if (v !== 1) {
                return false;
            }
            rname = m.children("#rname").val();

            if (rname !== "") {
                var givenName = rname,
                    //oldPath = data.Path,
                    connectString = fileConnector + "?mode=move&old=" + encodeURIComponent(data.Path) + "&new=" + encodeURIComponent(givenName) + "&root=" + encodeURIComponent(fileRoot) + "&config=" + userconfig;

                $.ajax({
                    type: "GET",
                    url: connectString,
                    dataType: "json",
                    async: false,
                    success: function (result) {
                        var newPath,
                            newName;
                            // fullexpandedFolder;
                        if (result.Code === 0) {
                            newPath = result["New Path"];
                            newName = result["New Name"];

                            // we set fullexpandedFolder value to automatically open file in
                            // filetree when calling createFileTree() function
                            fullexpandedFolder = newPath;

                            createFileTree();
                            getFolderInfo(newPath); // update list in main window

                            if (config.options.showConfirmation) {
                                $.prompt(lg.successful_moved);
                            }

                            finalName = newPath + newName;
                        } else {
                            $.prompt(result.Error);
                        }
                    }
                });
            }
            return false;
        };
        var btns = {};
        btns[lg.move] = true;
        btns[lg.cancel] = false;
        $.prompt(msg, {
            callback: doMove,
            buttons: btns
        });

        return finalName;
    }

    // Prompts for confirmation, then deletes the current item.
    // Called by clicking the "Delete" button in detail views
    // or choosing the "Delete contextual menu item in list views.
    function deleteItem(data) {
        var isDeleted = false;
        var msg = lg.confirmation_delete;

        var doDelete = function (v) {
            if (v !== 1) {
                return false;
            }
            var d = new Date(), // to prevent IE cache issues
                connectString = fileConnector + "?mode=delete&path=" + encodeURIComponent(data.Path) + "&time=" + d.getMilliseconds() + "&config=" + userconfig,
                parent = data.Path.split("/").reverse().slice(1).reverse().join("/") + "/";

            $.ajax({
                type: "GET",
                url: connectString,
                dataType: "json",
                async: false,
                success: function (result) {
                    if (result.Code === 0) {
                        removeNode(result.Path);
                        // if the actual view is the deleted folder, we display parent folder
                        //if ($("#uploader h1").attr("data-path") === result.path) {
                        //    var a = result.path.split("/"),
                        //        iparent = a.slice(0, length - 2).join("/") + "/";
                        //    getFolderInfo(iparent);
                        //}
                        // remove fileinfo when item to remove is currently selected
                        if ($("#preview").length) {
                            getFolderInfo(result.path.substr(0, result.path.lastIndexOf("/") + 1));
                        }
                        var rootpath = result.Path.substring(0, result.Path.length - 1); // removing the last slash
                        rootpath = rootpath.substr(0, rootpath.lastIndexOf("/") + 1);
                        $("#uploader h1").text(lg.current_folder + displayPath(rootpath)).attr("title", displayPath(rootpath, false)).attr("data-path", rootpath);
                        isDeleted = true;

                        if (config.options.showConfirmation) {
                            $.prompt(lg.successful_delete);
                        }

                        // seems to be necessary when dealing w/ files located on s3 (need to look into a cleaner solution going forward)
                        $("#filetree").find("a[data-path='" + parent + "/']").click().click();
                    } else {
                        isDeleted = false;
                        $.prompt(result.Error);
                    }
                }
            });
            return false;
        };
        var btns = {};
        btns[lg.yes] = true;
        btns[lg.no] = false;
        $.prompt(msg, {
            callback: doDelete,
            buttons: btns
        });

        return isDeleted;
    }

    // Display an 'edit' link for editable files
    // Then let user change the content of the file
    // Save action is handled by the method using ajax
    function editItem(data) {
        var isEdited = false;

        $("#fileinfo").find("div#tools").append(" <a id='edit-file' href='#' title='" + lg.edit + "'><span>" + lg.edit + "</span></a>");

        $("#edit-file").click(function () {
            $(this).hide(); // hiding Edit link

            var d = new Date(), // to prevent IE cache issues
                connectString = fileConnector + "?mode=editfile&path=" + encodeURIComponent(data.Path) + "&config=" + userconfig + "&time=" + d.getMilliseconds();

            $.ajax({
                type: "GET",
                url: connectString,
                dataType: "json",
                async: false,
                success: function (result) {
                    if (result.Code === 0) {
                        var content = "<form id='edit-form'>";
                        content += "<textarea id='edit-content' name='content'>" + result.Content + "</textarea>";
                        content += "<input type='hidden' name='mode' value='savefile' />";
                        content += "<input type='hidden' name='path' value='" + data.Path + "' />";
                        content += "<button id='edit-cancel' class='edition' type='button'>" + lg.quit_editor + "</button>";
                        content += "<button id='edit-save' class='edition' type='button'>" + lg.save + "</button>";
                        content += "</form>";

                        $("#preview").find("img").hide();
                        $("#preview").prepend(content).hide().fadeIn();

                        // Cancel Button Behavior
                        $("#edit-cancel").click(function () {
                            $("#preview").find("form#edit-form").hide();
                            $("#preview").find("img").fadeIn();
                            $("#edit-file").show();
                        });

                        // Save Button Behavior
                        $("#edit-save").click(function () {
                            // we get new textarea content
                            var newcontent = codeMirrorEditor.getValue();
                            $("textarea#edit-content").val(newcontent);

                            var postData = $("#edit-form").serializeArray();

                            $.ajax({
                                type: "POST",
                                url: fileConnector + "?config=" + userconfig,
                                dataType: "json",
                                data: postData,
                                async: false,
                                success: function (result) {
                                    if (result.Code === 0) {
                                        isEdited = true;
                                        // if (config.options.showConfirmation) $.prompt(lg.successful_edit);
                                        $.prompt(lg.successful_edit);
                                    } else {
                                        isEdited = false;
                                        $.prompt(result.Error);
                                    }
                                }
                            });

                        });

                        // we instantiate codeMirror according to config options
                        codeMirrorEditor = instantiateCodeMirror(getExtension(data.Path), config);
                    } else {
                        isEdited = false;
                        $.prompt(result.Error);
                        $(this).show(); // hiding Edit link
                    }
                }
            });
        });

        return isEdited;
    }//editItem




    /*---------------------------------------------------------
      Functions to Retrieve File and Folder Details
    ---------------------------------------------------------*/

    // Decides whether to retrieve file or folder info based on
    // the path provided.
    function getDetailView(path) {
        if (path.lastIndexOf("/") === path.length - 1) {
            getFolderInfo(path);
            $("#filetree").find("a[data-path='" + path + "']").click();
        } else {
            getFileInfo(path);
        }
    }

    function getContextMenuOptions(elem) {
        var optionsID = elem.attr("class").replace(/\ /g, "_");
        if (optionsID === "") {
            return "itemOptions";
        }
        if (!($("#" + optionsID).length)) {
            // Create a clone to itemOptions with menus specific to this element
            var newOptions = $("#itemOptions").clone().attr("id", optionsID);
            if (!elem.hasClass("cap_select")) {
                $(".select", newOptions).remove();
            }
            if (!elem.hasClass("cap_download")) {
                $(".download", newOptions).remove();
            }
            if (!elem.hasClass("cap_rename")) {
                $(".rename", newOptions).remove();
            }
            if (!elem.hasClass("cap_move")) {
                $(".move", newOptions).remove();
                $(".replace", newOptions).remove(); // we remove replace since it is not implemented on Opera + Chrome and works only if #preview panel is on on FF
            }
            if (!elem.hasClass("cap_delete")) {
                $(".delete", newOptions).remove();
            }
            $("#itemOptions").after(newOptions);
        }
        return optionsID;
    }

    // Binds contextual menus to items in list and grid views.
    function setMenus(action, path) {
        var d = new Date(); // to prevent IE cache issues
        $.getJSON(fileConnector + "?mode=getinfo&path=" + encodeURIComponent(path) + "&config=" + userconfig + "&time=" + d.getMilliseconds(), function (data) {
            // if ($('#fileinfo').data('view') === 'grid') {
            //     var item = $('#fileinfo').find('img[data-path="' + data.Path + '"]').parent();
            // } else {
            //     var item = $('#fileinfo').find('td[data-path="' + data.Path + '"]').parent();
            // }

            switch (action) {
            case "select":
                selectItem(data);
                break;
            case "download": // todo implement javascript method to test if exstension is correct
                window.location = fileConnector + "?mode=download&path=" + data.Path  + "&config=" + userconfig + "&time=" + d.getMilliseconds();
                break;
            case "rename":
                renameItem(data);
                break;
            case "replace":
                replaceItem(data);
                break;
            case "move":
                moveItem(data);
                break;
            case "delete":
                deleteItem(data);
                break;
            }
        });
    }

    // Retrieves information about the specified file as a JSON
    // object and uses that data to populate a template for
    // detail views. Binds the toolbar for that detail view to
    // enable specific actions. Called whenever an item is
    // clicked in the file tree or list views.
    function getFileInfo(file) {
        //Hide context menu
        $(".contextMenu").hide();

        // Update location for status, upload, & new folder functions.
        var currentpath = file.substr(0, file.lastIndexOf("/") + 1);
        setUploader(currentpath);

        // Include the template.
        var template = "<div id='preview'><img /><div id='main-title'><h1></h1><div id='tools'></div></div><dl></dl></div>";
        template += "<form id='toolbar'>";
        template += "<button id='parentfolder'>" + lg.parentfolder + "</button>";
        if ($.inArray("select", capabilities) !== -1 && (_$.urlParameters("CKEditor") || window.opener || window.tinyMCEPopup || _$.urlParameters("field_name"))) {
            template += "<button id='select' name='select' type='button' value='Select'>" + lg.select + "</button>";
        }
        if ($.inArray("download", capabilities) !== -1) {
            template += "<button id='download' name='download' type='button' value='Download'>" + lg.download + "</button>";
        }
        if ($.inArray("rename", capabilities) !== -1 && config.options.browseOnly !== true) {
            template += "<button id='rename' name='rename' type='button' value='Rename'>" + lg.rename + "</button>";
        }
        if ($.inArray("move", capabilities) !== -1 && config.options.browseOnly !== true) {
            template += "<button id='move' name='move' type='button' value='Move'>" + lg.move + "</button>";
        }
        if ($.inArray("delete", capabilities) !== -1 && config.options.browseOnly !== true) {
            template += "<button id='delete' name='delete' type='button' value='Delete'>" + lg.del + "</button>";
        }
        if ($.inArray("replace", capabilities) !== -1 && config.options.browseOnly !== true) {
            template += "<button id='replace' name='replace' type='button' value='Replace'>" + lg.replace + "</button>";
            template += "<div class='hidden-file-input'><input id='fileR' name='fileR' type='file' /></div>";
            template += "<input id='mode' name='mode' type='hidden' value='replace' /> ";
            template += "<input id='newfilepath' name='newfilepath' type='hidden' />";
        }
        template += "</form>";

        // test if scrollbar plugin is enabled
        if ($("#fileinfo .mCSB_container").length > 0) {
            $("#fileinfo .mCSB_container").html(template);
        } else {
            $("#fileinfo").html(template);
        }

        $("#parentfolder").click(function () {
            getFolderInfo(currentpath);
        });

        // Retrieve the data & populate the template.
        var d = new Date(); // to prevent IE cache issues

        $.getJSON(fileConnector + "?mode=getinfo&path=" + encodeURIComponent(file) + "&config=" + userconfig + "&time=" + d.getMilliseconds(), function (data) {
            var url;
            if (data.Code === 0) {
                $("#fileinfo").find("h1").text(data.Filename).attr("title", file);

                $("#fileinfo").find("img").attr("src", _$.getIconUrl(data));
                if (isVideoFile(data.Filename) && config.videos.showVideoPlayer === true) {
                    getVideoPlayer(data);
                }
                if (isAudioFile(data.Filename) && config.audios.showAudioPlayer === true) {
                    getAudioPlayer(data);
                }
                //Pdf
                if (isPdfFile(data.Filename) && config.pdfs.showPdfReader === true) {
                    getPdfReader(data);
                }
                if (isEditableFile(data.Filename) && config.edit.enabled === true && data.Protected === 0) {
                    editItem(data);
                }

                // copy URL instructions - zeroclipboard
                d = new Date(); // to prevent IE cache issues

                if (config.options.baseUrl !== false) {
                    url = smartPath(baseUrl, data.Path.replace(fileRoot, ""));
                } else {
                    url = data.Path;
                }
                if (data.Protected === 0) {
                    $("#fileinfo").find("div#tools").append(" <a id='copy-button' data-clipboard-text='" + url + "' title='" + lg.copy_to_clipboard + "' href='#'><span>" + lg.copy_to_clipboard + "</span></a>");
                    // loading zeroClipboard code

                    loadJS("./scripts/zeroclipboard/copy.js?d" + d.getMilliseconds());
                    $("#copy-button").click(function () {
                        $("#fileinfo").find("div#tools").append("<span id='copied'>" + lg.copied + "</span>");
                        $("#copied").delay(500).fadeOut(1000, function() {
                            $(this).remove();
                        });
                    });
                }

                var properties = "";

                if (data.Properties.Width && data.Properties.Width !== "") {
                    properties += "<dt>" + lg.dimensions + "</dt><dd>" + data.Properties.Width + "x" + data.Properties.Height + "</dd>";
                }
                if (data.Properties["Date Created"] && data.Properties["Date Created"] !== "") {
                    properties += "<dt>" + lg.created + "</dt><dd>" + data.Properties["Date Created"] + "</dd>";
                }
                if (data.Properties["Date Modified"] && data.Properties["Date Modified"] !== "") {
                    properties += "<dt>" + lg.modified + "</dt><dd>" + data.Properties["Date Modified"] + "</dd>";
                }
                if (data.Properties.Size || parseInt(data.Properties.Size, 10) === 0) {
                    properties += "<dt>" + lg.size + "</dt><dd>" + formatBytes(data.Properties.Size) + "</dd>";
                }
                $("#fileinfo").find("dl").html(properties);

                // Bind toolbar functions.
                bindToolbar(data);

            } else {
                $.prompt(data.Error);
            }
        });
    }

    // Retrieve data (file/folder listing) for jqueryFileTree and pass the data back
    // to the callback function in jqueryFileTree
    function populateFileTree(path, callback) {

        //    url = fileConnector + "?path=" + encodeURIComponent(path)  + "&config=" + userconfig + "&mode=getfolder&showThumbs=" + config.options.showThumbs + "&time=" + d.getMilliseconds();
        //if (_$.urlParameters("type")) {
        //    url += "&type=" + _$.urlParameters("type");
        //}

        _$.apiGet({
            mode: "getfolder",
            path: encodeURIComponent(path),
            success: function (data) {
                console.log("populateFileTree data -> ", data);
                var result = "",
                    extraclass,
                    key,
                    cap;
                // Is there any error or user is unauthorized?
                if (data.Code === "-1") {
                    handleError(data.Error);
                    return;
                }

                if (data) {
                    var cap_classes = "";
                    result += "<ul class=\"jqueryFileTree\" style=\"display: none;\">";
                    for (key in data) {
                        if (data.hasOwnProperty(key)) {
                            for (cap in capabilities) {
                                if (capabilities.hasOwnProperty(cap) && has_capability(data[key], capabilities[cap])) {
                                    cap_classes += " cap_" + capabilities[cap];
                                }
                            }
                            if (data[key]["File Type"] === "dir") {
                                extraclass = data[key].Protected === 0
                                    ? ""
                                    : " directory-locked";
                                result += "<li class=\"directory collapsed" +
                                        extraclass +
                                        "\"><a href=\"#\" class=\"" +
                                        cap_classes +
                                        "\" data-path=\"" +
                                        data[key].Path +
                                        "\">" +
                                        data[key].Filename +
                                        "</a></li>";
                            } else {
                                if (config.options.listFiles) {
                                    extraclass = data[key].Protected === 0
                                        ? ""
                                        : " file-locked";
                                    result += "<li class=\"file ext_" +
                                            data[key]["File Type"].toLowerCase() +
                                            extraclass +
                                            "\"><a href=\"#\" class=\"" +
                                            cap_classes +
                                            "\" data-path=\"" +
                                            data[key].Path +
                                            "\">" +
                                            data[key].Filename +
                                            "</a></li>";
                                }
                            }
                        }
                    }
                    result += "</ul>";
                } else {
                    result += "<h1>" + lg.could_not_retrieve_folder + "</h1>";
                }
                callback(result);
            }
        });
    }




    /*---------------------------------------------------------
      Initialization
    ---------------------------------------------------------*/

    $(function () {
        var expandedFolder;
            //Dropzone;

        if (config.extras.extra_js) {
            var i;
            for (i = 0; i < config.extras.extra_js.length; i++) {
                $.ajax({
                    url: config.extras.extra_js[i],
                    dataType: "script",
                    async: config.extras.extra_js_async
                });
            }
        }

        $("#link-to-project").attr("href", config.url).attr("target", "_blank").attr("title", lg.support_fm + " [" + lg.version + " : " + config.version + "]");
        $("div.version").html(config.version);

        // Loading theme
        loadCSS("./themes/" + config.options.theme + "/styles/filemanager.css");
        $.ajax({
            url: "./themes/" + config.options.theme + "/styles/ie.css",
            async: false,
            success: function (data) {
                $("head").append(data);
            }
        });

        // loading zeroClipboard
        loadJS("./scripts/zeroclipboard/dist/ZeroClipboard.js");

        // Loading CodeMirror if enabled for online edition
        if (config.edit.enabled) {
            loadCSS("./scripts/CodeMirror/lib/codemirror.css");
            loadCSS("./scripts/CodeMirror/theme/" + config.edit.theme + ".css");
            loadJS("./scripts/CodeMirror/lib/codemirror.js");
            loadJS("./scripts/CodeMirror/addon/selection/active-line.js");
            loadCSS("./scripts/CodeMirror/addon/display/fullscreen.css");
            loadJS("./scripts/CodeMirror/addon/display/fullscreen.js");
            loadJS("./scripts/CodeMirror/dynamic-mode.js");
        }

        if (config.options.baseUrl === false) {
            baseUrl = window.location.protocol + "//" + window.location.host;
        } else {
            baseUrl = config.options.baseUrl;
        }

        if (_$.urlParameters("exclusiveFolder") !== 0) {
            fileRoot += _$.urlParameters("exclusiveFolder");
            if (fileRoot.charAt(fileRoot.length - 1) !== "/") {
                fileRoot += "/";
            } // add last '/' if needed
            fileRoot = fileRoot.replace(/\/\//g, "\/");
        }

        if (_$.urlParameters("expandedFolder") !== 0) {
            expandedFolder = _$.urlParameters("expandedFolder");
            fullexpandedFolder = fileRoot + expandedFolder;
        } else {
            expandedFolder = "";
            fullexpandedFolder = null;
        }


        $("#folder-info").html('<span id="items-counter"></span> ' + lg.items + " - " + lg.size + ' : <span id="items-size"></span> ' + lg.mb);

        // we finalize the FileManager UI initialization
        // with localized text if necessary
        if (config.options.autoload === true) {
            $("#upload").append(lg.upload);
            $("#newfolder").append(lg.new_folder);
            $("#grid").attr("title", lg.grid_view);
            $("#list").attr("title", lg.list_view);
            $("#fileinfo h1").append(lg.select_from_left);
            $('#itemOptions a[href$="#select"]').append(lg.select);
            $('#itemOptions a[href$="#download"]').append(lg.download);
            $('#itemOptions a[href$="#rename"]').append(lg.rename);
            $('#itemOptions a[href$="#move"]').append(lg.move);
            $('#itemOptions a[href$="#replace"]').append(lg.replace);
            $('#itemOptions a[href$="#delete"]').append(lg.del);
        }

        /** Adding a close button triggering callback function if CKEditorCleanUpFuncNum passed */
        if (_$.urlParameters("CKEditorCleanUpFuncNum")) {
            $("body").append("<button id='close-btn' type='button'>" + lg.close + "</button>");

            $("#close-btn").click(function () {
                parent.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorCleanUpFuncNum"));
            });
        }

        /** Input file Replacement */
        $("#browse").append("+");
        $("#browse").attr("title", lg.browse);
        $("#newfile").change(function () {
            $("#filepath").val($(this).val().replace(/.+[\\\/]/, ""));
        });

        /** load searchbox */
        if (config.options.searchBox === true) {
            loadJS("./scripts/filemanager.liveSearch.min.js");
        } else {
            $("#search").remove();
        }

        // cosmetic tweak for buttons
        $("button").wrapInner("<span></span>");

        // Set initial view state.
        $("#fileinfo").data("view", config.options.defaultViewMode);
        setViewButtonsFor(config.options.defaultViewMode);

        $("#home").click(function () {
            var currentViewMode = $("#fileinfo").data("view");
            $("#fileinfo").data("view", currentViewMode);
            $("#filetree ul.jqueryFileTree > li.expanded > a").trigger("click");
            getFolderInfo(fileRoot);
        });

        $("#level-up").click(function () {
            var cpath = $("#uploader h1").attr("data-path"), // get path
                iparent;
            // console.log(' cpath : ' + cpath + ' - fileRoot : ' + fileRoot ); // @todo remove
            if (cpath !== fileRoot) {
                // we get the parent folder - cpath.slice(0, - 1) removes last slash
                iparent = cpath.substring(0, cpath.slice(0, -1).lastIndexOf("/")) + "/";
                // console.log(' parent : ' + parent); // @todo remove
                var currentViewMode = $("#fileinfo").data("view");
                $("#fileinfo").data("view", currentViewMode);
                $("#filetree").find("a[data-path='" + cpath + "']").click(); // we close the previous folder
                getFolderInfo(iparent);
            }
        });

        // Set buttons to switch between grid and list views.
        $("#grid").click(function() {
            setViewButtonsFor("grid");
            $("#fileinfo").data("view", "grid");
            getFolderInfo($("#currentpath").val());
        });

        $("#list").click(function () {
            setViewButtonsFor("list");
            $("#fileinfo").data("view", "list");
            getFolderInfo($("#currentpath").val());
        });

        // Provide initial values for upload form, status, etc.
        setUploader(fileRoot);

        // Handling File upload

        // Multiple Uploads
        if (config.upload.multiple) {
            // we load dropzone library
            loadCSS("./scripts/dropzone/downloads/css/dropzone.css");
            loadJS("./scripts/dropzone/downloads/dropzone.js");
            //Dropzone.autoDiscover = false;

            // we remove simple file upload element
            $("#file-input-container").remove();

            // we add multiple-files upload button using upload button
            // $('#upload').prop('type', 'button');
            // replaced by code below because og Chrome 18 bug https://github.com/simogeo/Filemanager/issues/304
            // and it may also be safer for IE (see http://stackoverflow.com/questions/1544317/change-type-of-input-field-with-jquery
            $("#upload").remove();
            $("#newfolder").before("<button value='Upload' type='button' name='upload' id='upload' class='em'><span>" + lg.upload + "</span></button> ");

            $("#upload").unbind().click(function () {
                var allowedFiles;
                // we create prompt
                var msg = "<div id='dropzone-container'><h2>" + lg.current_folder + $("#uploader h1").attr("title") + "</h2><div id='multiple-uploads' class='dropzone'></div>";
                msg += "<div id='total-progress'><div data-dz-uploadprogress=''' style='width:0%;' class='progress-bar'></div></div>";
                msg += "<div class='prompt-info'>" + lg.dz_dictMaxFilesExceeded.replace("%s", config.upload.number) + lg.file_size_limit + config.upload.fileSizeLimit + " " + lg.mb + ".</div>";
                msg += "<button id='process-upload'>" + lg.upload + "</button></div>";

                var error_flag = false;
                var path = $("#currentpath").val();

                var fileSize = (config.upload.fileSizeLimit !== "auto")
                    ? config.upload.fileSizeLimit
                    : 256; // default dropzone value

                if (config.security.uploadPolicy === "DISALLOW_ALL") {
                    allowedFiles = "." + config.security.uploadRestrictions.join(",.");
                } else {
                    // we allow any extension since we have no easy way to handle the the built-in `acceptedFiles` params
                    // Would be handled later by the connector
                    allowedFiles = null;
                }

                if (_$.urlParameters("type").toString().toLowerCase() === "images" || config.upload.imagesOnly) {
                    allowedFiles = "." + config.images.imagesExt.join(",.");
                }

                var btns = {};
                btns[lg.close] = false;
                $.prompt(msg, {
                    buttons: btns
                });

                $("div#multiple-uploads").dropzone({
                    paramName: "newfile",
                    url: fileConnector + "?config=" + userconfig,
                    maxFilesize: fileSize,
                    maxFiles: config.upload.number,
                    addRemoveLinks: true,
                    parallelUploads: config.upload.number,
                    dictCancelUpload: lg.cancel,
                    dictRemoveFile: lg.del,
                    dictMaxFilesExceeded: lg.dz_dictMaxFilesExceeded.replace("%s", config.upload.number),
                    dictDefaultMessage: lg.dz_dictDefaultMessage,
                    dictInvalidFileType: lg.dz_dictInvalidFileType,
                    dictFileTooBig: lg.file_too_big + " " + lg.file_size_limit + config.upload.fileSizeLimit + " " + lg.mb,
                    acceptedFiles: allowedFiles,
                    autoProcessQueue: false,
                    init: function () {
                        // for accessing dropzone : https://github.com/enyo/dropzone/issues/180
                        var dropzone = this;
                        $("#process-upload").click(function () {
                            // to proceed full queue parallelUploads ust be equal or > to maxFileSize
                            // https://github.com/enyo/dropzone/issues/462
                            dropzone.processQueue();
                        });
                    },
                    totaluploadprogress: function (progress) {
                        $("#total-progress .progress-bar").css("width", progress + "%");
                    },
                    sending: function (file, xhr, formData) {
                        console.log(file, xhr);
                        formData.append("mode", "add");
                        formData.append("currentpath", path);
                    },
                    success: function (file, response) {
                        $("#uploadresponse").empty().html(response);
                        var data = $.parseJSON($("#uploadresponse").find("textarea").text());

                        if (data.Code === 0) {
                            this.removeFile(file);
                        } else {
                            // this.removeAllFiles();
                            getFolderInfo(path);
                            $("#filetree").find("a[data-path='" + path + "']").click();
                            $.prompt(data.Error);
                            error_flag = true;

                        }
                    },
                    complete: function () {
                        if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
                            $("#total-progress .progress-bar").css("width", "0");
                            if (this.getRejectedFiles().length === 0 && error_flag === false) {
                                setTimeout(function () {
                                    $.prompt.close();
                                }, 800);
                            }
                            getFolderInfo(path);
                            if (path === fileRoot) {
                                createFileTree();
                            }
                            $("#filetree").find("a[data-path='" + path + "']").click().click();
                            if (config.options.showConfirmation) {
                                $.prompt(lg.successful_added_file);
                            }
                        }
                    }
                });

            });

            // Simple Upload
        } else {

            $("#uploader").attr("action", fileConnector + "?config=" + userconfig);

            $("#uploader").ajaxForm({
                target: "#uploadresponse",
                beforeSubmit: function (ignore, form) {
                    var key;
                    // Test if a value is given
                    if ($("#newfile", form).val() === "") {
                        return false;
                    }
                    // Check if file extension is allowed
                    if (!isAuthorizedFile($("#newfile", form).val())) {
                        var str = "<p>" + lg.INVALID_FILE_TYPE + "</p>";
                        if (config.security.uploadPolicy === "DISALLOW_ALL") {
                            str += "<p>" + lg.ALLOWED_FILE_TYPE + config.security.uploadRestrictions.join(", ") + ".</p>";
                        }
                        if (config.security.uploadPolicy === "ALLOW_ALL") {
                            str += "<p>" + lg.DISALLOWED_FILE_TYPE + config.security.uploadRestrictions.join(", ") + ".</p>";
                        }
                        $("#filepath").val("");
                        $.prompt(str);
                        return false;
                    }
                    $("#upload").attr("disabled", true);
                    $("#upload span").addClass("loading").text(lg.loading_data);
                    if (_$.urlParameters("type").toString().toLowerCase() === "images") {
                        // Test if uploaded file extension is in valid image extensions
                        var newfileSplitted = $("#newfile", form).val().toLowerCase().split(".");
                        var found = false;
                        for (key in config.images.imagesExt) {
                            if (config.images.imagesExt.hasOwnProperty(key) && config.images.imagesExt[key] === newfileSplitted[newfileSplitted.length - 1]) {
                                found = true;
                            }
                        }
                        if (found === false) {
                            $.prompt(lg.UPLOAD_IMAGES_ONLY);
                            $("#upload").removeAttr("disabled").find("span").removeClass("loading").text(lg.upload);
                            return false;
                        }
                    }
                    // if config.upload.fileSizeLimit == auto we delegate size test to connector
                    if (FileReader !== undefined && config.upload.fileSizeLimit !== "auto") {
                        // Check file size using html5 FileReader API
                        var size = $("#newfile", form).get(0).files[0].size;
                        if (size > config.upload.fileSizeLimit * 1024 * 1024) {
                            $.prompt("<p>" + lg.file_too_big + "</p><p>" + lg.file_size_limit + config.upload.fileSizeLimit + " " + lg.mb + ".</p>");
                            $("#upload").removeAttr("disabled").find("span").removeClass("loading").text(lg.upload);
                            return false;
                        }
                    }
                    return false;
                },
                error: function () {//(jqXHR, textStatus, errorThrown)
                    $("#upload").removeAttr("disabled").find("span").removeClass("loading").text(lg.upload);
                    $.prompt(lg.ERROR_UPLOADING_FILE);
                },
                success: function () {
                    var data = $.parseJSON($("#uploadresponse").find("textarea").text());
                    if (data.Code === 0) {
                        var needs = addNode(data.Path, data.Name);
                        if (needs) {
                            createFileTree();
                        }

                        getFolderInfo(data.Path); // update list in main window
                        $("#filepath, #newfile").val("");
                        // IE can not empty input='file'. A fix consist to replace the element (see github issue #215)
                        if ($.browser.msie) {
                            $("#newfile").replaceWith($("#newfile").clone(true));
                        }
                        // seems to be necessary when dealing w/ files located on s3 (need to look into a cleaner solution going forward)
                        $("#filetree").find("a[data-path='" + data.Path + "/']").click().click();
                    } else {
                        $.prompt(data.Error);
                    }
                    $("#upload").removeAttr("disabled");
                    $("#upload span").removeClass("loading").text(lg.upload);
                    $("#filepath").val("");
                }
            });
        }

        // Loading CustomScrollbar if enabled
        // Important, the script should be called after calling createFileTree() to prevent bug
        if (config.customScrollbar.enabled) {
            loadCSS("./scripts/custom-scrollbar-plugin/jquery.mCustomScrollbar.min.css");
            loadJS("./scripts/custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min.js");

            var csTheme = config.customScrollbar.theme !== undefined
                    ? config.customScrollbar.theme
                    : "inset-2-dark",
                csButton = config.customScrollbar.button !== undefined
                    ? config.customScrollbar.button
                    : true;

            $(window).load(function () {
                $("#filetree").append("<div style='height:3000px'></div>"); // because if #filetree has height equal to 0, mCustomScrollbar is not applied
                $("#filetree").mCustomScrollbar({
                    theme: csTheme,
                    scrollButtons: {enable: csButton},
                    advanced: {autoExpandHorizontalScroll: true, updateOnContentResize: true},
                    callbacks: {
                        onInit: function () {
                            createFileTree();
                        }
                    },
                    axis: "yx"
                });
                $("#fileinfo").mCustomScrollbar({
                    theme: csTheme,
                    scrollButtons: {enable: csButton},
                    advanced: {autoExpandHorizontalScroll: true, updateOnContentResize: true},
                    axis: "y",
                    alwaysShowScrollbar: 1
                });

            });
        } else {
            createFileTree();
        }

        // Disable select function if no window.opener
        if (!(window.opener || window.tinyMCEPopup || _$.urlParameters("field_name"))) {
            $("#itemOptions a[href$='#select']").remove();
        }
        // Keep only browseOnly features if needed
        if (config.options.browseOnly === true) {
            $("#file-input-container").remove();
            $("#upload").remove();
            $("#newfolder").remove();
            $("#toolbar").remove("#rename");
            $(".contextMenu .rename").remove();
            $(".contextMenu .move").remove();
            $(".contextMenu .replace").remove();
            $(".contextMenu .delete").remove();
        }

        // Adjust layout.
        setDimensions();
        $(window).resize(setDimensions);

        // Provides support for adjustible columns.
        $("#splitter").splitter({
            sizeLeft: config.options.splitterMinWidth,
            minLeft: config.options.splitterMinWidth,
            minRight: 200
        });

        getDetailView(fileRoot + expandedFolder);
    });//function Initialization

    // add useragent string to html element for IE 10/11 detection
    var doc = document.documentElement;
    doc.setAttribute("data-useragent", navigator.userAgent);

    if (config.options.logger) {
        var end = Date.now();
        var time = end - start;
        console.log("Total execution time : " + time + " ms");
    }

    $(window).load(function () {
        setDimensions();
    });

}(jQuery));

$(window).load(function () {
    "use strict";
    $("#fileinfo").css({"left": $("#splitter .vsplitbar").width() + $("#filetree").width()});
});
