module.exports = function(eleventyConfig) {
  
    // Copy `img/` to `_site/img`
    eleventyConfig.addPassthroughCopy("assets");
  

    const { DateTime } = require("luxon");

    eleventyConfig.addFilter("postDate", (dateObj) => {
        let date = DateTime.fromJSDate(dateObj);

        return date.year + "-" + date.month + "-" + date.day;
    });
};