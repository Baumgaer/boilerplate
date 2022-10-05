import { createHash, randomBytes } from "crypto";
import { createServer } from "http";
import compression from "compression";
import csurf from "csurf";
import express, { json, urlencoded /*static as expressStatic */, Router } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import HttpErrors from "http-errors";
import ms from "ms";
import normalizeUrl from "normalize-url";
import Train from "~server/lib/Train";
import { middleware as i18nMiddleware } from "~server/utils/language";
import type { Request, Response, NextFunction, Express } from "express";
import type { Server } from "http";
import type { HttpMethods } from "~server/@types/http";
import type BaseRoute from "~server/lib/BaseRoute";


type cspSrcNames = "default" | "font" | "frame" | "img" | "media" | "manifest" | "object" | "script" | "style" | "connect"
type cspSrc = `${cspSrcNames}Src` | "frameAncestors" | "baseUri" | "formAction"
type SetupCspReturn = Partial<Record<cspSrc, string[]>>

interface options {
    maximumRequestBodySize?: string;
    useQueryStringLibrary?: boolean;
    enableETag?: boolean;
    sessionSecret?: string;
    sessionMaxAge?: string;
    secure?: boolean;
    domain?: string;
    sessionName?: string;
    host?: string,
    port?: number
}

export default abstract class BaseServer {

    protected readonly app: Express = express();

    protected readonly server: Server = createServer(this.app);

    private readonly options: options;

    private setupFinished: boolean = false;

    public constructor(options: options) {
        this.options = options;
        this.setup();
    }

    public async start() {
        await this.awaitSetupFinished();
        const { host, port } = this.options;
        this.server.listen(port, host, undefined, () => {
            console.info(`Server is running and reachable on http://${host}:${port}`);
            process.send?.('ready');
        });
    }

    public async stop() {
        await this.awaitSetupFinished();
        this.server.close();
        await Promise.all([
            this.tearDownDatabase(),
            this.tearDownEmailConnection()
        ]);
        process.exit();
    }

    protected async setupGeneral() {
        const { enableETag, maximumRequestBodySize, useQueryStringLibrary } = this.options;

        this.app.use(json({ limit: maximumRequestBodySize }));
        this.app.use(urlencoded({ extended: Boolean(useQueryStringLibrary), limit: maximumRequestBodySize }));
        this.app.use(compression());

        if (enableETag) this.app.enable('etag');
    }

    ///////////////////////////////
    // START ASYNC AREA

    protected setupTemplateEngine() {
        // Nothing to do here
    }

    protected setupLocalization() {
        this.app.use(i18nMiddleware);
    }

    protected setupDatabase() {
        // Nothing to do here
    }

    protected tearDownDatabase() {
        // Nothing to do here
    }

    protected setupEmailConnection() {
        // Nothing to do here
    }

    protected tearDownEmailConnection() {
        // Nothing to do here
    }

    // END ASYNC AREA
    ///////////////////////////////

    protected async setupSession() {
        const { sessionMaxAge, secure, domain, sessionName, sessionSecret } = this.options;
        const urlParts = new URL(normalizeUrl(`${domain}`, { forceHttps: secure, forceHttp: !secure }));

        this.app.use(expressSession({
            secret: createHash("sha512").update(sessionSecret ?? randomBytes(256)).digest("base64"),
            cookie: {
                httpOnly: true,
                domain: urlParts.hostname === "localhost" || process.env.NODE_ENV === "development" ? undefined : urlParts.hostname,
                secure,
                maxAge: ms(`${sessionMaxAge}`)
            },
            resave: true,
            saveUninitialized: false,
            name: sessionName,
            rolling: true,
            unset: "destroy"
        }));
    }

    protected async setupBasicSecurity() {
        this.app.use(hpp());
        this.app.use(csurf());
        this.app.use(this.setupHelmet.bind(this));
    }

    protected setupCsp(_cspNonce: string): SetupCspReturn {
        return {};
    }

    protected routeFilter(_route: typeof BaseRoute): boolean {
        return true;
    }

    private async setupRoutes() {
        const context = require.context("~server/routes/", true, /.+\.ts/, "sync");
        const router = Router({ caseSensitive: true, mergeParams: true });

        context.keys().forEach((key) => {
            const routeClass: typeof BaseRoute = context(key).default;
            if (!routeClass.serverClasses.includes(this.constructor as typeof BaseServer) || !this.routeFilter(routeClass)) return;

            const route = new routeClass(this);
            for (const routeObj of route.routes) {
                const routerMethod = routeObj.method.toLowerCase() as Lowercase<HttpMethods>;
                router[routerMethod](routeObj.uri, (req, res, next) => {
                    const descriptor = routeObj.descriptor;
                    const accessCheck = routeObj.accessCheck;
                    const train = new Train(req, res, next);
                    route.handle(train, { descriptor, accessCheck });
                });
            }

            this.app.use(routeClass.namespace, router);
        });

        this.app.use("*", (request, _response, next) => {
            console.info(`${request.ip} ${request.method} NOT FOUND ${request.originalUrl}`);
            const httpError = new HttpErrors.NotFound();
            next(httpError);
        });
    }

    private setupHelmet(request: Request, response: Response, next: NextFunction) {
        const nonce = createHash("sha512").update(randomBytes(32)).digest("base64");
        response.locals.cspNonce = nonce;

        const cspNonce = `'nonce-${nonce}'`;
        const all = ["'self'", cspNonce];
        const directives = this.setupCsp(cspNonce);

        helmet({
            hidePoweredBy: true,
            contentSecurityPolicy: {
                directives: Object.assign({
                    defaultSrc: all.slice()
                }, directives)
            }
        })(request, response, next);
    }

    private async setup() {
        try {
            console.info("1. Basic middlewares");
            await this.setupGeneral();
            console.info("2. Session");
            await this.setupSession();
            console.info("3. Basic security");
            await this.setupBasicSecurity();
            console.info("4. Localization");
            await this.setupLocalization();
            console.info("5. Template engine");
            await this.setupTemplateEngine();
            console.info("6. Database and mail server connections");
            await Promise.all([this.setupDatabase(), this.setupEmailConnection()]);
            console.info("7. Routes");
            await this.setupRoutes();
            console.info("8. Setup finished");
        } catch (error) {
            console.error(`Error while setting up server: ${error}`);
        }
        this.setupFinished = true;
    }

    private awaitSetupFinished() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!this.setupFinished) return;
                clearInterval(interval);
                resolve(true);
            });
        });
    }
}
