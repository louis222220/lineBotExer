import * as request from "request-promise";
import * as cheerio from "cheerio";
import {getRepository} from "typeorm";
import {User} from "./entity/User";


export function validURL(str: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}


export async function checkAndGetCurrentUser(lineUserId: string): Promise<User> {
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


export async function fetchUrlTitle(url: string) {
  let result = await request.get({ uri: url });

  let $ = cheerio.load(result);
  let title = $("head > title").text().trim();
  return title;
}
