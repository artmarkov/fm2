/*global define*/
/**
 * Created by Joshua.Austill on 8/19/2016.
 */
define(function (require) {
    "use strict";
    var ko = require("knockout");

    return function (item, config) {
        var self = this;
        self.config = config;
        item = item || {};
        item.properties = item.properties || {};

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
            size: item.properties.size
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
    };//Item
});//define