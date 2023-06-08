import CommonUser from "~common/models/User";
import { Model } from "~server/utils/decorators";

@Model()
export default class User extends CommonUser { }
