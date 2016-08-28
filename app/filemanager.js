/**
 *    Filemanager JS core
 *
 *    main.js
 *
 *    @license    MIT License
 *
 *    @author        Joshua Austill - FM2
 *    @copyright    Authors
 */

require("../node_modules/knockout.contextmenu/dist/css/knockout.contextmenu.css");
require("../node_modules/jquery.fancytree/dist/skin-lion/ui.fancytree.css");
require("../node_modules/jquery.splitter/css/jquery.splitter.css");
require("../node_modules/dropzone/dist/dropzone.css");
require("../node_modules/toastr/build/toastr.css");
require("../node_modules/bootstrap/dist/css/bootstrap.css");
require("../node_modules/sweetalert/dist/sweetalert.css");
require("../node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css");
// Load theme last so nothing overwrites our colors :)
require("../styles/fm2.css");


//load jquery and related
var $ = require("jquery"); //updated to 3.0
require("jquery-ui-dist");
require("jquery.fancytree"); //replace with fancyTree
require("jquery.splitter"); // Seems to be working well

//load libraries
require("dropzone");
require("bootstrap");

//load knockout and related
var ko = require("knockout");
require("knockout-punches");
require("knockout.contextmenu")(ko, document);

//load knockout punches, here goes the magic :)
ko.punches.enableAll();

//load our viewmodels
var AppViewModel = require("app.viewmodel");
var appVM;
$.getJSON("config/filemanager.config.json", function (config) {
    "use strict";
    appVM = new AppViewModel(config);
    ko.applyBindings(appVM);
    var start;

    /*---------------------------------------------------------
     Setup, Layout, and Status Functions
     ---------------------------------------------------------*/

    //noinspection JSUnresolvedVariable
    if (appVM.config.options.logger) {
        start = Date.now();
    }

    $("#splitter").height(100).split({
        position: appVM.config.options.splitPercentage,
        orientation: "vertical",
        limit: 200
    });

    if (appVM.config.options.logger) {
        var end = Date.now();
        var time = end - start;
        console.log("Total execution time: " + time + " ms");
    }

});