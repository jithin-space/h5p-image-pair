H5P.ImagePair = (function(EventDispatcher, $, UI) {

  /**
   * @class H5P.ImagePair
   * @param {Object} params
   */

  function ImagePair(parameters, id) {

    var self = this;
    EventDispatcher.call(self);


    cards = [];
    mates = [];



    var clicked, numClicks;
    self.pairedCount = 0;

    var addCard = function(card, mate) {


      card.on('selected', function() {
        card.setSelected();
        // timer.play();
        numClicks++;
        if (clicked !== undefined) {
          // var matie = clicked;
          // clicked = undefined;
          // setTimeout(function() {
          //   check(card, matie, mate);
          // }, 800);

          clicked.removeSelection();
          clicked = card;

        } else {
          clicked = card;
        }

        // counter.increment();

      });

      mate.on('unpair', function() {

        self.pairedCount--;
        mate.pairingStatus = undefined;

        if (self.$checkButton) {
          self.$checkButton.remove();
          self.$checkButton = undefined;
        }
        if (self.$retryButton) {
          self.$retryButton.remove();
          self.$retryButton = undefined;
        }
        if (self.$showSolutionButton) {
          self.$showSolutionButton.remove();
          self.$showSolutionButton = undefined;
        }
        if (self.$progressBar) {
          self.$progressBar.$scoreBar.remove();
          self.$progressBar = undefined;
        }


      });
      mate.on('selected', function() {
        // mate.setSelected();
        numClicks++;
        if (clicked !== undefined) {
          // alert("need to merge");
          // paired.splice([clicked,mate,card]);
          // if(clicked == card){
          //   mate.pairingStatus = true;
          // }
          // else{
          //   mate.pairingStatus = false;
          // }
          mate.trigger('checkPair', clicked);
          mate.$card.removeClass('reducer').droppable("option", "disabled", true);
          mate.pair(clicked);
          clicked.disable();
          clicked = undefined;
          self.pairedCount++;

        }

        if (self.pairedCount == cards.length) {
          // alert("pairing completed");

          self.showCheckButton();
        }
      });

      mate.on('checkPair', function(pair) {
        if (pair.data == card) {
          mate.pairingStatus = true;
        } else {
          mate.pairingStatus = false;
        }
      });

      mate.on('attachSolution', function() {
        mate.$top.empty();
        mate.pair(card);
        mate.setSolved();
      });

      cards.push(card);
      mates.push(mate);
    };

    self.showCheckButton = function() {
      if (self.$checkButton == undefined) {
        self.$checkButton = UI.createButton({
          title: 'Submit',
          click: function(event) {
            // console.log(paired.length());
            self.checkResult();
          },
          html: '<span><i class="fa fa-check" aria-hidden="true"></i></span>&nbsp;' + parameters.l10n.checkAnswer
        });
      }

      self.$checkButton.appendTo(self.$wrapper);
    }

    self.showSolution = function() {

      self.$showSolutionButton.remove();
      for (var i = 0; i < mates.length; i++) {
        if (mates[i].pairingStatus == false) {
          mates[i].trigger('attachSolution');
          mates[i].pairingStatus = true;
        }
      }
    }

    self.retry = function() {

      if (self.$showSolutionButton) {
        self.$showSolutionButton.remove();
      }
      self.$retryButton.remove();
      for (var i = 0; i < mates.length; i++) {
        mates[i].detach();
        cards[i].$card.removeClass('disabled');
      }
      self.pairedCount = 0;

    }

    self.checkResult = function() {

      score = 0;
      for (var i = 0; i < mates.length; i++) {
        if (mates[i].pairingStatus == true) {
          mates[i].setCorrect();
          score++;
        } else if (mates[i].pairingStatus == false) {
          mates[i].setIncorrect();
        }
      }

      self.$checkButton.remove();
      self.$retryButton = UI.createButton({
        title: 'Submit',
        click: function(event) {
          // console.log(paired.length());
          self.retry();
        },
        html: '<span><i class="fa fa-check" aria-hidden="true"></i></span>&nbsp;' + 'retry *'
      });

      if (score != cards.length) {
        self.$showSolutionButton = UI.createButton({
          title: 'Submit',
          click: function(event) {
            // console.log(paired.length());
            self.showSolution();
          },
          html: '<span><i class="fa fa-check" aria-hidden="true"></i></span>&nbsp;' + 'show solution *'
        });
        self.$showSolutionButton.appendTo(self.$wrapper);
      }
      self.$progressBar = UI.createScoreBar(cards.length, 'scoreBarLabel');
      self.$progressBar.setScore(score);
      self.$progressBar.appendTo(self.$wrapper);
      self.$retryButton.appendTo(self.$wrapper);

    }


    var getCardsToUse = function() {
      var numCardsToUse = (parameters.behaviour && parameters.behaviour.numCardsToUse ? parseInt(parameters.behaviour.numCardsToUse) : 0);
      if (numCardsToUse <= 2 || numCardsToUse >= parameters.cards.length) {
        // Use all cards
        return parameters.cards;
      }
      // Pick random cards from pool
      var cardsToUse = [];
      var pickedCardsMap = {};
      var numPicket = 0;
      while (numPicket < numCardsToUse) {
        var pickIndex = Math.floor(Math.random() * parameters.cards.length);
        if (pickedCardsMap[pickIndex]) {
          continue; // Already picked, try again!
        }
        cardsToUse.push(parameters.cards[pickIndex]);
        pickedCardsMap[pickIndex] = true;
        numPicket++;
      }
      return cardsToUse;
    };

    var cardsToUse = getCardsToUse();

    for (var i = 0; i < cardsToUse.length; i++) {
      var cardParams = cardsToUse[i];
      if (ImagePair.Card.isValid(cardParams)) {
        // Create first card
        var cardTwo, cardOne = new ImagePair.Card(cardParams.image, id, cardParams.description);

        if (ImagePair.Card.hasTwoImages(cardParams)) {
          // Use matching image for card two
          cardTwo = new ImagePair.Card(cardParams.match, id, cardParams.description);
          cardOne.hasTwoImages = cardTwo.hasTwoImages = true;
        } else {
          // Add two cards with the same image
          cardTwo = new ImagePair.Card(cardParams.image, id, cardParams.description);
        }

        // Add cards to card list for shuffeling
        addCard(cardOne, cardTwo);
        // addCard(cardTwo, cardOne);
      }
    }




    self.attach = function($container) {

      self.$wrapper = $container.addClass('h5p-image-pair').html('');
      $('<div class="h5p-task-description">' + parameters.taskDescription + '</div>').appendTo($container);
      self.$gameContainer = $('<div class="gameContainer"/>');
      self.$cardList = $('<ul class="cardContainer" />');
      self.$mateList = $('<ul class="mateContainer"/>');
      for (var i = 0; i < cards.length; i++) {

        cards[i].appendTo(self.$cardList);
        cards[i].$card.attr("data-card", i);
        mates[i].appendTo(self.$mateList);
        mates[i].$card.addClass('droppable');
        mates[i].$card.attr("data-mate", i);
        cards[i].$card.draggable(

          {
            opacity: 0.7,
            helper: "clone",
            handle: "div",
            revert: 'invalid',
            stack: '.item',
            start: function(event, ui) {
              temp = $(this).data('card');
              cards[temp].$card.addClass('reducer');
            },
            drag: function() {

            },
            stop: function() {
              temp = $(this).data('card');
              cards[temp].$card.removeClass('reducer');
            }
          });

      }

      if (self.$cardList.children().length >= 0) {
        self.$cardList.appendTo(self.$gameContainer);

        self.$mateList.find('.droppable').droppable({
          over: function(event, ui) {
            temp2 = $(this).data('mate');
            mates[temp2].$card.addClass('reducer');
          },
          out: function(event, ui) {
            temp2 = $(this).data('mate');
            mates[temp2].$card.removeClass('reducer');
          },
          drop: function(event, ui) {
            temp = $(ui.draggable).data('card');
            temp2 = $(this).data('mate');
            cards[temp].$card.addClass('disabled');
            mates[temp2].pair(cards[temp]);
            mates[temp2].trigger('checkPair', cards[temp]);
            mates[temp2].$card.removeClass('reducer').droppable("option", "disabled", true);
            self.pairedCount++;
            console.log(self.pairedCount);
            if (self.pairedCount == cards.length) {
              self.showCheckButton();
            }
          }
        });

        self.$cardList.find('img').disableSelection();
        self.$mateList.find('img').disableSelection();
        self.$mateList.appendTo(self.$gameContainer);
        // $feedback = $('<div class="h5p-feedback">' + parameters.l10n.feedback + '</div>').appendTo($container);
        self.$gameContainer.appendTo($container);
        // self.$progressBar.appendTo($container);

        // Add status bar
      }

    }

  };


  ImagePair.prototype = Object.create(EventDispatcher.prototype);
  ImagePair.prototype.constructor = ImagePair;


  return ImagePair;
})(H5P.EventDispatcher, H5P.jQuery, H5P.JoubelUI);
