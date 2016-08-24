/*global define, window*/
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
    var Utility = require("app/utility.viewmodel");

    return function (appVM, item) {
        var self = this;
        self.config = appVM.config;
        self._$ = new Utility(self.config);
        item = item || {};
        item.properties = item.properties || {};

        // This is our context menu for each item, so simple :)
        self.menu = ko.observableArray([{
            text: "<span class='glyphicon glyphicon-download'></span>  Download",
            action: function () {self.download(); }
        }, {
            text: "<span class=\'glyphicon glyphicon-random\'></span>  Rename",
            action: function () {self.rename(); }
        }, {
            text: "<span class=\'glyphicon glyphicon-move\'></span>  Move",
            action: function () {self.move(); }
        }, {
            text: "<span class='glyphicon glyphicon-trash'></span>  Delete",
            action: function () {self.removeMe(); }
        }, {
            text: "<span class='glyphicon glyphicon-info-sign'></span>  Details",
            action: function () {appVM.goToItem(self); }
        }]);
        //{ '<span class=\'glyphicon glyphicon-download\'></span>  Download': download, '<span class=\'glyphicon glyphicon-random\'></span>  Rename': rename, '<span class=\'glyphicon glyphicon-move\'></span>  Move': move }

        // console.log("item config -> ", self.config);

        // Lets make the entire item into observables
        self.filename = ko.observable((item.filename));
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
            // filemtime: item.properties.filemtime,
            height: item.properties.height,
            width: item.properties.width,
            size: filesize(parseInt(item.properties.size || 0, 10))
        });//self.properties

        self.reloadSelf = function () {
            // console.log("reloadSelf path -> ", self.path());
            self._$.apiGet({
                url: "/item/meta",
                // mode: "getinfo",
                path: self.path(),
                success: function (item) {
                    // console.log("reloadSelf item -> ", item);
                    self.filename((item.filename));
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
                        // filemtime: item.properties.filemtime,
                        height: item.properties.height,
                        width: item.properties.width,
                        size: filesize(parseInt(item.properties.size || 0, 10))
                    });
                }//success
            });//apiGet
        };//reloadSelf

        self.getIconUrl = ko.pureComputed(function () {
            var url = self.config.icons.path;
            if (self.isDirectory()) {
                url += self.config.icons.directory;
            } else {
                url += self.fileType() + ".png";
            }

            return url;
        });//getIconUrl

        self.getDownloadUrl = ko.pureComputed(function () {
            // console.log("getDownloadUrl file -> ", self);
            if (self.config && self.path()) {
                if (self.isDirectory()) {
                    return self.config.icons.path + self.config.icons.directory;
                }
                return self.config.options.fileConnector
                    + self.directPath();
            }
        });//getDownloadUrl

        self.getPreviewUrl = ko.pureComputed(function () {
            if (self.config) {
                if (self.isDirectory()) {
                    return self.config.icons.path + self.config.icons.directory;
                }
                return self.config.options.fileConnector
                    + self.preview();
            }
        });//getDownloadUrl

        // Is file in the list of accepted image file formats?
        self.isImageFile = ko.pureComputed(function () {
            if (self.config) {
                return $.inArray(self.fileType(), self.config.images.imagesExt || []) !== -1 || self.isDirectory();
            }
            return false;
        });

        // Test if file is supported web video file
        self.isVideoFile = ko.pureComputed(function () {
            if (self.config) {
                return $.inArray(self.fileType(), self.config.videos.videosExt || []) !== -1;
            }
            return false;
        });

        // Test if file is supported web audio file
        self.isAudioFile = ko.pureComputed(function () {
            if (self.config) {
                return $.inArray(self.fileType(), self.config.audios.audiosExt || []) !== -1;
            }
            return false;
        });

        // Test if file is pdf file
        self.isPdfFile = ko.pureComputed(function () {
            if (self.config) {
                return $.inArray(self.fileType(), self.config.pdfs.pdfsExt || []) !== -1;
            }
            return false;
        });

        self.templateName = function () {
            if (self.config) {
                if (self.isVideoFile()) {
                    return "video-player-template";
                }
                if (self.isAudioFile()) {
                    return "audio-player-template";
                }
                if (self.isPdfFile()) {
                    return "pdf-viewer-template";
                }
            }
            return "image-template";
        };//templateName

        self.download = function () {
            window.location = self.getDownloadUrl();
        };//download

        self.rename = function () {
            swal({
                title: self.config.language.rename,
                text: self.config.language.new_filename,
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "Write something"
            },
                function (inputValue) {
                    if (inputValue === false) {
                        return false;
                    }
                    if (inputValue === "") {
                        swal.showInputError(self.config.language.INVALID_DIRECTORY_OR_FILE);
                        return false;
                    }
                    self._$.apiPut({
                        url: "/item/meta/name",
                        new: inputValue,
                        path: self.path(),
                        success: function (result) {
                            self.path(result.path);
                            self.reloadSelf();
                            appVM.loadCurrentFolder();
                            toastr.success(self.config.language.successful_rename, result.filename, {"positionClass": "toast-bottom-right"});
                        }
                    });//apiGet
                });//swal
        };//rename

        self.move = function () {
            swal({
                title: self.config.language.move,
                text: self.config.language.prompt_foldername,
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "Write something"
            },
                function (inputValue) {
                    if (inputValue === false) {
                        return false;
                    }
                    if (inputValue === "") {
                        swal.showInputError(self.config.language.help_move);
                        return false;
                    }
                    self._$.apiPatch({
                        url: "/item",
                        newPath: inputValue,
                        path: self.path(),
                        success: function (result) {
                            // console.log("move result -> ", result);
                            self.path(result.path);
                            self.reloadSelf();
                            appVM.currentPath(result.dir);
                            appVM.loadCurrentFolder();
                            toastr.success(self.config.language.successful_moved, result.filename, {"positionClass": "toast-bottom-right"});
                        }
                    });//apiGet
                });//swal
        };//move

        //naming this 'delete' breaks knockoutjs, blah
        self.removeMe = function () {
            swal({
                title: self.config.language.del,
                text: self.config.language.confirmation_delete,
                type: "warning",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                confirmButtonText: self.config.language.yes
            }, function () {
                self._$.apiDelete({
                    url: "/item",
                    path: self.path(),
                    success: function (result) {
                        console.log("delete result -> ", result);
                        toastr.success(self.config.language.successful_delete, result.path, {"positionClass": "toast-bottom-right"});
                        appVM.goLevelUp();
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
                url: self.config.options.fileConnector + "/file",
                params: {path: self.path()},
                maxFiles: 1,
                method: "put",
                success: function (file, res) {
                    if (res.error) {
                        toastr.error(self.config.language.ERROR_UPLOADING_FILE, res.error[0], {"positionClass": "toast-bottom-right"});
                    } else {
                        dz.hide();
                        button.show();
                        var img = $('#detailImage'),
                            newImg = img.attr('src');
                        newImg += img.attr('src').indexOf('?') === -1 ? "?" : "&";
                        newImg += Math.random();

                        // console.log("image after random ", newImg);
                        img.attr('src', newImg);

                        toastr.success(self.config.language.successful_replace, res.data.name, {"positionClass": "toast-bottom-right"});
                    }
                },
                complete: function (file) {
                    this.removeFile(file);
                }
            });
        };//replaceMe

        // Calls the SetUrl function for FCKEditor compatibility,
        // passes file path, dimensions, and alt text back to the
        // opening window. Triggered by clicking the "Select"
        // button in detail views or choosing the "Select"
        // contextual menu option in list views.
        // NOTE: closes the window when finished.
        self.selectMe = function () {
            var url;
            // if (self.config.options.baseUrl !== false) {
            //     url = smartPath(baseUrl, data.Path.replace(fileRoot, ""));
            // } else {
                url = self.config.options.fileConnector
                    + "?mode=download"
                    + "&path=" + self.path();
            // }

            if (window.opener || window.tinyMCEPopup || self._$.urlParameters("field_name") || self._$.urlParameters("CKEditorCleanUpFuncNum") || self._$.urlParameters("CKEditor")) {
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
                if (self._$.urlParameters("field_name")) {
                    window.parent.document.getElementById(self._$.urlParameters("field_name")).value = url;

                    if (window.parent.tinyMCE !== undefined) {
                        window.parent.tinyMCE.activeEditor.windowManager.close();
                    }
                    if (window.parent.$.fn.colorbox !== undefined) {
                        window.parent.$.fn.colorbox.close();
                    }
                } else if (self._$.urlParameters("CKEditor")) {
                    // use CKEditor 3.0 + integration method
                    if (window.opener) {
                        // Popup
                        window.opener.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorFuncNum"), url);
                    } else {
                        // Modal (in iframe)
                        window.parent.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorFuncNum"), url);
                        window.parent.CKEDITOR.tools.callFunction(_$.urlParameters("CKEditorCleanUpFuncNum"));
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
                toastr.error(self.config.language.error, self.config.language.fck_select_integration, {"positionClass": "toast-bottom-right"});
            }
        };//selectMe

    };//Item
});//define