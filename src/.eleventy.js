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

        if(content.length > 100) {
            content.split(" ").forEach( (item) => {
                if(length + item.length > 100){
                    return;
                }

                parts.push(item);
                length += item.length;
            });

            parts.push("...");

            return parts.join(" ");
        }
        
        return content;
    });



};


