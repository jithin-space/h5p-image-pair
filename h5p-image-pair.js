var H5P = H5P || {};
H5P.ImagePair = (function(EventDispatcher, $, UI) {

  /**
   * Image Pair Constructor
   *
   * @class H5P.ImagePair
   * @extends H5P.EventDispatcher
   * @param {Object} parameters
   * @param {Number} id
   */


  function ImagePair(parameters, id) {

    /* @alias H5P.ImagePair# */
    var self = this;
    // Initialize event inheritance
    EventDispatcher.call(self);
    var cards = [],
      mates = [];
    var clicked, pairedCount = 0;

    /*
     * pushing the cards and mates to appropriate arrays and
     * defining various events on which each card should respondTo
     * @private
     * @param {H5P.ImagePair.Card} card
     * @param {H5P.ImagePair.Card} mate
     */

    var addCard = function(card, mate) {

      // while clicking on a card on cardList
      card.on('selected', function() {

        if (clicked === undefined) {
          card.setSelected();
        } else if (clicked == card) {
          card.$card.toggleClass('h5p-pair-item-selected');
        } else {
          clicked.removeSelected();
          card.setSelected();

        }

        self.enablemates();

        clicked = card;


      });

      // while clicking on a matecard in the mateList

      mate.on('selected', function() {

        // perform pairing
        if (clicked !== undefined) {
          // check if the clicked is the correct pair
          mate.trigger('checkPair', clicked);
          mate.pair(clicked);
          mate.transform(); //transform mate to paired status
          clicked.disable();
          clicked = undefined;
          pairedCount++;

          self.disablemates();
        }

        // show check button when all images are paired
        if (pairedCount == cards.length) {

          self.showCheckButton();
        }


      });


      // while user decides to unpair the mate with its attached pair
      mate.on('unpair', function() {
        pairedCount--;
        mate.pairingStatus = undefined;
        // destroy the footer if it is present
        if (self.$footerStatus === true) {
          self.$footer.empty();
        }
      });

      // check whether the attached card is the correct pair
      mate.on('checkPair', function(pair) {
        if (pair.data == card) {
          mate.pairingStatus = true;
        } else {
          mate.pairingStatus = false;
        }
      });

      // attach  mate with the clicked card
      mate.on('attachPair', function() {

        mate.$top.empty();
        mate.pair(card);
        mate.setSolved();

      });

      cards.push(card);
      mates.push(mate);

    };

    /* calculate the score and mark the correct and
     * incorrect paired card
     * @private
     */

    var prepareResult = function() {
      var score = 0;
      for (var i = 0; i < mates.length; i++) {
        if (mates[i].pairingStatus === true) {
          mates[i].setCorrect();
          score++;
        } else if (mates[i].pairingStatus === false) {
          mates[i].setIncorrect();
        }
      }

      return score;
    };

    /* Generic Function to create buttons for the game
     * @private
     * @param {{ function }} callback
     * @param {{ String }} icon
     * @param {{ String }} name
     */

    var createButton = function(callback, icon, name) {

      return UI.createButton({
        title: 'Submit',
        click: function(event) {
          callback();
        },
        html: '<span><i class="fa ' + icon + '" aria-hidden="true"></i></span>&nbsp;' + name
      });

    };

    self.enablemates = function(){
      console.log('working');
      self.$wrapper.find('.droppable').css("pointer-events","all");
    }
    self.disablemates = function(){
      console.log('working');
      self.$wrapper.find('.droppable').css("pointer-events","none");
    }
    /* once the user paired all the images on the cardList
     * display the checkResult button
     * @public
     */

    self.showCheckButton = function() {

      self.$footerStatus = true;

      self.$checkButton = createButton(self.displayResult, 'fa-check', parameters.l10n.checkAnswer);

      self.$checkButton.appendTo(self.$footer);

      self.trigger('resize');
    };



    /* triggerd when showSolution button is clicked
     * @public
     */
    self.showSolution = function() {

      self.$showSolutionButton.remove();
      for (var i = 0; i < mates.length; i++) {
        // if pairingStatus is false ( incorrect pair attached)
        if (mates[i].pairingStatus === false) {
          mates[i].trigger('attachPair');
          mates[i].pairingStatus = true;
        }
      }
    };

    /* triggerd when user clicks the retry button
     * @public
     */

    self.retry = function() {


      // empty the game footer
      self.$footer.empty();
      self.$footerStatus = false;
      // detach all cards from their current state
      for (var i = 0; i < mates.length; i++) {
        mates[i].detach();
        cards[i].$card.removeClass('h5p-pair-item-disabled');
      }
      pairedCount = 0;

    };

    /* triggerd when user clicks the check button
     * @public
     */


    self.displayResult = function() {

      var result = prepareResult();

      self.$checkButton.remove();

      self.$progressBar = UI.createScoreBar(cards.length, 'scoreBarLabel');
      self.$progressBar.setScore(result);



      self.$feedbacks = $('<div class="feedback-container" />');

      var scoreText = parameters.l10n.score;
      scoreText = scoreText.replace('@score', result).replace('@total', cards.length);
      self.$feedbacks.html('<div class="feedback-text">' + scoreText + '</div>');

      self.$progressBar.appendTo(self.$feedbacks);
      self.$feedbacks.appendTo(self.$footer);




      self.$retryButton = createButton(self.retry, 'fa-repeat', parameters.l10n.tryAgain);

      // if all cards are not correctly paired
      if (result != cards.length) {

        self.$showSolutionButton = createButton(self.showSolution, 'fa-eye', parameters.l10n.showSolution);
        self.$showSolutionButton.appendTo(self.$footer);
      }

      self.$retryButton.appendTo(self.$footer);

      self.trigger('resize');


    };

  //  self.resize = function(){
  //    self.$wrapper.css("height","100%");
  //  }



    /* Initialize an array with the parameter values;
     * @private
     */

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

    // Initialize cards with the given parameters and trigger adding them
    // to proper lists

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

    // shuffle cards and mates array

    H5P.shuffleArray(cards);
    H5P.shuffleArray(mates);

    /**
     * Attach this game's html to the given container.
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function($container) {

      self.$wrapper = $container.addClass('h5p-pair').html('');
      $('<div class="h5p-game-desc">' + parameters.taskDescription + '</div>').appendTo($container);
      var $gameContainer = $('<div class="gameContainer"/>');
      var $cardList = $('<ul class="cardContainer" />');
      var $mateList = $('<ul class="mateContainer"/>');
      self.$footer = $('<div class="footer-container"/>');

      for (var i = 0; i < cards.length; i++) {

        cards[i].appendTo($cardList);
        mates[i].appendTo($mateList);

        cards[i].$card.attr("data-card", i);
        cards[i].$card.addClass("draggable");
        mates[i].$card.addClass('droppable');
        mates[i].$card.attr("data-mate", i);

      }

      $cardList.find('.draggable').draggable(

        {
          opacity: 0.7,
          helper: "clone",
          handle: "div",
          revert: 'invalid',
          start: function(event, ui) {
            var cardId = $(this).data('card');
            cards[cardId].$card.addClass('h5p-pair-item-reduced').removeClass('h5p-pair-item-hover');
            $cardList.find('.ui-draggable-dragging').removeClass('h5p-pair-item-hover');
            $mateList.find('.droppable').css("border","2px dashed grey");
          },
          drag: function() {

          },
          stop: function() {
            var cardId = $(this).data('card');
            cards[cardId].$card.removeClass('h5p-pair-item-reduced');
            $mateList.find('.h5p-pair-item-reduced').removeClass('h5p-pair-item-reduced');
            $mateList.find('.h5p-pair-item').css("border","").removeClass('h5p-pair-item-hover');
          }
        });

      $mateList.find('.droppable').droppable({
        tolerance: 'intersect',
        over: function(event, ui) {
          var mateId = $(this).data('mate');
          mates[mateId].$card.addClass('h5p-pair-item-reduced').css('border','2px dashed blue');
        },
        out: function(event, ui) {
          var mateId = $(this).data('mate');
          mates[mateId].$card.removeClass('h5p-pair-item-reduced').css('border','2px dashed grey');
        },
        drop: function(event, ui) {
          var cardId = $(ui.draggable).data('card');
          var mateId = $(this).data('mate');
          cards[cardId].$card.addClass('h5p-pair-item-disabled');
          mates[mateId].pair(cards[cardId]);
          mates[mateId].trigger('checkPair', cards[cardId]);
          mates[mateId].$card.removeClass('h5p-pair-item-reduced').removeClass('droppable').droppable("option", "disabled", true);
          pairedCount++;
          // console.log(pairedCount);
          if (pairedCount == cards.length) {
            // alert("showCheckButton");
            self.showCheckButton();
          }
        }
      });

      if ($cardList.children().length >= 0) {
        $cardList.appendTo($gameContainer);
        $mateList.appendTo($gameContainer);

        $gameContainer.find('img').disableSelection();

        $gameContainer.appendTo($container);
        self.$footer.appendTo($container);

      }

    };
  }

  // Extends the event dispatcher
  ImagePair.prototype = Object.create(EventDispatcher.prototype);
  ImagePair.prototype.constructor = ImagePair;

  return ImagePair;

})(H5P.EventDispatcher, H5P.jQuery, H5P.JoubelUI);
