// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const connectBtn = document.getElementById('connectBtn');
const status = document.getElementById('status');
const terminalContainer = document.getElementById('terminal-container')
const terminal = document.getElementById('terminal')
const SerialPort = require('serialport')
var dataBuffer = '';
var serialport = ''

var term = new Terminal({ 
  cursorBlink: true , 
  bellStyle: 'sound'
});

term.open(terminalContainer);
Terminal.applyAddon(fit);
fit.fit(term);

var shellprompt = '\x1B[1;3;31mCodeBadge\x1B[0m $ ';
term.prompt = function () {
  // term.write('\r\n' + shellprompt);
  term.write(shellprompt);
};

var port;

detectBadge()

connectBtn.onclick = function () {
  if (connectBtn.innerHTML == 'Connect') {
    terminalContainer.style.display === 'block'
    port.open()
  } else if (connectBtn.innerHTML == 'Disconnect') {
    terminalContainer.style.display === 'none'
    port.close()
  } else if (connectBtn.innerHTML == 'Refresh') {
    detectBadge()
  }
}

function detectBadge(){
  SerialPort.list((err, ports) => {
    if (err) {
      status.textContent = err.message
      return
    }
  
    for (var i = 0; i < ports.length; i++) {
      if (ports[i].comName.includes('SLAB') || ports[i].comName.includes('wchusbserial')) {
        serialport = ports[i].comName;
        status.textContent = 'Badge detected at: \'' + serialport + '\''
        connectBtn.innerHTML = 'Connect'
        connect();
        return;
      } else {
        status.textContent = 'No badge detected. Please make sure your badge is connected.'
        connectBtn.innerHTML = 'Refresh'
      }
    }
  })
}



function connect() {

  port = new SerialPort(serialport, {
    autoOpen: false,
    baudRate: 115200
  });

  const parsers = SerialPort.parsers;
  const parser = new parsers.Readline({
    delimiter: '\r\n'
  });

  port.pipe(parser);
  
  port.on('open', () => {
    console.log('Port open');
    term.focus();
    status.textContent = 'Connected to port ' + serialport
    connectBtn.innerHTML = 'Disconnect'
    port.write('help\r\n', (err) => {
      if (err) { return console.log('Error: ', err.message) }
      //console.log('message written');
    });
  });

  port.on('close', () => {
    status.textContent = 'Disconnected from port \'' + serialport + '\''
    term.clear()
    console.log('Port closed');
    connectBtn.innerHTML = 'Connect'
  })
    
  parser.on('data', (data) => {
    //console.log(data);
    if (data.includes('>>>')) {
      term.prompt()
      return
    }
    term.writeln(data);
  });
    
  term.on('data', function(data) {
    if (data.indexOf('\r\n') == -1 ){
      dataBuffer+=data;
      //console.log(dataBuffer)
    }
  });
  
  term.on('key', function (key, ev) {
    var printable = (
      !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
    );
  
    if (dataBuffer.indexOf('clear') > -1 ) {
      console.log('cleaning')
      term.clear()
      dataBuffer=''
      return
    }

    if (ev.keyCode == 13 && dataBuffer.trim() != '') {
      console.log('dataBuffer', dataBuffer)
      port.write(dataBuffer)
      term.write('\r\n')
      dataBuffer = ''
    } else if (ev.keyCode == 8) {
      if (term.buffer.x > 12) {
        term.write('\b \b');
      } 
    } else if (key == '[D') {
      if (term.buffer.x > 12) {
        term.buffer.x = term.buffer.x - 1
      }
    } else if (printable && key.trim() != '') {
      console.log('key', key)
      term.write(key);
    } else if (key.trim() == '') {
      term.write('\r\n')
      term.prompt()
    }

  });

}

