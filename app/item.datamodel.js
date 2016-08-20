/*global define*/
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

        console.log("item config -> ", self.config);

        // Lets make the entire item into observables
        self.filename = ko.observable((item.filename));
        self.fileType = ko.observable(item.fileType);
        self.isDirectory = ko.observable(item.isDirectory);
        self.path = ko.observable(item.path);
        self.preview = ko.observable(item.preview);
        self.thumbnail = ko.observable(item.thumbnail);
        self.properties = ko.observable({
            dateCreated: item.properties.dateCreated,
            dateModified: item.properties.dateModified,
            filemtime: item.properties.filemtime,
            height: item.properties.height,
            width: item.properties.width,
            size: filesize(parseInt(item.properties.size || 0, 10))
        });//self.properties

        self.reloadSelf = function () {
            self._$.apiGet({
                mode: "getinfo",
                path: self.path(),
                success: function (item) {
                    console.log("reloadSelf item -> ", item);
                    self.filename((item.filename));
                    self.fileType(item.fileType);
                    self.isDirectory(item.isDirectory);
                    self.path(item.path);
                    self.preview(item.preview);
                    self.thumbnail(item.thumbnail);
                    self.properties({
                        dateCreated: item.properties.dateCreated,
                        dateModified: item.properties.dateModified,
                        filemtime: item.properties.filemtime,
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
            console.log("getDownloadUrl file -> ", self);
            if (self.config && self.path()) {
                if (self.isDirectory()) {
                    return self.config.icons.path + self.config.icons.directory;
                }
                return self.config.options.fileConnector
                    + "?mode=download"
                    + "&path=" + encodeURIComponent(self.path())
                    + "&time=" + Date.now();
            }
        });//getDownloadUrl

        self.getPreviewUrl = ko.pureComputed(function () {
            if (self.config) {
                if (self.isDirectory()) {
                    return self.config.icons.path + self.config.icons.directory;
                }
                return self.config.options.fileConnector
                    + "?mode=preview"
                    + "&path=" + encodeURIComponent(self.preview())
                    + "&time=" + Date.now();
            }
        });//getDownloadUrl

        // Is file in the list of accepted image file formats?
        self.isImageFile = ko.pureComputed(function () {
            if (self.config) {
                return $.inArray(self.fileType(), self.config.images.imagesExt || []) !== -1;
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
                    self._$.apiGet({
                        mode: "rename",
                        new: inputValue,
                        old: self.path(),
                        success: function (result) {
                            self.path(result.newPath);
                            self.reloadSelf();
                            appVM.loadCurrentFolder();
                            toastr.success(self.config.language.successful_rename, result.newName, {"positionClass": "toast-bottom-right"});
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
                    self._$.apiGet({
                        mode: "move",
                        new: inputValue,
                        old: self.path(),
                        success: function (result) {
                            console.log("move result -> ", result);
                            self.path(result.newPath);
                            self.reloadSelf();
                            appVM.currentPath(inputValue);
                            appVM.loadCurrentFolder();
                            toastr.success(self.config.language.successful_moved, result.newName, {"positionClass": "toast-bottom-right"});
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
                self._$.apiGet({
                    mode: "delete",
                    path: self.path(),
                    success: function (result) {
                        console.log("delete result -> ", result);
                        toastr.success(self.config.language.successful_delete, result.path, {"positionClass": "toast-bottom-right"});
                        appVM.goLevelUp();
                    }//success
                });//apiGet
            });//swal
        };//delete

    };//Item
});//define