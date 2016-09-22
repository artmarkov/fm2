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
    self.path = ko.observable(path);
    self.items = ko.observableArray([]);

    self.currentItem = ko.pureComputed({
        read: function () {
            return _currentItem();
        }, // read
        write: function (value) {
            _currentItem(value);
            if (self.path() !== _currentItem().dir()) {
                self.path(_currentItem().dir());
            } // if
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

    self.levelUp = function () {
        var cpath = self.path();
        if (cpath !== appVM.homePath) {
            var newPath = cpath.substring(0, cpath.slice(0, -1).lastIndexOf("/"));
            self.path(newPath === ""
                ? "/"
                : newPath);
            appVM.loading(false);
        } else {
            appVM.loading(false);
        } // if
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
                    self.loadPath();
                    toastr.success(appVM.language.successful_added_folder, inputValue, {"positionClass": "toast-bottom-right"});
                } // success
            }); // apiGet
            return false;
        }); // swal
    }; // createFolder

    self.loadPath = function () {
        var newItems = [];

        appVM.util.apiGet({
            url: "/folder",
            path: self.path(),
            success: function (data) {
                $.each(data, function (i, d) {
                    newItems.push(new Item(appVM, d));
                }); //each

                self.items(newItems);
            } // success
        }); // apiGet
    }; // loadPath

    self.path.subscribe(function () {
        self.loadPath();
    }); // path.subscribe

    self.loadPath();
}; // folder.datamodel