import * as line from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import {
    validURL, checkAndGetCurrentUser, fetchUrlTitle
} from "./helper";
import {
    createConnection, ConnectionOptions, getRepository
} from "typeorm";
import {User} from "./entity/User";
import {Link} from "./entity/Link";
import "reflect-metadata";
import {linkFlexMessage} from "./message";
import {getRedirectToReadUrl} from "./controller/GetRedirectToReadUrl";

dotenv.config();

// LINE Bot
const config: line.Config =  {
    channelAccessToken: process.env.channelAccessToken,
    channelSecret: process.env.channelSecret,
};

const client = new line.Client(<line.ClientConfig>config);


// TypeORM
const connectionConfig = {
    type: process.env.DB_CONNECTION,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Link],
    synchronize: true
};


const connection = createConnection(<ConnectionOptions>connectionConfig);

connection.then(async connection => {

    const app = express();

    app.post('/lineBotWebhook', line.middleware(<line.MiddlewareConfig>config), (req, res) => {
        Promise
            .all(req.body.events.map(
                function(event: line.WebhookEvent) {
                    return handleEvent(event, req.hostname);
                }
            ))
            .then((result) => res.json(result))
            .catch((err) => {
            console.error(err);
            res.status(500).end();
            });
    });


    app.get('/readUrl', getRedirectToReadUrl);



    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });


}).catch(error => console.log(error));


// LINE Bot Webhook Event
async function handleEvent(event: line.WebhookEvent, hostname: string) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }


    let currentUser = await checkAndGetCurrentUser(<string>event.source.userId);

    console.log(`Received message: ${event.message.text}`);
    
    event.message.text = event.message.text.trim();

    // save url
    if (validURL(event.message.text)) {
        let title = await fetchUrlTitle(event.message.text);

        let newLink = new Link();
        newLink.user = currentUser;
        newLink.url = event.message.text;
        newLink.isRead = false;
        newLink.linkTitle = title;
        await getRepository(Link).save(newLink);

        let message: line.TextMessage = {
            type: "text",
            text: `To Read URL saved: ${event.message.text}`
        };
        return client.replyMessage(event.replyToken, message);
    }

    else if (event.message.text === "all"){
        let links = await getRepository(Link).find({
            where: {
                user: currentUser
            }
        });

        if (links.length > 0){
            let flex: line.FlexMessage = <line.FlexMessage>linkFlexMessage(links, hostname);
            return client.replyMessage(event.replyToken, flex);
        }
        else {
            return client.replyMessage(event.replyToken, {type: "text", text: "No ToRead links"});
        }
    }

    else if (event.message.text === "list"){
        let links = await getRepository(Link).find({
            where: {
                user: currentUser, isRead: false
            }
        });

        if (links.length > 0){
            let flex: line.FlexMessage = <line.FlexMessage>linkFlexMessage(links, hostname);
            return client.replyMessage(event.replyToken, flex);
        }
        else {
            return client.replyMessage(event.replyToken, {type: "text", text: "No ToRead links"});
        }
    }

    else if (event.message.text === "one"){
        let links = await getRepository(Link).find({
            where: {
                user: currentUser, isRead: false
            }
        });

        if (links.length > 0){
            let randomLinkIndex = Math.floor(Math.random() * links.length);
            let flex: line.FlexMessage = <line.FlexMessage>linkFlexMessage([links[randomLinkIndex]], hostname);
            return client.replyMessage(event.replyToken, flex);
        }
        else {
            return client.replyMessage(event.replyToken, {type: "text", text: "No ToRead links"});
        }
    }
}
