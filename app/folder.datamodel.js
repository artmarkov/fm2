/**
 * Created by joshuaaustill on 9/22/16.
 */
// datamodel for a folder
var ko = require("knockout");
var $ = require("jquery");
var Item = require("./item.datamodel.js");
var swal = require("sweetalert");
var toastr = require("toastr");

module.exports = function (appVM, path) {
    "use strict";
    var self = this,
        _currentItem = ko.observable(new Item(appVM));
    self.path = ko.observable("");
    self.items = ko.observableArray([]);

    self.currentItem = ko.pureComputed({
        read: function () {
            return _currentItem();
        }, // read
        write: function (value, onlySelect) {
            if (value.isDirectory() && !onlySelect) {
                self.loadPath(value.path(), function () {
                    _currentItem(value);
                }); // loadPath
            } else if (self.path() !== value.dir() && !onlySelect) {
                self.loadPath(value.dir(), function () {
                    _currentItem(value);
                }); // loadPath
            } else {
                _currentItem(value);
            }// if
        }, // write
        owner: self
    }); // currentItem

    self.itemCount = ko.computed(function () {
        return self.items().length;
    }); //notHome

    self.itemSize = ko.computed(function () {
        var s = 0;

        $.each(self.items(), function (i, d) {
            s += d.properties().size;
        }); //each

        return s;
    }); // itemSize

    self.setRootActive = function () {
        self.currentItem().path(self.path());
        self.currentItem().reloadSelf();
    }; // setRootActive

    self.levelUp = function () {
        var cpath = self.path();
        if (cpath !== appVM.homePath && self.currentItem().isDirectory()) {
            var newPath = cpath.substring(0, cpath.slice(0, -1).lastIndexOf("/"));
            newPath = newPath === ""
                ? "/"
                : newPath;
            self.loadPath(newPath);
        } else {
            self.setRootActive();
        } // if

        appVM.loading(false);
    }; // levelUp

    self.createFolder = function () {
        swal({
            title: appVM.language.new_folder,
            text: appVM.language.prompt_foldername,
            type: "input",
            showCancelButton: true,
            closeOnConfirm: true,
            animation: "slide-from-top",
            inputPlaceholder: appVM.language.inputPlaceholder
        }, function (inputValue) {
            if (inputValue === false) {
                return false;
            } //if
            if (inputValue === "") {
                swal.showInputError(appVM.language.no_foldername);
                return false;
            } //if
            appVM.util.apiPost({
                url: "/folder",
                name: inputValue,
                path: self.path(),
                success: function () {
                    self.refreshCurrentPath();
                    toastr.success(appVM.language.successful_added_folder, inputValue, {"positionClass": "toast-bottom-right"});
                } // success
            }); // apiGet
            return false;
        }); // swal
    }; // createFolder

    self.refreshCurrentPath = function (callback) {
        appVM.util.apiGet({
            url: "/folder",
            path: self.path(),
            success: function (data) {
                var newItems = [];
                $.each(data, function (i, d) {
                    newItems.push(new Item(appVM, d));
                }); //each

                self.items(newItems);
                if (typeof callback === "function") {
                    return callback();
                } else {
                    return 0;
                }
            } // success
        }); // apiGet
    }; // refreshCurrentPath

    self.loadPath = function (__path, callback) {
        __path = __path || self.path();

        if (self.path() !== __path) {
            self.path(__path);

            self.refreshCurrentPath(callback);
        } else {
            if (typeof callback === "function") {
                return callback();
            } else {
                return 0;
            } // if
        } // if
        return callback;
    }; // loadPath

    self.loadPath(path);
}; // folder.datamodel