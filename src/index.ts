import * as line from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import * as helper from "./helper";
import {
    createConnection, Connection, ConnectionOptions,
    getRepository, getManager, getConnection
} from "typeorm";
import {User} from "./entity/User";
import {Link} from "./entity/Link";
import "reflect-metadata";
import {linkFlexMessage} from "./message";
import * as request from "request-promise";
import * as cheerio from "cheerio";
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

    // save url
    if (helper.validURL(event.message.text)) {
        let result = await request.get({ uri: event.message.text });

        let $ = cheerio.load(result);
        let title = $("head > title").text().trim();


        let newLink = new Link();

        newLink.user = currentUser;
        newLink.url = event.message.text;
        newLink.isRead = false;
        newLink.linkTitle = title;
        getRepository(Link).save(newLink).then;

        let message: line.TextMessage = {
            type: "text",
            text: `It's an URL: ${event.message.text}`
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


async function checkAndGetCurrentUser(lineUserId: string): Promise<User> {
    let userRepository = getRepository(User);

    let foundUser = await userRepository.findOne({
        where: {lineUserId: lineUserId}
    });

    if (! foundUser){
        let newUser = new User();
        newUser.lineUserId = lineUserId;
        await userRepository.save(newUser);
        return newUser;
    }
    else {
        return foundUser;
    }
}
