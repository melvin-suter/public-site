(() => {


    /* Jump Down */
    $(".jump-down").on('click',() => {
      $(".layout-outter").animate({ scrollTop: $(document).height() }, 300);
    });


    /* Toast Handler */


    $(".toast-handler").on('click',".toast-closer", (ev) => {
        var toast = $(ev.target).closest('.toast');
        toast.fadeOut(200);
        setTimeout(() => {
            toast.remove();
        },1000);
    });

    const createToast = (message,level = "info") => {
        var svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
      </svg>`;
        var element = $(".toast-handler").append(`<div class="toast toast-${level}">${message} <div class="toast-closer">${svg}</div></div>`);

        setTimeout(() => {
            element.fadeOut(200);
            setTimeout(() => {
                element.remove();
            },1000);
        },3000);
    };




    /* Search in Nav */
    $(".nav-search-input").on('keyup', (ev) => {
      if(ev.keyCode == 13){
        window.location.href="/search#" + $(".nav-search-input").val();
      }
    });
    
    $(".nav-search-input").val(window.location.hash.substr(1));



    /* Tags Color */

    const getRandomColor = (input) => {

      // Generate "Hash" number from string
      var hash = 0
      if (input.length === 0) return hash;
      for (var i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }

      // Generate HSL color from hash number
      var hue = (hash >> 8) & 360;
      var saturation = ( (hash >> 8) & 20 ) + 50;
      var light = ( (hash >> 8) & 20 ) + 70;

      return `hsl(${hue}, ${saturation}%, ${light}%)`;
    } ;

    $(".tag").each((index,element) => {
      var randomColor = getRandomColor($(element).html());
      $(element).css("background-color",randomColor)
    });


    /* Code Copy Button */

    $("pre").each((index,element) => {
      $(element).append("<button class=\"copy-button\">Copy</button>");
    });

    $("pre").on('click',".copy-button", (ev) => {
      let code = $(ev.target).closest('pre').find("code");
      let codeText = code.text();

      var $temp = $("<textarea>");
      $("body").append($temp);
      $temp.val(codeText).select();
      document.execCommand("copy");
      $temp.remove();

      createToast("Code copied to clipboard" , "success");
    });


    

})();