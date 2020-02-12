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
            .all(req.body.events.map(handleEvent))
            .then((result) => res.json(result))
            .catch((err) => {
            console.error(err);
            res.status(500).end();
            });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`listening on ${port}`);
    });


}).catch(error => console.log(error));






// LINE Bot Webhook Event
function handleEvent(event: line.WebhookEvent) {
    if (event.type === 'follow') {
        let newUser = new User();
        newUser.lineUserId = '' + event.source.userId;
        getRepository(User).save(newUser).then;

    }

    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }

    console.log(`Received message: ${event.message.text}`);

    // save url
    if (helper.validURL(event.message.text)) {


        let message: line.TextMessage = {
            type: "text",
            text: `It's an URL: ${event.message.text}`
        };
        return client.replyMessage(event.replyToken, message);
    }

    else if (event.message.text === "all"){
        return client.replyMessage(event.replyToken, {type: "text", text: "all"});
    }
    else if (event.message.text === "list"){
        return client.replyMessage(event.replyToken, {type: "text", text: "list"});
    }
    else if (event.message.text === "one"){
        return client.replyMessage(event.replyToken, {type: "text", text: "one"});
    }
    
}
