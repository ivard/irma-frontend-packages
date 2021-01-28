const transitions = require('./state-transitions');
const userAgent   = require('./user-agent');

module.exports = class StateMachine {

  constructor(debugging) {
    this._state     = transitions.startState;
    this._debugging = debugging;
    this._listeners = [];
    this._inEndState = false;
    this._disabledTransitions = [];
    this._transitionQueue = Promise.resolve();
    this._eventQueue = Promise.resolve();
    this._inTransition = false;
  }

  currentState() {
    if (this._inTransition) throw new Error('The state machine is in transition; wait until the transition is made.')
    return this._state;
  }

  isEndState() {
    if (this._inTransition) throw new Error('The state machine is in transition; wait until the transition is made.')
    return this._inEndState;
  }

  isValidTransition(transition) {
    if (this._inTransition) throw new Error('The state machine is in transition; wait until the transition is made.')

    if (this._inEndState || this._disabledTransitions.includes(transition))
      return false;
    return transitions[this._state][transition] != undefined;
  }

  onReady(handlerFunc) {
    this._transitionQueue = this._transitionQueue.then(handlerFunc);
  }

  addEventListener(func) {
    this._listeners.push(func);
  }

  abort() {
    if (!this._inEndState) {
      this._inEndState = true;
      this._dispatchEvent({
        eventType: 'abort',
        state:     this._state,
      });
    }
  }

  transition(transition, payload) {
    this._performTransition(transition, false, payload)
  }

  finalTransition(transition, payload) {
    this._performTransition(transition, true, payload);
  }

  _performTransition(transition, isFinal, payload) {
    this._transitionQueue = this._transitionQueue.then(() => {
      const oldState = this._state;
      if (this._inEndState)
        throw new Error(`State machine is in an end state. No transitions are allowed from ${oldState}.`);
      const newState = this._getNewState(transition, isFinal);

      if (transition === 'checkUserAgent') {
        if (this._debugging) console.debug(`🎰 Re-checking user agent`);
        let agent = userAgent();
        if (newState === 'ShowingQRCode' && ['Android', 'iOS'].includes(agent)) return;
        if (['ShowingIrmaButton', 'ShowingQRCodeInstead'].includes(newState) && agent === 'Desktop') return;
      }

      if (this._debugging)
        console.debug(`🎰 Preparing for state change: '${oldState}' → '${newState}' (because of '${transition}')`);

      // State is also an end state when no transitions are available from that state
      const isEnabled = t => !this._disabledTransitions.includes(t);
      let inEndState = isFinal || Object.keys(transitions[newState]).filter(isEnabled).length == 0;

      if (transition === 'restart') {
        payload = {...payload, canRestart: true};
      }

      let event = {
        eventType: 'prepare',
        newState: newState,
        oldState: oldState,
        transition: transition,
        isFinal: inEndState,
        payload: payload
      };

      this._inTransition = true;
      return this._dispatchEvent(event)
        .catch(err => {
          if (this._debugging)
            console.debug('🎰 Preparing for state change failed');

          inEndState = isFinal || Object.keys(transitions['Error']).filter(isEnabled).length == 0;
          event = {
            ...event,
            newState: 'Error',
            isFinal: inEndState,
            payload: err
          };
        })
        .then(() => {
          // Before applying change, check whether state machine is aborted in between
          if (this._inEndState) {
            this._inTransition = false;
            return;
          }

          this._state = event.newState;
          this._inEndState = event.isFinal;
          if (transition === 'initialize')
            this._disabledTransitions = payload.canRestart ? [] : ['restart'];

          if (this._debugging)
            console.debug(`🎰 State change: '${oldState}' → '${this._state}' (because of '${transition}')`);

          this._inTransition = false;
          return this._dispatchEvent({...event, eventType: 'change'});
        });
    });
  }

  _dispatchEvent(event) {
    let promise = Promise.all(
      this._listeners.map(l => Promise.resolve(l(event)))
    );

    // Prevent queuing an error
    this._eventQueue = this._eventQueue
      .then(() => promise)
      .catch(() => {});

    return promise;
  }

  _getNewState(transition, isFinal) {
    let newState = transitions[this._state][transition];
    let isDisabled = this._disabledTransitions.includes(transition);
    if (!newState || isDisabled) newState = transitions[this._state]['fail'];
    if (!newState) throw new Error(`Invalid transition '${transition}' from state '${this._state}' and could not find a "fail" transition to fall back on.`);
    if (isDisabled) throw new Error(`Transition '${transition}' was disabled in state '${this._state}'`)
    if (isFinal && !transitions.endStates.includes(newState))
      throw new Error(`Transition '${transition}' from state '${this._state}' is marked as final, but resulting state ${newState} cannot be an end state.`);
    return newState;
  }

}
