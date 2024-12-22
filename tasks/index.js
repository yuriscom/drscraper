const yargsParser = require('yargs-parser');
const htmlentities = require('html-entities');

var readline = require('readline')
  , readlineInterface = readline.createInterface(
    process.stdin,
    process.stdout
  );

// readlineInterface.setPrompt('OHAI> ');
// readlineInterface.prompt();

readlineInterface.on('line', function(command) {
  runCommand(command);
  readlineInterface.prompt();
}).on('close', close);

function runCommand(line, callback) {
  line = htmlentities.decode(line);
  let args = yargsParser(line)._;
  const command = args.shift();

  const argObj = {};
  for (let i = 0; i < args.length; i += 3) {
    const key = args[i];
    const value = args[i + 2]?.replace(/^["']|["']$/g, '') || ''; // Remove quotes from the value
    argObj[key] = value;
  }


  // console.log(command);
  // console.log(argObj);

  switch (command) {
    case 'bla':
      console.log("blabla");
      break;
    case 'ds':
      var propercallback = function(res, err) {
        console.log("done.");
        readlineInterface.prompt();
        if (callback) {
          callback(res, err);
        }
      }

      require('./generators/ds.js')(argObj, propercallback);
    case 'quit':
    case 'q':
      close();
      break;
    case 'rs':
      break;
    default:
      console.log('Unknown command!');
      break;
  }
}

function close() {
  //console.log('Exit Application Server');
  //readlineInterface.close();
  //process.exit();
}



module.exports.runCommand = runCommand;
