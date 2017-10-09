(function(ImagePair, EventDispatcher, $) {


  ImagePair.Card = function(image, id, description) {

    var self = this;
    EventDispatcher.call(self);
    var path = H5P.getPath(image.path, id);

    self.getImage = function() {
      return self.$card.find('img').clone();
    };

    self.setCorrect = function(){

      self.$top.children('.pairing-mark').addClass('pairing-correct-mark');
      self.$top.children('.h5p-popup-image').addClass('item-correct');

    }

    self.setIncorrect = function(){
      self.$top.children('.pairing-mark').addClass('pairing-incorrect-mark');
      self.$top.children('.h5p-popup-image').addClass('item-incorrect');
    }

    self.setSolved = function(){
      self.$top.children('.pairing-mark').addClass('pairing-solved-mark');
      self.$top.children('.h5p-popup-image').addClass('item-solved');
    }


    self.setSelected = function() {
      self.$card.addClass('item-selected');
    }

    self.removeSelected = function(){
      self.$card.removeClass('item-selected');
    }

    self.transform = function(){
      // remove droppable property
      self.$card.removeClass('item-selected').droppable("option", "disabled", true);
    };

    self.disable = function(){
      self.$card.removeClass('item-selected').addClass('disabled');
    };

    self.pair = function(pair){

      self.srcImage = (self.srcImage)? self.srcImage:self.getImage();
      self.$top = self.$card;
      self.$top.html('').toggleClass('h5p-pair-images',true);
      $('<span class="pairing-mark"></span>').appendTo(self.$top);
      $('<div class="h5p-popup-image front"></div>').append(pair.getImage()).appendTo(self.$top);
      $('<div class="h5p-popup-image"></div>').append(self.srcImage).appendTo(self.$top);
      self.$card.replaceWith(self.$top);

      self.$top.children('.h5p-popup-image').on('click', function(){
        pair.$card.removeClass('disabled');
        self.detach();
       });

      self.$top.children('.h5p-popup-image').hover(function(){
        self.$top.removeClass('item-hover');
        $(this).addClass('item-hover');
      }, function(){
        $(this).removeClass('item-hover');
      });
    }

   self.detach = function(){
     self.$card.removeClass('h5p-pair-images').empty();
     $('<div class="image-container"></div>').append(self.srcImage).appendTo(self.$card);
     self.$card.removeClass('item-selected').droppable( "option", "disabled", false);
     self.trigger('unpair');
   };


    self.appendTo = function($container){

      self.$card = $('<li class="item">'+
      '<div class="image-container">'+
        '<img src="'+ path +'"/>'+
      '</div>'+
      '</li>').appendTo($container);

      self.$card.click(function(){
        self.trigger('selected');
      }).end();

      self.$card.hover(function(){
        $(this).addClass('item-hover');
      }, function(){
        $(this).removeClass('item-hover');
      });


    };

  };

  ImagePair.Card.prototype = Object.create(EventDispatcher.prototype);
  ImagePair.Card.prototype.constructor = ImagePair.Card;

  ImagePair.Card.isValid = function(params) {
    return (params !== undefined &&
      params.image !== undefined &&
      params.image.path !== undefined);
  };

  ImagePair.Card.hasTwoImages = function(params) {
    return (params !== undefined &&
      params.match !== undefined &&
      params.match.path !== undefined);
  };

})(H5P.ImagePair, H5P.EventDispatcher, H5P.jQuery);
