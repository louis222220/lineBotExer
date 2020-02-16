import {Request, Response} from "express";
import {getRepository} from "typeorm";
import {Link} from "../entity/Link";


export async function getRedirectToReadUrl(req: Request, res: Response) {
    if (req.query.hasOwnProperty('linkId')) {
        let link = await getRepository(Link).findOne(req.query.linkId);
        if (link) {
            link.isRead = true;
            getRepository(Link).save(link);

            res.redirect(link.url);
        }
    }
    else {
        res.send('no link');
    }
}
