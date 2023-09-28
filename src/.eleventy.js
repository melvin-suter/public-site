module.exports = function(eleventyConfig) {
  
    // Copy `img/` to `_site/img`
    eleventyConfig.addPassthroughCopy("assets");
  

    const { DateTime } = require("luxon");

    eleventyConfig.addFilter("postDate", (dateObj) => {
        let date = DateTime.fromJSDate(dateObj);

        return date.year + "-" + date.month + "-" + date.day;
    });

    eleventyConfig.addFilter("trimShort", (content) => {

        let length = 0;
        let parts = [];

        let newContent = content.replace( /(<([^>]+)>)/ig, '');

        if(newContent.length > 100) {
            newContent.split(" ").forEach( (item) => {
                
                if(length + item.length > 100){
                    return;
                }

                parts.push(item);
                length += item.length;
        

    
            });

            parts.push("...");

            return parts.join(" ");
        }
        
        return newContent;
    });

    eleventyConfig.addFilter("removeHTML", (str) => {

        str = str.toString();
            
        // Regular expression to identify HTML tags in
        // the input string. Replacing the identified
        // HTML tag with a null string.
        return str.replace( /(<([^>]+)>)/ig, '');
    });


};


