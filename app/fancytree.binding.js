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
            item = allBindingsAccessor().item,
            folder = allBindingsAccessor().folder;

        $el.fancytree({
            "focusOnSelect": true,
            source: [{title: ko.unwrap(valueAccessor()), children: null, key: ko.unwrap(valueAccessor()), folder: true, expanded: true}],
            activate: function (ignore, data) {
                valueAccessor()(data);
            } //activate
        }); //fancytree

        item.subscribe(function (selectItem) {
            console.log("item.subscribe -> ", selectItem);
            $el.fancytree("getTree").getNodeByKey(selectItem.path()).setActive({noEvents: true});
        });

        folder.subscribe(function (newFolder) {
            var node = $el.fancytree("getTree").getNodeByKey(ko.unwrap(valueAccessor()));
            if (node.hasChildren()) {
                node.removeChildren();
                node.render();
            } //if
            node.addChildren(ko.toJS(newFolder));
            node.setExpanded(true);
        });
    },
    "update": function (element, valueAccessor) {
        "use strict";
        var $el = $(element);
        if ($el.fancytree) {
            // we set no events on this one because we simply want to select it, not kick off the chain of activate events that normally
            // happen when you physically click a node
            $el.fancytree("getTree").getNodeByKey(ko.unwrap(valueAccessor())).setActive({noEvents: true});
        }
    }
};