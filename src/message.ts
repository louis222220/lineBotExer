import {Link} from "./entity/Link";


export function linkFlexMessage(links: Link[]) {
    return {
        type: "flex",
        altText: "this is a flex message",
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents:
                    linksToButtons(links)
            }
        }
    }
}

function linksToButtons(links: Link[]) {
    return links.map(link => linkToButton(link));
}

function linkToButton(link: Link) {
    return {
        type: "button",
        style: "link",
        action: {
            type: "uri",
            label: link.linkTitle,
            uri: link.url
        }
    };
}