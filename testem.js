#!/usr/bin/env node

var log = require('winston')
var program = require('commander')
var progOptions = program
var Config = require('./lib/config')
var catchem = require('./lib/catchem')
var appMode = 'dev'
  
program
    .version(require(__dirname + '/package').version)
    .usage('[options]')
    .option('-f, --file [file]', 'config file - defaults to testem.json or testem.yml')
    .option('-p, --port [num]', 'server port - defaults to 7357', Number)
    .option('-l, --launch [list]', 'list of launchers to launch(comma separated)')
    .option('-s, --skip [list]', 'list of launchers to skip(comma separated)')
    .option('-d, --debug', 'output debug to debug log - testem.log')
    .option('-t, --test_page [page]', 'the html page to drive the tests')

program
    .command('launchers')
    .description('Print the list of available launchers (browsers & process launchers)')
    .action(function(env){
        env.__proto__ = program
        progOptions = env
        appMode = 'launchers'
    })

program
    .command('ci')
    .description('Continuous integration mode')
    .option('-t, --timeout [sec]', 'timeout a browser after [sec] seconds', null)
    .action(function(env){
        env.__proto__ = program
        progOptions = env
        appMode = 'ci'
    })


program.on('--help', function(){
    console.log('  Keyboard Controls (in dev mode):\n')
    console.log('    ENTER                  run the tests')
    console.log('    q                      quit')
    console.log('    LEFT ARROW             move to the next browser tab on the left')
    console.log('    RIGHT ARROW            move to the next browser tab on the right')
    console.log('    UP ARROW               scroll up in the target text panel')
    console.log('    DOWN ARROW             scroll down in the target text panel')
    console.log('    SPACE                  page down in the target text panel')
    console.log('    b                      page up in the target text panel')
    console.log('    d                      half a page down in the target text panel')
    console.log('    u                      half a page up in the target text panel')
    console.log()
})

program.parse(process.argv)
log.remove(log.transports.Console)
if (progOptions.debug){
    log.add(log.transports.File, {filename: 'testem.log'})
}
log.info("Test'em starting...")

catchem.on('err', function(e){
    log.error(e.message)
    log.error(e.stack)
})

var config = new Config(appMode, progOptions)
if (appMode === 'launchers'){
    config.read(function(){
        config.printLauncherInfo()
    })
}else{
    App = appMode === 'ci' ? 
        require('./lib/ci_mode_app') :
        require('./lib/dev_mode_app')
    config.read(function(){
        new App(config)
    })
}



