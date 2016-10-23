/**
 * Created by joshuaaustill on 8/30/16.
 */

var ko = require("knockout");
var $ = require("jquery");
var _ = require("lodash");
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
                var _item = data.node.data;
                if (typeof _item.isDirectory !== "undefined") {
                    // console.log("lets figure this out :) _item.path -> ", _item.path, " $folder().currentItem().path() -> ", $folder().currentItem().path());
                    if (_item.path !== $folder().currentItem().path()) {
                        $browseToItem(_item);
                    }
                } else {
                    if ($folder().currentItem().path() !== "/") {
                        $browseToItem({isDirectory: ko.observable(true), path: ko.observable("/")});
                    }
                }
            } // activate
        }); // fancytree

        $folder().items.subscribe(function (newFolder) {
            var p = ko.unwrap($folder().path());
            var node = $el.fancytree("getTree").getNodeByKey(p);
            if (node) {
                if (node.hasChildren()) {
                    var $existingFolder = node.children;

                    var newItems = _.differenceWith(newFolder, $existingFolder, function (newItem, existingItem) {
                        return newItem.key() === existingItem.key;
                    });

                    var removedItems = _.differenceWith($existingFolder, newFolder, function (existingItem, newItem) {
                        return newItem.key() === existingItem.key;
                    });

                    _.forEach(removedItems, function (item) {
                        item.remove();
                    });
                    if (newItems.length > 0) {
                        node.addChildren(ko.toJS(newItems));
                    }
                } else {
                    node.addChildren(ko.toJS(newFolder));
                } // if

                node.setExpanded(true);
                //after reloading the folder, we need to ensure it is active and focused.
                if (node.isActive() === false && (node.key === "/" || node.data.isDirectory === true)) {
                    node.setActive({noEvents: true});
                }
                if (node.isSelected() === false && (node.key === "/" || node.data.isDirectory === true)) {
                    // console.log("item node -> ", node);
                    node.setFocus();
                }
            } // if(node)
        }); // $folder().items.subscribe
    },
    "update": function (element, valueAccessor) {
        "use strict";
        var _el = $(element),
            _folder = valueAccessor(),
            _currentItem = _folder().currentItem(),
            _firedNode = _el.fancytree("getTree").getNodeByKey(_currentItem.path());

        if (_el.fancytree && _firedNode) {
            // we set no events on this one because we simply want to select it, not kick off the chain of activate events that normally
            // happen when you physically click a node

            // Only set the node active if it isn't already
            if (_firedNode.isActive() === false) {
                _firedNode.setActive({noEvents: true});
            }
            // Only set the node focused if it isn't already
            if (_firedNode.isSelected() === false) {
                _firedNode.setFocus();
            }
        }
    }
};
