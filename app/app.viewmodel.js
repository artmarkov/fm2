/**
 * Created by Joshua.Austill on 8/18/2016.
 */
// our viewmodel for our app
var ko = require("knockout");
var $ = require("jquery");
var Utility = require("./utility.viewmodel.js");
var Folder = require("./folder.datamodel.js");
var Item = require("./item.datamodel.js");

module.exports = function (config) {
    "use strict";
    var self = this;
    //configuration stuff first :)
    self.config = config;
    self.util = new Utility(self);
    self.language = self.util.getLanguage();
    self.canUpload = ko.observable(false);
    self.canDownload = ko.observable(false);
    self.canRename = ko.observable(false);
    self.canMove = ko.observable(false);
    self.canDelete = ko.observable(false);
    // self.canReplace = ko.observable(false);
    self.canSelect = ko.observable(false);

    self.util.apiGet({
        url: "",
        success: function (rules) {
            $.extend(self.config, rules[0]);

            if ($.inArray("upload", self.config.security.capabilities) !== -1) {
                self.canUpload(true);
            }//if

            if ($.inArray("download", self.config.security.capabilities) !== -1) {
                self.canDownload(true);
            }//if

            if ($.inArray("rename", self.config.security.capabilities) !== -1) {
                self.canRename(true);
            }//if

            if ($.inArray("move", self.config.security.capabilities) !== -1) {
                self.canMove(true);
            }//if

            if ($.inArray("delete", self.config.security.capabilities) !== -1) {
                self.canDelete(true);
            }//if

            // if ($.inArray("replace", self.config.security.capabilities) !== -1) {
            //     self.canReplace(true);
            // }//if

            if ($.inArray("select", self.config.security.capabilities) !== -1 && (self.util.urlParameters("CKEditor") || window.opener || window.tinyMCEPopup || self.util.urlParameters("field_name"))) {
                self.canSelect(true);
            }//if
        }//success
    });//apiGet

    self.util.loadTheme();

    // Now we start our data processing
    self.homePath = self.config.options.startingPath;

    // folder datamodel stuff
    self.currentFolder = ko.observable(new Folder(self, self.config.options.startingPath));

    self.currentView = ko.observable("main");
    self.currentSubView = ko.observable(config.options.defaultViewMode);

    self.loading = ko.observable(false);

    self.mainView = function () {
        if (self.config) {
            if (self.currentView() === "uploads") {
                return "uploads-template";
            }//if
            if (self.currentView() === "details") {
                return "details-template";
            }//if
        }//if config
        return "main-template";
    }; // mainView

    self.mainSubView = function () {
        if (self.config) {
            if (self.currentSubView() === "grid") {
                return "grid-template";
            }//if
            if (self.currentSubView() === "list") {
                return "list-template";
            }//if
        }//if config
        return "grid-template";
    }; // mainView

    self.afterRender = function () {
        if (self.currentView() === "uploads") {
            $("#my-awesome-dropzone").dropzone({
                url: self.util.apiUrl + "/file",
                withCredentials: true,
                dictCancelUpload: self.language.cancel,
                dictRemoveFile: self.language.del,
                dictDefaultMessage: self.language.dz_dictDefaultMessage,
                dictInvalidFileType: self.language.dz_dictInvalidFileType,
                params: {path: self.util.getFullPath(self.currentFolder().path())}
            }); // dropzone
        } // if uploads
        setTimeout(self.util.setDimensions, 100);
    }; // afterRender

    self.returnToFolderView = function () {
        if (self.currentView !== "main") {
            self.currentView("main");
        } //if
    }; //returnToFolderView

    self.goHome = function () {
        if (self.currentFolder().path() !== self.homePath) {
            self.currentFolder().loadPath(self.homePath);
        }
        self.currentFolder().setRootActive();

        if (self.currentView() !== "main") {
            self.currentView("main");
        }
    };//goHome

    self.notHome = ko.pureComputed(function () {
        return self.currentFolder().path() !== self.homePath || self.currentView() !== "main";
    }); //notHome

    self.browseToItem = function (data) {
        var newItem = new Item(self, ko.toJS(data));
        self.currentFolder().currentItem(newItem);
        if (newItem.isDirectory()) {
            self.currentView("main");
        } else {
            self.currentView("details");
        } //if
    }; //browseToItem

    self.goToItem = function (data) {
        console.log("goToItem data -> ", data);
        self.currentFolder().currentItem(data, true);
        self.currentView("details");
    }; //goToItem

    self.goLevelUp = function () {
        self.loading(true);
        if (self.currentView() !== "main") {
            self.currentView("main");
            self.currentFolder().refreshCurrentPath();
        } else {
            self.currentFolder().levelUp();
        }//if
        self.loading(false);
    }; //goLevelUp

    self.switchViews = function () {
        if (self.currentSubView() === "list") {
            self.currentSubView("grid");
        } else {
            self.currentSubView("list");
        } //if
    };//switchViews

    self.mainSubViewButtonClass = ko.pureComputed(function () {
        return self.currentSubView() === "grid"
            ? "glyphicon glyphicon-th-list"
            : "glyphicon glyphicon-th";
    });//viewButtonClass
}; //app.viewmodel tst