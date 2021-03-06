(function() {
  var ElmCompiler, elmCompile, childProcess, path;

  childProcess = require('child_process');

  path = require('path');

  module.exports = ElmCompiler = (function() {
    ElmCompiler.prototype.brunchPlugin = true;

    ElmCompiler.prototype.type = 'javascript';

    ElmCompiler.prototype.extension = 'elm';

    function ElmCompiler(config) {
      var elm_config = {};
      elm_config.outputFolder = (config.plugins.elmBrunch || {}).outputFolder || path.join(config.paths.public, 'js');
      elm_config.mainModules = (config.plugins.elmBrunch || {}).mainModules;
      elm_config.elmFolder = (config.plugins.elmBrunch || {}).elmFolder || null;
      elm_config.makeParameters = (config.plugins.elmBrunch || {}).makeParameters || [];
      this.elm_config = elm_config;
      this.skipedOnInit = {};
    }

    function escapeRegExp(str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    ElmCompiler.prototype.compile = function(data, inFile, callback) {
      var elmFolder = this.elm_config.elmFolder;
      var file = inFile;
      if (elmFolder) {
        file = inFile.replace(new RegExp('^' + escapeRegExp(elmFolder) + '[/\\\\]?'), '');
      }
      var modules = this.elm_config.mainModules || [file];
      var file_is_module_index = modules.indexOf(file);
      if (file_is_module_index >= 0) {
        modules = [modules[file_is_module_index]];
      } else {
        if (this.skipedOnInit[file]){
        } else {
          this.skipedOnInit[file] = true;
          return callback(null, '');
        }
      }
      var outputFolder = this.elm_config.outputFolder;
      const makeParameters = this.elm_config.makeParameters;
      return modules.forEach(function(src) {
        var moduleName;
        moduleName = path.basename(src, '.elm').toLowerCase();
        return elmCompile ( src, elmFolder
                          , path.join(outputFolder, moduleName + '.js')
                          , makeParameters
                          , callback );
      });
    };

    return ElmCompiler;

  })();

  elmCompile = function(srcFile, elmFolder, outputFile, makeParameters, callback) {
    var info = 'Elm compile: ' + srcFile;
    if (elmFolder) {
      info += ', in ' + elmFolder;
    }
    info += ', to ' + outputFile;
    console.log(info);

    const params = ['--yes']  //  Reply 'yes' to all automated prompts
                  .concat(makeParameters) // other options from brunch-config.js
                  .concat(['--output', outputFile , srcFile ]);

    var command = 'elm make ' + params.join(' ');


    try {
      childProcess.execSync(command, { cwd: elmFolder });
      callback(null, "");
    } catch (error) {
      callback(error, "");
    }
  };

}).call(this);
