const qrcode = require('qrcode-terminal');

module.exports = (askRetry) => {
  return class IrmaConsole {

    constructor({stateMachine}) {
      this._stateMachine = stateMachine;
    }

    stateChange({newState, payload, isFinal}) {
      if (isFinal) return;
      switch(newState) {
        case 'Cancelled':
          return this._askRetry('Transaction cancelled.');
        case 'TimedOut':
          return this._askRetry('Transaction timed out.');
        case 'Error':
          return this._askRetry('An error occurred.');
        case 'ShowingQRCode':
          return this._renderQRcode(payload);
        case 'ContinueOn2ndDevice':
        case 'ContinueInIrmaApp':
          return console.log('Please follow the instructions in the IRMA app.');
      }
    }

    _askRetry(message) {
      if ( askRetry(message) )
        return this._stateMachine.transition('restart');
      this._stateMachine.transition('abort');
    }

    _renderQRcode(payload) {
      qrcode.generate(payload.qr);
    }

  }
};
