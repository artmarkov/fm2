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
    var toastr = require("toastr");

    return function () {
        var self = this;
        //configuration stuff first :)
        self.config = config;
        self._$ = new Utility(self.config);
        self.language = self._$.getLanguage();
        self.config.language = self.language;

        self._$.loadTheme();
        self._$.loadIeFix();

        // Now we start our data processing
        self.currentPath = ko.observable(config.options.fileRoot);
        self.currentFolder = ko.observableArray([]);
        self.lastView = ko.observable(config.options.defaultViewMode);
        self.activeView = ko.observable(config.options.defaultViewMode);
        self.currentView = ko.pureComputed({
            read: function () {
                return self.activeView();
            },
            write: function (value) {
                self.lastView(self.activeView());
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

        self.afterRender = function (elements) {
            if (self.currentView() === "uploads") {
                $("#my-awesome-dropzone").dropzone({
                    url: config.options.fileConnector,
                    params: {path: self.currentPath()}
                });
                // $("#my-awesome-dropzone").on("sending", function(file, xhr, formData) {
                //     // Will send the filesize along with the file as POST data.
                //     formData.append("mode", "add");
                //     formData.append("currentPath", self.currentPath());
                // });

                // The recommended way from within the init configuration:
                // Dropzone.options.myAwesomeDropzone = {
                //     sending: function (file, xhr, formData) {
                //         // Will send the filesize along with the file as POST data.
                //         formData.append("mode", "add");
                //         formData.append("currentPath", self.currentPath());
                //     }
                // };
            }
        };

        self.loadCurrentFolder = function () {
            var newItems = [];
            self._$.apiGet({
                mode: "getfolder",
                path: encodeURIComponent(self.currentPath()),
                success: function (data) {
                    $.each(data, function (i, d) {
                        newItems.push(new Item(self, d));
                    });
                    self.currentFolder(newItems);
                    self.loading(false);
                }
            });//apiGet
        };//loadCurrentFolder

        self.createFolder = function () {
            swal({
                title: self.language.new_folder,
                text: self.language.prompt_foldername,
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
                        swal.showInputError(self.language.no_foldername);
                        return false;
                    }
                    //console.log("new folder will be ", inputValue);
                    self._$.apiGet({
                        mode: "addfolder",
                        foldername: inputValue,
                        path: self.currentPath(),
                        success: function () {
                            self.loadCurrentFolder();
                            toastr.success(self.language.successful_added_folder, inputValue, {"positionClass": "toast-bottom-right"});
                        }
                    });//apiGet
                });//swal
        };//createFolder

        self.goHome = function () {
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
            console.log("browseToItem data -> ", data);
            if (data.isDirectory()) {
                self.currentPath(data.path());
                self.loadCurrentFolder();
            } else {
                self.currentItem(data);
                self.currentView("details");
            }
        };

        self.goToItem = function (data) {
            console.log("goToItem data -> ", data);
            self.currentItem(data);
            self.currentView("details");
        };

        self.goLevelUp = function () {
            self.loading(true);
            if (self.currentView() !== "grid" && self.currentView() !== "list") {
                self.currentView(self.lastView());
                self.loadCurrentFolder();
                self.loading(false);
            } else {
                var cpath = self.currentPath();
                if (cpath !== config.options.fileRoot) {
                    self.currentPath(cpath.substring(0, cpath.slice(0, -1).lastIndexOf("/")) + "/");
                    self.loadCurrentFolder();
                    self.loading(false);
                } else {
                    self.loadCurrentFolder();
                    self.loading(false);
                }
            }
        };

        self.hasCapability = function (capability) {
            if (self.config) {
                if (capability === "select" && (self._$.urlParameters("CKEditor") || window.opener || window.tinyMCEPopup || self._$.urlParameters("field_name"))) {
                    return true;
                }
                return $.inArray(capability, self.config.options.capabilities) !== -1 && capability !== "select";
            }
            return false;
        };//hasCapability

        self.switchViews = function () {
            console.log("switchViews start -> ", self.currentView());
            if (self.currentView() !== "list" && self.currentView() !== "grid") {
                self.currentView(self.lastView());
            } else if (self.currentView() === "grid") {
                self.currentView("list");
            } else {
                self.currentView("grid");
            }
            console.log("switchViews end -> ", self.currentView());
        };//switchViews

        self.viewButtonClass = ko.pureComputed(function () {
            return self.currentView() === "grid"
                ? "glyphicon glyphicon-th-list"
                : "glyphicon glyphicon-th";
        });//viewButtonClass

        self.capClasses = ko.computed(function () {
            return config.options.capabilities;
        });

        // console.log("app.viewmodel version -> ", self.config);
        self.loadCurrentFolder();
    };
});