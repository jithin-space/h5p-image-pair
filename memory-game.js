H5P.ImagePair = (function (EventDispatcher, $) {

  function ImagePair(parameters, id) {

    var self = this;
    EventDispatcher.call(self);

    var clicked,timer,counter,popup;
    var cards = [];
    var numClicks = 0;
    var revertBacks = [];
    var removed = 0;

    var processRevertBacks = function () {
      revertBacks[0].revertBack();
      revertBacks[1].revertBack();
      revertBacks.splice(0, 2);
      numClicks -= 2;
    };

    var check = function (card, mate, correct) {
      if (mate !== correct) {
        // Incorrect, must be scheduled for flipping back
        card.setIncorrect();
        mate.setIncorrect();
        revertBacks.push(card);
        revertBacks.push(mate);

        // Wait for next click to flip them back…
        // if (numClicks > 2) {
          // or do it straight away
          // processRevertBacks();
        // }

        setTimeout(function(){
          processRevertBacks();
        },800);
        return;
      }

      // Remove them from the game.
      card.remove();
      mate.remove();
      //
      // // Update counters
      numClicks -= 2;
      removed += 2;
      //
      var isFinished = (removed === cards.length);
      var desc = card.getDescription();
      //
      if (desc !== undefined) {
      //   // Pause timer and show desciption.
      //   timer.pause();
         var imgs = [card.getImage()];
        if (card.hasTwoImages) {
          imgs.push(mate.getImage());
        }
        popup.show(desc, imgs, cardStyles ? cardStyles.back : undefined, function () {
          if (isFinished) {
            // Game done
            // finished();
          }
          else {
            // Popup is closed, continue.
            // timer.play();
          }
        });
       }
      else if (isFinished) {
        // Game done

        alert("gamefinished");
        //finished();
      }
    };


    var addCard = function( card,mate){

      card.on('selected',function(){
          self.triggerXAPI('interacted');
          card.setSelected();

          numClicks++;

          if (clicked !== undefined){
            var matie = clicked;
            clicked = undefined;
            setTimeout(function(){
              check(card,matie,mate);
            },800);
          }
          else{

            clicked = card;
          }
      });

      cards.push(card);

    };

    var getCardsToUse = function () {
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

    var cardStyles, invertShades;
    if (parameters.lookNFeel) {
      // If the contrast between the chosen color and white is too low we invert the shades to create good contrast
      invertShades = (parameters.lookNFeel.themeColor &&
                      getContrast(parameters.lookNFeel.themeColor) < 1.7 ? -1 : 1);
      var backImage = (parameters.lookNFeel.cardBack ? H5P.getPath(parameters.lookNFeel.cardBack.path, id) : null);
      // cardStyles = ImagePair.Card.determineStyles(parameters.lookNFeel.themeColor, invertShades, backImage);
    }

    var cardsToUse = getCardsToUse();

    for (var i = 0; i < cardsToUse.length; i++) {
      var cardParams = cardsToUse[i];
      if (ImagePair.Card.isValid(cardParams)) {
        // Create first card
        var cardTwo, cardOne = new ImagePair.Card(cardParams.image, id, cardParams.description, cardStyles);

        if (ImagePair.Card.hasTwoImages(cardParams)) {
          // Use matching image for card two
          cardTwo = new ImagePair.Card(cardParams.match, id, cardParams.description, cardStyles);
          cardOne.hasTwoImages = cardTwo.hasTwoImages = true;
        }
        else {
          // Add two cards with the same image
          cardTwo = new ImagePair.Card(cardParams.image, id, cardParams.description, cardStyles);
        }

        // Add cards to card list for shuffeling
        addCard(cardOne, cardTwo);
        addCard(cardTwo, cardOne);
      }
    }

    H5P.shuffleArray(cards);

    self.attach = function($container){
      self.$wrapper = $container.addClass('h5p-image-pair').html('');
      var $list = $('<ul />');
      for (var i = 0; i < cards.length; i++) {
        cards[i].appendTo($list);
      }

      if($list.children().length){
        $list.appendTo($container);
        $feedback = $('<div class="h5p-feedback">' + parameters.l10n.feedback + '</div>').appendTo($container);

        // Add status bar
        var $status = $('<dl class="h5p-status">' +
                        '<dt>' + parameters.l10n.timeSpent + '</dt>' +
                        '<dd class="h5p-time-spent">0:00</dd>' +
                        '<dt>' + parameters.l10n.cardTurns + '</dt>' +
                        '<dd class="h5p-card-turns">0</dd>' +
                        '</dl>').appendTo($container);

        popup = new ImagePair.Popup($container,parameters.l10n);

        $container.click(function () {
          popup.close();
        });
      }

    }


  };

  var getContrast = function (color) {
    return 255 / ((parseInt(color.substr(1, 2), 16) * 299 +
                   parseInt(color.substr(3, 2), 16) * 587 +
                   parseInt(color.substr(5, 2), 16) * 144) / 1000);

  };
  return ImagePair;
})(H5P.EventDispatcher, H5P.jQuery);
