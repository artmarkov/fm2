/*global define*/
/**
 * Created by Joshua.Austill on 8/18/2016.
 */
// our viewmodel for our app
define(function (require) {
    "use strict";
    // var ko = require("knockout");
    var config = JSON.parse(require("text!scripts/filemanager.config.json"));
    var Utility = require("app/utility.viewmodel");

    return function () {
        var self = this;
        self.config = config;
        var _$ = new Utility(self.config);
        self.language = _$.getLanguage();

        _$.loadTheme();
        _$.loadIeFix();

        // console.log("app.viewmodel version -> ", self.config);
    };
});