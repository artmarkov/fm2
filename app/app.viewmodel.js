/*global define*/
/**
 * Created by Joshua.Austill on 8/18/2016.
 */
// our viewmodel for our app
define(function (require) {
    "use strict";
    var ko = require("knockout");
    var $ = require("jquery");
    var config = JSON.parse(require("text!scripts/filemanager.config.json"));
    var Utility = require("app/utility.viewmodel");
    var Item = require("app/item.datamodel");
    var swal = require("sweetalert");
    var filesize = require("filesize");
    var toastr = require("toastr");
    require("jqueryfancytree");

    return function () {
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
        self.currentPath = ko.observable(config.options.fileRoot);
        self.currentFolder = ko.observableArray([]);
        self.folderSize = ko.observable(0);
        self.folderCount = ko.observable(0);
        self.lastView = ko.observable(config.options.defaultViewMode);
        self.activeView = ko.observable(config.options.defaultViewMode);
        self.currentView = ko.pureComputed({
            read: function () {
                return self.activeView();
            }, //read
            write: function (value) {
                if ((self.activeView() === "grid" || self.activeView() === "list") && value !== "grid" && value !== "list") {
                    self.lastView(self.activeView());
                }
                self.activeView(value);
            }, //write
            owner: self
        }); //currentView
        self.currentItem = ko.observable(new Item(self));
        self.loading = ko.observable(true);

        self.templateName = function () {
            if (self.config) {
                if (self.currentView() === "grid") {
                    return "grid-template";
                }//if
                if (self.currentView() === "list") {
                    return "list-template";
                }//if
                if (self.currentView() === "details") {
                    return "details-template";
                }//if
            }//if config
            return "uploads-template";
        };//templateName

        self.afterRender = function () {
            if (self.currentView() === "uploads") {
                $("#my-awesome-dropzone").dropzone({
                    url: config.options.fileConnector + "/file",
                    dictCancelUpload: self.language.cancel,
                    dictRemoveFile: self.language.del,
                    dictDefaultMessage: self.language.dz_dictDefaultMessage,
                    dictInvalidFileType: self.language.dz_dictInvalidFileType,
                    params: {path: self.currentPath()}
                }); //dropzone
            } //if uploads
        }; //afterRender

        // I think this needs to be broken out into 2 different functions, one for initialization, the other for reloading
        self.loadCurrentFolder = function (init) {
            var newItems = [],
                newSize = 0,
                newCount = 0,
                $tree = $("#tree");
            self.util.apiGet({
                url: "/folder",
                path: encodeURIComponent(self.currentPath()),
                success: function (data) {
                    $.each(data, function (i, d) {
                        newSize += d.properties.size;
                        newCount++;
                        newItems.push(new Item(self, d));
                    }); //each
                    self.currentFolder(newItems);
                    self.folderCount(newCount);
                    self.folderSize(filesize(parseInt(newSize || 0, 10)));
                    self.loading(false);
                    if (init) {
                        $tree.fancytree({
                            "focusOnSelect": true,
                            source: [{title: config.options.fileRoot, children: data, key: config.options.fileRoot, folder: true, expanded: true}],
                            activate: function (ignore, data) {
                                if (data.node.folder === true) {
                                    self.currentPath(data.node.key);
                                    self.loadCurrentFolder();
                                } else {
                                    self.currentItem(new Item(self, data.node.data));
                                    self.currentView("details");
                                } //if
                            } //activate
                        }); //fancytree
                        $tree.fancytree("getTree").getNodeByKey(self.currentPath()).setActive();
                    } else {
                        var node = $tree.fancytree("getTree").getNodeByKey(self.currentPath());
                        if (node.hasChildren()) {
                            node.removeChildren();
                            node.render();
                        } //if
                        $tree.fancytree("getTree").getNodeByKey(self.currentPath()).addChildren(data);
                    } //if init
                    self.returnToFolderView();
                    setTimeout(self.util.setDimensions, 100);
                    return data;
                }//success
            });//apiGet
        };//loadCurrentFolder

        self.returnToFolderView = function () {
            if (self.currentView !== "grid" && self.currentView() !== "list") {
                self.currentView(self.lastView());
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
                        self.loadCurrentFolder();
                        toastr.success(self.language.successful_added_folder, inputValue, {"positionClass": "toast-bottom-right"});
                    }//success
                });//apiGet
                return false;
            });//swal
        };//createFolder

        self.goHome = function () {
            $("#tree").fancytree("getTree").getNodeByKey(config.options.fileRoot).setActive();
            self.currentPath(config.options.fileRoot);
            if (self.currentView() !== "grid" && self.currentView() !== "list") {
                self.currentView(self.lastView());
            } //if
            self.loadCurrentFolder();
        };//goHome

        self.notHome = ko.pureComputed(function () {
            return self.currentPath() !== config.options.fileRoot || self.currentView() === "uploads";
        }); //notHome

        self.browseToItem = function (data) {
            $("#tree").fancytree("getTree").getNodeByKey(data.path()).setActive();
            if (data.isDirectory()) {
                self.currentPath(data.path());
                self.loadCurrentFolder();
            } else {
                self.currentItem(data);
                self.currentView("details");
            } //if
        }; //browseToItem

        self.goToItem = function (data) {
            // we set no events on this one because we simply want to select it, not kick off the chain of activate events that normally
            // happen when you physically click a node
            $("#tree").fancytree("getTree").getNodeByKey(data.path()).setActive(true, {noEvents: true});
            self.currentItem(data);
            self.currentView("details");
        }; //goToItem

        self.goLevelUp = function () {
            self.loading(true);
            if (self.currentView() !== "grid" && self.currentView() !== "list") {
                self.currentView(self.lastView());
                self.loadCurrentFolder();
                $("#tree").fancytree("getTree").getNodeByKey(self.currentPath()).setActive();
                self.loading(false);
            } else {
                var cpath = self.currentPath();
                if (cpath !== config.options.fileRoot) {
                    var newPath = cpath.substring(0, cpath.slice(0, -1).lastIndexOf("/"));
                    self.currentPath(newPath === ""
                        ? "/"
                        : newPath);
                    self.loadCurrentFolder();
                    $("#tree").fancytree("getTree").getNodeByKey(self.currentPath()).setActive();
                    self.loading(false);
                } else {
                    self.loadCurrentFolder();
                    $("#tree").fancytree("getTree").getNodeByKey(self.currentPath()).setActive();
                    self.loading(false);
                } //if
            } //if
        }; //goLevelUp

        self.switchViews = function () {
            if (self.currentView() !== "list" && self.currentView() !== "grid") {
                self.currentView(self.lastView());
            } else if (self.currentView() === "grid") {
                self.currentView("list");
            } else {
                self.currentView("grid");
            } //if
        };//switchViews

        self.viewButtonClass = ko.pureComputed(function () {
            return self.currentView() === "grid"
                ? "glyphicon glyphicon-th-list"
                : "glyphicon glyphicon-th";
        });//viewButtonClass

        self.loadCurrentFolder(true);
    }; //app.viewmodel
}); //define