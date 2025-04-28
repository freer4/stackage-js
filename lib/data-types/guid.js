const _new = () => {
    return window.crypto.randomUUID();
}
const _validate = (value) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

class Guid extends String{
    static _new = _new;
    static _validate = _validate;
};
export default Guid;
