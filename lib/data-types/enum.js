//Read-only semi-object like class acts like enum
class Enum{
    constructor(values){
        const _reverse = {};
        for (let key in values){
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: false,
                writable: false,
                value: values[key],
            });
            Object.defineProperty(_reverse, values[key], {
                enumerable: true,
                configurable: false,
                writable: false,
                value: key,
            })
        }

        Object.defineProperty(this, 'getKey', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: (value) => {
                return _reverse[value];
            }
        });

        Object.freeze(this);
    }
}
export default Enum;