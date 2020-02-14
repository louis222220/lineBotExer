import {Link} from "./entity/Link";


export function linkFlexMessage(links: Link[], hostname: string) {
    return {
        type: "flex",
        altText: "this is a flex message",
        contents: {
            type: "bubble",
            body: {
                type: "box",
                layout: "vertical",
                contents:
                    linksToButtons(links, hostname)
            }
        }
    }
}

function linksToButtons(links: Link[], hostname: string) {
    return links.map(
        function(link) {
            return linkToButton(link, hostname);
        }
    );
}

function linkToButton(link: Link, hostname: string) {
    return {
        type: "button",
        style: "link",
        action: {
            type: "uri",
            label: link.linkTitle,
            uri: `https://${hostname}/readUrl?linkId=` +  link.id
        }
    };
}