/*global define, window, data*/
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
define(function (require) {
    "use strict";
    var ko = require("knockout");
    var $ = require("jquery");
    var filesize = require("filesize");
    var swal = require("sweetalert");
    var toastr = require("toastr");

    return function (appVM, item) {
        var self = this;
        item = item || {};
        item.properties = item.properties || {};

        // Lets make the entire item into observables
        self.filename = ko.observable(item.filename);
        self.fileType = ko.observable(item.fileType);
        self.isDirectory = ko.observable(item.isDirectory);
        self.path = ko.observable(item.path);
        self.dir = ko.observable(item.dir);
        self.directPath = ko.observable(item.directPath);
        self.preview = ko.observable(item.preview);
        self.thumbnail = ko.observable(item.thumbnail);
        self.properties = ko.observable({
            dateCreated: item.properties.dateCreated,
            dateModified: item.properties.dateModified,
            height: item.properties.height,
            width: item.properties.width,
            size: filesize(parseInt(item.properties.size || 0, 10))
        });//self.properties

        //This function makes a call to the api to reload the current item.  Used after replacing,renaming,moving, etc to ensure success
        self.reloadSelf = function () {
            appVM.util.apiGet({
                url: "/item/meta",
                path: self.path(),
                success: function (item) {
                    self.filename(item.filename);
                    self.fileType(item.fileType);
                    self.isDirectory(item.isDirectory);
                    self.path(item.path);
                    self.dir(item.dir);
                    self.path(item.directPath);
                    self.preview(item.preview);
                    self.thumbnail(item.thumbnail);
                    self.properties({
                        dateCreated: item.properties.dateCreated,
                        dateModified: item.properties.dateModified,
                        height: item.properties.height,
                        width: item.properties.width,
                        size: filesize(parseInt(item.properties.size || 0, 10))
                    });//self.properties
                }//success
            });//apiGet
        };//reloadSelf

        self.canDownload = ko.pureComputed(function () {
            return (appVM.canDownload() && !self.isDirectory());
        });//canDownload

        self.canReplace = ko.pureComputed(function () {
            return (appVM.canReplace() && !self.isDirectory());
        });//canDownload

        // This is our context menu for each item, so simple :)
        self.menu = ko.observableArray([{
            text: "<span class='glyphicon glyphicon-info-sign'></span>  " + appVM.language.details,
            action: function () {
                appVM.goToItem(self);
            }//self.menu.push
        }]);//self.menu

        if (appVM.canSelect()) {
            self.menu.push({
                text: "<span class='glyphicon glyphicon-download'></span>  " + appVM.language.select,
                action: function () {
                    self.selectMe();
                }
            });//self.menu.push
        }//if canSelect

        if (self.canDownload()) {
            self.menu.push({
                text: "<span class='glyphicon glyphicon-download'></span>  " + appVM.language.download,
                action: function () {
                    self.download();
                }
            });//self.menu.push
        }//if canDownload

        if (appVM.canRename()) {
            self.menu.push({
                text: "<span class=\'glyphicon glyphicon-random\'></span>  " + appVM.language.rename,
                action: function () {
                    self.rename();
                }
            });//self.menu.push
        }//if canRename

        if (appVM.canMove()) {
            self.menu.push({
                text: "<span class=\'glyphicon glyphicon-move\'></span>  " + appVM.language.move,
                action: function () {
                    self.move();
                }
            });//self.menu.push
        }//if canMove

        if (appVM.canDelete()) {
            self.menu.push({
                text: "<span class='glyphicon glyphicon-trash'></span>  " + appVM.language.del,
                action: function () {
                    self.removeMe();
                }
            });//self.menu.push
        }//if canDelete

        self.getIconUrl = ko.pureComputed(function () {
            var url = appVM.config.icons.path;
            if (self.isDirectory()) {
                url += appVM.config.icons.directory;
            } else {
                url += self.fileType() + ".png";
            }//if
            return url;
        });//getIconUrl

        self.getDownloadUrl = ko.pureComputed(function () {
            if (appVM.config && self.path()) {
                if (self.isDirectory()) {
                    return false;
                }//if
                return appVM.config.options.fileConnector
                        + self.directPath();
            }//if
            return false;
        });//getDownloadUrl

        self.getPreviewUrl = ko.pureComputed(function () {
            if (appVM.config) {
                if (self.isDirectory()) {
                    return appVM.config.icons.path + appVM.config.icons.directory;
                }//if
                return appVM.config.options.fileConnector
                        + self.preview();
            }//if
            return false;
        });//getDownloadUrl

        // Is file in the list of accepted image file formats?
        self.isImageFile = ko.pureComputed(function () {
            if (appVM.config) {
                return $.inArray(self.fileType(), appVM.config.images.imagesExt || []) !== -1 || self.isDirectory();
            }//if
            return false;
        });//isImageFile

        // Test if file is supported web video file
        self.isVideoFile = ko.pureComputed(function () {
            if (appVM.config) {
                return $.inArray(self.fileType(), appVM.config.videos.videosExt || []) !== -1;
            }//if
            return false;
        });//isVideoFile

        // Test if file is supported web audio file
        self.isAudioFile = ko.pureComputed(function () {
            if (appVM.config) {
                return $.inArray(self.fileType(), appVM.config.audios.audiosExt || []) !== -1;
            }//if
            return false;
        });//isAudioFile

        // Test if file is pdf file
        self.isPdfFile = ko.pureComputed(function () {
            if (appVM.config) {
                return $.inArray(self.fileType(), appVM.config.pdfs.pdfsExt || []) !== -1;
            }//if
            return false;
        });//ifPdfFile

        self.templateName = function () {
            if (appVM.config) {
                if (self.isVideoFile()) {
                    return "video-player-template";
                }//if isVideoFile
                if (self.isAudioFile()) {
                    return "audio-player-template";
                }//if isAudioFile
                if (self.isPdfFile()) {
                    return "pdf-viewer-template";
                }//if isPdfFile
            }//if appVM.config
            return "image-template";
        };//templateName

        self.download = function () {
            var downloadUrl = self.getDownloadUrl();
            if (downloadUrl) {
                window.location = downloadUrl;
            }//if downloadUrl
        };//download

        self.rename = function () {
            swal({
                title: appVM.language.rename,
                text: appVM.language.new_filename,
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: appVM.language.inputPlaceholder
            }, function (inputValue) {
                if (inputValue === false) {
                    return false;
                }//if
                if (inputValue === "") {
                    swal.showInputError(appVM.language.INVALID_DIRECTORY_OR_FILE);
                    return false;
                }//if
                appVM.util.apiPut({
                    url: "/item/meta/name",
                    new: inputValue,
                    path: self.path(),
                    success: function (result) {
                        self.path(result.path);
                        self.reloadSelf();
                        appVM.loadCurrentFolder();
                        toastr.success(appVM.language.successful_rename, result.filename, {"positionClass": "toast-bottom-right"});
                    }//success
                });//apiGet
                return false;
            });//swal
        };//rename

        self.move = function () {
            swal({
                title: appVM.language.move,
                text: appVM.language.prompt_foldername,
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: appVM.language.inputPlaceholder
            }, function (inputValue) {
                if (inputValue === false) {
                    return false;
                }//if
                if (inputValue === "") {
                    swal.showInputError(appVM.language.help_move);
                    return false;
                }//if
                appVM.util.apiPatch({
                    url: "/item",
                    newPath: inputValue,
                    path: self.path(),
                    success: function (result) {
                        self.path(result.path);
                        self.reloadSelf();
                        appVM.currentPath(result.dir);
                        appVM.loadCurrentFolder();
                        toastr.success(appVM.language.successful_moved, result.filename, {"positionClass": "toast-bottom-right"});
                    }
                });//apiGet
                return false;
            });//swal
        };//move

        //naming this 'delete' breaks knockoutjs, blah
        self.removeMe = function () {
            swal({
                title: appVM.language.del,
                text: appVM.language.confirmation_delete,
                type: "warning",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                confirmButtonText: appVM.language.yes
            }, function () {
                appVM.util.apiDelete({
                    url: "/item",
                    path: self.path(),
                    success: function (result) {
                        toastr.success(appVM.language.successful_delete, result.path, {"positionClass": "toast-bottom-right"});
                        if (appVM.currentView() === "details") {
                            appVM.goLevelUp();
                        } else {
                            appVM.loadCurrentFolder();
                        }
                    }//success
                });//apiGet
            });//swal
        };//delete

        self.replaceMe = function () {
            var dz = $("#my-replace-dropzone");
            var button = $("#replaceMe");
            dz.show();
            button.hide();
            dz.dropzone({
                url: appVM.config.options.fileConnector + "/file",
                dictCancelUpload: appVM.language.cancel,
                dictRemoveFile: appVM.language.del,
                dictDefaultMessage: appVM.language.dz_dictDefaultMessage,
                dictInvalidFileType: appVM.language.dz_dictInvalidFileType,
                params: {path: self.path()},
                maxFiles: 1,
                method: "put",
                success: function (ignore, res) {
                    if (res.error) {
                        toastr.error(appVM.language.ERROR_UPLOADING_FILE, res.error[0], {"positionClass": "toast-bottom-right"});
                    } else {
                        dz.hide();
                        button.show();

                        //This ensures the image is reloaded by appending a random number
                        var img = $("#detailImage"),
                            newImg = img.attr("src");
                        newImg += img.attr("src").indexOf("?") === -1
                            ? "?"
                            : "&";
                        newImg += Math.random();

                        img.attr("src", newImg);

                        toastr.success(appVM.language.successful_replace, res.data.name, {"positionClass": "toast-bottom-right"});
                    }//if
                }, //success
                complete: function (file) {
                    this.removeFile(file);
                }//complete
            });//dropzone
        };//replaceMe

        // Calls the SetUrl function for FCKEditor compatibility,
        // passes file path, dimensions, and alt text back to the
        // opening window. Triggered by clicking the "Select"
        // button in detail views or choosing the "Select"
        // contextual menu option in list views.
        // NOTE: closes the window when finished.
        self.selectMe = function () {
            var url = appVM.config.options.fileConnector
                    + self.directPath();

            if (window.opener || window.tinyMCEPopup || appVM.util.urlParameters("field_name") || appVM.util.urlParameters("CKEditorCleanUpFuncNum") || appVM.util.urlParameters("CKEditor")) {
                if (window.tinyMCEPopup) {
                    // use TinyMCE > 3.0 integration method
                    var win = window.tinyMCEPopup.getWindowArg("window");
                    win.document.getElementById(window.tinyMCEPopup.getWindowArg("input")).value = url;
                    if (win.ImageDialog !== undefined) {
                        // Update image dimensions
                        if (win.ImageDialog.getImageData) {
                            win.ImageDialog.getImageData();
                        }//if

                        // Preview if necessary
                        if (win.ImageDialog.showPreviewImage) {
                            win.ImageDialog.showPreviewImage(url);
                        }//if
                    }//if ImageDialog
                    window.tinyMCEPopup.close();
                    return;
                }//if tinyMCEPopup

                // tinymce 4 and colorbox
                if (appVM.util.urlParameters("field_name")) {
                    window.parent.document.getElementById(appVM.util.urlParameters("field_name")).value = url;

                    if (window.parent.tinyMCE !== undefined) {
                        window.parent.tinyMCE.activeEditor.windowManager.close();
                    }//if
                    if (window.parent.$.fn.colorbox !== undefined) {
                        window.parent.$.fn.colorbox.close();
                    }//if
                } else if (appVM.util.urlParameters("CKEditor")) {
                    // use CKEditor 3.0 + integration method
                    if (window.opener) {
                        // Popup
                        window.opener.CKEDITOR.tools.callFunction(appVM.util.urlParameters("CKEditorFuncNum"), url);
                    } else {
                        // Modal (in iframe)
                        window.parent.CKEDITOR.tools.callFunction(appVM.util.urlParameters("CKEditorFuncNum"), url);
                        window.parent.CKEDITOR.tools.callFunction(appVM.util.urlParameters("CKEditorCleanUpFuncNum"));
                    }//if opener
                } else {
                    // use FCKEditor 2.0 integration method
                    if (data !== undefined && data.Properties.Width !== "") {
                        var p = url;
                        var w = data.Properties.Width;
                        var h = data.Properties.Height;
                        window.opener.SetUrl(p, w, h);
                    } else {
                        window.opener.SetUrl(url);
                    }//if
                }//if tinyMCE 4 and colorbox

                if (window.opener) {
                    window.close();
                }//if opener
            } else {
                toastr.error(appVM.language.error, appVM.language.fck_select_integration, {"positionClass": "toast-bottom-right"});
            }//if we are a plugin for an editor
        };//selectMe
    };//Item
});//define