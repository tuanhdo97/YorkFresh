$(document).ready(function() {
    //Preloader
    preloaderFadeOutTime = 500;
    function hidePreloader() {
    var preloader = $('.spinner-wrapper');
    preloader.fadeOut(preloaderFadeOutTime);
    }
    hidePreloader();
    });

$(document).ready(function(){
    $("a").on('click', function(event) {
      if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
          scrollTop: $(hash).offset().top
        }, 2000, function(){

          window.location.hash = hash;
        });
      }
    });
  });
  // const checkoutButton = document.querySelector(".checkoutButton");
  // checkoutButton.addEventListener("click", () => {
  //   console.log("checkout");
  // })
