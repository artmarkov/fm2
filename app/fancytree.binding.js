/**
 * Created by joshuaaustill on 8/30/16.
 */

var ko = require("knockout");
var $ = require("jquery");
require("jquery.fancytree");

ko.bindingHandlers.fancytree = {
    "init": function (element, valueAccessor, allBindingsAccessor) {
        "use strict";
        var $el = $(element),
            $folder = valueAccessor(),
            $browseToItem = allBindingsAccessor().browseToItem;

        $el.fancytree({
            "focusOnSelect": true,
            source: [{title: ko.unwrap($folder().path()), children: null, key: ko.unwrap($folder().path()), folder: true, expanded: true}],
            activate: function (ignore, data) {
                // console.log("activate data -> ", data);
                if (typeof data.node.data.isDirectory !== "undefined") {
                    $browseToItem(data.node.data);
                } else {
                    $folder().path("/");
                }
            } // activate
        }); // fancytree

        $folder().currentItem.subscribe(function (selectItem) {
            $el.fancytree("getTree").getNodeByKey(selectItem.key()).setActive({noEvents: true});
        });

        $folder().items.subscribe(function (newFolder) {
            var node = $el.fancytree("getTree").getNodeByKey(ko.unwrap($folder().path()));
            if (node.hasChildren()) {
                node.removeChildren();
            } // if
            node.addChildren(ko.toJS(newFolder));
            node.setExpanded(true);
        });
    },
    "update": function (element, valueAccessor) {
        "use strict";
        var $el = $(element),
            $folder = valueAccessor();

        if ($el.fancytree) {
            // we set no events on this one because we simply want to select it, not kick off the chain of activate events that normally
            // happen when you physically click a node
            $el.fancytree("getTree").getNodeByKey(ko.unwrap($folder().path())).setActive({noEvents: true});
        }
    }
};