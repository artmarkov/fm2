/*global define*/
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
define(function (require) {
    "use strict";
    var ko = require("knockout");
    var $ = require("jquery");
    var filesize = require("filesize");

    return function (item, config) {
        var self = this;
        self.config = config;
        item = item || {};
        item.properties = item.properties || {};

        console.log("item config -> ", self.config);

        // Lets make the entire item into observables
        self.filename = ko.observable(item.filename);
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
            if (self.config) {
                if (self.isDirectory()) {
                    return self.config.icons.path + self.config.icons.directory;
                }
                return self.config.options.fileConnector
                    + "?mode=download"
                    + "&path=" + self.path()
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
                    + "&path=" + self.preview()
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
    };//Item
});//define