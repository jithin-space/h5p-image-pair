// (function (ImagePair) {
//
//   /**
//    * Keeps track of the number of cards that has been turned
//    *
//    * @class H5P.ImagePair.Counter
//    * @param {H5P.jQuery} $container
//    */
//   ImagePair.Counter = function ($container) {
//     /** @alias H5P.ImagePair.Counter# */
//     var self = this;
//
//     var current = 0;
//
//     /**
//      * @private
//      */
//     var update = function () {
//       $container[0].innerText = current;
//     };
//
//     /**
//      * Increment the counter.
//      */
//     self.increment = function () {
//       current++;
//       update();
//     };
//
//     /**
//      * Revert counter back to its natural state
//      */
//     self.reset = function () {
//       current = 0;
//       update();
//     };
//   };
//
// })(H5P.ImagePair);
