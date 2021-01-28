/**
 * This file defines the states for the state machine, plus the different valid
 * transitions to other states from each state.
 *
 * The transition 'fail' is a special one, and will (also) be triggered if we
 * try to apply an invalid transition from that state.
 */

module.exports = {

  startState:       'Uninitialized',
  endStates:        ['BrowserNotSupported', 'Success', 'Cancelled', 'TimedOut', 'Error'],

  Uninitialized: {
    initialize:     'Loading',              // Expected payload: {canRestart: true/false}
    browserError:   'BrowserNotSupported',  // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  Loading: {
    loaded:         'MediumContemplation',  // Expected payload: { sessionPtr, frontendAuth (if available) }
    fail:           'Error'                 // Expected payload: error object
  },

  MediumContemplation: {
    showQRCode:     'ShowingQRCode',        // Expected payload: {qr: <payload for in QRs, mobile: <app link for launching the IRMA app>}
    showIrmaButton: 'ShowingIrmaButton',    // Expected payload: {qr: <payload for in QRs, mobile: <app link for launching the IRMA app>}
    fail:           'Error'                 // Expected payload: error object
  },

  ShowingQRCode: {
    appConnected:   'ContinueOn2ndDevice',  // Expected payload: frontend options
    appPairing:     'Pairing',              // Expected payload: frontend options
    timeout:        'TimedOut',             // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object

    // State change below is only performed if user agent actually changed.
    checkUserAgent: 'ShowingIrmaButton'     // Expected payload: {qr: <payload for in QRs, mobile: <app link for launching the IRMA app>}
  },

  Pairing: {
    pairingCompleted: 'ContinueOn2ndDevice', // Expected payload: undefined
    cancel:           'Cancelled',           // Expected payload: undefined
    timeout:          'TimedOut',            // Expected payload: undefined
    fail:             'Error',               // Expected payload: error object
  },

  ContinueOn2ndDevice: {
    succeed:        'Success',              // Expected payload: session result (if any)
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  ShowingIrmaButton: {
    chooseQR:       'ShowingQRCodeInstead', // Expected payload: undefined
    appConnected:   'ContinueInIrmaApp',    // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object

    // We sometimes miss the appConnected transition
    // on iOS, that's why these transitions are here
    // too. So we don't 'fail' to the Error state.
    succeed:        'Success',              // Expected payload: session result (if any)
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined

    // State change below is only performed if user agent actually changed.
    checkUserAgent: 'ShowingQRCode'         // Expected payload: {qr: <payload for in QRs, mobile: <app link for launching the IRMA app>}
  },

  ShowingQRCodeInstead: {
    appConnected:   'ContinueOn2ndDevice',  // Expected payload: frontend options
    appPairing:     'Pairing',              // Expected payload: frontend options
    showIrmaButton: 'ShowingIrmaButton',    // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object

    // State change below is only performed if user agent actually changed.
    checkUserAgent: 'ShowingQRCode'         // Expected payload: {qr: <payload for in QRs, mobile: <app link for launching the IRMA app>}
  },

  ContinueInIrmaApp: {
    succeed:        'Success',              // Expected payload: undefined
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  // Possible end states
  Cancelled: {
    restart:        'Loading'               // Expected payload: undefined
  },

  TimedOut: {
    restart:        'Loading'               // Expected payload: undefined
  },

  Error: {
    restart:        'Loading'               // Expected payload: undefined
  },

  BrowserNotSupported: {},
  Success: {}

}
