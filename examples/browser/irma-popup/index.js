require('@privacybydesign/irma-css');

const IrmaCore = require('@privacybydesign/irma-core');
const Popup    = require('@privacybydesign/irma-popup');
const Dummy    = require('@privacybydesign/irma-dummy');

document.getElementById('start-button').addEventListener('click', () => {

  const irma = new IrmaCore({
    debugging: true,
    dummy:     'happy path',
    language:  'en',
    translations: {
      header:  'Sign the agreement with <i class="irma-web-logo">IRMA</i>',
      loading: 'Just one second please!'
    }
  });

  irma.use(Popup);
  irma.use(Dummy);

  irma.start()
  .then(result => console.log("Successful disclosure! 🎉", result))
  .catch(error => console.error("Couldn't do what you asked 😢", error));

});
