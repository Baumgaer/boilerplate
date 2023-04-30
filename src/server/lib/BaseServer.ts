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
import { DataSource } from "typeorm";
import Configurator from "~env/lib/Configurator";
import { getModelNameToModelMap } from "~env/utils/schema";
import Logger from "~server/lib/Logger";
import Train from "~server/lib/Train";
import { middleware as i18nMiddleware } from "~server/utils/language";
import type { Request, Response, NextFunction, Express } from "express";
import type { Server } from "http";
import type { DataSourceOptions } from "typeorm";
import type { SetupCspReturn } from "~server/@types/BaseServer";
import type { HttpMethods } from "~server/@types/http";
import type BaseRoute from "~server/lib/BaseRoute";

const configurator = new Configurator();
const logger = new Logger("server");

export default abstract class BaseServer {

    protected readonly app: Express = express();

    protected readonly server: Server = createServer(this.app);

    private setupFinished: boolean = false;

    private dataSource?: DataSource;

    public constructor() {
        this.setup();
    }

    public async start() {
        await this.awaitSetupFinished();
        const { host, port } = configurator.get("server.engine");
        this.server.listen(port, host, undefined, () => {
            logger.info(`Server is running and reachable on http://${host}:${port}`);
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
        const { enableETag, maximumRequestBodySize, useQueryStringLibrary } = configurator.get("server.engine");

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

    protected async setupDatabase() {
        // Wait for all model schemas constructed to ensure all models have correct relations
        const modelClasses = Object.values(getModelNameToModelMap());
        await Promise.all(modelClasses.map((modelClass) => modelClass.getSchema()?.awaitConstruction()));

        this.dataSource = await new DataSource(Object.assign(configurator.get("databases.server") as DataSourceOptions, {
            entities: modelClasses
        })).initialize();
    }

    protected tearDownDatabase() {
        return this.dataSource?.driver?.disconnect();
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
        const { maxAge, secure, domain, name, sessionSecret, secretAlgo } = configurator.get("server.session");
        const urlParts = new URL(normalizeUrl(`${domain}`, { forceHttps: secure, forceHttp: !secure }));

        this.app.use(expressSession({
            secret: createHash(secretAlgo).update(sessionSecret ?? randomBytes(256)).digest("base64"),
            cookie: {
                httpOnly: true,
                domain: urlParts.hostname === "localhost" || process.env.NODE_ENV === "development" ? undefined : urlParts.hostname,
                secure,
                maxAge: ms(`${maxAge}`)
            },
            resave: true,
            saveUninitialized: false,
            name: name,
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

    private async setupRoutes() {
        const context = require.context("~server/routes/", true, /.+\.ts/, "sync");
        const router = Router({ caseSensitive: true, mergeParams: true });

        context.keys().forEach((key) => {
            const routeClass: typeof BaseRoute = context(key).default;

            const route = new routeClass(this);
            for (const routeObj of route.getRoutes()) {
                const routerMethod = routeObj.httpMethod.toLowerCase() as Lowercase<HttpMethods>;
                router[routerMethod](routeObj.name, (req, res, next) => {
                    const train = new Train(req, res, next);
                    route.handle(train, routeObj);
                });
            }

            this.app.use(routeClass.namespace, router);
        });

        this.app.use("*", (request, _response, next) => {
            logger.info(`${request.ip} ${request.method} NOT FOUND ${request.originalUrl}`);
            const httpError = new HttpErrors.NotFound();
            next(httpError);
        });
    }

    private setupHelmet(request: Request, response: Response, next: NextFunction) {
        const { includeSelf, length, nonceAlgo, hashes } = configurator.get("server.csp");
        const nonce = createHash(nonceAlgo).update(randomBytes(length)).digest("base64");
        response.locals.cspNonce = nonce;

        const cspNonce = `'nonce-${nonce}'`;
        const all = [];
        if (includeSelf) all.push("'self'");
        all.push(nonce);
        all.push(...hashes);
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
            logger.info("1. Basic middlewares");
            await this.setupGeneral();
            logger.info("2. Session");
            await this.setupSession();
            logger.info("3. Basic security");
            await this.setupBasicSecurity();
            logger.info("4. Localization");
            await this.setupLocalization();
            logger.info("5. Template engine");
            await this.setupTemplateEngine();
            logger.info("6. Database and mail server connections");
            await Promise.all([this.setupDatabase(), this.setupEmailConnection()]);
            logger.info("7. Routes");
            await this.setupRoutes();
            logger.info("8. Setup finished");
        } catch (error) {
            logger.error(`Error while setting up server!`, error);
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
