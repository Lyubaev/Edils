var log = function() {
  try {
    console.info.apply(console, arguments);
  } catch( e ) {
    try {
      opera.postError.apply(opera,  arguments);
    } catch( e ) {
      console.info( Array.prototype.join.call(arguments, " ") );
    }
  }
};