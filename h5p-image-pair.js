H5P.ImagePair = (function(EventDispatcher, $) {

  /**
   * @class H5P.ImagePair
   * @param {Object} params
   */

  function ImagePair(parameters, id) {

    var self = this;
    EventDispatcher.call(self);

    var clicked, timer, counter, popup;
    var cards = [];
    var numClicks = 0;
    var revertBacks = [];
    var removed = 0;

    /**
     * Revert the Incorrectly Selected Cards To Default State
     */

    var processRevertBacks = function() {
      revertBacks[0].revertBack();
      revertBacks[1].revertBack();
      revertBacks.splice(0, 2);
      numClicks -= 2;
    };

    /**
     * Check two selected cards are correct
     */


    var check = function(card, mate, correct) {
      if (mate !== correct) {
        // Incorrect, must be scheduled for flipping back
        card.setIncorrect();
        mate.setIncorrect();
        revertBacks.push(card);
        revertBacks.push(mate);
        setTimeout(function() {
          processRevertBacks();
        }, 800);
        return;
      }

      // Remove them from the game.
      card.remove();
      mate.remove();
      numClicks -= 2;
      removed += 2;
      var isFinished = (removed === cards.length);
      var desc = card.getDescription();
      if (desc !== undefined) {
        timer.pause();
        var imgs = [card.getImage()];
        if (card.hasTwoImages) {
          imgs.push(mate.getImage());
        }
        popup.show(desc, imgs, function() {
          if (isFinished) {
            // Game done
            finished();
          } else {
            // Popup is closed, continue.
            timer.play();
          }
        });
      } else if (isFinished) {
        finished();
      }
    };

    /**
     * When the Image Pairing Game is Finished
     * Show feedback and create a retry button
     */
    var finished = function() {
      timer.stop();
      $feedback.addClass('h5p-show');

      if (parameters.behaviour && parameters.behaviour.allowRetry) {
        // Create retry button
        var retryButton = createButton('reset', parameters.l10n.tryAgain || 'Reset', function() {

          retryButton.classList.add('h5p-image-transout');
          setTimeout(function() {
            // Remove button on nextTick to get transition effect
            self.$wrapper[0].removeChild(retryButton);
          }, 300);

          resetGame();
        });
        retryButton.classList.add('h5p-image-transin');
        setTimeout(function() {
          // Remove class on nextTick to get transition effect
          retryButton.classList.remove('h5p-image-transin');
        }, 0);

        self.$wrapper[0].appendChild(retryButton); // Add to DOM
      }

    }

    var createButton = function(name, label, action) {
      var buttonElement = document.createElement('div');
      buttonElement.classList.add('h5p-image-pair-' + name);
      buttonElement.innerHTML = label;
      buttonElement.setAttribute('role', 'button');
      buttonElement.tabIndex = 0;
      buttonElement.addEventListener('click', function(event) {
        action.apply(buttonElement);
      }, false);
      buttonElement.addEventListener('keypress', function(event) {
        if (event.which === 13 || event.which === 32) { // Enter or Space key
          event.preventDefault();
          action.apply(buttonElement);
        }
      }, false);
      return buttonElement;
    };

    var resetGame = function()  {
      removed = 0;
      for (var i = 0; i < cards.length; i++) {
        cards[i].reset();
      }

      $feedback[0].classList.remove('h5p-show');
      timer.reset();
      counter.reset();
      H5P.shuffleArray(cards);

      self.$list.empty();


      for (var i = 0; i < cards.length; i++) {
        cards[i].appendTo(self.$list);
      }


    };



    var addCard = function(card, mate) {
      card.on('selected', function() {
        card.setSelected();
        timer.play();
        numClicks++;
        if (clicked !== undefined) {
          var matie = clicked;
          clicked = undefined;
          setTimeout(function() {
            check(card, matie, mate);
          }, 800);
        } else {
          clicked = card;
        }

        counter.increment();
      });
      cards.push(card);
    };

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
        addCard(cardTwo, cardOne);
      }
    }

    H5P.shuffleArray(cards);

    self.attach = function($container) {
      self.$wrapper = $container.addClass('h5p-image-pair').html('');
      $('<div class="h5p-task-description">' + parameters.taskDescription + '</div>').appendTo($container);
      self.$list = $('<ul />');
      for (var i = 0; i < cards.length; i++) {
        cards[i].appendTo(self.$list);
      }

      if (self.$list.children().length) {
        self.$list.appendTo($container);
        $feedback = $('<div class="h5p-feedback">' + parameters.l10n.feedback + '</div>').appendTo($container);

        // Add status bar
        var $status = $('<dl class="h5p-status">' +
          '<dt>' + parameters.l10n.timeSpent + '</dt>' +
          '<dd class="h5p-time-spent">0:00</dd>' +
          '<dt>' + parameters.l10n.cardTurns + '</dt>' +
          '<dd class="h5p-card-turns">0</dd>' +
          '</dl>').appendTo($container);

        counter = new ImagePair.Counter($status.find('.h5p-card-turns'));
        timer = new ImagePair.Timer($status.find('.h5p-time-spent')[0]);
        popup = new ImagePair.Popup($container, parameters.l10n);

        $container.click(function() {
          popup.close();
        });
      }
    }
  };

  return ImagePair;
})(H5P.EventDispatcher, H5P.jQuery);
