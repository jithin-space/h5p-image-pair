H5P.ImagePair = (function(EventDispatcher, $ , UI) {



  function ImagePair(parameters,id){


    var self = this;
    EventDispatcher.call(self);
    var cards = [],mates = [];
    var clicked,pairedCount = 0;



    var addCard = function(card,mate){

      card.on('selected',function(){

        if(clicked == undefined){
          card.setSelected();
        }
        else if(clicked == card){
          card.$card.toggleClass('item-selected');
        }
        else{
          clicked.removeSelected();
          card.setSelected();

        }

        // card.setSelected();
        // if (clicked !== undefined ) {
        //
        //       clicked.removeSelected();
        //
        //
        // }
        // if(clicked != card){
        //     card.setSelected();
        // }

        clicked = card;


      });

      mate.on('selected',function(){

        if(clicked !== undefined){
          // should pair;
          mate.trigger('checkPair', clicked);
          mate.pair(clicked);
          mate.transform();
          clicked.disable();
          clicked = undefined;
          pairedCount++;
        }

        if (pairedCount == cards.length) {

           self.showCheckButton();
        }


      });


      mate.on('unpair', function(){
        pairedCount--;
        mate.pairingStatus = undefined;
        // prepare buttons
        if(self.$footerStatus == true){
          self.$footer.empty();
        }
      });

      mate.on('checkPair', function(pair){
        if (pair.data == card) {
          mate.pairingStatus = true;
        } else {
          mate.pairingStatus = false;
        }
      });

      mate.on('attachPair', function(){

        mate.$top.empty();
        mate.pair(card);
        mate.setSolved();

      });

      cards.push(card);
      mates.push(mate);

    };


    self.showCheckButton = function() {

      self.$footerStatus = true;

      self.$checkButton = createButton(self.displayResult,'fa-check',parameters.l10n.checkAnswer);

      self.$checkButton.appendTo(self.$footer);
    }


    var prepareResult = function(){
      var score = 0;
      for (var i = 0; i < mates.length; i++) {
        if (mates[i].pairingStatus == true) {
          mates[i].setCorrect();
          score++;
        } else if (mates[i].pairingStatus == false) {
          mates[i].setIncorrect();
        }
      }

      return score;
    }

    var createButton = function (callback,icon,name){

      return UI.createButton({
        title: 'Submit',
        click: function(event) {
          callback();
        },
        html: '<span><i class="fa '+icon+'" aria-hidden="true"></i></span>&nbsp;' + name
      });

    }

    self.showSolution = function() {

      self.$showSolutionButton.remove();
      for (var i = 0; i < mates.length; i++) {
        if (mates[i].pairingStatus == false) {
          mates[i].trigger('attachPair');
          mates[i].pairingStatus = true;
        }
      }
    }

    self.retry = function() {

      // if (self.$showSolutionButton) {
      //   self.$showSolutionButton.remove();
      // }
      // self.$retryButton.remove();
      self.$footer.empty();
      self.$footerStatus = false;
      for (var i = 0; i < mates.length; i++) {
        mates[i].detach();
        cards[i].$card.removeClass('disabled');
      }
      pairedCount = 0;

    }


    self.displayResult = function(){

      var result = prepareResult();

      self.$checkButton.remove();

      self.$progressBar = UI.createScoreBar(cards.length, 'scoreBarLabel');
      self.$progressBar.setScore(result);



        self.$feedbacks =  $('<div class="feedbackContainer" />');
        self.$progressBar.appendTo(self.$feedbacks);
        self.$feedbacks.appendTo(self.$footer);




      self.$retryButton = createButton(self.retry,'fa-check','Retry');

      if (result != cards.length) {

        self.$showSolutionButton = createButton(self.showSolution,'fa-check','Show Solution');
        self.$showSolutionButton.appendTo(self.$footer);
      }

      self.$retryButton.appendTo(self.$footer);


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

    self.attach = function($container){

      self.$wrapper = $container.addClass('h5p-image-pair').html('');
      $('<div class="h5p-task-description">' + parameters.taskDescription + '</div>').appendTo($container);
      var $gameContainer = $('<div class="gameContainer"/>');
      var $cardList = $('<ul class="cardContainer" />');
      var $mateList = $('<ul class="mateContainer"/>');
      self.$footer = $('<div class="footerContainer"/>');

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
            temp = $(this).data('card');
            cards[temp].$card.addClass('reducer');
          },
          drag: function() {

          },
          stop: function() {
            temp = $(this).data('card');
            cards[temp].$card.removeClass('reducer');
            $mateList.find('.reducer').removeClass('reducer');
          }
        });

      $mateList.find('.droppable').droppable({
        tolerance: 'intersect',
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


  ImagePair.prototype = Object.create(EventDispatcher.prototype);
  ImagePair.prototype.constructor = ImagePair;

  return ImagePair;

})(H5P.EventDispatcher, H5P.jQuery,H5P.JoubelUI);
