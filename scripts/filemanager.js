/* property
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
    getParams, getQueuedFiles, getRejectedFiles, getUploadingFiles, getValue,
    getWindowArg, grid_view, hasClass, hasOwnProperty, height, help_move, hide,
    host, href, html, icons, images, imagesExt, imagesOnly, inArray, indexOf,
    init, innerHTML, input, items, join, kb, lang, lastIndexOf, left, length,
    listFiles, list_view, liveUpdate, load, loading_data, location, log,
    logger, mCustomScrollbar, maxFiles, maxFilesize, mb, menu, minLeft,
    minRight, mode, modified, move, msie, multiFolder, multiple, name, new,
    new_filename, new_folder, next, no, no_foldername, now, number, offset,
    old, onInit, opacity, opener, options, overlayspeed, parallelUploads,
    paramName, parent, parentfolder, parseJSON, path, pathname, pdfs, pdfsExt,
    pdfsReaderHeight, pdfsReaderWidth, persistent, pop, prepend, prev,
    processQueue, prompt, prompt_foldername, protocol, push, quickSelect,
    quit_editor, remove, removeAttr, removeClass, removeFile, rename, replace,
    replaceWith, resize, reverse, root, round, save, scrollButtons, search,
    searchBox, search_reset, security, select, select_from_left, sending,
    serializeArray, setAttribute, setDefaults, show,
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
    windowManager, wrapInner, yes, "File Type", "Date Created", "Date Modified", "New Path",
    "New Name", "Old Path", errors, code, title, description, detail, paths,
    config, jquery, exports, shim, jquery-impromptu, jqueryFileTree
*/
/*global FileReader,$, define*/

/**
 *    Filemanager JS core
 *
 *    filemanager.js
 *
 *    @license    MIT License
 *
 *    @author        Joshua Austill - FM2
 *    @author        Jason Huck - Core Five Labs
 *    @author        Simon Georget <simon (at) linea21 (dot) com>
 *    @copyright    Authors
 */
require.config({
    "baseUrl": "",
    "paths": {
        "bootstrap": "node_modules/bootstrap/dist/js/bootstrap",
        "dropzone": "node_modules/dropzone/dist/dropzone-amd-module",
        // "clipboard": "scripts/zeroclipboard/copy",
        "filesize": "node_modules/filesize/lib/filesize",
        "jquery": "node_modules/jquery/dist/jquery",
        "jqueryfancytree": "node_modules/jquery.fancytree/dist/jquery.fancytree",
        "jquerySplitter": "node_modules/jquery.splitter/js/jquery.splitter",
        "jqueryMCustomScrollbar": "node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar",
        "jquery.ui": "node_modules/jquery-ui-dist/jquery-ui",
        "knockout": "node_modules/knockout/build/output/knockout-latest.debug",
        "knockout.contextmenu": "node_modules/knockout.contextmenu/dist/js/knockout.contextmenu",
        "knockoutPunches": "node_modules/knockout-punches/knockout.punches",
        "sweetalert": "node_modules/sweetalert/dist/sweetalert-dev",
        "text": "node_modules/text/text",
        "toastr": "node_modules/toastr/build/toastr.min"
    },
    "shim": {
        "bootstrap": ["jquery"],
        // "clipboard": ["jquery"],
        "jquery": {
            exports: "$"
        },
        "jqueryfancytree": ["jquery", "jquery.ui"],
        "jquerySplitter": ["jquery"],
        "jqueryMCustomScrollbar": ["jquery"],
        "jquery.ui": ["jquery"],
        "knockout.contextmenu": ["knockout"],
        "knockoutPunches": ["knockout"],
        "toastr": {
            exports: "toastr"
        }
    },
    map: {
        "*": {
            "css": "node_modules/require-css/css"
        }
    }
});

define(function (require) {
    "use strict";
    require("css!node_modules/knockout.contextmenu/dist/css/knockout.contextmenu.css");
    require("css!node_modules/jquery.fancytree/dist/skin-lion/ui.fancytree.css");
    require("css!node_modules/jquery.splitter/css/jquery.splitter.css");
    require("css!node_modules/dropzone/dist/dropzone.css");
    require("css!node_modules/toastr/build/toastr.css");
    require("css!node_modules/bootstrap/dist/css/bootstrap.css");
    require("css!node_modules/sweetalert/dist/sweetalert.css");
    require("css!node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css");
    // Load theme last so nothing overwrites our colors :)
    require("css!styles/fm2.css");


    //load jquery and related
    require("jquery"); //updated to 3.0
    require("jquery.ui");
    require("jqueryfancytree"); //replace with fancyTree
    require("jquerySplitter"); // Seems to be working well
    require("jqueryMCustomScrollbar"); //currently disabled

    //load libraries
    require("dropzone");
    require("bootstrap");

    //load knockout and related
    var ko = require("knockout");
    require("knockoutPunches");
    require("knockout.contextmenu");

    //load knockout punches, here goes the magic :)
    ko.punches.enableAll();

    //load our viewmodels
    var AppViewModel = require("app/app.viewmodel");
    var appVM = new AppViewModel();
    ko.applyBindings(appVM);

    var start;

    /*---------------------------------------------------------
     Setup, Layout, and Status Functions
     ---------------------------------------------------------*/

    //noinspection JSUnresolvedVariable
    if (appVM.config.options.logger) {
        start = Date.now();
    }

    // Forces columns to fill the layout vertically.
    // Called on initial page load and on resize.
    // var setDimensions = function () {
    //     var bheight = 53,
    //         $uploader = $("#uploader");
    //
    //     if (_$.urlParameters("CKEditorCleanUpFuncNum")) {
    //         bheight += 60;
    //     }
    //
    //     var newH = $(window).height() - $uploader.height() - $uploader.offset().top - bheight;
    //     $("#splitter, #filetree, #fileinfo, .vsplitbar").height(newH);
    //     var newW = $("#splitter").width() - $("div.vsplitbar").width() - $("#filetree").width();
    //     $fileinfo.width(newW);
    // };


//     // Display an 'edit' link for editable files
//     // Then let user change the content of the file
//     // Save action is handled by the method using ajax
//     function editItem(data) {
//         var isEdited = false;
//
//         $fileinfo.find("div#tools").append(" <a id='edit-file' href='#' title='" + appVM.language.edit + "'><span>" + appVM.language.edit + "</span></a>");
//
//         $("#edit-file").click(function () {
//             $(this).hide(); // hiding Edit link
//
//             var d = new Date(), // to prevent IE cache issues
//                 connectString = fileConnector + "?mode=editfile&path=" + encodeURIComponent(data.Path) + "&appVM.config=" + userappVM.config + "&time=" + d.getMilliseconds();
//
//             $.ajax({
//                 type: "GET",
//                 url: connectString,
//                 dataType: "json",
//                 async: false,
//                 success: function (result) {
//                     // if (result.Code === 0) {
//                     var content = "<form id='edit-form'>";
//                     content += "<textarea id='edit-content' name='content'>" + result.Content + "</textarea>";
//                     content += "<input type='hidden' name='mode' value='savefile' />";
//                     content += "<input type='hidden' name='path' value='" + data.Path + "' />";
//                     content += "<button id='edit-cancel' class='edition' type='button'>" + appVM.language.quit_editor + "</button>";
//                     content += "<button id='edit-save' class='edition' type='button'>" + appVM.language.save + "</button>";
//                     content += "</form>";
//
//                     var el = $("preview");
//                     el.find("img").hide();
//                     el.prepend(content).hide().fadeIn();
//
//                     // Cancel Button Behavior
//                     $("#edit-cancel").click(function () {
//                         el.find("form#edit-form").hide();
//                         el.find("img").fadeIn();
//                         $("#edit-file").show();
//                     });
//
//                     // Save Button Behavior
//                     $("#edit-save").click(function () {
//                         // we get new textarea content
//                         var newcontent = codeMirrorEditor.getValue();
//                         $("textarea#edit-content").val(newcontent);
//
//                         var postData = $("#edit-form").serializeArray();
//
//                         $.ajax({
//                             type: "POST",
//                             url: fileConnector + "?appVM.config=" + userappVM.config,
//                             dataType: "json",
//                             data: postData,
//                             async: false,
//                             success: function (result) {
//                                 // if (result.Code === 0) {
//                                 isEdited = true;
//                                 // if (appVM.config.options.showConfirmation) $.prompt(appVM.language.successful_edit);
//                                 $.prompt(appVM.language.successful_edit);
//                                 // } else {
//                                 //     isEdited = false;
//                                 //     $.prompt(result.Error);
//                                 // }
//                             }
//                         });
//
//                     });
//
//                     // we instantiate codeMirror according to appVM.config options
// //                    codeMirrorEditor = instantiateCodeMirror(getExtension(data.Path), appVM.config);
//                     // } else {
//                     //     isEdited = false;
//                     //     $.prompt(result.Error);
//                     //     $(this).show(); // hiding Edit link
//                     // }
//                 }
//             });
//         });
//
//         return isEdited;
//     }//editItem




    /*---------------------------------------------------------
     Initialization
     ---------------------------------------------------------*/

    $(function () {

        // if (_$.urlParameters("exclusiveFolder") !== 0) {
        //     fileRoot += _$.urlParameters("exclusiveFolder");
        //     if (fileRoot.charAt(fileRoot.length - 1) !== "/") {
        //         fileRoot += "/";
        //     } // add last '/' if needed
        //     fileRoot = fileRoot.replace(/\/\//g, "\/");
        // }



        /** Adding a close button triggering callback function if CKEditorCleanUpFuncNum passed */
        if (appVM.util.urlParameters("CKEditorCleanUpFuncNum")) {
            $("body").append("<button id='close-btn' type='button'>" + appVM.language.close + "</button>");

            $("#close-btn").click(function () {
                parent.CKEDITOR.tools.callFunction(appVM.util.urlParameters("CKEditorCleanUpFuncNum"));
            });
        }



        // Keep only browseOnly features if needed
        // if (appVM.config.options.browseOnly === true) {
        //     $("#file-input-container").remove();
        //     $("#upload").remove();
        //     $("#newfolder").remove();
        //     $("#toolbar").remove("#rename");
        //     $(".contextMenu .rename").remove();
        //     $(".contextMenu .move").remove();
        //     $(".contextMenu .replace").remove();
        //     $(".contextMenu .delete").remove();
        // }

        // Adjust layout.
        // setDimensions();
        // $(window).resize(setDimensions);

        // Provides support for adjustible columns.
        $("#splitter").height(100).split({
            position: appVM.config.options.splitPercentage,
            orientation: "vertical",
            limit: 200
        });

        // I think I'll need a custom binding to make the custom scrollbars work properly
        // $("#tree").mCustomScrollbar({
        //     axis: "yx"
        // });

        //getDetailView(fileRoot + expandedFolder);
    });//function Initialization

    // add useragent string to html element for IE 10/11 detection
    var doc = document.documentElement;
    doc.setAttribute("data-useragent", navigator.userAgent);

    if (appVM.config.options.logger) {
        var end = Date.now();
        var time = end - start;
        console.log("Total execution time : " + time + " ms");
    }

    // $(window).on("load", function () {
    //     setDimensions();
    // });

    // $(window).on("load", function () {
    //     $fileinfo.css({"left": $("#splitter").find(".vsplitbar").width() + $("#filetree").width()});
    // });
    //
    // setTimeout(setDimensions, 0);
});
