/*global define*/
/**
 * Created by Joshua.Austill on 8/18/2016.
 */
// our viewmodel for our app
define(function (require) {
    "use strict";
    var ko = require("knockout");
    var config = JSON.parse(require("text!scripts/filemanager.config.json"));

    return function () {
        var self = this;
        self.version = ko.observable(config.version);

        console.log("app.viewmodel version -> ", self.version());
    };
});