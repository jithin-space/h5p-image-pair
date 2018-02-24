
H5P.ImagePair = (function(EventDispatcher, $, UI) {

  /**
   * Image Pair Constructor
   * @class H5P.ImagePair
   * @extends H5P.EventDispatcher
   * @param {Object} parameters
   * @param {Number} id
   */
  function ImagePair(parameters, id) {

    // @alias H5P.ImagePair
    var self = this;
    // Initialize event inheritance
    EventDispatcher.call(self);
    var cards = [],
      mates = [];
    var clicked;

    /**
     * pushing the cards and mates to appropriate arrays and
     * defining various events on which each card should respondTo
     * @private
     * @param {H5P.ImagePair.Card} card
     * @param {H5P.ImagePair.Card} mate
     */
    var addCard = function(card, mate) {

      // while clicking on a card on cardList
      card.on('selected', function() {

        self.triggerXAPI('interacted');
        
        if (clicked === undefined) {
          card.setSelected();
          self.prepareMateContainer();
          clicked = card;
        } else if (clicked == card) {
          card.$card.toggleClass('h5p-image-pair-item-selected');
          self.reverseMateContainer();
          clicked = undefined;
        } else {
          clicked.removeSelected();
          card.setSelected();
          self.prepareMateContainer();
          clicked = card;
        }
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
          self.reverseMateContainer();
        }
      });

      // while user decides to unpair the mate with its attached pair
      mate.on('unpair', function() {
        mate.pairingStatus = undefined;
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
        if (mate.$top !== undefined) {
          mate.$top.empty();
        }
        mate.pair(card);
        mate.setSolved();
      });
      cards.push(card);
      mates.push(mate);
    };

    /**
     * calculate the score and mark the correct and
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

    /**
     * Generic Function to create buttons for the game
     * @private
     * @param  callback
     * @param {string} icon
     * @param {string} name
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

    /**
     * function that defines the changes that needs to be applied on the right side
     * when a left side element is selected
     * @public
     */
    self.prepareMateContainer = function() {

      for (var i = 0; i < mates.length; i++) {

        // if element is already paired
        if (mates[i].isPaired === true) {
          //disable paired elements both front and rear
          mates[i].$front.removeClass('event-enabled').addClass('visual-disable');
          mates[i].$rear.removeClass('event-enabled').addClass('visual-disable');
          mates[i].$top.removeClass('event-enabled').addClass('event-disabled');
        } else {
          // if it is not paired, enable it for dropping with a grey dashed border
          mates[i].$card.removeClass('event-disabled').addClass('event-enabled').addClass('grey-dash');
        }
      }
    };

    /**
     * function that defines the changes that needs to be applied on the right side
     * after a selected element is successfully dropped
     * @public
     */
    self.reverseMateContainer = function() {

      for (var i = 0; i < mates.length; i++) {

        // if element is already paired
        if (mates[i].isPaired === true) {

          //enable paired elements
          mates[i].$front.removeClass('visual-disable').addClass('event-enabled');
          mates[i].$rear.removeClass('visual-disable').addClass('event-enabled');
          mates[i].$top.removeClass('grey-dash').removeClass('event-enabled');

        } else {
          // disable unpaired elements
          mates[i].$card.removeClass('event-enabled').addClass('event-disabled').removeClass('grey-dash');
        }
      }

    };


    /**
     * display the checkResult button
     * @public
     */
    self.showCheckButton = function() {
      self.$checkButton = createButton(self.displayResult, 'fa-check', parameters.l10n.checkAnswer);
      self.$checkButton.appendTo(self.$footer);
    };

    /**
     * triggerd when showSolution button is clicked
     * @public
     */
    self.showSolution = function() {

      self.$showSolutionButton.remove();
      for (var i = 0; i < mates.length; i++) {

        //if it is incorrectly paired or not paired at all
        if (mates[i].pairingStatus !== true) {
          mates[i].trigger('attachPair');
          mates[i].pairingStatus = true;
        }
      }
    };

    /**
     * triggerd when user clicks the retry button
     * @public
     */
    self.retry = function() {
      // empty the game footer
      self.$footer.empty();
      self.showCheckButton();
      for (var i = 0; i < mates.length; i++) {
        if (mates[i].isPaired === true) {
          mates[i].detach();
        }
        self.$footer.appendTo(self.$wrapper);
      }
      self.$gameContainer.removeClass('event-disabled').addClass('event-enabled');
      self.$wrapper.find('.h5p-image-pair-item-disabled').removeClass('h5p-image-pair-item-disabled');
    };

    /**
     * triggerd when user clicks the check button
     * @public
     */
    self.displayResult = function() {

      var result = prepareResult();
      self.$wrapper.find('.event-enabled').removeClass('event-enabled').addClass('event-disabled');
      self.$checkButton.remove();



      self.$feedbacks = $('<div class="feedback-container" />');
      var scoreText = parameters.l10n.score;
      scoreText = scoreText.replace('@score', result).replace('@total', cards.length);
      self.$feedbacks.html('<div class="feedback-text">' + scoreText + '</div>');

      self.$progressBar = UI.createScoreBar(cards.length, 'scoreBarLabel');
      self.$progressBar.setScore(result);
      self.$progressBar.appendTo(self.$feedbacks);
      self.$feedbacks.appendTo(self.$footer);

      if(parameters.behaviour.allowRetry){
        self.$retryButton = createButton(self.retry, 'fa-repeat', parameters.l10n.tryAgain);
      }



      // if all cards are not correctly paired
      if (result != cards.length) {
        self.$showSolutionButton = createButton(self.showSolution, 'fa-eye', parameters.l10n.showSolution);
        self.$showSolutionButton.appendTo(self.$footer);
      }

      self.$retryButton.appendTo(self.$footer);

      var completedEvent = self.createXAPIEventTemplate('completed');
      completedEvent.setScoredResult(result,cards.length, self, true, score===cards.length);
      self.trigger(completedEvent);


      self.trigger('resize');

    };




    /**
     * Initialize an array with the parameter values;
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
        var cardTwo, cardOne = new ImagePair.Card(cardParams.image, id , cardParams.imageAlt);

        if (ImagePair.Card.hasTwoImages(cardParams)) {
          // Use matching image for card two
          cardTwo = new ImagePair.Card(cardParams.match, id , cardParams.matchAlt);
          cardOne.hasTwoImages = cardTwo.hasTwoImages = true;
        } else {
          // Add two cards with the same image
          cardTwo = new ImagePair.Card(cardParams.image, id , cardParams.imageAlt);
        }

        // Add cards to card list for shuffeling
        addCard(cardOne, cardTwo);
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

      self.triggerXAPI('attempted');

      self.$wrapper = $container.addClass('h5p-image-pair').html('');
      $('<div class="h5p-image-pair-desc">' + parameters.taskDescription + '</div>').appendTo($container);
      self.$gameContainer = $('<div class="game-container event-enabled"/>');
      var $cardList = $('<ul class="card-container" />');
      var $mateList = $('<ul class="mate-container"/>');
      self.$footer = $('<div class="footer-container"/>');

      self.$checkButton = createButton(self.displayResult, 'fa-check', parameters.l10n.checkAnswer);
      self.$checkButton.appendTo(self.$footer);


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
            self.triggerXAPI('interacted');
            var cardId = $(this).data('card');
            cards[cardId].$card.removeClass('h5p-image-pair-item-hover').removeClass('h5p-image-pair-item-selected').addClass('h5p-image-pair-item-disabled');
            $cardList.find('.ui-draggable-dragging').removeClass('h5p-image-pair-item-hover');
            self.prepareMateContainer();
          },
          stop: function() {
            var cardId = $(this).data('card');
            cards[cardId].$card.removeClass('h5p-image-pair-item-disabled');
            self.reverseMateContainer();
          }
        });

      $mateList.find('.droppable').droppable({
        tolerance: 'intersect',
        over: function(event, ui) {
          var mateId = $(this).data('mate');
          mates[mateId].$card.addClass('h5p-image-pair-item-hover').removeClass('grey-dash').addClass('blue-dash');
        },
        out: function(event, ui) {
          var mateId = $(this).data('mate');
          mates[mateId].$card.removeClass('h5p-image-pair-item-hover').removeClass('blue-dash').addClass('grey-dash');
        },
        drop: function(event, ui) {
          var cardId = $(ui.draggable).data('card');
          var mateId = $(this).data('mate');

          //for ensuring drag end completes before drop is triggered
          setTimeout(
            function() {
              cards[cardId].$card.addClass('h5p-image-pair-item-disabled');
            }, 0.01);
          mates[mateId].pair(cards[cardId]);
          mates[mateId].trigger('checkPair', cards[cardId]);
          mates[mateId].$card.removeClass('h5p-image-pair-item-hover').removeClass('droppable').removeClass('blue-dash').droppable("option", "disabled", true);
        }
      });

      if ($cardList.children().length >= 0) {
        $cardList.appendTo(self.$gameContainer);
        $mateList.appendTo(self.$gameContainer);
        self.$gameContainer.appendTo($container);
        self.$footer.appendTo($container);
      }
    };
  }

  // Extends the event dispatcher
  ImagePair.prototype = Object.create(EventDispatcher.prototype);
  ImagePair.prototype.constructor = ImagePair;

  return ImagePair;

})(H5P.EventDispatcher, H5P.jQuery, H5P.JoubelUI);
