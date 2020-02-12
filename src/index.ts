import * as line from "@line/bot-sdk";
import express from "express";
import dotenv from "dotenv";
import * as helper from "./helper";


dotenv.config();

const config: line.Config =  {
    channelAccessToken: process.env.channelAccessToken,
    channelSecret: process.env.channelSecret,
};

console.log(config);

const client = new line.Client(<line.ClientConfig>config);

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


function handleEvent(event: line.WebhookEvent) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ignore non-text-message event
        return Promise.resolve(null);
    }

    console.log(`Received message: ${event.message.text}`);

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


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});