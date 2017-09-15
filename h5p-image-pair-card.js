(function(ImagePair, EventDispatcher, $) {

  /**
   * Controls all the operations for each card.
   *
   * @class H5P.ImagePair.Card
   * @extends H5P.EventDispatcher
   * @param {Object} image
   * @param {number} id
   * @param {string} [description]
   */
  ImagePair.Card = function(image, id, description) {
    /** @alias H5P.ImagePair.Card# */
    var self = this;
    // Initialize event inheritance
    EventDispatcher.call(self);

    var path = H5P.getPath(image.path, id);

    /**
     * Revert the card from incorrect state to default state
     */
    self.revertBack = function() {
      self.$card.removeClass('h5p-image-pair-item-incorrect');
      self.$card.find('.h5p-image-pair-mark').removeClass('h5p-image-pair-mark-incorrect');
    };

    /**
     * Remove the card from the active set of game cards
     */
    self.remove = function() {
      self.$card.addClass('h5p-image-pair-item-matched');
      self.$card.find('.h5p-image-pair-mark').addClass('h5p-image-pair-mark-matched');
      self.$card.find('.image-unmatched').replaceWith(self.$card.find('.image-matched').show());

    };

    /**
     * Reset card to natural state
     */
    self.reset = function() {
      self.$card.find('.h5p-image-pair-mark').removeClass('h5p-image-pair-mark-matched');
      self.$card[0].classList.remove('h5p-image-pair-item-matched', 'h5p-image-pair-item-selected');
      self.$card.find('.image-matched').removeClass('image-matched').addClass('image-unmatched');
    };

    /**
     * Get card description.
     *
     * @returns {string}
     */
    self.getDescription = function() {
      return description;
    };

    /**
     * Get image clone.
     *
     * @returns {H5P.jQuery}
     */
    self.getImage = function() {
      return self.$card.find('img').clone();
    };

    /**
     * Set a card to selected state
     */
    self.setSelected = function() {
      self.$card.addClass('h5p-image-pair-item-selected');
    }

    /**
     * Set a card to incorrect state
     */
    self.setIncorrect = function() {
      self.$card.removeClass('h5p-image-pair-item-selected').addClass('h5p-image-pair-item-incorrect');
      self.$card.find('.h5p-image-pair-mark').addClass('h5p-image-pair-mark-incorrect');
    }

    /**
     * Append card to the given container.
     *
     * @param {H5P.jQuery} $container
     */

    self.appendTo = function($container) {
      self.$card = $('<li class="h5p-image-pair-item " >' +
        '<span class="h5p-image-pair-mark"></span>' +
        '<div class="h5p-image-pair-card">' +
        '<div class="image-unmatched">' +
        '<img src="' + path + '" alt="' + description + '"/>' +
        '</div>' +
        '<div class="image-matched">' +
        '<img src="' + path + '" alt="' + description + '"/>' +
        '</div>' +
        '</div>' +
        '</li>').appendTo($container);
      self.$card.children('.h5p-image-pair-card')
        .children('.image-unmatched')
        .click(function() {
          self.trigger('selected');
        })
        .end();
    };


  };

  // Extends the event dispatcher
  ImagePair.Card.prototype = Object.create(EventDispatcher.prototype);
  ImagePair.Card.prototype.constructor = ImagePair.Card;

  /**
   * Check to see if the given object corresponds with the semantics for
   * a image game card.
   *
   * @param {object} params
   * @returns {boolean}
   */
  ImagePair.Card.isValid = function(params) {
    return (params !== undefined &&
      params.image !== undefined &&
      params.image.path !== undefined);
  };

  /**
   * Checks to see if the card parameters should create cards with different
   * images.
   *
   * @param {object} params
   * @returns {boolean}
   */
  ImagePair.Card.hasTwoImages = function(params) {
    return (params !== undefined &&
      params.match !== undefined &&
      params.match.path !== undefined);
  };

})(H5P.ImagePair, H5P.EventDispatcher, H5P.jQuery);
