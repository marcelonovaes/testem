var EventEmitter = require('events').EventEmitter
var Backbone = require('backbone')
var BrowserRunner = require('./runners').BrowserRunner
var exec = require('child_process').exec
var log = require('winston')

function BaseApp(config){
    var self = this
    this.config = config
    this.url = 'http://localhost:' + this.config.get('port')
    this.runners = new Backbone.Collection

    this
        .on('all-test-results', function () {
            var allRunnersComplete = self.runners.all(function (runner) {
                return !!runner.get('results').get('all')
            })
            if (allRunnersComplete) {
                self.emit('all-runners-complete')
            }
        })

    var on_start = this.config.get('on_start')
    if (on_start){
        log.info('Starting on_start hook ' + on_start)
        this.onStartProcess = exec(on_start)
    }
}
BaseApp.prototype = {
    __proto__: EventEmitter.prototype
    , runPreprocessors: function(callback){
        this.runHook('before_tests', callback)
    }
    , runPostprocessors: function(callback){
        this.runHook('after_tests', callback)
    }
    , runExitHook: function (callback) {
        if(this.onStartProcess) {
            this.onStartProcess.kill('SIGTERM');
        }
        this.runHook('on_exit', callback)
    }
    , runHook: function(hook, callback){
        var self = this
        var hookCommand = this.config.get(hook)
        if (hookCommand){
            log.info('Running ' + hook + ' command ' + hookCommand)
            this.disableFileWatch = true
            exec(hookCommand, function(err, stdout, stderr){
                self.disableFileWatch = false
                if (callback) callback(err, stdout, stderr, hookCommand)
            })
        }else{
            if (callback) callback()
        }
    }
    , removeBrowser: function(browser){
        this.runners.remove(browser)
    }
    , connectBrowser: function(browserName, client){
        var existing = this.runners.find(function(runner){
            return runner.pending && runner.get('name') === browserName
        })
        if (existing){
            clearTimeout(existing.pending)
            existing.set('socket', client)
        }else{
            var browser = new BrowserRunner({
                name: browserName
                , socket: client
                , app: this
            })
            this.runners.push(browser)
        }
    }
}

module.exports = BaseApp