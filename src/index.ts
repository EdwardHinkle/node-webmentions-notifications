import * as request from 'request';
import * as cron from 'cron';
import * as moment from 'moment';
import * as _ from 'lodash';

var open = require('open');
var config = require('../config.json');
const NotificationCenter = require('node-notifier').NotificationCenter;
var notifier = new NotificationCenter();
var itemsToNotify = [];
var lastDateChecked = moment().subtract(2, "hours");

new cron.CronJob('0 0,30 * * * *', function() {
	getWebMentions();
}, null, true, 'America/New_York');

getWebMentions();

function getWebMentions() {
    console.log("Checking for mentions");
    request("https://webmention.io/api/mentions?token=" + config.webmention.token, {}, (err, data) => {
        if (err != undefined) {
            console.log("Error");
            console.log(err);
        }
        
        var webmentions = {};
        var webmentionData = JSON.parse(data.body);

        webmentionData = _.filter(webmentionData.links, (mention: any) => {
            if (lastDateChecked != undefined && mention.data.published != undefined) {
                return lastDateChecked.diff(mention.data.published, 'minutes') < 0;
            }
        });

        itemsToNotify = _.merge(itemsToNotify, webmentionData);
        lastDateChecked = moment();

        if (itemsToNotify.length > 0) {
            var mentionToSend = itemsToNotify.shift();

            notifier.notify({
                title: "EddieHinkle.com received a " + mentionToSend.activity.type,
                icon: mentionToSend.data.author.photo,
                message: mentionToSend.activity.sentence,
                open: mentionToSend.source,
                closeLabel: "Close",
                actions: "View"
            },
            function(err, response, metadata){
                if (metadata.activationValue == "View") {
                    open(mentionToSend.source);
                }
            });
        }

        // Promise.each(webmentionData.links, (mention) => {
        //     var targetPage = mention.target.split("http://eddiehinkle.com").pop().split("?")[0];

        //     if (webmentions[targetPage] === undefined) {
        //         webmentions[targetPage] = { likes: [], replies: [], reactions: [], mentions: [] }
        //     }

        //     switch(mention.activity.type) {
        //         case 'like':
        //             // Check if item exists
        //             addOrCreateEmojiArray("+1", webmentions[targetPage].reactions, mention);
        //             break;
        //         case 'link':
        //             if (tryAddEmojiReaction(webmentions[targetPage].reactions, mention) == false) {
        //                 addReplaceOrIgnoreWebMention(webmentions[targetPage].mentions, mention);
        //             }
        //             break;
        //         case 'reply':
        //             if (tryAddEmojiReaction(webmentions[targetPage].reactions, mention) == false) {
        //                 addReplaceOrIgnoreWebMention(webmentions[targetPage].replies, mention);
        //             }
        //             break;
        //     }
        // }).then(() => {
        //     var json = JSON.stringify(webmentions);
        //     fs.writeFile(__dirname + '/../_source/_data/webmentions.json', json, 'utf8', function(error){
        //         if (error != undefined) {
        //             console.error("OOPS!", error);
        //         }
        //         console.log("Webmentions Retrieved");
        //     }); 
        // });
    });
}

// function tryAddEmojiReaction(reactionsArray, mention) {
//     var emoji = getEmojiReaction(mention)
//     if (emoji == undefined) {
//         return false;
//     } else {
//         addOrCreateEmojiArray(emoji, reactionsArray, mention);
//         return true;
//     }
// }

// function addOrCreateEmojiArray(emoji, reactionsArray, mention) {
//     var reactionIndex = _.findIndex(reactionsArray, (object) => {
//         return object.code == emoji;
//     });
    
//     if (reactionIndex == -1) {
//         reactionsArray.push({
//             code: emoji,
//             display: "" + emojiData.find_by_short_name(emoji),
//             content: []
//         });
//         reactionIndex = reactionsArray.length-1;
//     }
//     addReplaceOrIgnoreWebMention(reactionsArray[reactionIndex].content, mention);
// }

// function getEmojiReaction(mention) {
//     var emojiFound = undefined;
//     var stripContent = mention.data.content.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "");
    
//     emojiData.scan(stripContent).forEach(
//         function(ec) {
//             if (stripContent.length < 5) {
//                 emojiFound = ec.short_name;
//             }
//         }
//     );

//     return emojiFound;

// }

// function addReplaceOrIgnoreWebMention(current_array, mention) {
//     // Find out if item exists in array
//     var replaceIndex = _.findIndex(current_array, (object) => {
//         return object.data.url == mention.data.url;
//     })

//     if (replaceIndex == -1) {
//         // If item doesn't exist, add it
//         current_array.push(mention);
//     } else {
//         // If item does exist, only add it if it has a date and the date is older than the new item
//         if (current_array[replaceIndex].data.published_ts != undefined && current_array[replaceIndex].data.published_ts < mention.data.published_ts) {
//             current_array[replaceIndex] = mention;
//         }
//     }
// }