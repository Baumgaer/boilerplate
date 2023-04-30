import "reflect-metadata";
import BaseServer from "~server/lib/BaseServer";

class Webserver extends BaseServer { }

const webServer = new Webserver();
webServer.start();
