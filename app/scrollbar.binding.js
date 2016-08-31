/**
 * Created by Joshua.Austill on 8/31/2016.
 */

var ko = require("knockout");
var $ = require("jquery");

ko.bindingHandlers.scrolly = {
    init: function (element) {
        "use strict";
        $(element).mCustomScrollbar({axis:"yx", theme:"minimal-dark"});
    }
};