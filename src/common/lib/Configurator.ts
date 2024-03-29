import { merge, setValue, getValue, eachDeep, isObject, isArray, cloneDeep } from "~env/utils/utils";
import type { Get } from "type-fest";
import type { Paths } from "~common/@types/Configurator";
import type { IConfig } from "~env/@types/Config";

export default class Configurator {

    /**
     * Stores the already initialized instance to enable this class to be a singleton
     */
    protected static instance: Configurator | null = null;

    /**
     * Stores the loaded config to have faster access to it
     */
    protected config: IConfig = {} as IConfig;

    public constructor() {
        // Make this class singleton
        if (Configurator.instance) return Configurator.instance;
        Configurator.instance = this;
        // @ts-expect-error just for testing
        global.configurator = this;
        this.load();
    }

    /**
     * Path based getter for the config
     *
     * @param path the dot separated path to a leave of the configuration
     * @returns the value if the given path if exists and undefined else
     */
    public get<TPath extends Paths<IConfig>>(path: TPath): Get<IConfig, TPath, { strict: true }> {
        return cloneDeep(getValue(this.config, (path as string).split(".")));
    }

    /**
     * Path based setter for the config
     *
     * @param path the dot separated path to a leave of the configuration
     * @param value the value to set into the configuration
     */
    public set<TPath extends Paths<IConfig>>(path: TPath, value: Get<IConfig, TPath>) {
        const pathAsArray = (path as string).split(".");
        const oldValue = getValue(this.config, pathAsArray);
        if (isObject(oldValue)) {
            let areEqualTypes = true;
            eachDeep(oldValue, (currentValue, key, parentValue, context) => {
                let allowedTypes: string[] = [typeof currentValue];
                if (isArray(parentValue)) {
                    if (!parentValue.length || isArray(value) && Number(key) >= value.length) return; // No type to determine
                    allowedTypes = Array.from(new Set(parentValue.map((item) => typeof item)));
                }
                if (context.path && !allowedTypes.includes(typeof getValue(value, context.path))) {
                    areEqualTypes = false;
                    return context.break?.();
                }
            }, { leavesOnly: true, pathFormat: "array" });
            if (!areEqualTypes) return false;
        } else {
            const parentValue = getValue(this.config, pathAsArray.slice(0, pathAsArray.length - 1));
            let allowedTypes: string[] = [typeof oldValue];
            if (isArray(parentValue)) {
                if (parentValue.length) {
                    allowedTypes = Array.from(new Set(parentValue.map((item) => typeof item)));
                } else allowedTypes = [];
            }
            if (allowedTypes.length && !allowedTypes.includes(typeof value)) return false;
        }
        return Boolean(setValue(this.config, pathAsArray, value));
    }

    /**
     * Loads the configuration in the following order and overwrites the previous loaded one:
     *
     * 1. Default in common
     * 2. Default in env
     * 3. Node env base in common
     * 4. Node env base in env
     */
    private load() {
        const commonDefaultContext = require.context("~common/configs/default", true, /.+\.yml/, "sync");
        const envDefaultContext = require.context("~env/configs/default", true, /.+\.yml/, "sync");
        const commonEnvContext = require.context(`~common/configs/${process.env.NODE_ENV}`, true, /.+\.yml/, "sync");
        const envEnvContext = require.context(`~env/configs/${process.env.NODE_ENV}`, true, /.+\.yml/, "sync");

        const contexts = [commonDefaultContext, envDefaultContext, commonEnvContext, envEnvContext];
        for (const context of contexts) {
            for (const key of context.keys()) {
                const value = context(key);
                const name = key.split("/").at(-1)?.split(".")[0] as string;

                eachDeep(value.default, (value, key, parentValue, context) => {
                    if (key === "<<" && context.path) {
                        const clonedParent = cloneDeep(parentValue);
                        merge(parentValue, value, clonedParent);
                        delete parentValue[key];
                        return false;
                    }
                }, { checkCircular: false, pathFormat: "array", includeRoot: true });

                merge(this.config, { [name]: value.default } || {});
            }
        }
    }
}
