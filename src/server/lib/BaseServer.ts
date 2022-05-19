import { createHash, randomBytes } from "crypto";
import { createServer } from "http";
import compression from "compression";
import csurf from "csurf";
import express, { json, urlencoded /*static as expressStatic, Router */ } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import ms from "ms";
import normalizeUrl from "normalize-url";
import type { Request, Response, NextFunction } from "express";


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

export default class BaseServer {

    protected readonly app = express();

    protected readonly server = createServer(this.app);

    private readonly options: options;

    private setupFinished = false;

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
        // Nothing to do here
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

    protected setupRoutes() {
        // TODO
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
        await this.setupGeneral();
        await Promise.all([
            this.setupTemplateEngine(),
            this.setupLocalization(),
            this.setupDatabase(),
            this.setupEmailConnection()
        ]);
        await this.setupSession();
        await this.setupBasicSecurity();
        await this.setupRoutes();

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
