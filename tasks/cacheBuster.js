'use strict';

var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    glob = require("glob"),
    path = require("path"),
	mkdirp = require('mkdirp');
module.exports = function (grunt) {
    grunt.registerTask('cacheBuster', 'Set the versions for enqueued CSS/JS', function () {
        var options = this.options({
            file: '',
            css: '',
            cssHandle: '',
            js: '',
            jsHandle: '',
			distTarget: ''
        });

        var scriptsPhp = options.file;

        // Hash based on css file
        var hash = md5(options.css);

        var content = grunt.file.read(scriptsPhp);

        var regexCss = new RegExp("(?:wp_enqueue_style\\('" + options.cssHandle + "')(.*)(?:.css)");
        var regexJs = new RegExp("(?:wp_register_script\\('" + options.jsHandle + "')(.*)(?:.js)");

        var cssFilePart = content.match(regexCss);
        var jsFilePart = content.match(regexJs);

        grunt.log.writeln(cssFilePart[0]);

        var newCssFile = updateAssetFileName(cssFilePart[0], '.css', hash);
        var newJsFile = updateAssetFileName(jsFilePart[0], '.js', hash);

        content = content.replace(regexCss, "wp_enqueue_style('" + options.cssHandle + "'" + newCssFile);
        content = content.replace(regexJs, "wp_register_script('" + options.jsHandle + "'" + newJsFile);


        // Create new file
        copy(options.css, newFileName(options.css, hash, '.css'), options.distTarget);
        copy(options.js, newFileName(options.js, hash, '.js'), options.distTarget);

        grunt.file.write(scriptsPhp, content);
        grunt.log.writeln('"' + scriptsPhp + '" updated with new CSS/JS versions.');
    });


    function extractFileNamefromPath(filePath) {
        grunt.log.writeln(path.basename(filePath));
        return path.basename(filePath);
    }


    function newFileName(file, hash, extension) {
        file = file.slice(0, file.lastIndexOf(extension));
        return file + "-" + hash + extension;
    }

    function fileNameToRemove(file, extension) {
        file = file.slice(0, file.lastIndexOf(extension));
        return file + "-*" + extension;
    }

    function copy(source, target, distTarget) {
		
		if (typeof distTarget !== 'undefined') {
			target =  distTarget + '/' + target;
		}
		mkdirp.sync(path.dirname(target));
        var content = fs.readFileSync(source)
        fs.writeFileSync(target, content);
    }

    function updateAssetFileName(content, extension, hash) {

        var end = content.indexOf(extension);
        var start = content.indexOf(',');
        // Complete file name part from source code, do not include the file extension
        var fileNamePart = content.slice(start, end);

        // Remove old hash
        if (fileNamePart.indexOf('-_-') !== -1) {
            fileNamePart = fileNamePart.split('-_-')[0];
        }

        var newFileNamepart = fileNamePart + '-_-' + hash + extension;
        return newFileNamepart;

    }


    var md5 = function (filepath) {
        var hash = crypto.createHash('md5');
        hash.update(new Date().toUTCString());
        grunt.log.write('Versioning ' + filepath + '...').ok();
        return hash.digest('hex');
    };
};
