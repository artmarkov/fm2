/**
 * Created by Joshua.Austill on 8/18/2016.
 */
// our viewmodel for our app
var ko = require("knockout");
var $ = require("jquery");
var Utility = require("./utility.viewmodel.js");
var Item = require("./item.datamodel.js");
var swal = require("sweetalert");
var filesize = require("filesize");
var toastr = require("toastr");

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
    self.canReplace = ko.observable(false);
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

            if ($.inArray("replace", self.config.security.capabilities) !== -1) {
                self.canReplace(true);
            }//if

            if ($.inArray("select", self.config.security.capabilities) !== -1 && (self.util.urlParameters("CKEditor") || window.opener || window.tinyMCEPopup || self.util.urlParameters("field_name"))) {
                self.canSelect(true);
            }//if
        }//success
    });//apiGet

    self.util.loadTheme();

    // Now we start our data processing
    self.exclusiveFolder = self.util.getExclusiveFolder();
    self.homePath = self.util.getFullPath(self.exclusiveFolder, self.config.options.startingPath);
    self.currentPath = ko.observable(self.util.getFullPath(self.exclusiveFolder, self.config.options.startingPath));
    self.currentRelativePath = ko.pureComputed({
        read: function () {
            return self.util.getRelativePath(self.exclusiveFolder, self.currentPath());
        }, //read
        write: function (data) {
            if (data.node.folder === true) {
                self.currentPath(self.util.getFullPath(self.exclusiveFolder, data.node.key));
                self.returnToFolderView();
            } else {
                self.currentItem(new Item(self, $.extend(data.node.data, data.node)));
                self.currentView("details");
            } //if
        }
    });//currentRelativePath
    self.currentFolder = ko.observableArray([]);
    self.folderSize = ko.observable(0);
    self.folderCount = ko.observable(0);

    self.currentView = ko.observable("main");
    self.currentSubView = ko.observable(config.options.defaultViewMode);

    self.currentItem = ko.observable(new Item(self));
    self.loading = ko.observable(true);

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
                params: {path: self.currentPath()}
            }); //dropzone
        } //if uploads
    }; //afterRender

    self.currentPath.subscribe(function () {
        var newItems = [],
            newSize = 0,
            newCount = 0;
        self.util.apiGet({
            url: "/folder",
            path: self.currentPath(),
            success: function (data) {
                $.each(data, function (i, d) {
                    d.key = self.util.getRelativePath(self.exclusiveFolder, d.key);
                    newSize += d.properties.size;
                    newCount++;
                    newItems.push(new Item(self, d));
                }); //each
                self.currentFolder(newItems);
                self.folderCount(newCount);
                self.folderSize(filesize(parseInt(newSize || 0, 10)));
                self.loading(false);
                self.returnToFolderView();
                setTimeout(self.util.setDimensions, 100);
            }//success
        });//apiGet
    }); // currentPath.subscribe

    self.initializeFolder = function () {
        var newItems = [],
            newSize = 0,
            newCount = 0;
        self.util.apiGet({
            url: "/folder",
            path: self.currentPath(),
            success: function (data) {
                $.each(data, function (i, d) {
                    d.key = self.util.getRelativePath(self.exclusiveFolder, d.key);
                    newSize += d.properties.size;
                    newCount++;
                    newItems.push(new Item(self, d));
                }); //each
                self.currentFolder(newItems);
                self.folderCount(newCount);
                self.folderSize(filesize(parseInt(newSize || 0, 10)));
                self.loading(false);
                self.returnToFolderView();
                setTimeout(self.util.setDimensions, 100);
                return data;
            }//success
        });//apiGet
    };//loadCurrentFolder

    self.returnToFolderView = function () {
        if (self.currentView !== "main") {
            self.currentView("main");
        } //if
    }; //returnToFolderView

    self.createFolder = function () {
        swal({
            title: self.language.new_folder,
            text: self.language.prompt_foldername,
            type: "input",
            showCancelButton: true,
            closeOnConfirm: true,
            animation: "slide-from-top",
            inputPlaceholder: self.language.inputPlaceholder
        }, function (inputValue) {
            if (inputValue === false) {
                return false;
            } //if
            if (inputValue === "") {
                swal.showInputError(self.language.no_foldername);
                return false;
            } //if
            self.util.apiPost({
                url: "/folder",
                name: inputValue,
                path: self.currentPath(),
                success: function () {
                    self.initializeFolder();
                    toastr.success(self.language.successful_added_folder, inputValue, {"positionClass": "toast-bottom-right"});
                }//success
            });//apiGet
            return false;
        });//swal
    };//createFolder

    self.goHome = function () {
        self.currentPath(self.homePath);
        if (self.currentView() !== "main") {
            self.currentView("main");
        }
    };//goHome

    self.notHome = ko.pureComputed(function () {
        return self.currentPath() !== self.homePath || self.currentView() !== "main";
    }); //notHome

    self.browseToItem = function (data) {
        if (data.isDirectory()) {
            self.currentPath(data.path());
        } else {
            self.currentItem(data);
            self.currentView("details");
        } //if
    }; //browseToItem

    self.goToItem = function (data) {
        self.currentItem(data);
        self.currentView("details");
    }; //goToItem

    self.goLevelUp = function () {
        self.loading(true);
        if (self.currentView() !== "main") {
            self.currentView("main");
            // self.currentPath().valueHasMutated();
            self.initializeFolder();
            self.loading(false);
        } else {
            var cpath = self.currentPath();
            if (cpath !== self.homePath) {
                var newPath = cpath.substring(0, cpath.slice(0, -1).lastIndexOf("/"));
                self.currentPath(newPath === ""
                    ? "/"
                    : newPath);
                self.loading(false);
            } else {
                self.loading(false);
            } //if
        } //if
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

    self.initializeFolder();
}; //app.viewmodel tst