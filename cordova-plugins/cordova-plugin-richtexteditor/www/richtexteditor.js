'use strict';
var exec = require('cordova/exec');

var RichTextEditor = {

    edit : function(options,success, failure) {
        return exec(success, failure, "RichTextEditor", "edit", [options]);
    }

};

module.exports = RichTextEditor;
