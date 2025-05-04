const _new = () => {
    return window.crypto.randomUUID();
}
const _validate = (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


class Guid extends String{
    static _new = _new;
    static _validate = _validate;

    constructor(value){
        super(value || _new());

        Object.defineProperty(this, "_raw", {
            enumerable: false,
            configurable: false,
            get: () => {
                return this;
            },
        })

        Object.defineProperty(this, "_value", {
            enumerable: false,
            configurable: false,
            get: () => {
                return this;
            }, 
        });

        Object.defineProperty(this, "_validate", {
            enumerable: false,
            configurable: false,
            value: () => _validate(this)
        })
    }
};

export default Guid;
