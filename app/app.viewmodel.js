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
                //console.log("rules -> ", rules);
                $.extend(self.config, rules[0]);
                // console.log("self.config after rules load", self.config);

                if ($.inArray("upload", self.config.security.capabilities) !== -1) {
                    self.canUpload(true);
                }

                if ($.inArray("download", self.config.security.capabilities) !== -1) {
                    self.canDownload(true);
                }

                if ($.inArray("rename", self.config.security.capabilities) !== -1) {
                    self.canRename(true);
                }

                if ($.inArray("move", self.config.security.capabilities) !== -1) {
                    self.canMove(true);
                }

                if ($.inArray("delete", self.config.security.capabilities) !== -1) {
                    self.canDelete(true);
                }

                if ($.inArray("replace", self.config.security.capabilities) !== -1) {
                    self.canReplace(true);
                }

                if ($.inArray("select", self.config.security.capabilities) !== -1 && (self.util.urlParameters("CKEditor") || window.opener || window.tinyMCEPopup || self.util.urlParameters("field_name"))) {
                    self.canSelect(true);
                }
            }
        });

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
            },
            write: function (value) {
                if ((self.activeView() === "grid" || self.activeView() === "list") && value !== "grid" && value !== "list") {
                    self.lastView(self.activeView());
                }
                self.activeView(value);
            },
            owner: self
        });
        self.currentItem = ko.observable(new Item(self));
        self.loading = ko.observable(true);

        self.templateName = function () {
            if (self.config) {
                if (self.currentView() === "grid") {
                    return "grid-template";
                }
                if (self.currentView() === "list") {
                    return "list-template";
                }
                if (self.currentView() === "details") {
                    return "details-template";
                }
            }
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
                });
            }
        };

        // I think this needs to be broken out into 2 different functions, one for initialization, the other for reloading
        self.loadCurrentFolder = function (init) {
            var newItems = [],
                newSize = 0,
                newCount = 0,
                $tree = $("#tree");
            self.util.apiGet({
                // mode: "getfolder",
                url: "/folder",
                path: encodeURIComponent(self.currentPath()),
                success: function (data) {
                    $.each(data, function (i, d) {
                        //console.log("d -> ", d);
                        newSize += d.properties.size;
                        newCount++;
                        newItems.push(new Item(self, d));
                    });
                    self.currentFolder(newItems);
                    self.folderCount(newCount);
                    self.folderSize(filesize(parseInt(newSize || 0, 10)));
                    self.loading(false);
                    if (init) {
                        $tree.fancytree({
                            "focusOnSelect": true,
                            source: [{title: config.options.fileRoot, children: data, key: config.options.fileRoot, folder: true, expanded: true}],
                            activate: function (ignore, data) {
                                // console.log("node key ", data.node);
                                if (data.node.folder === true) {
                                    self.currentPath(data.node.key);
                                    self.loadCurrentFolder();
                                } else {
                                    self.currentItem(new Item(self, data.node.data));
                                    self.currentView("details");
                                }
                            }
                        });
                        $tree.fancytree("getTree").getNodeByKey(self.currentPath()).setActive();
                    } else {
                        // console.log("currentPath -> ", self.currentPath());
                        var node = $tree.fancytree("getTree").getNodeByKey(self.currentPath());
                        if (node.hasChildren()) {
                        //     console.log("node -> ", node);
                            node.removeChildren();
                            node.render();
                        }
                        $tree.fancytree("getTree").getNodeByKey(self.currentPath()).addChildren(data);
                        // $tree.fancytree("getTree").getNodeByKey(self.currentPath()).setExpanded();
                    }
                    self.returnToFolderView();
                    setTimeout(self.util.setDimensions, 100);
                    return data;
                }
            });//apiGet
        };//loadCurrentFolder

        self.returnToFolderView = function () {
            // console.log("returnToFolderView currentView -> ", self.currentView(), " lastView -> ", self.lastView());
            if (self.currentView !== "grid" && self.currentView() !== "list") {
                self.currentView(self.lastView());
            }
        };

        self.createFolder = function () {
            swal({
                title: self.language.new_folder,
                text: self.language.prompt_foldername,
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "Write something"
            }, function (inputValue) {
                if (inputValue === false) {
                    return false;
                }
                if (inputValue === "") {
                    swal.showInputError(self.language.no_foldername);
                    return false;
                }
                //console.log("new folder will be ", inputValue);
                self.util.apiPost({
                    url: "/folder",
                    name: inputValue,
                    path: self.currentPath(),
                    success: function () {
                        self.loadCurrentFolder();
                        toastr.success(self.language.successful_added_folder, inputValue, {"positionClass": "toast-bottom-right"});
                    }
                });//apiGet
                return false;
            });//swal
        };//createFolder

        self.goHome = function () {
            $("#tree").fancytree("getTree").getNodeByKey(config.options.fileRoot).setActive();
            self.currentPath(config.options.fileRoot);
            if (self.currentView() !== "grid" && self.currentView() !== "list") {
                self.currentView(self.lastView());
            }
            self.loadCurrentFolder();
        };//goHome

        self.notHome = ko.pureComputed(function () {
            return self.currentPath() !== config.options.fileRoot || self.currentView() === "uploads";
        });

        self.browseToItem = function (data) {
            // console.log("browseToItem data -> ", data);
            $("#tree").fancytree("getTree").getNodeByKey(data.path()).setActive();
            if (data.isDirectory()) {
                self.currentPath(data.path());
                self.loadCurrentFolder();
            } else {
                self.currentItem(data);
                self.currentView("details");
            }
        };

        self.goToItem = function (data) {
            // console.log("goToItem data -> ", data);
            // we set no events on this one because we simply want to select it, not kick off the chain of activate events that normally
            // happen when you physically click a node
            $("#tree").fancytree("getTree").getNodeByKey(data.path()).setActive(true, {noEvents: true});
            self.currentItem(data);
            self.currentView("details");
        };

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
                }
            }
        };

        self.switchViews = function () {
            // console.log("switchViews start -> ", self.currentView());
            if (self.currentView() !== "list" && self.currentView() !== "grid") {
                self.currentView(self.lastView());
            } else if (self.currentView() === "grid") {
                self.currentView("list");
            } else {
                self.currentView("grid");
            }
            // console.log("switchViews end -> ", self.currentView());
        };//switchViews

        self.viewButtonClass = ko.pureComputed(function () {
            return self.currentView() === "grid"
                ? "glyphicon glyphicon-th-list"
                : "glyphicon glyphicon-th";
        });//viewButtonClass

        // console.log("app.viewmodel version -> ", self.config);
        self.loadCurrentFolder(true);
    };
});