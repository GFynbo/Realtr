'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var Store = require('./store');
const LUIS_APP_URL = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/d3b4d78d-c051-451f-b0f2-4d86b381a8ef?subscription-key=2ebc9c4a80dc4968bdd6425f14ec8019&timezoneOffset=0&verbose=true&q='


var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

// setup bot credentials
var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
  session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// google api
var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDBjktTNauyQEUuB2H5rmZQMwLP_CX5W6w'
});


// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
  recognize: function (context, done) {
  var intent = { score: 0.0 };

        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'help':
                    intent = { score: 1.0, intent: 'Help' };
                    break;
                case 'hi':
                    intent = { score: 1.0, intent: 'Hi' };
                    break;
                case 'goodbye':
                    intent = { score: 1.0, intent: 'Goodbye' };
                    break;
            }
        }
        done(null, intent);
    }
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var luisAppUrl = process.env.LUIS_APP_URL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/d3b4d78d-c051-451f-b0f2-4d86b381a8ef?subscription-key=2ebc9c4a80dc4968bdd6425f14ec8019&timezoneOffset=0&verbose=true&q=';
bot.recognizer(new builder.LuisRecognizer(luisAppUrl));

// root dialog
bot.dialog('Hi', function(session, args) {

  var message = 'Hello, I\'m Tyrion Realister.';
  session.send({text: message,
                attachments: [
                    {
                    contentUrl: "https://vignette.wikia.nocookie.net/gameofthrones/images/5/58/Tyrion_main_s7_e6.jpg/revision/latest?cb=20170818050344",
                    contentType: "image/jpg",
                    name: "Tyrion.jpg"
                    }
                ]
            });
  message = ' I\'m here to be your personalized Hand on all matters related to rentals in Boston.';
  session.send(message);
  //

  connector.url

}).triggerAction({
  matches: 'Hi'
});

bot.dialog('Nearby', [
    function (session, args, next) {
        session.send('Give me one second and I promise I wont dissapoint.', session.message.text);

        // try extracting entities
        var nearbyEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.transportation', 'builtin.food');
        if (nearbyEntity) {
            // city entity detected, continue to next step
            session.dialogData.searchType = 'builtin.transportation', 'builtin.food';
            next({ response: nearbyEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'What did you want to find?');
        }
    },
    function (session, results) {
        var destination = results.response;

        var message = "I'll be back after some drinks";

        session.send(message, destination);

        // Async search
        Store
            .searchNearby(object)
            .then(function (object) {

            });
    }
]).triggerAction({
    matches: 'Nearby',
    onInterrupted: function (session) {
        session.send('What did you want to find?');
    }
});

bot.dialog('FindApartments', [
  function (session, args, next) {
      session.send({text: "",
          attachments: [
              {
              contentUrl: "https://pbs.twimg.com/profile_images/668279339838935040/8sUE9d4C.jpg",
              contentType: "image/jpg",
              name: "Tyrion.jpg"
              }
          ]
      });

      session.send('The apartment search has begun! We are decrypting your message and sending a raven containing: \'%s\'', session.message.text);

      // try extracting entities
      var cityEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.city');
      if (cityEntity) {
          // city entity detected, continue to next step
          session.dialogData.searchType = 'city';
          next({ response: cityEntity.entity });
      } else {
          // no entities detected, ask user for a destination
          builder.Prompts.text(session, 'Please enter your destination');
      }
  },
  function (session, results) {
      var destination = results.response;

      var message = 'Looking for apartments';
      message += ' in %s...';

      session.send(message, destination);

      // Async search
      Store
          .searchApartments(destination)
          .then(function (apartments) {
              // args
              session.send('I found %d apartments:', apartments.length);

              var message = new builder.Message()
                  .attachmentLayout(builder.AttachmentLayout.carousel)
                  .attachments(apartments.map(apartmentAsAttachment));

              session.send(message);

              // End
              session.endDialog();
          });
  }
]).triggerAction({
  matches: 'FindApartments',
  onInterrupted: function (session) {
      session.send('Please provide a destination');
  }
});

bot.dialog('ValueOf', [
    function (session, args, next) {
        session.send({text: "",
            attachments: [
                {
                    contentUrl: "https://pbs.twimg.com/profile_images/668279339838935040/8sUE9d4C.jpg",
                    contentType: "image/jpg",
                    name: "Tyrion.jpg"
                }
            ]
        });

        session.send('One momemnt while I see how much money you shouldn\'t spend on this piece of rubbish... I mean this lovely home!', session.message.text);

        // try extracting entities
        var valueEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.quantity');
        if (valueEntity) {
            // city entity detected, continue to next step
            session.dialogData.searchType = 'money';
            next({ response: cityEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please specify what you want me to appreciate.');
        }
    },
    function (session, results) {
        var destination = results.response;

        var message = 'Let me think';
        message += ' ...';

        session.send(message, destination);

        // Async search
        Store
            .searchApartments(destination)
            .then(function (apartments) {
                // args
                session.send('It\'s worth about, $5,999, you shoulde be lucky to find one so cheap /S' );

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(apartments.map(apartmentAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
    }
]).triggerAction({
    matches: 'Value',
    onInterrupted: function (session) {
        session.send('Another?');
    }
});

bot.dialog('WutUp', [
    function (session, args, next) {
        session.send({text: "",
            attachments: [
                {
                    contentUrl: "https://pbs.twimg.com/profile_images/668279339838935040/8sUE9d4C.jpg",
                    contentType: "image/jpg",
                    name: "Tyrion.jpg"
                }
            ]
        });

        session.send('Sorry, I only have so many braincells left. I have to think about that one... ', session.message.text);

        // try extracting entities
        var valueEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.sentiment');
        if (valueEntity) {
            // city entity detected, continue to next step
            session.dialogData.searchType = 'question';
            next({ response: cityEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'So, you want to know how I\'m feeling, what\'s going on in my crown sized head?.');
        }
    },
    function (session, results) {
        var destination = results.response;

        var message = 'I\'m miserable, all I do is answer your questions';
        message += ' ...';

        session.send(message, destination);

        // Async search
        Store
            .searchApartments(destination)
            .then(function (apartments) {
                // args
                session.send('What else do you want to know?' );
                
                // End
                session.endDialog();
            });
    }
]).triggerAction({
    matches: 'General',
    onInterrupted: function (session) {
        session.send('Another?');
    }
});

// help command
bot.dialog('Help', function (session) {
  session.send({text: "",
    attachments: [
        {
        contentUrl: "https://s-media-cache-ak0.pinimg.com/originals/a8/50/f3/a850f3e582a8768568033a27f4d89e9d.jpg",
        contentType: "image/jpg",
        name: "Tyrion.jpg"
        }
    ]
  });
  
  session.endDialog('Don\'t feel bad, Sansa asks me all the time. Try asking me things like \'find apartments in Cambridge\' or \'find apartments near Boston University\'');
}).triggerAction({
  matches: 'Help'
});

// Add a global endConversation() action that is bound to the 'Goodbye' intent
bot.endConversationAction('goodbyeAction', "Ok... See you later.", { matches: 'Goodbye' });

// Helpers
function apartmentAsAttachment(apartment) {
  return new builder.HeroCard()
      .title(apartment.name)
      .subtitle('%d stars. %d reviews. From $%d per night.', apartment.rating, apartment.numberOfReviews, apartment.priceStarting)
      .images([new builder.CardImage().url(apartment.image)])
      .buttons([
          new builder.CardAction()
              .title('More details')
              .type('openUrl')
              .value('https://www.bing.com/search?q=apartments+in+' + encodeURIComponent(apartment.location))
      ]);
}
// function searchApartments(destination) {
  
// }