/*global define*/
/**
 * Created by Joshua.Austill on 8/18/2016.
 */
// our viewmodel for our app
define(function (require) {
    "use strict";
    var ko = require("knockout");
    var config = JSON.parse(require("text!scripts/filemanager.config.json"));
    var Utility = require("app/utility.viewmodel");

    return function () {
        var self = this;
        //configuration stuff first :)
        self.config = config;
        self._$ = new Utility(self.config);
        self.language = self._$.getLanguage();

        self._$.loadTheme();
        self._$.loadIeFix();

        // Now we start our data processing
        self.currentPath = ko.observable(config.options.fileRoot);
        self.currentFolder = ko.observableArray([]);
        self.currentView = ko.observable(config.options.defaultViewMode);
        self.loading = ko.observable(true);

        self.loadCurrentFolder = function () {
            self._$.apiGet({
                mode: "getfolder",
                path: encodeURIComponent(self.currentPath()),
                success: function (data) {
                    self.currentFolder(data);
                    self.loading(false);
                    console.log(data);
                }
            });//apiGet
        };//loadCurrentFolder

        self.switchViews = function () {
            if (self.currentView() === "grid") {
                self.currentView("list");
            } else {
                self.currentView("grid");
            }
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