/**
 * Created by Joshua.Austill on 8/11/2016.

 This connector is actually an api, so you can use it on a seperate server from your ui.  However, because of this, it will require
 a bit more setup than your average connector.

 Firstly, you will need a global variable for the application root, why this isn't a standard nodejs variable is seriously
 beyond me.  Just copy and paste this into your app.js, or whatever file you use for your root

 global.__appRoot = path.normalize(__dirname);

 Also, ensure you are requiring path in that file.

 Second, you will need to add path-posix to your project, just run

 npm install --save path-posix

 And you should be good to go there.  I named it paths instead of path in this file because RichFilemanager is passing in a path variable
 and I wanted to keep them as clear as possible.

 Next, you will need a copy of your filemanager.config.json file in /config .  This is to keep from having to do an ajax request back to the ui
 for every single request.  Hopefully in future we will get the server side and client side config seperated into two seperate files.  In the
 mean-time, this means keeping two copies of your config when using nodejs, not ideal, sorry.

 Lastly, you will need to require this file and use it as a route.  My call looks like this

 router.use('/filemanager', require('./filemanager')());

 If you are new to nodejs and express, the first parameter defines the endpoint, and the second the loading of this file.
 */
/*global __appRoot*/

var express = require("express");
var router = express.Router();
var fs = require("fs");
var paths = require("path");
var multer  = require('multer');
var upload = multer({ dest: 'upload/'});
var config = require("../config/fm2.api.config.json");

paths.posix = require("path-posix");

module.exports = function () {
    "use strict";

    // We will handle errors consistently by using a function that returns an error object
    function errors(err) {
        console.log("err -> ", err);
        err = err || {}; // This allows us to call errors and just get a default error
        return {
            errors: [{
                title: err.title || err.code || "Error.",
                code: err.errno || err.code || -1,
                detail: err.Error || err.detail || "An error occurred.",
                status: err.status,
                source: err.syscall || err.source
            }]
        };//return
    }//errors

    // This is a seperate function because branch new files are uploaded and won't have an existing file
    // to get information from
    function parseNewPath(path, callback) {
        var parsedPath = {},
            fileRoot = config.options.fileRoot || "";
        parsedPath.uiPath = path;

        // if the passed in path isn't in the fileRoot path, make it so
        // This should go away and every path should be relative to the fileRoot
        if (path.substring(0, fileRoot.length) !== fileRoot) {
            path = paths.posix.join(fileRoot, path);
        }

        parsedPath.relativePath = paths.posix.normalize(path);
        parsedPath.filename = paths.posix.basename(parsedPath.relativePath);
        parsedPath.osRelativePath = paths.normalize(path);
        parsedPath.osExecutionPath = __appRoot;
        parsedPath.osFullPath = paths.join(parsedPath.osExecutionPath, parsedPath.osRelativePath);
        parsedPath.osFullDirectory = paths.parse(parsedPath.osFullPath).dir;
        callback(parsedPath);
    }//parseNewPath

    // because of windows, we are going to start by parsing out all the needed path information
    // this will include original values, as well as OS specific values
    function parsePath(path, callback) {
        if (path) {
            parseNewPath(path, function (parsedPath) {
                fs.stat(parsedPath.osFullPath, function (err, stats) {
                    if (err) {
                        callback(errors(err));
                        return;
                    }
                    parsedPath.isDirectory = !!stats.isDirectory();
                    parsedPath.stats = stats;
                    callback(null, parsedPath);
                }); //fs.stat
            });//parseNewPath
        } else {
            callback(new errors({
                "code": 404,
                "title": "Path not provided",
                "detail": "You must provide a path parameter, IE ?path=/folder/file.ext",
                "source": "parsePath",
                "status": "error"
            }));
        }
    }//parsePath

    // This function will create the return object for a file.  This keeps it consistent and
    // adheres to the DRY principle
    function fileInfo(pp, callback) {
        var result = {
            "path": (pp.uiPath),
            "dir": paths.posix.parse(pp.uiPath).dir,
            "directPath": ("/item?path=" + pp.uiPath),
            "preview": ("/item/preview?path=" + pp.uiPath),
            "filename": (pp.filename),
            "fileType": paths.parse(pp.osFullPath).ext.toLowerCase().replace(".", ""),
            "isDirectory": false,
            "thumbnail": "images/fileicons/" + paths.parse(pp.osFullPath).ext.toLowerCase().replace(".", "") + ".png",
            "properties": {
                "dateCreated": pp.stats.birthtime,
                "dateModified": pp.stats.mtime,
                "filemtime": pp.stats.mtime,
                "height": 0,
                "width": 0,
                "size": pp.stats.size
            },
            "title": pp.filename,
            "key": pp.uiPath
        };//result
        callback(result);
    }//fileInfo

    // This function will create the return object for a directory.  This keeps it consistent and
    // adheres to the DRY principle
    function directoryInfo(pp, callback) {
        var result = {
            "path": (pp.uiPath),
            "dir": paths.posix.parse(pp.uiPath).dir,
            "directPath": ("/item?path=" + pp.uiPath),
            "preview": ("/item/preview?path=" + pp.uiPath),
            "filename": (pp.filename),
            "fileType": "dir",
            "isDirectory": true,
            "thumbnail": "images/fileicons/_Open.png",
            "properties": {
                "dateCreated": pp.stats.birthtime,
                "dateModified": pp.stats.mtime,
                "filemtime": pp.stats.mtime,
                "height": 0,
                "width": 0,
                "size": pp.stats.size
            },
            "title": pp.filename,
            "folder": true,
            "key": pp.uiPath
        };//result
        callback(result);
    }//directoryInfo

    // Getting information is different for a file than it is for a directory, so here
    // we make sure we are calling the right function.
    function getinfo(pp, callback) {
        if (pp.isDirectory) {
            directoryInfo(pp, function (result) {
                callback(result);
            });
        } else {
            fileInfo(pp, function (result) {
                callback(result);
            });
        }//if
    }//getinfo

    // Here we get the information for a folder, which is a content listing

    // This function exists merely to capture the index and and pp(parsedPath) information in the for loop
    // otherwise the for loop would finish before our async functions
    function getIndividualFileInfo(pp, files, loopInfo, callback, $index) {
        parsePath(paths.posix.join(pp.uiPath, files[$index]), function (err, ipp) {
            if (err) {
                callback(err);
            } else {
                getinfo(ipp, function (result) {
                    // console.log("config -> ", config.security.allowedFileTypes.indexOf(result.fileType), " and ", result);
                    if (config.security.allowedFileTypes.indexOf(result.fileType) !== -1 || result.isDirectory) {
                        loopInfo.results.push(result);
                    }
                    if ($index + 1 >= loopInfo.total) {
                        callback(loopInfo.results);
                    }//if
                });//getinfo
            }//if
        });//parsePath
    }//getIndividualFileInfo

    function getfolder(pp, callback) {
        fs.stat(pp.osFullPath, function (err) {
            if (err) {
                console.log("err -> ", err);
                callback(errors(err));
            } else {
                fs.readdir(pp.osFullPath, function (err, files) {
                    if (err) {
                        //console.log("err -> ", err);
                        callback(errors(err));
                    } else {
                        var loopInfo = {
                                results: [],
                                total: files.length
                            },
                            i;

                        if (loopInfo.total === 0) {
                            callback(loopInfo.results);
                        }

                        for (i = 0; i < loopInfo.total; i++) {
                            getIndividualFileInfo(pp, files, loopInfo, callback, i);
                        }//for
                    }//if
                });//fs.readdir
            }//if
        });//fs.stat
    }//getinfo

    // function to delete a file/folder
    function deleteItem(pp, callback) {
        getinfo(pp, function (item) {
            if (pp.isDirectory === true) {
                fs.rmdir(pp.osFullPath, function (err) {
                    if (err) {
                        callback(errors(err));
                    } else {
                        callback(item);//callback
                    }//if
                });//fs.rmdir
            } else {
                fs.unlink(pp.osFullPath, function (err) {
                    if (err) {
                        callback(errors(err));
                    } else {
                        callback(item);//callback
                    }//if
                });//fs.unlink
            }//if
        });
    }//deleteItem

    // function to add a new folder
    function addfolder(pp, name, callback) {
        fs.mkdir(paths.join(pp.osFullPath, name), function (err) {
            if (err) {
                callback(errors(err));
            } else {
                getinfo(pp, function (ipp) {
                    callback(ipp);//callback
                });
            }//if
        });//fs.mkdir
    }//addfolder

    //function to save a replaced file, tried to combine this with save new files, but it
    // just got to complicated
    function replacefile(pp, file, callback) {
        var oldfilename = paths.join(__appRoot, file.path),

            newfilename = paths.join(
                pp.osFullPath
            ); //not sure if this is the best way to handle this or not

        // console.log("replacefile pp -> ", pp, " file -> ", file, " oldfilename -> ", oldfilename, " newfilename -> ", newfilename);

        fs.rename(oldfilename, newfilename, function (err) {
            if (err) {
                console.log("replacefile error -> ", err);
                callback(errors(err));
            } else {
                callback({
                    "path": pp.uiPath,
                    "name": pp.isDirectory ? file.originalname : pp.filename
                });//callback
            }//if
        });//fs.rename
    }//replacefile

    function savefile(pp, file, callback) {
        var oldfilename = paths.join(__appRoot, file.path),

            newfilename = paths.join(
                pp.osExecutionPath,
                pp.osRelativePath,
                file.originalname
            ); //not sure if this is the best way to handle this or not

        // console.log("savefile pp -> ", pp, " file -> ", file, " oldfilename -> ", oldfilename, " newfilename -> ", newfilename);

        fs.rename(oldfilename, newfilename, function (err) {
            if (err) {
                console.log("savefiles error -> ", err);
                callback(errors(err));
            } else {
                callback({
                    "path": pp.uiPath,
                    "name": pp.isDirectory ? file.originalname : pp.filename
                });//callback
            }//if
        });//fs.rename
    }//savefile

    // function to rename files
    function rename(old, newish, callback) {
        console.log("rename old -> ", old, " new -> ", newish);
        fs.rename(old.osFullPath, newish.osFullPath, function (err) {
            if (err) {
                callback(errors(err));
            } else {
                parsePath(newish.uiPath, function (err, pp) {
                    if (err) {
                        callback(err);
                    } else {
                        getinfo(pp, function (ipp) {
                            callback(ipp);
                        });//getinfo
                    } //if
                });//parsePath
            }//if
        }); //fs.rename
    }//rename

    function respond(res, obj) {
        if (obj.errors) {
            console.log("respond err -> ", obj);
            res.json(obj);
        } else {
            // console.log(JSON.stringify(obj));
            res.json({data: obj});
        }
    }//respond

    /* ****************************************************
     New routes 2.0
     ****************************************************
     */

    router.route("/file")
        .post(upload.single("file"), function (req, res) {
            parsePath(req.body.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    savefile(pp, req.file, function (result) {
                        respond(res, result);
                    });//savefiles
                }
            });//parsePath
        })//post
        .put(upload.single("file"), function (req, res) {
            parsePath(req.body.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    console.log("/replace pp -> ", pp, " req.file -> ", req.file);
                    replacefile(pp, req.file, function (result) {
                        respond(res, result);
                    });//savefiles
                }//if err
            });//parsePath
        }); //put

    router.route("/item")
        .get(function (req,res) {
            parsePath(req.query.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    res.setHeader("content-disposition", "attachment; filename=" + pp.filename);
                    res.setHeader("content-type", "application/octet-stream");
                    res.sendFile(pp.osFullPath);
                }
            });//parsePath
        })//get
        .patch(function (req, res) {
            // console.log("PATCH /item -> ", req.query);
            parsePath(req.query.path, function (err, opp) {
                if (err) {
                    respond(res, err);
                } else {
                    parseNewPath(paths.posix.join("/", req.query.newPath, opp.filename), function (npp) {
                        rename(opp, npp, function (result) {
                            respond(res, result);
                        });//rename
                    });//parseNewPath
                }//if
            });//parsePath
        })//patch
        .delete(function (req, res) {
            parsePath(req.query.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    deleteItem(pp, function (result) {
                        respond(res, result);
                    });//parsePath
                }//if
            });//parsePath
        });// route: /item

    router.route("/item/meta")
        .get(function (req, res) {
            parsePath(req.query.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    //console.log("getinfo pp -> ", pp);
                    getinfo(pp, function (result) {
                        respond(res, result);
                    });//getinfo
                }
            });//parsePath
        });// /item/meta

    router.route("/item/meta/name")
        .put(function (req, res) {
            parsePath(req.query.path, function (err, opp) {
                if (err) {
                    respond(res, err);
                } else {
                    var newPath = paths.posix.parse(opp.uiPath).dir,
                        newish = paths.posix.join(newPath, req.query.new);

                    parseNewPath(newish, function (npp) {
                        rename(opp, npp, function (result) {
                            respond(res, result);
                        });//rename
                    });//parseNewPath
                }
            });//parsePath
        });// route /item/meta/name

    // For now this is just returning the entire file.  In future, it will need to handle creating thumbnails
    // and whatever is appropiate
    router.route("/item/preview")
        .get(function (req, res) {
            parsePath(req.query.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    res.setHeader("content-disposition", "attachment; filename=" + pp.filename);
                    res.setHeader("content-type", "application/octet-stream");
                    res.sendFile(pp.osFullPath);
                }
            });//parsePath
        });// route: /item/preview

    router.route("/folder")
        .get(function (req, res) {
            // console.log("getfolder -> ", req.query.path);
            parsePath(req.query.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    getfolder(pp, function (result) {
                        respond(res, result);
                    });//getfolder
                }
            });//parsePath
        })//get
        .post(function (req, res) {
            // console.log("addfolder query -> ", req.query);
            parsePath(req.query.path, function (err, pp) {
                if (err) {
                    respond(res, err);
                } else {
                    console.log("addfolder path -> ", req.query.path, " pp -> ", pp);
                    addfolder(pp, req.query.name, function (result) {
                        respond(res, result);
                    });//addfolder
                }
            });//parsePath
        });//router /folder

    return router;
};//module.exports