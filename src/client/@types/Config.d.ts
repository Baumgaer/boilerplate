/* eslint-disable @typescript-eslint/no-empty-interface */
export interface IConfig {
    config: Config;
}
interface Config {
    test: Test;
    testen: string;
    testatstisch: Testatstisch;
}
interface Testatstisch {
    deep: boolean[];
}
interface Test {
    aString: string;
    aNumber: number;
    aListOfNumbers: number[];
    aListOfStrings: string[];
    aMixedList: (boolean | number | string)[];
    aDeepObject: ADeepObject;
}
interface ADeepObject {
    layer1: Layer1;
    layerOther: string;
}
interface Layer1 {
    layer2: Layer2;
    prop11: string;
    prop12: number;
}
interface Layer2 {
    layer3: Layer3;
    prop21: string;
    prop22: number;
}
interface Layer3 {
    prop31: string;
    prop32: number;
}
