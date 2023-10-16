const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

const markdownIt = require('markdown-it')
const markdownItAttrs = require('markdown-it-attrs')


module.exports = function(eleventyConfig) {


    // Allow classes in markdown
    const markdownItOptions = {
        html: true,
        breaks: true,
        linkify: true
    }
    
    const markdownLib = markdownIt(markdownItOptions).use(markdownItAttrs)
    eleventyConfig.setLibrary('md', markdownLib)
  
    // Copy `img/` to `_site/img`
    eleventyConfig.addPassthroughCopy("assets");
  
    eleventyConfig.addPlugin(syntaxHighlight);

    const { DateTime } = require("luxon");

    eleventyConfig.addFilter("postDate", (dateObj) => {
        let date = DateTime.fromJSDate(dateObj);

        return date.year + "-" + date.month + "-" + date.day;
    });

    eleventyConfig.addFilter("dirname", (path) => {
        return path.split("/").slice(0,-1).join("/");
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


    // Search Indexer
    eleventyConfig.addCollection("searchIndex", function(collection) {

        var fullCollection = collection.getAll().map(hit => {
            return hit;
        })

        return fullCollection;
    });

    eleventyConfig.addFilter('dumpSafe', (value) => {
        const postData = value.map((post) => {
          return {
            title: post.data.title,
            content: post.content,
            url: post.url
            /*
            date: post.date,
            url: post.url,
            data: {
              title: post.data.title,
              excerpt: post.data.excerpt,
            },*/
          };
        });
      
        return JSON.stringify({
            searchData: postData,
        }, null, 2);
    });

};


