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

    });
}
